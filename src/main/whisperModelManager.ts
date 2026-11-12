import { app, net } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import { WHISPER_MODEL_CATALOG } from '../common/constants';
import {
  LocalWhisperModelId,
  WhisperDownloadProgress,
  WhisperModelInfo
} from '../common/types';

export const WHISPER_MODEL_REQUIRED_FILES = [
  'config.json',
  'generation_config.json',
  'preprocessor_config.json',
  'tokenizer.json',
  'tokenizer_config.json',
  'onnx/encoder_model_quantized.onnx',
  'onnx/decoder_model_merged_quantized.onnx'
] as const;

export const WHISPER_MODEL_REVISIONS: Record<LocalWhisperModelId, string> = {
  'onnx-community/whisper-tiny': 'ff4177021cc41f7db950912b73ea4fdf7d01d8e7',
  'onnx-community/whisper-base': '27a07b4b52b3a4c5886134bb4320e93e1a4bbc7c',
  'onnx-community/whisper-small': '36050c46d777d46dc4b5f43f6d90574fc38f8732',
  'onnx-community/whisper-large-v3-turbo': '360ebcde2559d60bb474678be3c1de9ef347d01a'
};

const MODEL_METADATA_FILE = '.cyrano-model.json';
const PRIMARY_MODEL_HOST = 'https://huggingface.co';
const FALLBACK_MODEL_HOST = 'https://hf-mirror.com';
const MIN_ONNX_FILE_SIZE = 1024 * 1024;

type ProgressListener = (progress: WhisperDownloadProgress) => void;

export interface WhisperModelValidation {
  valid: boolean;
  missingFiles: string[];
  invalidFiles: string[];
}

interface ActiveModelOperation {
  controller: AbortController;
  listeners: Set<ProgressListener>;
  promise: Promise<string>;
}

class ModelDownloadHttpError extends Error {
  constructor(
    public readonly statusCode: number,
    url: string
  ) {
    super(`HTTP ${statusCode} while downloading ${url}`);
    this.name = 'ModelDownloadHttpError';
  }
}

class ModelDownloadCancelledError extends Error {
  constructor(modelId: LocalWhisperModelId) {
    super(`Whisper model download cancelled: ${modelId}`);
    this.name = 'ModelDownloadCancelledError';
  }
}

function directoryExists(directory: string): boolean {
  try {
    return fs.statSync(directory).isDirectory();
  } catch {
    return false;
  }
}

function pathExists(targetPath: string): boolean {
  try {
    fs.lstatSync(targetPath);
    return true;
  } catch {
    return false;
  }
}

export function validateWhisperModelDirectory(
  modelDir: string,
  expectedModelId?: LocalWhisperModelId
): WhisperModelValidation {
  const missingFiles: string[] = [];
  const invalidFiles: string[] = [];

  for (const relativePath of WHISPER_MODEL_REQUIRED_FILES) {
    const filePath = path.join(modelDir, ...relativePath.split('/'));
    let stat: fs.Stats;
    try {
      stat = fs.statSync(filePath);
    } catch {
      missingFiles.push(relativePath);
      continue;
    }

    if (!stat.isFile() || stat.size === 0) {
      invalidFiles.push(relativePath);
      continue;
    }

    if (relativePath.endsWith('.onnx')) {
      if (stat.size < MIN_ONNX_FILE_SIZE) {
        invalidFiles.push(relativePath);
      }
      continue;
    }

    try {
      const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        invalidFiles.push(relativePath);
      } else if (relativePath === 'config.json' && parsed.model_type !== 'whisper') {
        invalidFiles.push(relativePath);
      }
    } catch {
      invalidFiles.push(relativePath);
    }
  }

  const metadataPath = path.join(modelDir, MODEL_METADATA_FILE);
  if (expectedModelId && pathExists(metadataPath)) {
    try {
      const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
      if (
        metadata.modelId !== expectedModelId ||
        metadata.revision !== WHISPER_MODEL_REVISIONS[expectedModelId]
      ) {
        invalidFiles.push(MODEL_METADATA_FILE);
      }
    } catch {
      invalidFiles.push(MODEL_METADATA_FILE);
    }
  }

  return {
    valid: missingFiles.length === 0 && invalidFiles.length === 0,
    missingFiles,
    invalidFiles
  };
}

