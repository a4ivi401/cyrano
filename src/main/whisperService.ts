import {
  LocalWhisperModelId,
  PrompterSettings,
  WhisperDownloadProgress,
  WhisperModelInfo
} from '../common/types';
import { WhisperModelManager } from './whisperModelManager';

// Known Whisper silence/background-noise hallucinations in RU/EN/UK
const HALLUCINATION_PATTERNS = [
  /^\[.*\]$/,
  /^\(.*\)$/,
  /^(?:редактор|перевод|русские|украинские)?\s*субтитр[ыа-я.]*$/i,
  /^(?:редактор|корректор)\s*(?:субтитров|текста)?$/i,
  /редактор\s+субтитров\s+[а-яё]/i,
  /корректор\s+[а-яё]/i,
  /продолжение\s+следует/i,
  /dima\s*torzok/i,
  /дима\s*торжок/i,
  /amara\.org/i,
  /^(?:thank\s+you|thanks)(?:\s+for\s+watching)?\.?$/i,
  /^(?:спасибо\s+за\s+просмотр|дякую\s+за\s+перегляд)\.?$/i,
  /^(?:подписывайтесь|підписуйтесь)\s+на\s+канал/i,
  /^ставь(?:те)?\s+лайк/i,
  /^[\s.,!?;:—–-]+$/,
  /^(\.|\s)+$/
];

interface DisposableValue {
  dispose: () => unknown;
}

function isDisposableValue(value: unknown): value is DisposableValue {
  return (
    typeof value === 'object' &&
    value !== null &&
    'dispose' in value &&
    typeof value.dispose === 'function'
  );
}

export class WhisperService {
  private readonly modelManager: WhisperModelManager;
  private activeModelId: LocalWhisperModelId | null = null;
  private transcriber: any = null;
  private tensorConstructor: any = null;
  private readonly loadingModels = new Map<LocalWhisperModelId, Promise<any>>();
  private modelLoadQueue: Promise<void> = Promise.resolve();
  private inferenceQueue: Promise<void> = Promise.resolve();

  constructor(modelManager = new WhisperModelManager()) {
    this.modelManager = modelManager;
  }

  public getModelsStatus(): WhisperModelInfo[] {
    return this.modelManager.getModelsStatus().map((model) => ({
      ...model,
      selected: model.id === this.activeModelId
    }));
  }

  public isModelDownloaded(modelId: LocalWhisperModelId): boolean {
    return this.modelManager
      .getModelsStatus()
      .some((model) => model.id === modelId && model.downloaded);
  }

  public cancelModelDownload(modelId: LocalWhisperModelId): boolean {
    return this.modelManager.cancelModelDownload(modelId);
  }

  public async downloadOrLoadModel(
    modelId: LocalWhisperModelId,
    onProgress?: (progress: WhisperDownloadProgress) => void
  ): Promise<any> {
    if (this.transcriber && this.activeModelId === modelId) {
      onProgress?.({
        modelId,
        status: 'ready',
        progress: 100
      });
      return this.transcriber;
    }

    const existingLoad = this.loadingModels.get(modelId);
    if (existingLoad) return existingLoad;

    const loading = this.modelManager
      .ensureModel(modelId, (progress) => {
        if (progress.status === 'ready') {
          onProgress?.({ modelId, status: 'validating', progress: 98 });
        } else {
          onProgress?.(progress);
        }
      })
      .then((modelPath) =>
        this.enqueueModelLoad(async () => {
          if (this.transcriber && this.activeModelId === modelId) return this.transcriber;

          let transformers: any;
          try {
            transformers = await import('@huggingface/transformers');
          } catch (error) {
            throw new Error(
              `Local Whisper runtime could not be loaded: ${this.errorMessage(error)}`
            );
          }

          const env = transformers.env || transformers.default?.env;
          const pipeline = transformers.pipeline || transformers.default?.pipeline;
          const Tensor = transformers.Tensor || transformers.default?.Tensor;
          if (!env || typeof pipeline !== 'function' || typeof Tensor !== 'function') {
            throw new Error('The installed @huggingface/transformers runtime is incomplete');
          }

          env.allowLocalModels = true;
          env.allowRemoteModels = false;

          onProgress?.({ modelId, status: 'validating', progress: 99 });
          const pipe = await pipeline('automatic-speech-recognition', modelPath, {
            dtype: 'q8',
            local_files_only: true
          });

          const previousPipeline =
            this.transcriber && this.activeModelId !== modelId ? this.transcriber : null;
          this.transcriber = pipe;
          this.tensorConstructor = Tensor;
          this.activeModelId = modelId;
          if (previousPipeline) {
            void this.inferenceQueue.then(() => this.disposePipeline(previousPipeline));
          }
          onProgress?.({ modelId, status: 'ready', progress: 100 });
          return pipe;
        })
      )
      .catch((error: unknown) => {
        if (error instanceof Error && error.name === 'ModelDownloadCancelledError') {
          throw error;
        }
        const message = this.localRuntimeError(modelId, error);
        onProgress?.({
          modelId,
          status: 'error',
          progress: 0,
          error: message
        });
        throw new Error(message);
      })
      .finally(() => {
        if (this.loadingModels.get(modelId) === loading) {
          this.loadingModels.delete(modelId);
        }
      });

    this.loadingModels.set(modelId, loading);
    return loading;
  }

