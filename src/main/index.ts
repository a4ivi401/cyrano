import {
  app,
  BrowserWindow,
  ipcMain,
  screen,
  dialog,
  session,
  desktopCapturer,
  systemPreferences,
  shell
} from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { SettingsStore } from './store';
import { WindowManager } from './windowManager';
import { ShortcutManager } from './shortcuts';
import { getAvailableFonts } from './fonts';
import { WhisperService } from './whisperService';
import { ContextIndexer } from './contextIndexer';
import { LLMService } from './llmService';
import {
  AudioSourceType,
  CopilotAnswerEvent,
  LocalWhisperModelId,
  PrompterSettings,
  TranscriptEntry,
  WhisperDownloadProgress
} from '../common/types';

// Enforce single instance lock
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
}

const store = new SettingsStore();
const windowManager = new WindowManager();
const shortcutManager = new ShortcutManager();
const whisperService = new WhisperService();
const contextIndexer = new ContextIndexer();
const llmService = new LLMService();

let transcriptEntries: TranscriptEntry[] = [];

function broadcastToWindows(channel: string, payload: unknown) {
  const overlay = windowManager.getOverlay();
  if (overlay && !overlay.isDestroyed()) {
    overlay.webContents.send(channel, payload);
  }
  const settingsWin = windowManager.getSettingsWindow();
  if (settingsWin && !settingsWin.isDestroyed()) {
    settingsWin.webContents.send(channel, payload);
  }
}

function broadcastWhisperProgress(progress: WhisperDownloadProgress) {
  broadcastToWindows('prompter:whisper-download-progress', progress);
}

function triggerCopilotAnswer(customQuestion?: string): string {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const currentSettings = store.getSettings();

  const entriesToUse = [...transcriptEntries];
  // Immediately clear accumulated transcript queue so old question fragments don't pollute subsequent questions
  transcriptEntries = [];
  broadcastToWindows('prompter:transcript-updated', transcriptEntries);

  void llmService.streamCopilotAnswer({
    requestId,
    settings: currentSettings,
    transcript: entriesToUse,
    contextIndexer,
    customQuestion,
    onEvent: (event: CopilotAnswerEvent) => {
      broadcastToWindows('prompter:copilot-answer', event);
    }
  });

  return requestId;
}

function registerShortcuts(settings: PrompterSettings) {
  shortcutManager.register(settings, {
    onClose: () => {
      windowManager.stopPrompter();
      shortcutManager.unregister();
    },
    onTogglePlay: () => {
      const overlay = windowManager.getOverlay();
      if (overlay) {
        overlay.webContents.send('prompter:toggle-play');
      }
    },
    onRewind: () => {
      const current = store.getSettings();
      if (current.appMode === 'copilot') {
        transcriptEntries = [];
        broadcastToWindows('prompter:transcript-updated', transcriptEntries);
        llmService.cancelActiveAnswer();
        llmService.clearHistory();
        broadcastToWindows('prompter:copilot-answer', {
          requestId: `clear_${Date.now()}`,
          status: 'idle',
          question: '',
          fullText: ''
        });
      }
      const overlay = windowManager.getOverlay();
      if (overlay && !overlay.isDestroyed()) {
        overlay.webContents.send('prompter:rewind');
      }
    },
    onSpeedAdjust: (delta: number) => {
      const overlay = windowManager.getOverlay();
      if (overlay && !overlay.isDestroyed()) {
        overlay.webContents.send('prompter:adjust-speed', delta);
      }
    },
    onAskAI: () => {
      const overlay = windowManager.getOverlay();
      if (overlay && !overlay.isDestroyed()) {
        overlay.webContents.send('prompter:shortcut-ask-ai');
      } else {
        triggerCopilotAnswer();
      }
    }
  });
}

