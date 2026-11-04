import { app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import {
  LocalWhisperModelId,
  PrompterSettings,
  WhisperDownloadProgress,
  WhisperModelInfo
} from '../common/types';
import { WHISPER_MODEL_CATALOG } from '../common/constants';

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

export class WhisperService {
  private cacheDir: string;
  private activeModelId: string | null = null;
  private transcriber: any = null;
  private loadingPromise: Promise<any> | null = null;
  private isTranscribing: boolean = false;

  constructor() {
    this.cacheDir = path.join(app.getPath('userData'), 'whisper-models');
    if (!fs.existsSync(this.cacheDir)) {
      fs.mkdirSync(this.cacheDir, { recursive: true });
    }
  }

  public getModelsStatus(): WhisperModelInfo[] {
    return WHISPER_MODEL_CATALOG.map((item) => ({
      ...item,
      downloaded: this.isModelDownloaded(item.id)
    }));
  }

  public isModelDownloaded(modelId: LocalWhisperModelId): boolean {
    const modelDir = path.join(this.cacheDir, ...modelId.split('/'));
    const onnxDir = path.join(modelDir, 'onnx');
    const configPath = path.join(modelDir, 'config.json');
    if (!fs.existsSync(configPath) || !fs.existsSync(onnxDir)) {
      return false;
    }
    try {
      const files = fs.readdirSync(onnxDir);
      return files.some((f) => f.endsWith('.onnx'));
    } catch {
      return false;
    }
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

    if (this.loadingPromise && this.activeModelId === modelId) {
      return this.loadingPromise;
    }

    this.activeModelId = modelId;

    this.loadingPromise = (async () => {
      try {
        let transformers: any;
        try {
          transformers = await import('@huggingface/transformers');
        } catch {
          transformers = typeof require !== 'undefined' ? require('@huggingface/transformers') : {};
        }
        const env = transformers.env || transformers.default?.env;
        const pipeline = transformers.pipeline || transformers.default?.pipeline;

        if (env) {
          env.cacheDir = this.cacheDir;
          env.allowLocalModels = true;
          env.allowRemoteModels = true;
        }

        if (typeof pipeline !== 'function') {
          throw new Error('Pipeline function is not available in @huggingface/transformers');
        }

        onProgress?.({
          modelId,
          status: 'downloading',
          progress: 1
        });

        const pipe = await pipeline('automatic-speech-recognition', modelId, {
          dtype: 'q8',
          progress_callback: (info: any) => {
            if (!onProgress || !info) return;
            if (info.status === 'progress' && typeof info.progress === 'number') {
              onProgress({
                modelId,
                status: 'downloading',
                progress: Math.min(99, Math.max(1, Math.round(info.progress))),
                file: info.file
              });
            } else if (info.status === 'ready') {
              onProgress({
                modelId,
                status: 'ready',
                progress: 100
              });
            }
          }
        });

        this.transcriber = pipe;
        onProgress?.({
          modelId,
          status: 'ready',
          progress: 100
        });
        return pipe;
      } catch (err: any) {
        this.transcriber = null;
        this.activeModelId = null;
        const msg = err?.message || 'Failed to load Whisper model';
        onProgress?.({
          modelId,
          status: 'error',
          progress: 0,
          error: msg
        });
        throw err;
      } finally {
        this.loadingPromise = null;
      }
    })();

    return this.loadingPromise;
  }

  public async transcribe(
    samplesInput: Float32Array | number[] | ArrayLike<number>,
    settings: PrompterSettings,
    onProgress?: (progress: WhisperDownloadProgress) => void
  ): Promise<string> {
    let rawSamples: Float32Array;
    if (samplesInput instanceof Float32Array) {
      rawSamples = samplesInput;
    } else if (Array.isArray(samplesInput) || ArrayBuffer.isView(samplesInput)) {
      rawSamples = Float32Array.from(samplesInput as ArrayLike<number>);
    } else if (samplesInput && typeof samplesInput === 'object') {
      const vals = Object.values(samplesInput as unknown as Record<string, number>);
      rawSamples = Float32Array.from(vals);
    } else {
      return '';
    }

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
    // Drop outdated audio chunks if queue is backed up, preventing seconds of lag
    let waitCount = 0;
    while (this.isTranscribing) {
      await new Promise((r) => setTimeout(r, 60));
      waitCount++;
      if (waitCount > 25) {
        return '';
      }
    }

    this.isTranscribing = true;
    try {
      const pipe = await this.downloadOrLoadModel(settings.localWhisperModel, onProgress);
      // Determine language: if auto/unset, match the app language (RU/UK/EN).
      // Crucial: @huggingface/transformers forces English (en) when language is undefined!
      const appLang = settings.language || 'ru';
      const langKey =
        settings.sttLanguage && settings.sttLanguage !== 'auto'
          ? settings.sttLanguage
          : appLang;

      const langMap: Record<string, string> = {
        ru: 'russian',
        en: 'english',
        uk: 'ukrainian'
      };
      const language = langMap[langKey] || 'russian';

      const result = await pipe(samples, {
        language,
        task: 'transcribe',
        chunk_length_s: 25,
        stride_length_s: 4
      });

      if (typeof result === 'string') return result;
      if (result && typeof result.text === 'string') return result.text;
      return '';
    } finally {
      this.isTranscribing = false;
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
    const cloudLang =
      settings.sttLanguage && settings.sttLanguage !== 'auto'
        ? settings.sttLanguage
        : (settings.language || 'ru');
    formData.append('language', cloudLang);

    const response = await fetch(`${baseUrl}/audio/transcriptions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`
      },
      body: formData
    });

    if (!response.ok) {
      const errBody = await response.text().catch(() => '');
      throw new Error(`Cloud STT HTTP ${response.status}: ${errBody.slice(0, 200)}`);
    }

    const data = (await response.json()) as { text?: string };
    return data.text || '';
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
