const fs = require('fs');
const path = require('path');

const REQUIRED_FILES = [
  'config.json',
  'generation_config.json',
  'preprocessor_config.json',
  'tokenizer.json',
  'tokenizer_config.json',
  'onnx/encoder_model_quantized.onnx',
  'onnx/decoder_model_merged_quantized.onnx'
];

const MODEL_REVISIONS = {
  'onnx-community/whisper-tiny': 'ff4177021cc41f7db950912b73ea4fdf7d01d8e7',
  'onnx-community/whisper-base': '27a07b4b52b3a4c5886134bb4320e93e1a4bbc7c',
  'onnx-community/whisper-small': '36050c46d777d46dc4b5f43f6d90574fc38f8732',
  'onnx-community/whisper-large-v3-turbo': '360ebcde2559d60bb474678be3c1de9ef347d01a'
};

const DEFAULT_MODELS = [
  'onnx-community/whisper-tiny',
  'onnx-community/whisper-base'
];
const TARGET_ROOT = path.join(__dirname, '..', 'resources', 'whisper-models');
const MIN_ONNX_FILE_SIZE = 1024 * 1024;

function exists(target) {
  try {
    fs.accessSync(target);
    return true;
  } catch {
    return false;
  }
}

function validateModel(modelDir, modelId) {
  for (const relativePath of REQUIRED_FILES) {
    const filePath = path.join(modelDir, ...relativePath.split('/'));
    let stat;
    try {
      stat = fs.statSync(filePath);
    } catch {
      return false;
    }
    if (!stat.isFile() || stat.size === 0) return false;
    if (relativePath.endsWith('.onnx')) {
      if (stat.size < MIN_ONNX_FILE_SIZE) return false;
      continue;
    }
    try {
      const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return false;
      if (relativePath === 'config.json' && parsed.model_type !== 'whisper') return false;
    } catch {
      return false;
    }
  }

  const metadataPath = path.join(modelDir, '.cyrano-model.json');
  if (exists(metadataPath)) {
    try {
      const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
      if (metadata.modelId !== modelId || metadata.revision !== MODEL_REVISIONS[modelId]) {
        return false;
      }
    } catch {
      return false;
    }
  }
  return true;
}

async function installAtomically(partialDir, targetDir, backupDir) {
  await fs.promises.rm(backupDir, { recursive: true, force: true });
  let movedTarget = false;
  if (exists(targetDir)) {
    await fs.promises.rename(targetDir, backupDir);
    movedTarget = true;
  }

  try {
    await fs.promises.rename(partialDir, targetDir);
  } catch (error) {
    if (movedTarget && !exists(targetDir) && exists(backupDir)) {
      await fs.promises.rename(backupDir, targetDir).catch(() => {});
    }
    throw error;
  }

  if (movedTarget) {
    await fs.promises.rm(backupDir, { recursive: true, force: true });
  }
}

async function recoverInterruptedInstall(modelId, targetDir, partialDir, backupDir) {
  if (validateModel(targetDir, modelId)) {
    await Promise.all([
      fs.promises.rm(partialDir, { recursive: true, force: true }),
      fs.promises.rm(backupDir, { recursive: true, force: true })
    ]);
    return true;
  }
  if (validateModel(backupDir, modelId)) {
    await fs.promises.rm(targetDir, { recursive: true, force: true });
    await fs.promises.rename(backupDir, targetDir);
    await fs.promises.rm(partialDir, { recursive: true, force: true });
    return true;
  }
  if (validateModel(partialDir, modelId)) {
    await installAtomically(partialDir, targetDir, backupDir);
    return true;
  }
  await Promise.all([
    fs.promises.rm(partialDir, { recursive: true, force: true }),
    fs.promises.rm(backupDir, { recursive: true, force: true })
  ]);
  return false;
}

async function downloadFile(modelId, revision, relativePath, destination, index, signal) {
  const encodedPath = relativePath.split('/').map(encodeURIComponent).join('/');
  const url = `https://huggingface.co/${modelId}/resolve/${revision}/${encodedPath}`;
  const response = await fetch(url, { signal });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} while downloading ${url}`);
  }
  if (!response.body) throw new Error(`Empty response body for ${relativePath}`);

  await fs.promises.mkdir(path.dirname(destination), { recursive: true });
  const file = await fs.promises.open(destination, 'wx');
  const reader = response.body.getReader();
  const total = Number(response.headers.get('content-length')) || 0;
  let loaded = 0;
  try {
    while (true) {
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
      const fileProgress = total > 0 ? loaded / total : 0;
      const overall = Math.floor(((index + fileProgress) / REQUIRED_FILES.length) * 100);
      process.stdout.write(`\r[${modelId}] ${String(overall).padStart(3)}% ${relativePath}`);
    }
  } finally {
    await file.close();
    if (signal.aborted) await reader.cancel().catch(() => {});
  }

  const contentEncoding = response.headers.get('content-encoding');
  if (total > 0 && (!contentEncoding || contentEncoding === 'identity') && loaded !== total) {
    throw new Error(`Incomplete ${relativePath}: received ${loaded} of ${total} bytes`);
  }
}

async function downloadModel(modelId, signal) {
  const revision = MODEL_REVISIONS[modelId];
  if (!revision) throw new Error(`Unsupported model: ${modelId}`);

  const targetDir = path.join(TARGET_ROOT, ...modelId.split('/'));
  const parentDir = path.dirname(targetDir);
  const baseName = path.basename(targetDir);
  const partialDir = path.join(parentDir, `.${baseName}.partial`);
  const backupDir = path.join(parentDir, `.${baseName}.backup`);
  await fs.promises.mkdir(parentDir, { recursive: true });

  if (await recoverInterruptedInstall(modelId, targetDir, partialDir, backupDir)) {
    console.log(`[${modelId}] already complete at ${targetDir}`);
    return;
  }

  await fs.promises.mkdir(partialDir, { recursive: true });
  try {
    for (let index = 0; index < REQUIRED_FILES.length; index++) {
      const relativePath = REQUIRED_FILES[index];
      await downloadFile(
        modelId,
        revision,
        relativePath,
        path.join(partialDir, ...relativePath.split('/')),
        index,
        signal
      );
    }
    process.stdout.write('\n');

    if (!validateModel(partialDir, modelId)) {
      throw new Error(`Downloaded model failed manifest validation: ${modelId}`);
    }
    await fs.promises.writeFile(
      path.join(partialDir, '.cyrano-model.json'),
      `${JSON.stringify({ modelId, revision, files: REQUIRED_FILES }, null, 2)}\n`,
      'utf8'
    );
    await installAtomically(partialDir, targetDir, backupDir);
    console.log(`[${modelId}] ready at ${targetDir}`);
  } catch (error) {
    await fs.promises.rm(partialDir, { recursive: true, force: true });
    throw error;
  }
}

async function main() {
  const args = process.argv.slice(2);
  if (args[0] === '--') args.shift();
  const modelIds = args.length === 0
    ? DEFAULT_MODELS
    : args.length === 1 && args[0] === '--all'
      ? Object.keys(MODEL_REVISIONS)
      : args;

  for (const modelId of modelIds) {
    if (!MODEL_REVISIONS[modelId]) {
      throw new Error(`Unknown model '${modelId}'. Supported models: ${Object.keys(MODEL_REVISIONS).join(', ')}`);
    }
  }

  const controller = new AbortController();
  process.once('SIGINT', () => controller.abort());
  for (const modelId of modelIds) {
    await downloadModel(modelId, controller.signal);
  }
}

main().catch((error) => {
  process.stdout.write('\n');
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