  private enqueueModelLoad<T>(operation: () => Promise<T>): Promise<T> {
    const result = this.modelLoadQueue.then(operation);
    this.modelLoadQueue = result.then(
      () => undefined,
      () => undefined
    );
    return result;
  }

  public async transcribe(
    samplesInput: Float32Array | number[] | ArrayLike<number>,
    settings: PrompterSettings,
    onProgress?: (progress: WhisperDownloadProgress) => void
  ): Promise<string> {
    const rawSamples =
      samplesInput instanceof Float32Array
        ? samplesInput
        : Float32Array.from(samplesInput);

    // Minimum ~0.35s of audio at 16kHz
    if (rawSamples.length < 5600) {
      return '';
    }

    // Check RMS energy & peak to avoid running STT on pure digital silence
    let sumSq = 0;
    let peak = 0;
    for (let i = 0; i < rawSamples.length; i++) {
      const v = rawSamples[i];
      sumSq += v * v;
      const abs = Math.abs(v);
      if (abs > peak) peak = abs;
    }
    const rms = Math.sqrt(sumSq / rawSamples.length);
    if (rms < 0.0008 || peak < 0.003) {
      return '';
    }

    // Peak-normalize quiet audio (e.g., speaker pickup or quiet Zoom participant) up to 0.85 peak
    const samples = new Float32Array(rawSamples.length);
    const gain = peak > 0.001 && peak < 0.8 ? Math.min(16, 0.85 / peak) : 1;
    for (let i = 0; i < rawSamples.length; i++) {
      samples[i] = Math.max(-1, Math.min(1, rawSamples[i] * gain));
    }

    let rawText = '';
    if (settings.sttProvider === 'cloud-whisper') {
      rawText = await this.transcribeCloud(samples, settings);
    } else {
      rawText = await this.transcribeLocal(samples, settings, onProgress);
    }

    const cleaned = this.cleanTranscript(rawText);
    return cleaned;
  }

  private async transcribeLocal(
    samples: Float32Array,
    settings: PrompterSettings,
    onProgress?: (progress: WhisperDownloadProgress) => void
  ): Promise<string> {
    return this.enqueueInference(async () => {
      try {
        const pipe = await this.downloadOrLoadModel(settings.localWhisperModel, onProgress);
        const languageMap: Record<string, string> = {
          ru: 'russian',
          en: 'english',
          uk: 'ukrainian'
        };
        const language =
          settings.sttLanguage && settings.sttLanguage !== 'auto'
            ? languageMap[settings.sttLanguage]
            : await this.detectWhisperLanguage(pipe, samples);

        const generateOptions: any = {
          language,
          task: 'transcribe',
          return_timestamps: false,
          max_new_tokens: 128
        };
        if (samples.length > 16000 * 25) {
          generateOptions.chunk_length_s = 25;
          generateOptions.stride_length_s = 4;
        }

        const result = await pipe(samples, generateOptions);
        if (typeof result === 'string') return result;
        if (result && typeof result.text === 'string') return result.text;
        return '';
      } catch (error) {
        throw new Error(`Local Whisper transcription failed: ${this.errorMessage(error)}`);
      }
    });
  }

