export type PresetPosition =
  | 'top-center'
  | 'top-full'
  | 'center'
  | 'left-sidebar'
  | 'right-sidebar'
  | 'custom';

export type Language = 'en' | 'ru' | 'uk';

export type AppMode = 'prompter' | 'copilot';

export type LLMProvider = 'anthropic' | 'openai-compatible';

export type CopilotTriggerMode = 'both' | 'hotkey' | 'auto';

export type STTProvider = 'local-whisper' | 'cloud-whisper';

export type LocalWhisperModelId =
  | 'onnx-community/whisper-tiny'
  | 'onnx-community/whisper-base'
  | 'onnx-community/whisper-small'
  | 'onnx-community/whisper-large-v3-turbo';

export type STTLanguage = 'auto' | 'ru' | 'en' | 'uk';

export type AudioSourceType = 'system' | 'mic';

export type CopilotSessionPhase =
  | 'idle'
  | 'awaiting-audio-permission'
  | 'listening'
  | 'capturing'
  | 'transcribing'
  | 'reviewing-question'
  | 'answering'
  | 'paused'
  | 'error';

export type CopilotErrorCode =
  | 'AUDIO_PERMISSION_DENIED'
  | 'SYSTEM_AUDIO_NO_TRACK'
  | 'SYSTEM_AUDIO_NO_SIGNAL'
  | 'MODEL_INCOMPLETE'
  | 'MODEL_NATIVE_RUNTIME_MISSING'
  | 'STT_BACKLOG_LIMIT'
  | 'TRANSCRIPTION_FAILED'
  | 'LLM_UNAUTHORIZED'
  | 'LLM_EMPTY_RESPONSE'
  | 'LLM_REQUEST_FAILED'
  | 'PROJECT_INDEX_STALE'
  | 'UNKNOWN';

export interface TranscriptEntry {
  id: string;
  source: AudioSourceType;
  text: string;
  timestamp: number;
  sequence?: number;
  startedAt?: number;
  endedAt?: number;
}

export interface WhisperModelInfo {
  id: LocalWhisperModelId;
  name: string;
  sizeLabel: string;
  description: string;
  downloaded: boolean;
  selected?: boolean;
  status?: 'missing' | 'partial' | 'ready' | 'loading' | 'error';
  error?: string;
}

export interface WhisperDownloadProgress {
  modelId: LocalWhisperModelId;
  status: 'downloading' | 'validating' | 'ready' | 'cancelled' | 'error';
  progress: number;
  file?: string;
  error?: string;
}

export interface CopilotCitation {
  id: string;
  relativePath: string;
  startLine: number;
  endLine: number;
  label: string;
}

export interface CopilotQuestionCandidate {
  id: string;
  text: string;
  source: 'system' | 'manual';
  createdAt: number;
  reviewEndsAt: number;
  transcriptEntryIds: string[];
}

export interface CopilotRequestContext {
  sessionId: string;
  generation: number;
}

export interface CopilotSessionError {
  code: CopilotErrorCode;
  message: string;
  recoverable: boolean;
}

export interface CopilotAudioStatus {
  systemEnabled: boolean;
  systemActive: boolean;
  systemSpeaking: boolean;
  micEnabled: boolean;
  micActive: boolean;
  micSpeaking: boolean;
  audioLevel: number;
  queueDepth: number;
}

export interface CopilotSessionSnapshot {
  sessionId: string;
  generation: number;
  phase: CopilotSessionPhase;
  transcript: TranscriptEntry[];
  pendingQuestion?: CopilotQuestionCandidate;
  activeRequestId?: string;
  activeQuestion?: string;
  answer: string;
  citations: CopilotCitation[];
  audio: CopilotAudioStatus;
  error?: CopilotSessionError;
  updatedAt: number;
}

export type CopilotReadinessItemId = 'llm' | 'audio' | 'stt' | 'project';
export type CopilotReadinessStatus = 'checking' | 'ready' | 'warning' | 'blocked';

export interface CopilotReadinessItem {
  id: CopilotReadinessItemId;
  status: CopilotReadinessStatus;
  title: string;
  detail: string;
}

export interface CopilotReadiness {
  ready: boolean;
  items: CopilotReadinessItem[];
  checkedAt: number;
}

export interface ContextFolderStats {
  folderPath: string;
  fileCount: number;
  totalChars: number;
  topFiles: string[];
  indexedAt: number;
}

export interface CopilotAnswerEvent {
  requestId: string;
  sessionId?: string;
  questionId?: string;
  status: 'idle' | 'thinking' | 'streaming' | 'done' | 'error';
  question?: string;
  delta?: string;
  fullText?: string;
  citations?: CopilotCitation[];
  error?: string;
}

export interface TranscribeAudioPayload {
  samples: Float32Array | number[];
  source: AudioSourceType;
  sessionId: string;
  sessionGeneration: number;
  sequence: number;
  startedAt: number;
  endedAt: number;
}

export interface TranscribeAudioResult {
  text: string;
  entry?: TranscriptEntry;
  error?: string;
  errorCode?: CopilotErrorCode;
}

export interface SystemAudioCaptureResult {
  success: boolean;
  unsupported?: boolean;
  error?: string;
}

export interface SystemAudioPcmChunk {
  data: Uint8Array;
  sampleRate: number;
  capturedAt: number;
}

export interface PrompterSettings {
  // Localization
  language: Language;

  // Operating Mode
  appMode: AppMode;
  copilotCompact: boolean;
  copilotOpacity: number; // 0.0 to 1.0

  // Script content
  text: string;

  // Typography & Appearance
  fontSize: number; // 16 to 72 px
  fontFamily: string;
  textColor: string;
  textShadow: boolean;
  bgColor: string;
  bgOpacity: number; // 0.0 to 1.0
  showFocalGuide: boolean;
  focalGuidePosition: number; // 10 to 90 %
  flipHorizontal: boolean;

  // Window geometry
  width: number;
  height: number;
  xPosition: number; // -1 for auto-center
  yPosition: number;
  presetPosition: PresetPosition;

  // Scroll engine
  speed: number; // px per second (10 to 300)
  autoRewindOnEnd: boolean;

  // Global hotkeys (Electron Accelerator format)
  hotkeyClose: string;
  hotkeyToggle: string;
  hotkeyRewind: string;
  hotkeySpeedUp: string;
  hotkeySpeedDown: string;
  hotkeyAskAI: string;

  // LLM Configuration (Claude / OpenAI / Omnirouter / Custom URL)
  llmProvider: LLMProvider;
  llmApiKey: string;
  llmBaseUrl: string;
  llmModel: string;
  llmSystemPrompt: string;
  copilotTriggerMode: CopilotTriggerMode;
  copilotReviewDelayMs: number;

  // Audio & Speech-to-Text (STT)
  sttProvider: STTProvider;
  localWhisperModel: LocalWhisperModelId;
  cloudSttBaseUrl: string;
  cloudSttApiKey: string;
  cloudSttModel: string;
  sttLanguage: STTLanguage;
  captureSystemAudio: boolean;
  captureMicAudio: boolean;
  micDeviceId: string;
  systemAudioDeviceId: string;

  // Project / Folder Context
  contextFolderPath: string;
  contextCustomNotes: string;
}

export interface DisplayInfo {
  id: number;
  label: string;
  bounds: { x: number; y: number; width: number; height: number };
  workArea: { x: number; y: number; width: number; height: number };
  isPrimary: boolean;
}

export interface WindowBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PrompterState {
  isPlaying: boolean;
  speed: number;
  progressPercent: number;
}