function validationError(modelId: LocalWhisperModelId, validation: WhisperModelValidation): Error {
  const details = [
    validation.missingFiles.length > 0
      ? `missing: ${validation.missingFiles.join(', ')}`
      : '',
    validation.invalidFiles.length > 0
      ? `invalid: ${validation.invalidFiles.join(', ')}`
      : ''
  ].filter(Boolean);
  return new Error(`Whisper model ${modelId} is incomplete (${details.join('; ')})`);
}

export class WhisperModelManager {
  private readonly cacheDir: string;
  private readonly bundledRoots: string[];
  private readonly activeOperations = new Map<LocalWhisperModelId, ActiveModelOperation>();
  private readonly lastErrors = new Map<LocalWhisperModelId, string>();

  constructor(cacheDir?: string, bundledRoots?: string[]) {
    this.cacheDir = cacheDir ?? path.join(app.getPath('userData'), 'whisper-models');
    this.bundledRoots = bundledRoots ?? this.getDefaultBundledRoots();
  }

  public getModelsStatus(): WhisperModelInfo[] {
    return WHISPER_MODEL_CATALOG.map((catalogItem) => {
      const modelId = catalogItem.id;
      const cachePath = this.getCachePath(modelId);
      const cacheValidation = validateWhisperModelDirectory(cachePath, modelId);
      const bundledPath = this.findValidBundledModel(modelId);
      const isLoading = this.activeOperations.has(modelId);
      const isReady = cacheValidation.valid || bundledPath !== null;
      const error = this.lastErrors.get(modelId);
      const hasPartialContent =
        pathExists(cachePath) ||
        pathExists(this.getPartialPath(modelId)) ||
        pathExists(this.getBackupPath(modelId)) ||
        this.hasIncompleteBundledModel(modelId);

      let status: NonNullable<WhisperModelInfo['status']>;
      if (isLoading) {
        status = 'loading';
      } else if (isReady) {
        status = 'ready';
      } else if (error) {
        status = 'error';
      } else if (hasPartialContent) {
        status = 'partial';
      } else {
        status = 'missing';
      }

      return {
        ...catalogItem,
        downloaded: isReady,
        status,
        ...(status === 'error' ? { error } : {})
      };
    });
  }

  public async ensureModel(
    modelId: LocalWhisperModelId,
    onProgress?: ProgressListener
  ): Promise<string> {
    this.assertKnownModel(modelId);

    const cachePath = this.getCachePath(modelId);
    if (validateWhisperModelDirectory(cachePath, modelId).valid) {
      onProgress?.({ modelId, status: 'ready', progress: 100 });
      return cachePath;
    }

    const partialPath = this.getPartialPath(modelId);
    const backupPath = this.getBackupPath(modelId);
    const hasInterruptedInstall = pathExists(partialPath) || pathExists(backupPath);
    const bundledPath = this.findValidBundledModel(modelId);
    if (!pathExists(cachePath) && !hasInterruptedInstall && bundledPath) {
      onProgress?.({ modelId, status: 'ready', progress: 100 });
      return bundledPath;
    }

    const activeOperation = this.activeOperations.get(modelId);
    if (activeOperation) {
      if (onProgress) activeOperation.listeners.add(onProgress);
      return activeOperation.promise;
    }

    const operation: ActiveModelOperation = {
      controller: new AbortController(),
      listeners: new Set(onProgress ? [onProgress] : []),
      promise: Promise.resolve('')
    };

    operation.promise = this.ensureModelInternal(modelId, operation)
      .then((modelPath) => {
        this.lastErrors.delete(modelId);
        this.report(operation, { modelId, status: 'ready', progress: 100 });
        return modelPath;
      })
      .catch((error: unknown) => {
        if (this.isCancellation(error, operation.controller.signal)) {
          const cancelledError =
            error instanceof ModelDownloadCancelledError
              ? error
              : new ModelDownloadCancelledError(modelId);
          this.report(operation, { modelId, status: 'cancelled', progress: 0 });
          throw cancelledError;
        }

        const message = error instanceof Error ? error.message : String(error);
        const wrapped = new Error(`Unable to prepare Whisper model ${modelId}: ${message}`);
        this.lastErrors.set(modelId, wrapped.message);
        this.report(operation, {
          modelId,
          status: 'error',
          progress: 0,
          error: wrapped.message
        });
        throw wrapped;
      })
      .finally(() => {
        if (this.activeOperations.get(modelId) === operation) {
          this.activeOperations.delete(modelId);
        }
      });

    this.activeOperations.set(modelId, operation);
    return operation.promise;
  }