app.whenReady().then(() => {
  // Set custom app icon in macOS Dock during development
  if (process.platform === 'darwin' && app.dock) {
    const devIconPath = path.join(__dirname, '../../build/icon.png');
    if (fs.existsSync(devIconPath)) {
      try {
        app.dock.setIcon(devIconPath);
      } catch {
        // Ignore dock icon errors
      }
    }
  }

  // Request microphone access on macOS if not yet granted
  if (process.platform === 'darwin') {
    void systemPreferences.askForMediaAccess('microphone').catch(() => {});
  }

  // Configure macOS native ScreenCaptureKit system audio loopback for getDisplayMedia
  session.defaultSession.setDisplayMediaRequestHandler(
    (_request, callback) => {
      // Check screen recording permission on macOS first
      if (process.platform === 'darwin') {
        try {
          const status = systemPreferences.getMediaAccessStatus('screen');
          if (status !== 'granted') {
            // No permission - return empty, renderer will fallback to mic
            callback({});
            return;
          }
        } catch {
          // Ignore permission check errors
        }
      }

      // Use void + immediate catch to prevent unhandled rejection warnings
      void desktopCapturer
        .getSources({ types: ['screen'] })
        .then((sources) => {
          if (sources && sources.length > 0) {
            callback({ video: sources[0], audio: 'loopback' });
          } else {
            callback({});
          }
        })
        .catch(() => {
          // Silently fall back to microphone capture
          callback({});
        });
    },
    { useSystemPicker: false }
  );

  // Index initial context folder & warm up local Whisper model if configured
  const initialSettings = store.getSettings();
  if (initialSettings.contextFolderPath) {
    contextIndexer.indexFolder(initialSettings.contextFolderPath);
  }
  if (initialSettings.sttProvider === 'local-whisper') {
    void whisperService
      .downloadOrLoadModel(initialSettings.localWhisperModel, broadcastWhisperProgress)
      .catch(() => {});
  }

  // Create settings window
  windowManager.createSettingsWindow();

  // IPC Handlers
  ipcMain.handle('prompter:get-settings', () => {
    return store.getSettings();
  });

  ipcMain.handle('prompter:save-settings', (_, newSettings: Partial<PrompterSettings>) => {
    const prevSettings = store.getSettings();
    const updated = store.saveSettings(newSettings);

    if (
      newSettings.contextFolderPath !== undefined &&
      newSettings.contextFolderPath !== prevSettings.contextFolderPath
    ) {
      contextIndexer.indexFolder(updated.contextFolderPath);
    }

    // If overlay is already active, update its bounds & settings immediately
    const overlay = windowManager.getOverlay();
    if (overlay) {
      const bounds = windowManager.calculateOverlayBounds(updated);
      overlay.setBounds(bounds);
      overlay.webContents.send('prompter:settings-updated', updated);
      registerShortcuts(updated);
    }
    return updated;
  });

  ipcMain.handle('prompter:start', (_, overrideSettings?: PrompterSettings) => {
    const settings = overrideSettings ? store.saveSettings(overrideSettings) : store.getSettings();
    if (settings.contextFolderPath && !contextIndexer.getStats()) {
      contextIndexer.indexFolder(settings.contextFolderPath);
    }
    windowManager.startPrompter(settings);
    registerShortcuts(settings);
    return { success: true };
  });

  ipcMain.handle('prompter:stop', () => {
    windowManager.stopPrompter();
    shortcutManager.unregister();
    return { success: true };
  });

  ipcMain.handle('prompter:get-fonts', () => {
    return getAvailableFonts();
  });

  ipcMain.handle('prompter:get-displays', () => {
    const primary = screen.getPrimaryDisplay();
    return screen.getAllDisplays().map((disp) => ({
      id: disp.id,
      label: disp.label || `Display ${disp.id} (${disp.bounds.width}x${disp.bounds.height})`,
      bounds: disp.bounds,
      workArea: disp.workArea,
      isPrimary: disp.id === primary.id
    }));
  });

  ipcMain.handle('prompter:validate-shortcut', (_, accelerator: string) => {
    return ShortcutManager.isValidAccelerator(accelerator);
  });

  // System Permissions Handlers
  ipcMain.handle('prompter:check-permissions', async () => {
    if (process.platform === 'darwin') {
      let screenStatus = 'unknown';
      let micStatus = 'unknown';
      let accessStatus = 'denied';

      try {
        screenStatus = systemPreferences.getMediaAccessStatus('screen');
      } catch {
        screenStatus = 'unknown';
      }

      try {
        micStatus = systemPreferences.getMediaAccessStatus('microphone');
      } catch {
        micStatus = 'unknown';
      }

      try {
        accessStatus = systemPreferences.isTrustedAccessibilityClient(false)
          ? 'granted'
          : 'denied';
      } catch {
        accessStatus = 'denied';
      }

      return {
        screen: screenStatus,
        microphone: micStatus,
        accessibility: accessStatus
      };
    } else if (process.platform === 'win32') {
      let micStatus = 'unknown';
      try {
        micStatus = systemPreferences.getMediaAccessStatus('microphone');
      } catch {
        micStatus = 'granted';
      }
      return {
        screen: 'not-needed',
        microphone: micStatus,
        accessibility: 'not-needed'
      };
    } else {
      return {
        screen: 'not-needed',
        microphone: 'granted',
        accessibility: 'not-needed'
      };
    }
  });

  ipcMain.handle('prompter:request-permission', async (_, type: 'microphone' | 'accessibility') => {
    if (process.platform === 'darwin') {
      if (type === 'microphone') {
        try {
          return await systemPreferences.askForMediaAccess('microphone');
        } catch {
          return false;
        }
      } else if (type === 'accessibility') {
        try {
          return systemPreferences.isTrustedAccessibilityClient(true);
        } catch {
          return false;
        }
      }
    }
    return true;
  });

  ipcMain.handle(
    'prompter:open-system-preferences',
    async (_, pane: 'screen' | 'microphone' | 'accessibility') => {
      if (process.platform === 'darwin') {
        let url = 'x-apple.systempreferences:com.apple.preference.security';
        if (pane === 'screen') {
          url = 'x-apple.systempreferences:com.apple.preference.security?Privacy_ScreenCapture';
        } else if (pane === 'microphone') {
          url = 'x-apple.systempreferences:com.apple.preference.security?Privacy_Microphone';
        } else if (pane === 'accessibility') {
          url = 'x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility';
        }
        await shell.openExternal(url);
      } else if (process.platform === 'win32') {
        if (pane === 'microphone') {
          await shell.openExternal('ms-settings:privacy-microphone');
        } else {
          await shell.openExternal('ms-settings:privacy');
        }
      }
    }
  );

  // Project / Folder Context Handlers
  ipcMain.handle('prompter:select-context-folder', async () => {
    const settingsWin = windowManager.getSettingsWindow();
    const result = settingsWin
      ? await dialog.showOpenDialog(settingsWin, {
          properties: ['openDirectory']
        })
      : await dialog.showOpenDialog({
          properties: ['openDirectory']
        });

    if (result.canceled || result.filePaths.length === 0) {
      return contextIndexer.getStats();
    }

    const folderPath = result.filePaths[0];
    store.saveSettings({ contextFolderPath: folderPath });
    return contextIndexer.indexFolder(folderPath);
  });

  ipcMain.handle('prompter:get-context-stats', (_, folderPath?: string) => {
    const targetPath = folderPath ?? store.getSettings().contextFolderPath;
    if (!targetPath) return null;
    const currentStats = contextIndexer.getStats();
    if (currentStats && currentStats.folderPath === targetPath) {
      return currentStats;
    }
    return contextIndexer.indexFolder(targetPath);
  });

  ipcMain.handle('prompter:refresh-context-folder', () => {
    const folderPath = store.getSettings().contextFolderPath;
    if (!folderPath) return null;
    return contextIndexer.indexFolder(folderPath);
  });

  // Whisper STT & Model Handlers
  ipcMain.handle('prompter:get-whisper-models', () => {
    return whisperService.getModelsStatus();
  });

  ipcMain.handle(
    'prompter:download-whisper-model',
    async (_, modelId: LocalWhisperModelId) => {
      try {
        await whisperService.downloadOrLoadModel(modelId, broadcastWhisperProgress);
        return { success: true };
      } catch (err: any) {
        return {
          success: false,
          error: err?.message || 'Failed to download Whisper model'
        };
      }
    }
  );

  ipcMain.handle(
    'prompter:transcribe-audio',
    async (
      _,
      payload: {
        samples: Float32Array | number[];
        source: AudioSourceType;
      }
    ) => {
      try {
        const settings = store.getSettings();
        const text = await whisperService.transcribe(
          payload.samples,
          settings,
          broadcastWhisperProgress
        );

        if (!text) {
          return { text: '' };
        }

        const entry: TranscriptEntry = {
          id: `tr_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          source: payload.source,
          text,
          timestamp: Date.now()
        };

        transcriptEntries.push(entry);
        if (transcriptEntries.length > 60) {
          transcriptEntries = transcriptEntries.slice(-60);
        }

        broadcastToWindows('prompter:transcript-updated', transcriptEntries);

        // Auto-trigger AI answer if a question or discussion prompt was asked in Copilot mode
        let questionPrompt = text;
        const isSingleQuestion = llmService.isLikelyQuestion(text);
        if (!isSingleQuestion && transcriptEntries.length > 1) {
          const lastTwo = transcriptEntries.slice(-2);
          if (lastTwo[1].timestamp - lastTwo[0].timestamp <= 7000) {
            const combined = lastTwo.map((e) => e.text).join(' ');
            if (llmService.isLikelyQuestion(combined)) {
              questionPrompt = combined;
            }
          }
        }
        const isQuestion = isSingleQuestion || questionPrompt !== text;

        const canAuto =
          settings.appMode === 'copilot' &&
          (settings.copilotTriggerMode === 'both' || settings.copilotTriggerMode === 'auto') &&
          isQuestion &&
          llmService.canAutoTrigger();

        if (canAuto) {
          triggerCopilotAnswer(questionPrompt);
        }

        return { text, entry };
      } catch (err: any) {
        console.error('[Main] Audio transcription error:', err);
        return {
          text: '',
          error: err?.message || 'Transcription failed'
        };
      }
    }
  );

  // Dynamic Mouse Event Forwarding (allows clicking HUD buttons while keeping window click-through elsewhere)
  ipcMain.on(
    'prompter:set-ignore-mouse-events',
    (event, ignore: boolean, options?: { forward: boolean }) => {
      const win = BrowserWindow.fromWebContents(event.sender);
      if (win && !win.isDestroyed()) {
        win.setIgnoreMouseEvents(ignore, options);
      }
    }
  );

  // LLM & Copilot Handlers
  ipcMain.handle('prompter:test-llm', async (_, override?: Partial<PrompterSettings>) => {
    const current = store.getSettings();
    const merged: PrompterSettings = { ...current, ...(override || {}) };
    return llmService.testConnection(merged);
  });

  ipcMain.handle('prompter:analyze-project', async (_, override?: Partial<PrompterSettings>) => {
    const current = store.getSettings();
    const merged: PrompterSettings = { ...current, ...(override || {}) };
    const result = await llmService.analyzeProjectForNotes(merged, contextIndexer);
    if (result.success && result.notes) {
      const updated = store.saveSettings({ contextCustomNotes: result.notes });
      broadcastToWindows('prompter:settings-updated', updated);
    }
    return result;
  });

  ipcMain.handle('prompter:ask-copilot', (_, customPrompt?: string) => {
    const requestId = triggerCopilotAnswer(customPrompt);
    return { requestId };
  });

  ipcMain.handle('prompter:clear-copilot-answer', () => {
    transcriptEntries = [];
    broadcastToWindows('prompter:transcript-updated', transcriptEntries);
    llmService.cancelActiveAnswer();
    llmService.clearHistory();
    broadcastToWindows('prompter:copilot-answer', {
      requestId: `clear_${Date.now()}`,
      status: 'idle',
      question: '',
      fullText: ''
    });
  });

  ipcMain.handle('prompter:get-transcript', () => {
    return transcriptEntries;
  });

  ipcMain.handle('prompter:clear-transcript', () => {
    transcriptEntries = [];
    broadcastToWindows('prompter:transcript-updated', transcriptEntries);
  });

  app.on('activate', () => {
    if (!windowManager.getIsPrompterActive()) {
      windowManager.showSettings();
    }
  });
});

app.on('second-instance', () => {
  if (!windowManager.getIsPrompterActive()) {
    windowManager.showSettings();
  }
});

app.on('will-quit', () => {
  shortcutManager.unregister();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