  private enqueueInference<T>(operation: () => Promise<T>): Promise<T> {
    const result = this.inferenceQueue.then(operation);
    this.inferenceQueue = result.then(
      () => undefined,
      () => undefined
    );
    return result;
  }

  private async detectWhisperLanguage(pipe: any, samples: Float32Array): Promise<string> {
    const model = pipe?.model;
    const processor = pipe?.processor;
    const generationConfig = model?.generation_config;
    const languageIds = generationConfig?.lang_to_id;
    const decoderStartTokenId = generationConfig?.decoder_start_token_id;
    if (
      typeof processor !== 'function' ||
      typeof model !== 'function' ||
      !languageIds ||
      !Number.isInteger(decoderStartTokenId) ||
      typeof this.tensorConstructor !== 'function'
    ) {
      throw new Error('This Whisper runtime does not expose multilingual language detection');
    }

    let processed: any;
    let decoderInput: any;
    let output: any;
    try {
      processed = await processor(samples);
      decoderInput = new this.tensorConstructor(
        'int64',
        new BigInt64Array([BigInt(decoderStartTokenId)]),
        [1, 1]
      );
      output = await model({
        input_features: processed.input_features,
        decoder_input_ids: decoderInput
      });

      const logits = output?.logits;
      const vocabularySize = logits?.dims?.at(-1);
      if (!logits?.data || !Number.isInteger(vocabularySize) || vocabularySize <= 0) {
        throw new Error('Whisper language detection did not return decoder logits');
      }

      const offset = logits.data.length - vocabularySize;
      let bestToken = '';
      let bestScore = Number.NEGATIVE_INFINITY;
      const supportedLanguageTokens = new Set(['<|ru|>', '<|en|>', '<|uk|>']);
      for (const [token, rawTokenId] of Object.entries(languageIds)) {
        const tokenId = Number(rawTokenId);
        if (!supportedLanguageTokens.has(token) || tokenId < 0 || tokenId >= vocabularySize) {
          continue;
        }
        const score = Number(logits.data[offset + tokenId]);
        if (score > bestScore) {
          bestScore = score;
          bestToken = token;
        }
      }

      const match = /^<\|([a-z]{2,3})\|>$/.exec(bestToken);
      if (!match) throw new Error('Whisper could not determine the spoken language');
      return match[1];
    } finally {
      await this.disposeTensorValues(output, processed, decoderInput);
    }
  }

  private async disposeTensorValues(...containers: unknown[]): Promise<void> {
    const disposed = new Set<DisposableValue>();
    for (const container of containers) {
      const values = [
        container,
        ...(container && typeof container === 'object'
          ? Object.values(container as Record<string, unknown>)
          : [])
      ];
      for (const value of values) {
        if (!isDisposableValue(value) || disposed.has(value)) continue;
        disposed.add(value);
        await Promise.resolve(value.dispose()).catch(() => {});
      }
    }
  }

  private async disposePipeline(pipeline: unknown): Promise<void> {
    if (isDisposableValue(pipeline)) {
      await Promise.resolve(pipeline.dispose()).catch(() => {});
      return;
    }
    if (pipeline && typeof pipeline === 'object') {
      const model = (pipeline as Record<string, unknown>).model;
      if (isDisposableValue(model)) {
        await Promise.resolve(model.dispose()).catch(() => {});
      }
    }
  }

