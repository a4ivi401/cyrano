import {
  PrompterSettings,
  DisplayInfo,
  ContextFolderStats,
  WhisperModelInfo,
  WhisperDownloadProgress,
  LocalWhisperModelId,
  TranscriptEntry,
  CopilotAnswerEvent,
  CopilotAudioStatus,
  CopilotRequestContext,
  CopilotReadiness,
  CopilotSessionSnapshot,
  SystemAudioCaptureResult,
  SystemAudioPcmChunk,
  TranscribeAudioPayload,
  TranscribeAudioResult
} from '../common/types';

export type PermissionState =
  | 'granted'
  | 'denied'
  | 'not-determined'
  | 'restricted'
  | 'not-needed'
  | 'unknown';

export interface PermissionStatus {
  screen: PermissionState;
  microphone: PermissionState;
  accessibility: PermissionState;
}

export interface IElectronAPI {
  getSettings: () => Promise<PrompterSettings>;
  saveSettings: (settings: Partial<PrompterSettings>) => Promise<PrompterSettings>;
  startPrompter: (settings?: PrompterSettings) => Promise<{ success: boolean }>;
  stopPrompter: () => Promise<{ success: boolean }>;
  getFonts: () => Promise<{ label: string; value: string }[]>;
  getDisplays: () => Promise<DisplayInfo[]>;
  validateShortcut: (accelerator: string) => Promise<boolean>;

  // System Permissions
  checkPermissions: () => Promise<PermissionStatus>;
  requestPermission: (type: 'microphone' | 'accessibility') => Promise<boolean>;
  openSystemPreferences: (pane: 'screen' | 'microphone' | 'accessibility') => Promise<void>;

  // Native system audio capture (macOS 14.2+)
  startSystemAudioCapture: () => Promise<SystemAudioCaptureResult>;
  stopSystemAudioCapture: () => Promise<void>;
  onSystemAudioData: (callback: (chunk: SystemAudioPcmChunk) => void) => () => void;
  onSystemAudioError: (callback: (message: string) => void) => () => void;

  // Project / Folder Context APIs
  selectContextFolder: () => Promise<ContextFolderStats | null>;
  clearContextFolder: () => Promise<PrompterSettings>;
  getContextStats: () => Promise<ContextFolderStats | null>;
  refreshContextFolder: () => Promise<ContextFolderStats | null>;

  // Local Whisper & STT APIs
  getWhisperModels: () => Promise<WhisperModelInfo[]>;
  downloadWhisperModel: (
    modelId: LocalWhisperModelId
  ) => Promise<{ success: boolean; cancelled?: boolean; error?: string }>;
  cancelWhisperModelDownload: (modelId: LocalWhisperModelId) => Promise<{ success: boolean }>;
  transcribeAudioChunk: (payload: TranscribeAudioPayload) => Promise<TranscribeAudioResult>;

  // LLM & Copilot APIs
  testLLMConnection: (override?: Partial<PrompterSettings>) => Promise<{ success: boolean; message: string }>;
  analyzeProjectWithAI: (override?: Partial<PrompterSettings>) => Promise<{ success: boolean; notes?: string; error?: string }>;
  askCopilot: (
    customPrompt?: string,
    context?: CopilotRequestContext
  ) => Promise<{ requestId: string }>;
  clearCopilotAnswer: () => Promise<void>;
  getTranscript: () => Promise<TranscriptEntry[]>;
  clearTranscript: () => Promise<void>;
  getCopilotReadiness: () => Promise<CopilotReadiness>;
  getCopilotSession: () => Promise<CopilotSessionSnapshot>;
  startCopilotSession: () => Promise<CopilotSessionSnapshot>;
  stopCopilotSession: () => Promise<CopilotSessionSnapshot>;
  setCopilotPaused: (paused: boolean) => Promise<CopilotSessionSnapshot>;
  recoverCopilotSession: () => Promise<CopilotSessionSnapshot>;
  reportCopilotAudioStatus: (status: Partial<CopilotAudioStatus>) => Promise<void>;
  confirmCopilotQuestion: (questionId: string) => Promise<{ success: boolean; requestId?: string }>;
  cancelCopilotQuestion: (questionId: string) => Promise<{ success: boolean }>;
  editCopilotQuestion: (
    questionId: string,
    text: string
  ) => Promise<{ success: boolean }>;
  setIgnoreMouseEvents?: (ignore: boolean, options?: { forward: boolean }) => void;
  setOverlayFocusable?: (focusable: boolean) => void;

  // Overlay & Settings Events
  onSettingsUpdated: (callback: (settings: PrompterSettings) => void) => () => void;
  onTogglePlay: (callback: () => void) => () => void;
  onRewind: (callback: () => void) => () => void;
  onAdjustSpeed: (callback: (delta: number) => void) => () => void;
  onStart: (callback: () => void) => () => void;
  onShortcutAskAI: (callback: () => void) => () => void;
  onWhisperDownloadProgress: (callback: (progress: WhisperDownloadProgress) => void) => () => void;
  onTranscriptUpdated: (callback: (entries: TranscriptEntry[]) => void) => () => void;
  onCopilotAnswer: (callback: (event: CopilotAnswerEvent) => void) => () => void;
  onCopilotSessionUpdated: (callback: (snapshot: CopilotSessionSnapshot) => void) => () => void;
}
