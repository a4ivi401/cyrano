import { contextBridge, ipcRenderer } from 'electron';
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
import { PermissionStatus } from '../common/electronApi';

const electronAPI = {
  getSettings: (): Promise<PrompterSettings> => ipcRenderer.invoke('prompter:get-settings'),
  saveSettings: (settings: Partial<PrompterSettings>): Promise<PrompterSettings> =>
    ipcRenderer.invoke('prompter:save-settings', settings),
  startPrompter: (settings?: PrompterSettings): Promise<{ success: boolean }> =>
    ipcRenderer.invoke('prompter:start', settings),
  stopPrompter: (): Promise<{ success: boolean }> => ipcRenderer.invoke('prompter:stop'),
  getFonts: (): Promise<{ label: string; value: string }[]> => ipcRenderer.invoke('prompter:get-fonts'),
  getDisplays: (): Promise<DisplayInfo[]> => ipcRenderer.invoke('prompter:get-displays'),
  validateShortcut: (accelerator: string): Promise<boolean> =>
    ipcRenderer.invoke('prompter:validate-shortcut', accelerator),

  // System Permissions
  checkPermissions: (): Promise<PermissionStatus> =>
    ipcRenderer.invoke('prompter:check-permissions'),
  requestPermission: (type: 'microphone' | 'accessibility'): Promise<boolean> =>
    ipcRenderer.invoke('prompter:request-permission', type),
  openSystemPreferences: (pane: 'screen' | 'microphone' | 'accessibility'): Promise<void> =>
    ipcRenderer.invoke('prompter:open-system-preferences', pane),

  // Project / Folder Context APIs
  selectContextFolder: (): Promise<ContextFolderStats | null> =>
    ipcRenderer.invoke('prompter:select-context-folder'),
  getContextStats: (folderPath?: string): Promise<ContextFolderStats | null> =>
    ipcRenderer.invoke('prompter:get-context-stats', folderPath),
  refreshContextFolder: (): Promise<ContextFolderStats | null> =>
    ipcRenderer.invoke('prompter:refresh-context-folder'),

  // Local Whisper & STT APIs
  getWhisperModels: (): Promise<WhisperModelInfo[]> =>
    ipcRenderer.invoke('prompter:get-whisper-models'),
  downloadWhisperModel: (
    modelId: LocalWhisperModelId
  ): Promise<{ success: boolean; error?: string }> =>
    ipcRenderer.invoke('prompter:download-whisper-model', modelId),
  transcribeAudioChunk: (payload: {
    samples: Float32Array | number[];
    source: AudioSourceType;
  }): Promise<{ text: string; entry?: TranscriptEntry; error?: string }> =>
    ipcRenderer.invoke('prompter:transcribe-audio', payload),

  // LLM & Copilot APIs
  testLLMConnection: (
    override?: Partial<PrompterSettings>
  ): Promise<{ success: boolean; message: string }> =>
    ipcRenderer.invoke('prompter:test-llm', override),
  analyzeProjectWithAI: (
    override?: Partial<PrompterSettings>
  ): Promise<{ success: boolean; notes?: string; error?: string }> =>
    ipcRenderer.invoke('prompter:analyze-project', override),
  askCopilot: (customPrompt?: string): Promise<{ requestId: string }> =>
    ipcRenderer.invoke('prompter:ask-copilot', customPrompt),
  clearCopilotAnswer: (): Promise<void> =>
    ipcRenderer.invoke('prompter:clear-copilot-answer'),
  getTranscript: (): Promise<TranscriptEntry[]> => ipcRenderer.invoke('prompter:get-transcript'),
  clearTranscript: (): Promise<void> => ipcRenderer.invoke('prompter:clear-transcript'),
  setIgnoreMouseEvents: (ignore: boolean, options?: { forward: boolean }): void => {
    ipcRenderer.send('prompter:set-ignore-mouse-events', ignore, options);
  },

  // Overlay & Settings Events
  onSettingsUpdated: (callback: (settings: PrompterSettings) => void): (() => void) => {
    const handler = (_: any, settings: PrompterSettings) => callback(settings);
    ipcRenderer.on('prompter:settings-updated', handler);
    return () => ipcRenderer.removeListener('prompter:settings-updated', handler);
  },
  onTogglePlay: (callback: () => void): (() => void) => {
    const handler = () => callback();
    ipcRenderer.on('prompter:toggle-play', handler);
    return () => ipcRenderer.removeListener('prompter:toggle-play', handler);
  },
  onRewind: (callback: () => void): (() => void) => {
    const handler = () => callback();
    ipcRenderer.on('prompter:rewind', handler);
    return () => ipcRenderer.removeListener('prompter:rewind', handler);
  },
  onAdjustSpeed: (callback: (delta: number) => void): (() => void) => {
    const handler = (_: any, delta: number) => callback(delta);
    ipcRenderer.on('prompter:adjust-speed', handler);
    return () => ipcRenderer.removeListener('prompter:adjust-speed', handler);
  },
  onStart: (callback: () => void): (() => void) => {
    const handler = () => callback();
    ipcRenderer.on('prompter:start', handler);
    return () => ipcRenderer.removeListener('prompter:start', handler);
  },
  onShortcutAskAI: (callback: () => void): (() => void) => {
    const handler = () => callback();
    ipcRenderer.on('prompter:shortcut-ask-ai', handler);
    return () => ipcRenderer.removeListener('prompter:shortcut-ask-ai', handler);
  },
  onWhisperDownloadProgress: (
    callback: (progress: WhisperDownloadProgress) => void
  ): (() => void) => {
    const handler = (_: any, progress: WhisperDownloadProgress) => callback(progress);
    ipcRenderer.on('prompter:whisper-download-progress', handler);
    return () => ipcRenderer.removeListener('prompter:whisper-download-progress', handler);
  },
  onTranscriptUpdated: (callback: (entries: TranscriptEntry[]) => void): (() => void) => {
    const handler = (_: any, entries: TranscriptEntry[]) => callback(entries);
    ipcRenderer.on('prompter:transcript-updated', handler);
    return () => ipcRenderer.removeListener('prompter:transcript-updated', handler);
  },
  onCopilotAnswer: (callback: (event: CopilotAnswerEvent) => void): (() => void) => {
    const handler = (_: any, event: CopilotAnswerEvent) => callback(event);
    ipcRenderer.on('prompter:copilot-answer', handler);
    return () => ipcRenderer.removeListener('prompter:copilot-answer', handler);
  }
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);
