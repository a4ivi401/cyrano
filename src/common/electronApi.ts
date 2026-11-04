import {
  PrompterSettings,
  DisplayInfo,
  ContextFolderStats,
  WhisperModelInfo,
  WhisperDownloadProgress,
  LocalWhisperModelId,
  AudioSourceType,
  TranscriptEntry,
  CopilotAnswerEvent
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

  // Project / Folder Context APIs
  selectContextFolder: () => Promise<ContextFolderStats | null>;
  getContextStats: (folderPath?: string) => Promise<ContextFolderStats | null>;
  refreshContextFolder: () => Promise<ContextFolderStats | null>;

  // Local Whisper & STT APIs
  getWhisperModels: () => Promise<WhisperModelInfo[]>;
  downloadWhisperModel: (modelId: LocalWhisperModelId) => Promise<{ success: boolean; error?: string }>;
  transcribeAudioChunk: (payload: {
    samples: Float32Array | number[];
    source: AudioSourceType;
  }) => Promise<{ text: string; entry?: TranscriptEntry; error?: string }>;

  // LLM & Copilot APIs
  testLLMConnection: (override?: Partial<PrompterSettings>) => Promise<{ success: boolean; message: string }>;
  analyzeProjectWithAI: (override?: Partial<PrompterSettings>) => Promise<{ success: boolean; notes?: string; error?: string }>;
  askCopilot: (customPrompt?: string) => Promise<{ requestId: string }>;
  clearCopilotAnswer: () => Promise<void>;
  getTranscript: () => Promise<TranscriptEntry[]>;
  clearTranscript: () => Promise<void>;
  setIgnoreMouseEvents?: (ignore: boolean, options?: { forward: boolean }) => void;

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
}