  public cancelModelDownload(modelId: LocalWhisperModelId): boolean {
    const operation = this.activeOperations.get(modelId);
    if (!operation) return false;
    operation.controller.abort();
    return true;
  }

  private async ensureModelInternal(
    modelId: LocalWhisperModelId,
    operation: ActiveModelOperation
  ): Promise<string> {
    const targetPath = this.getCachePath(modelId);
    const partialPath = this.getPartialPath(modelId);
    const backupPath = this.getBackupPath(modelId);
    await fs.promises.mkdir(path.dirname(targetPath), { recursive: true });

    const recoveredPath = await this.recoverInterruptedInstall(
      modelId,
      targetPath,
      partialPath,
      backupPath
    );
    if (recoveredPath) {
      this.throwIfCancelled(modelId, operation.controller.signal);
      return recoveredPath;
    }

    this.throwIfCancelled(modelId, operation.controller.signal);
    const bundledPath = this.findValidBundledModel(modelId);
    if (bundledPath) {
      if (!pathExists(targetPath)) return bundledPath;

      this.report(operation, {
        modelId,
        status: 'validating',
        progress: 5,
        file: 'bundled model'
      });
      await fs.promises.rm(partialPath, { recursive: true, force: true });
      await fs.promises.cp(bundledPath, partialPath, {
        recursive: true,
        force: false,
        errorOnExist: true
      });
      this.throwIfCancelled(modelId, operation.controller.signal);
      this.report(operation, { modelId, status: 'validating', progress: 95 });
      this.assertValidDirectory(modelId, partialPath);
      await this.writeMetadata(modelId, partialPath, 'bundled');
      this.throwIfCancelled(modelId, operation.controller.signal);
      await this.installAtomically(partialPath, targetPath, backupPath);
      return targetPath;
    }

    await fs.promises.rm(partialPath, { recursive: true, force: true });
    await fs.promises.mkdir(partialPath, { recursive: true });

    try {
      await this.downloadModel(modelId, partialPath, operation, PRIMARY_MODEL_HOST);
    } catch (error) {
      if (
        this.isCancellation(error, operation.controller.signal) ||
        !this.isRetryableNetworkError(error)
      ) {
        throw error;
      }

      await fs.promises.rm(partialPath, { recursive: true, force: true });
      await fs.promises.mkdir(partialPath, { recursive: true });
      this.report(operation, {
        modelId,
        status: 'downloading',
        progress: 0,
        file: 'Retrying via mirror'
      });
      await this.downloadModel(modelId, partialPath, operation, FALLBACK_MODEL_HOST);
    }

    this.throwIfCancelled(modelId, operation.controller.signal);
    this.report(operation, { modelId, status: 'validating', progress: 97 });
    this.assertValidDirectory(modelId, partialPath);
    await this.writeMetadata(modelId, partialPath, 'download');
    this.throwIfCancelled(modelId, operation.controller.signal);
    await this.installAtomically(partialPath, targetPath, backupPath);
    return targetPath;
  }