  private async transcribeCloud(
    samples: Float32Array,
    settings: PrompterSettings
  ): Promise<string> {
    const baseUrl = (settings.cloudSttBaseUrl || settings.llmBaseUrl || 'https://api.openai.com/v1').replace(/\/+$/, '');
    const apiKey = settings.cloudSttApiKey || settings.llmApiKey;
    const model = settings.cloudSttModel || 'whisper-1';

    if (!apiKey) {
      throw new Error('Cloud STT API Key is not configured.');
    }

    const wavBuffer = this.encodeWav16kHzMono(samples);
    const blob = new Blob([new Uint8Array(wavBuffer)], { type: 'audio/wav' });
    const formData = new FormData();
    formData.append('file', blob, 'speech.wav');
    formData.append('model', model);
    if (settings.sttLanguage && settings.sttLanguage !== 'auto') {
      formData.append('language', settings.sttLanguage);
    }

    let response: Response;
    try {
      response = await fetch(`${baseUrl}/audio/transcriptions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`
        },
        body: formData
      });
    } catch (error) {
      throw new Error(`Cloud STT request failed: ${this.errorMessage(error)}`);
    }

    if (!response.ok) {
      const errBody = await response.text().catch(() => '');
      throw new Error(`Cloud STT HTTP ${response.status}: ${errBody.slice(0, 200)}`);
    }

    let data: { text?: string };
    try {
      data = (await response.json()) as { text?: string };
    } catch {
      throw new Error('Cloud STT returned an invalid JSON response');
    }
    return typeof data.text === 'string' ? data.text : '';
  }

  private localRuntimeError(modelId: LocalWhisperModelId, error: unknown): string {
    const message = this.errorMessage(error);
    if (/@img\/sharp-win32|sharp.*(module|binary)|Could not load the "sharp" module/i.test(message)) {
      return `Local Whisper cannot start because the Windows Sharp native package is missing or incompatible (${message})`;
    }
    if (/onnxruntime_binding|onnxruntime\.dll|DLL initialization|dynamic library.*onnx/i.test(message)) {
      return `Local Whisper cannot start because ONNX Runtime is missing or incompatible (${message})`;
    }
    if (/local_files_only|file was not found locally|ModelFileNotFound/i.test(message)) {
      return `Verified Whisper model ${modelId} is missing a runtime-required local file (${message})`;
    }
    return `Failed to load local Whisper model ${modelId}: ${message}`;
  }

  private errorMessage(error: unknown): string {
    if (error instanceof Error && error.message) return error.message;
    return String(error || 'Unknown error');
  }

  private encodeWav16kHzMono(samples: Float32Array): Buffer {
    const sampleRate = 16000;
    const numChannels = 1;
    const bitsPerSample = 16;
    const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
    const blockAlign = (numChannels * bitsPerSample) / 8;
    const dataSize = samples.length * 2;
    const buffer = Buffer.alloc(44 + dataSize);

    // RIFF header
    buffer.write('RIFF', 0);
    buffer.writeUInt32LE(36 + dataSize, 4);
    buffer.write('WAVE', 8);

    // fmt subchunk
    buffer.write('fmt ', 12);
    buffer.writeUInt32LE(16, 16); // Subchunk1Size (16 for PCM)
    buffer.writeUInt16LE(1, 20);  // AudioFormat (1 = PCM)
    buffer.writeUInt16LE(numChannels, 22);
    buffer.writeUInt32LE(sampleRate, 24);
    buffer.writeUInt32LE(byteRate, 28);
    buffer.writeUInt16LE(blockAlign, 32);
    buffer.writeUInt16LE(bitsPerSample, 34);

    // data subchunk
    buffer.write('data', 36);
    buffer.writeUInt32LE(dataSize, 40);

    let offset = 44;
    for (let i = 0; i < samples.length; i++) {
      const clamped = Math.max(-1, Math.min(1, samples[i]));
      const int16 = clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff;
      buffer.writeInt16LE(Math.round(int16), offset);
      offset += 2;
    }

    return buffer;
  }

  private cleanTranscript(raw: string): string {
    const trimmed = raw.trim().replace(/\s+/g, ' ');
    if (!trimmed || trimmed.length < 2) return '';

    for (const pattern of HALLUCINATION_PATTERNS) {
      if (pattern.test(trimmed)) {
        return '';
      }
    }
    return trimmed;
  }
}
