import { contextBridge, ipcRenderer } from 'electron';
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
  startSystemAudioCapture: (): Promise<SystemAudioCaptureResult> =>
    ipcRenderer.invoke('prompter:start-system-audio-capture'),
  stopSystemAudioCapture: (): Promise<void> =>
    ipcRenderer.invoke('prompter:stop-system-audio-capture'),
  onSystemAudioData: (callback: (chunk: SystemAudioPcmChunk) => void): (() => void) => {
    const handler = (_: unknown, chunk: SystemAudioPcmChunk) => callback(chunk);
    ipcRenderer.on('prompter:system-audio-data', handler);
    return () => ipcRenderer.removeListener('prompter:system-audio-data', handler);
  },
  onSystemAudioError: (callback: (message: string) => void): (() => void) => {
    const handler = (_: unknown, message: string) => callback(message);
    ipcRenderer.on('prompter:system-audio-error', handler);
    return () => ipcRenderer.removeListener('prompter:system-audio-error', handler);
  },

  // Project / Folder Context APIs
  selectContextFolder: (): Promise<ContextFolderStats | null> =>
    ipcRenderer.invoke('prompter:select-context-folder'),
  clearContextFolder: (): Promise<PrompterSettings> =>
    ipcRenderer.invoke('prompter:clear-context-folder'),
  getContextStats: (): Promise<ContextFolderStats | null> =>
    ipcRenderer.invoke('prompter:get-context-stats'),
  refreshContextFolder: (): Promise<ContextFolderStats | null> =>
    ipcRenderer.invoke('prompter:refresh-context-folder'),

  // Local Whisper & STT APIs
  getWhisperModels: (): Promise<WhisperModelInfo[]> =>
    ipcRenderer.invoke('prompter:get-whisper-models'),
  downloadWhisperModel: (
    modelId: LocalWhisperModelId
  ): Promise<{ success: boolean; cancelled?: boolean; error?: string }> =>
    ipcRenderer.invoke('prompter:download-whisper-model', modelId),
  cancelWhisperModelDownload: (
    modelId: LocalWhisperModelId
  ): Promise<{ success: boolean }> =>
    ipcRenderer.invoke('prompter:cancel-whisper-model-download', modelId),
  transcribeAudioChunk: (payload: TranscribeAudioPayload): Promise<TranscribeAudioResult> =>
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
  askCopilot: (
    customPrompt?: string,
    context?: CopilotRequestContext
  ): Promise<{ requestId: string }> =>
    ipcRenderer.invoke('prompter:ask-copilot', customPrompt, context),
  clearCopilotAnswer: (): Promise<void> =>
    ipcRenderer.invoke('prompter:clear-copilot-answer'),
  getTranscript: (): Promise<TranscriptEntry[]> => ipcRenderer.invoke('prompter:get-transcript'),
  clearTranscript: (): Promise<void> => ipcRenderer.invoke('prompter:clear-transcript'),
  getCopilotReadiness: (): Promise<CopilotReadiness> =>
    ipcRenderer.invoke('prompter:get-copilot-readiness'),
  getCopilotSession: (): Promise<CopilotSessionSnapshot> =>
    ipcRenderer.invoke('prompter:get-copilot-session'),
  startCopilotSession: (): Promise<CopilotSessionSnapshot> =>
    ipcRenderer.invoke('prompter:start-copilot-session'),
  stopCopilotSession: (): Promise<CopilotSessionSnapshot> =>
    ipcRenderer.invoke('prompter:stop-copilot-session'),
  setCopilotPaused: (paused: boolean): Promise<CopilotSessionSnapshot> =>
    ipcRenderer.invoke('prompter:set-copilot-paused', paused),
  recoverCopilotSession: (): Promise<CopilotSessionSnapshot> =>
    ipcRenderer.invoke('prompter:recover-copilot-session'),
  reportCopilotAudioStatus: (status: Partial<CopilotAudioStatus>): Promise<void> =>
    ipcRenderer.invoke('prompter:report-copilot-audio-status', status),
  confirmCopilotQuestion: (
    questionId: string
  ): Promise<{ success: boolean; requestId?: string }> =>
    ipcRenderer.invoke('prompter:confirm-copilot-question', questionId),
  cancelCopilotQuestion: (questionId: string): Promise<{ success: boolean }> =>
    ipcRenderer.invoke('prompter:cancel-copilot-question', questionId),
  editCopilotQuestion: (
    questionId: string,
    text: string
  ): Promise<{ success: boolean }> =>
    ipcRenderer.invoke('prompter:edit-copilot-question', questionId, text),
  setIgnoreMouseEvents: (ignore: boolean, options?: { forward: boolean }): void => {
    ipcRenderer.send('prompter:set-ignore-mouse-events', ignore, options);
  },
  setOverlayFocusable: (focusable: boolean): void => {
    ipcRenderer.send('prompter:set-overlay-focusable', focusable);
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
  },
  onCopilotSessionUpdated: (
    callback: (snapshot: CopilotSessionSnapshot) => void
  ): (() => void) => {
    const handler = (_: unknown, snapshot: CopilotSessionSnapshot) => callback(snapshot);
    ipcRenderer.on('prompter:copilot-session-updated', handler);
    return () => ipcRenderer.removeListener('prompter:copilot-session-updated', handler);
  }
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);