  private async recoverInterruptedInstall(
    modelId: LocalWhisperModelId,
    targetPath: string,
    partialPath: string,
    backupPath: string
  ): Promise<string | null> {
    if (validateWhisperModelDirectory(targetPath, modelId).valid) {
      await Promise.all([
        fs.promises.rm(partialPath, { recursive: true, force: true }),
        fs.promises.rm(backupPath, { recursive: true, force: true })
      ]);
      return targetPath;
    }

    if (validateWhisperModelDirectory(backupPath, modelId).valid) {
      await fs.promises.rm(targetPath, { recursive: true, force: true });
      await fs.promises.rename(backupPath, targetPath);
      await fs.promises.rm(partialPath, { recursive: true, force: true });
      return targetPath;
    }

    if (validateWhisperModelDirectory(partialPath, modelId).valid) {
      await this.installAtomically(partialPath, targetPath, backupPath);
      return targetPath;
    }

    await Promise.all([
      fs.promises.rm(partialPath, { recursive: true, force: true }),
      fs.promises.rm(backupPath, { recursive: true, force: true })
    ]);
    return null;
  }

  private async downloadModel(
    modelId: LocalWhisperModelId,
    destination: string,
    operation: ActiveModelOperation,
    host: string
  ): Promise<void> {
    const revision = WHISPER_MODEL_REVISIONS[modelId];
    const signal = operation.controller.signal;

    for (let index = 0; index < WHISPER_MODEL_REQUIRED_FILES.length; index++) {
      this.throwIfCancelled(modelId, signal);
      const relativePath = WHISPER_MODEL_REQUIRED_FILES[index];
      const encodedPath = relativePath.split('/').map(encodeURIComponent).join('/');
      const url = `${host}/${modelId}/resolve/${revision}/${encodedPath}`;
      const targetFile = path.join(destination, ...relativePath.split('/'));
      await fs.promises.mkdir(path.dirname(targetFile), { recursive: true });

      const response = await net.fetch(url, { signal });
      if (!response.ok) {
        throw new ModelDownloadHttpError(response.status, url);
      }
      if (!response.body) {
        throw new Error(`Empty response body while downloading ${relativePath}`);
      }

      const total = Number(response.headers.get('content-length')) || 0;
      const reader = response.body.getReader();
      const file = await fs.promises.open(targetFile, 'wx');
      let loaded = 0;
      try {
        while (true) {
          this.throwIfCancelled(modelId, signal);
          const chunk = await reader.read();
          if (chunk.done) break;

          const buffer = Buffer.from(
            chunk.value.buffer,
            chunk.value.byteOffset,
            chunk.value.byteLength
          );
          let offset = 0;
          while (offset < buffer.length) {
            const result = await file.write(buffer, offset, buffer.length - offset, null);
            offset += result.bytesWritten;
          }
          loaded += buffer.length;

          const fileProgress = total > 0 ? Math.min(1, loaded / total) : 0;
          const overallProgress = Math.min(
            95,
            Math.round(
              ((index + fileProgress) / WHISPER_MODEL_REQUIRED_FILES.length) * 95
            )
          );
          this.report(operation, {
            modelId,
            status: 'downloading',
            progress: overallProgress,
            file: relativePath
          });
        }
      } finally {
        await file.close();
        if (signal.aborted) {
          await reader.cancel().catch(() => {});
        }
      }

      const contentEncoding = response.headers.get('content-encoding');
      if (total > 0 && (!contentEncoding || contentEncoding === 'identity') && loaded !== total) {
        throw new Error(
          `Incomplete download for ${relativePath}: received ${loaded} of ${total} bytes`
        );
      }
    }
  }

  private async installAtomically(
    partialPath: string,
    targetPath: string,
    backupPath: string
  ): Promise<void> {
    await fs.promises.rm(backupPath, { recursive: true, force: true });
    let movedExistingTarget = false;

    if (pathExists(targetPath)) {
      await fs.promises.rename(targetPath, backupPath);
      movedExistingTarget = true;
    }

    try {
      await fs.promises.rename(partialPath, targetPath);
    } catch (error) {
      if (movedExistingTarget && !pathExists(targetPath) && pathExists(backupPath)) {
        await fs.promises.rename(backupPath, targetPath).catch(() => {});
      }
      throw error;
    }

    if (movedExistingTarget) {
      await fs.promises.rm(backupPath, { recursive: true, force: true });
    }
  }

  private async writeMetadata(
    modelId: LocalWhisperModelId,
    modelPath: string,
    source: 'bundled' | 'download'
  ): Promise<void> {
    const metadata = {
      modelId,
      revision: WHISPER_MODEL_REVISIONS[modelId],
      source,
      files: WHISPER_MODEL_REQUIRED_FILES
    };
    await fs.promises.writeFile(
      path.join(modelPath, MODEL_METADATA_FILE),
      `${JSON.stringify(metadata, null, 2)}\n`,
      'utf8'
    );
  }

  private assertValidDirectory(modelId: LocalWhisperModelId, modelPath: string): void {
    const validation = validateWhisperModelDirectory(modelPath, modelId);
    if (!validation.valid) throw validationError(modelId, validation);
  }

  private assertKnownModel(modelId: LocalWhisperModelId): void {
    if (!Object.prototype.hasOwnProperty.call(WHISPER_MODEL_REVISIONS, modelId)) {
      throw new Error(`Unsupported Whisper model: ${String(modelId)}`);
    }
  }

  private getCachePath(modelId: LocalWhisperModelId): string {
    return path.join(this.cacheDir, ...modelId.split('/'));
  }

  private getPartialPath(modelId: LocalWhisperModelId): string {
    const targetPath = this.getCachePath(modelId);
    return path.join(path.dirname(targetPath), `.${path.basename(targetPath)}.partial`);
  }

  private getBackupPath(modelId: LocalWhisperModelId): string {
    const targetPath = this.getCachePath(modelId);
    return path.join(path.dirname(targetPath), `.${path.basename(targetPath)}.backup`);
  }

  private getDefaultBundledRoots(): string[] {
    const roots = [
      path.join(__dirname, '../../resources/whisper-models'),
      path.join(process.cwd(), 'resources/whisper-models')
    ];
    if (process.resourcesPath) {
      roots.unshift(path.join(process.resourcesPath, 'whisper-models'));
    }

    try {
      roots.push(path.join(app.getAppPath(), 'resources', 'whisper-models'));
    } catch {
      // app.getAppPath() can be unavailable in isolated unit tests.
    }

    return [...new Set(roots.map((root) => path.resolve(root)))];
  }

  private findValidBundledModel(modelId: LocalWhisperModelId): string | null {
    for (const root of this.bundledRoots) {
      const candidate = path.join(root, ...modelId.split('/'));
      if (validateWhisperModelDirectory(candidate, modelId).valid) return candidate;
    }
    return null;
  }

  private hasIncompleteBundledModel(modelId: LocalWhisperModelId): boolean {
    return this.bundledRoots.some((root) => {
      const candidate = path.join(root, ...modelId.split('/'));
      return directoryExists(candidate) && !validateWhisperModelDirectory(candidate, modelId).valid;
    });
  }

  private report(operation: ActiveModelOperation, progress: WhisperDownloadProgress): void {
    for (const listener of operation.listeners) {
      try {
        listener(progress);
      } catch (error) {
        console.warn('[WhisperModelManager] Progress listener failed:', error);
      }
    }
  }

  private throwIfCancelled(modelId: LocalWhisperModelId, signal: AbortSignal): void {
    if (signal.aborted) throw new ModelDownloadCancelledError(modelId);
  }

  private isCancellation(error: unknown, signal: AbortSignal): boolean {
    return (
      signal.aborted ||
      error instanceof ModelDownloadCancelledError ||
      (error instanceof Error && error.name === 'AbortError')
    );
  }

  private isRetryableNetworkError(error: unknown): boolean {
    if (error instanceof ModelDownloadHttpError) {
      return [408, 425, 429, 500, 502, 503, 504].includes(error.statusCode);
    }
    if (!(error instanceof Error)) return false;

    const code = (error as NodeJS.ErrnoException).code;
    if (
      code &&
      ['ECONNABORTED', 'ECONNREFUSED', 'ECONNRESET', 'ENETUNREACH', 'ENOTFOUND', 'ETIMEDOUT'].includes(
        code
      )
    ) {
      return true;
    }
    return error instanceof TypeError || /network|fetch failed|connection|timed out/i.test(error.message);
  }
}
