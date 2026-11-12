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
import { CopilotSession } from './copilotSession';
import { detectSystemQuestion } from './questionDetector';
import { supportsSystemAudioLoopback } from './platformCapabilities';
import { SystemAudioCapture } from './systemAudioCapture';
import {
  CopilotAudioStatus,
  CopilotAnswerEvent,
  CopilotErrorCode,
  CopilotReadiness,
  CopilotRequestContext,
  LocalWhisperModelId,
  PrompterSettings,
  TranscribeAudioPayload,
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
const systemAudioCapture = new SystemAudioCapture();
const copilotSession = new CopilotSession((snapshot) => {
  broadcastToWindows('prompter:copilot-session-updated', snapshot);
});

let questionReviewTimer: NodeJS.Timeout | null = null;
const handledQuestionTranscriptIds = new Set<string>();

function clearQuestionReviewTimer(): void {
  if (questionReviewTimer) {
    clearTimeout(questionReviewTimer);
    questionReviewTimer = null;
  }
}

function clearHandledQuestions(): void {
  handledQuestionTranscriptIds.clear();
}

function classifyTranscriptionError(message: string): CopilotErrorCode {
  if (/incomplete|missing a runtime-required local file|model.*missing/i.test(message)) {
    return 'MODEL_INCOMPLETE';
  }
  if (/sharp|onnx runtime|onnxruntime|native package|native runtime/i.test(message)) {
    return 'MODEL_NATIVE_RUNTIME_MISSING';
  }
  if (/falling behind|backlog/i.test(message)) return 'STT_BACKLOG_LIMIT';
  return 'TRANSCRIPTION_FAILED';
}

function classifyLlmError(message: string): CopilotErrorCode {
  if (/\b401\b|unauthori[sz]ed|invalid api key|authentication/i.test(message)) {
    return 'LLM_UNAUTHORIZED';
  }
  if (/empty response/i.test(message)) return 'LLM_EMPTY_RESPONSE';
  return 'LLM_REQUEST_FAILED';
}

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

function triggerCopilotAnswer(customQuestion?: string, questionId?: string): string {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const currentSettings = store.getSettings();
  const snapshot = copilotSession.getSnapshot();
  const pendingQuestion = snapshot.pendingQuestion;
  const question = (customQuestion || pendingQuestion?.text || '').trim();
  const resolvedQuestionId = questionId || pendingQuestion?.id || `manual_${Date.now()}`;

  clearQuestionReviewTimer();
  if (!question) {
    const message =
      currentSettings.language === 'en'
        ? 'No confirmed question was recognized.'
        : currentSettings.language === 'uk'
          ? 'Підтверджене питання не розпізнано.'
          : 'Подтвержденный вопрос не распознан.';
    copilotSession.fail('TRANSCRIPTION_FAILED', message, true);
    broadcastToWindows('prompter:copilot-answer', {
      requestId,
      sessionId: snapshot.sessionId,
      questionId: resolvedQuestionId,
      status: 'error',
      question: '',
      fullText: '',
      citations: [],
      error: message
    } satisfies CopilotAnswerEvent);
    return requestId;
  }

  if (!copilotSession.beginAnswer(resolvedQuestionId, requestId, question)) {
    return requestId;
  }

  const sessionId = copilotSession.getSnapshot().sessionId;
  const entriesToUse = copilotSession.getSnapshot().transcript;

  void llmService.streamCopilotAnswer({
    requestId,
    sessionId,
    questionId: resolvedQuestionId,
    settings: currentSettings,
    transcript: entriesToUse,
    contextIndexer,
    customQuestion: question,
    onEvent: (event: CopilotAnswerEvent) => {
      const active = copilotSession.getSnapshot();
      if (
        event.sessionId !== active.sessionId ||
        event.requestId !== active.activeRequestId
      ) {
        return;
      }

      if (event.status === 'streaming') {
        copilotSession.updateAnswer(requestId, event.fullText || '', event.citations || []);
      } else if (event.status === 'done') {
        copilotSession.finishAnswer(requestId, event.fullText || '', event.citations || []);
        const latestUnprocessedSystemEntry = copilotSession
          .getSnapshot()
          .transcript.filter(
            (entry) =>
              entry.source === 'system' && !handledQuestionTranscriptIds.has(entry.id)
          )
          .at(-1);
        if (latestUnprocessedSystemEntry) {
          maybeCreateAutomaticQuestion(latestUnprocessedSystemEntry, store.getSettings());
        }
      } else if (event.status === 'error') {
        const message = event.error || 'LLM request failed';
        copilotSession.fail(classifyLlmError(message), message, true);
      }
      broadcastToWindows('prompter:copilot-answer', event);
    }
  });

  return requestId;
}

function confirmPendingQuestion(questionId: string): { success: boolean; requestId?: string } {
  const pending = copilotSession.getSnapshot().pendingQuestion;
  if (!pending || pending.id !== questionId) return { success: false };
  return {
    success: true,
    requestId: triggerCopilotAnswer(pending.text, pending.id)
  };
}

function scheduleQuestionReview(questionId: string): void {
  clearQuestionReviewTimer();
  const pending = copilotSession.getSnapshot().pendingQuestion;
  if (!pending || pending.id !== questionId) return;

  questionReviewTimer = setTimeout(() => {
    questionReviewTimer = null;
    confirmPendingQuestion(questionId);
  }, Math.max(0, pending.reviewEndsAt - Date.now()));
}

function buildCopilotReadiness(settings: PrompterSettings): CopilotReadiness {
  const models = whisperService.getModelsStatus();
  const selectedModel = models.find((model) => model.id === settings.localWhisperModel);
  const hasLlmCredentials =
    Boolean(settings.llmModel.trim() && settings.llmBaseUrl.trim()) &&
    (Boolean(settings.llmApiKey.trim()) ||
      /(?:localhost|127\.0\.0\.1|0\.0\.0\.0)/.test(settings.llmBaseUrl));
  const systemLoopbackSupported = supportsSystemAudioLoopback(process.platform);
  const hasAudioSource =
    (settings.captureSystemAudio && systemLoopbackSupported) || settings.captureMicAudio;
  const automaticTriggerUnavailable =
    (settings.copilotTriggerMode === 'auto' || settings.copilotTriggerMode === 'both') &&
    !(settings.captureSystemAudio && systemLoopbackSupported);
  const cloudSttReady =
    settings.sttProvider === 'cloud-whisper' &&
    Boolean((settings.cloudSttApiKey || settings.llmApiKey).trim());
  const localSttReady =
    settings.sttProvider === 'local-whisper' && Boolean(selectedModel?.downloaded);
  const contextStats = contextIndexer.getStats();

  const items: CopilotReadiness['items'] = [
    {
      id: 'llm',
      status: hasLlmCredentials ? 'ready' : 'blocked',
      title: 'AI model',
      detail: hasLlmCredentials
        ? `${settings.llmProvider} · ${settings.llmModel}`
        : 'Configure and test the answer model.'
    },
    {
      id: 'audio',
      status:
        !hasAudioSource ||
        (settings.copilotTriggerMode === 'auto' && automaticTriggerUnavailable)
          ? 'blocked'
          : 'warning',
      title: 'Meeting audio',
      detail: automaticTriggerUnavailable && hasAudioSource
        ? 'Automatic question detection requires system loopback; manual questions remain available.'
        : hasAudioSource
        ? 'The selected source will be verified when Copilot starts.'
        : settings.captureSystemAudio && !systemLoopbackSupported
          ? 'System loopback requires Windows or macOS 13+. Enable the microphone explicitly.'
          : 'Enable system audio or microphone capture.'
    },
    {
      id: 'stt',
      status: localSttReady || cloudSttReady ? 'ready' : 'blocked',
      title: 'Speech recognition',
      detail:
        settings.sttProvider === 'local-whisper'
          ? selectedModel?.downloaded
            ? `${selectedModel.name} is ready locally.`
            : 'Download the selected Whisper model.'
          : cloudSttReady
            ? `${settings.cloudSttModel || 'whisper-1'} is configured.`
            : 'Configure the cloud STT API key.'
    },
    {
      id: 'project',
      status: contextStats?.fileCount ? 'ready' : 'warning',
      title: 'Project context',
      detail: contextStats?.fileCount
        ? `${contextStats.fileCount} files indexed.`
        : 'Select a project folder for code-aware answers.'
    }
  ];

  return {
    ready: !items.some((item) => item.status === 'blocked'),
    items,
    checkedAt: Date.now()
  };
}

function maybeCreateAutomaticQuestion(
  entry: TranscriptEntry,
  settings: PrompterSettings
): void {
  if (
    entry.source !== 'system' ||
    settings.appMode !== 'copilot' ||
    (settings.copilotTriggerMode !== 'both' && settings.copilotTriggerMode !== 'auto')
  ) {
    return;
  }

  const snapshot = copilotSession.getSnapshot();
  if (
    snapshot.pendingQuestion ||
    snapshot.phase === 'answering' ||
    snapshot.phase === 'paused' ||
    snapshot.phase === 'error'
  ) {
    return;
  }

  const detected = detectSystemQuestion(
    snapshot.transcript,
    entry,
    (text) => llmService.isLikelyQuestion(text),
    7000,
    handledQuestionTranscriptIds
  );
  if (!detected || !llmService.canAutoTrigger()) return;

  for (const entryId of detected.transcriptEntryIds) {
    handledQuestionTranscriptIds.add(entryId);
  }

  const candidate = copilotSession.createQuestionCandidate({
    text: detected.text,
    source: 'system',
    transcriptEntryIds: detected.transcriptEntryIds,
    reviewDelayMs: settings.copilotReviewDelayMs
  });
  scheduleQuestionReview(candidate.id);
}

function getLatestSystemUtterance(transcript: readonly TranscriptEntry[]): {
  text: string;
  entryIds: string[];
} | null {
  let latestIndex = -1;
  for (let index = transcript.length - 1; index >= 0; index -= 1) {
    if (transcript[index].source === 'system' && transcript[index].text.trim()) {
      latestIndex = index;
      break;
    }
  }
  if (latestIndex < 0) return null;

  const latest = transcript[latestIndex];
  const entries = [latest];
  const previous = transcript[latestIndex - 1];
  if (
    previous?.source === 'system' &&
    previous.text.trim() &&
    latest.timestamp - previous.timestamp >= 0 &&
    latest.timestamp - previous.timestamp <= 7000 &&
    !/[.!?]\s*$/.test(previous.text.trim())
  ) {
    entries.unshift(previous);
  }

  return {
    text: entries.map((entry) => entry.text.trim()).join(' '),
    entryIds: entries.map((entry) => entry.id)
  };
}

function registerShortcuts(settings: PrompterSettings) {
  shortcutManager.register(settings, {
    onClose: () => {
      clearQuestionReviewTimer();
      clearHandledQuestions();
      llmService.cancelActiveAnswer();
      copilotSession.stop();
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
        clearQuestionReviewTimer();
        clearHandledQuestions();
        llmService.cancelActiveAnswer();
        llmService.clearHistory();
        copilotSession.clearConversation();
        broadcastToWindows('prompter:transcript-updated', []);
        broadcastToWindows('prompter:copilot-answer', {
          requestId: `clear_${Date.now()}`,
          sessionId: copilotSession.getSnapshot().sessionId,
          status: 'idle',
          question: '',
          fullText: '',
          citations: []
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

  // Grant media permissions (microphone, audio capture, display capture) across platforms
  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
    const allowed = ['media', 'display-capture', 'screen', 'audioCapture'];
    const trustedSender = [windowManager.getSettingsWindow(), windowManager.getOverlay()].some(
      (window) => window?.webContents.id === webContents.id
    );
    callback(
      trustedSender && (allowed.includes(permission) || permission.startsWith('media'))
    );
  });

  session.defaultSession.setPermissionCheckHandler((webContents, permission) => {
    const allowed = ['media', 'display-capture', 'screen', 'audioCapture'];
    const senderId = webContents?.id;
    const trustedSender =
      senderId !== undefined &&
      [windowManager.getSettingsWindow(), windowManager.getOverlay()].some(
        (window) => window?.webContents.id === senderId
      );
    return trustedSender && (allowed.includes(permission) || permission.startsWith('media'));
  });

  // Display-media loopback remains the Windows and legacy macOS fallback.
  session.defaultSession.setDisplayMediaRequestHandler(
    (request, callback) => {
      // This fallback query triggers the screen-capture prompt on older macOS releases.
      void desktopCapturer
        .getSources({ types: ['screen'] })
        .then((sources) => {
          if (sources && sources.length > 0) {
            callback({
              video: sources[0],
              ...(request.audioRequested && supportsSystemAudioLoopback(process.platform)
                ? { audio: 'loopback' as const }
                : {})
            });
          } else {
            callback(null);
          }
        })
        .catch(() => {
          // Do not substitute another source for system audio.
          callback(null);
        });
    },
    { useSystemPicker: false }
  );

  // Index context eagerly, but never load or download Whisper until Copilot needs it.
  const initialSettings = store.getSettings();
  if (initialSettings.contextFolderPath) {
    contextIndexer.indexFolder(initialSettings.contextFolderPath);
  }

  // Create settings window
  windowManager.createSettingsWindow();

  // IPC Handlers
  ipcMain.handle('prompter:get-settings', () => {
    return store.getSettings();
  });

  ipcMain.handle('prompter:save-settings', (_, newSettings: Partial<PrompterSettings>) => {
    const prevSettings = store.getSettings();
    const safeSettings = { ...newSettings };
    delete safeSettings.contextFolderPath;
    const updated = store.saveSettings(safeSettings);

    if (prevSettings.appMode === 'copilot' && updated.appMode !== 'copilot') {
      clearQuestionReviewTimer();
      clearHandledQuestions();
      llmService.cancelActiveAnswer();
      copilotSession.stop();
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
    const currentSettings = store.getSettings();
    const settings = overrideSettings
      ? store.saveSettings({
          ...overrideSettings,
          contextFolderPath: currentSettings.contextFolderPath
        })
      : currentSettings;
    if (settings.contextFolderPath && !contextIndexer.getStats()) {
      contextIndexer.indexFolder(settings.contextFolderPath);
    }
    if (settings.appMode === 'copilot') {
      clearQuestionReviewTimer();
      clearHandledQuestions();
      llmService.cancelActiveAnswer();
      llmService.clearHistory();
      copilotSession.start({
        systemEnabled: settings.captureSystemAudio,
        micEnabled: settings.captureMicAudio
      });
    } else {
      copilotSession.stop();
    }
    windowManager.startPrompter(settings);
    registerShortcuts(settings);
    return { success: true };
  });

  ipcMain.handle('prompter:stop', () => {
    clearQuestionReviewTimer();
    clearHandledQuestions();
    llmService.cancelActiveAnswer();
    llmService.clearHistory();
    copilotSession.stop();
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

  ipcMain.handle('prompter:start-system-audio-capture', async (event) => {
    const trustedSender = [windowManager.getSettingsWindow(), windowManager.getOverlay()].some(
      (window) => window?.webContents.id === event.sender.id
    );
    if (!trustedSender) {
      return { success: false, error: 'System audio capture request was rejected.' };
    }
    return systemAudioCapture.start(event.sender);
  });

  ipcMain.handle('prompter:stop-system-audio-capture', async (event) => {
    await systemAudioCapture.stop(event.sender.id);
  });

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
    const updated = store.saveSettings({ contextFolderPath: folderPath, contextCustomNotes: '' });
    llmService.cancelActiveAnswer();
    llmService.clearHistory();
    clearQuestionReviewTimer();
    clearHandledQuestions();
    copilotSession.clearConversation();
    broadcastToWindows('prompter:settings-updated', updated);
    return contextIndexer.indexFolder(folderPath);
  });

  ipcMain.handle('prompter:clear-context-folder', () => {
    const updated = store.saveSettings({ contextFolderPath: '', contextCustomNotes: '' });
    contextIndexer.indexFolder('');
    clearQuestionReviewTimer();
    clearHandledQuestions();
    llmService.cancelActiveAnswer();
    llmService.clearHistory();
    copilotSession.clearConversation();
    broadcastToWindows('prompter:settings-updated', updated);
    return updated;
  });

  ipcMain.handle('prompter:get-context-stats', () => {
    const targetPath = store.getSettings().contextFolderPath;
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
    llmService.cancelActiveAnswer();
    const stats = contextIndexer.indexFolder(folderPath);
    llmService.clearHistory();
    clearQuestionReviewTimer();
    clearHandledQuestions();
    copilotSession.clearConversation();
    return stats;
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
      } catch (error: unknown) {
        if (error instanceof Error && error.name === 'ModelDownloadCancelledError') {
          return { success: false, cancelled: true };
        }
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to download Whisper model'
        };
      }
    }
  );

  ipcMain.handle(
    'prompter:cancel-whisper-model-download',
    (_, modelId: LocalWhisperModelId) => {
      return { success: whisperService.cancelModelDownload(modelId) };
    }
  );

  ipcMain.handle(
    'prompter:transcribe-audio',
    async (_, payload: TranscribeAudioPayload) => {
      try {
        const settings = store.getSettings();
        const sessionBeforeTranscription = copilotSession.getSnapshot();
        if (
          payload.sessionId !== sessionBeforeTranscription.sessionId ||
          payload.sessionGeneration !== sessionBeforeTranscription.generation ||
          sessionBeforeTranscription.phase === 'idle' ||
          sessionBeforeTranscription.phase === 'paused' ||
          sessionBeforeTranscription.phase === 'error' ||
          (payload.source === 'system' && !sessionBeforeTranscription.audio.systemEnabled) ||
          (payload.source === 'mic' && !sessionBeforeTranscription.audio.micEnabled)
        ) {
          return { text: '' };
        }
        if (
          settings.appMode === 'copilot' &&
          sessionBeforeTranscription.phase !== 'answering' &&
          sessionBeforeTranscription.phase !== 'reviewing-question'
        ) {
          copilotSession.setPhase('transcribing');
        }
        const text = await whisperService.transcribe(
          payload.samples,
          settings,
          broadcastWhisperProgress
        );

        const sessionAfterTranscription = copilotSession.getSnapshot();
        if (
          payload.sessionId !== sessionAfterTranscription.sessionId ||
          payload.sessionGeneration !== sessionAfterTranscription.generation ||
          sessionAfterTranscription.phase === 'idle' ||
          sessionAfterTranscription.phase === 'paused' ||
          sessionAfterTranscription.phase === 'error'
        ) {
          return { text: '' };
        }

        if (!text) {
          const current = copilotSession.getSnapshot();
          if (current.phase === 'transcribing') {
            copilotSession.setPhase(
              current.audio.systemActive || current.audio.micActive
                ? 'listening'
                : 'awaiting-audio-permission'
            );
          }
          return { text: '' };
        }

        const entry: TranscriptEntry = {
          id: `tr_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          source: payload.source,
          text,
          timestamp: payload.endedAt || Date.now(),
          sequence: payload.sequence,
          startedAt: payload.startedAt,
          endedAt: payload.endedAt
        };

        copilotSession.appendTranscript(entry);
        const transcript = copilotSession.getSnapshot().transcript;
        broadcastToWindows('prompter:transcript-updated', transcript);

        const current = copilotSession.getSnapshot();
        if (current.phase === 'transcribing') {
          copilotSession.setPhase(
            current.audio.systemActive || current.audio.micActive
              ? 'listening'
              : 'awaiting-audio-permission'
          );
        }
        maybeCreateAutomaticQuestion(entry, settings);

        return { text, entry };
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Transcription failed';
        const errorCode = classifyTranscriptionError(message);
        console.error('[Main] Audio transcription error:', error);
        const currentSession = copilotSession.getSnapshot();
        if (
          payload.sessionId === currentSession.sessionId &&
          payload.sessionGeneration === currentSession.generation &&
          currentSession.phase !== 'idle' &&
          currentSession.phase !== 'paused'
        ) {
          copilotSession.fail(errorCode, message, true);
        }
        return {
          text: '',
          error: message,
          errorCode
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
        if (
          process.platform === 'linux' &&
          store.getSettings().appMode === 'copilot' &&
          ignore
        ) {
          win.setIgnoreMouseEvents(false);
          return;
        }
        win.setIgnoreMouseEvents(ignore, options);
      }
    }
  );

  ipcMain.on('prompter:set-overlay-focusable', (event, focusable: boolean) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (!win || win.isDestroyed() || win !== windowManager.getOverlay()) return;
    win.setFocusable(Boolean(focusable));
    if (focusable) win.focus();
  });

  // LLM & Copilot Handlers
  ipcMain.handle('prompter:get-copilot-readiness', () => {
    return buildCopilotReadiness(store.getSettings());
  });

  ipcMain.handle('prompter:get-copilot-session', () => {
    return copilotSession.getSnapshot();
  });

  ipcMain.handle('prompter:start-copilot-session', () => {
    const settings = store.getSettings();
    if (!copilotSession.isActive()) {
      llmService.clearHistory();
      copilotSession.start({
        systemEnabled: settings.captureSystemAudio,
        micEnabled: settings.captureMicAudio
      });
    }
    return copilotSession.getSnapshot();
  });

  ipcMain.handle('prompter:stop-copilot-session', () => {
    clearQuestionReviewTimer();
    clearHandledQuestions();
    llmService.cancelActiveAnswer();
    llmService.clearHistory();
    copilotSession.stop();
    return copilotSession.getSnapshot();
  });

  ipcMain.handle('prompter:set-copilot-paused', (_, paused: boolean) => {
    if (!copilotSession.isActive()) return copilotSession.getSnapshot();
    if (paused) {
      clearQuestionReviewTimer();
      const pendingQuestion = copilotSession.getSnapshot().pendingQuestion;
      if (pendingQuestion) copilotSession.cancelQuestion(pendingQuestion.id);
    }
    copilotSession.setPaused(Boolean(paused));
    return copilotSession.getSnapshot();
  });

  ipcMain.handle('prompter:recover-copilot-session', () => {
    if (copilotSession.isActive()) copilotSession.recover();
    return copilotSession.getSnapshot();
  });

  ipcMain.handle(
    'prompter:report-copilot-audio-status',
    (_, status: Partial<CopilotAudioStatus>) => {
      if (!copilotSession.isActive()) return;
      copilotSession.updateAudio(status);
      const snapshot = copilotSession.getSnapshot();
      if (
        snapshot.phase !== 'answering' &&
        snapshot.phase !== 'reviewing-question' &&
        snapshot.phase !== 'paused' &&
        snapshot.phase !== 'error' &&
        snapshot.phase !== 'transcribing'
      ) {
        copilotSession.setPhase(
          snapshot.audio.systemSpeaking || snapshot.audio.micSpeaking
            ? 'capturing'
            : snapshot.audio.systemActive || snapshot.audio.micActive
              ? 'listening'
              : 'awaiting-audio-permission'
        );
      }
    }
  );

  ipcMain.handle('prompter:confirm-copilot-question', (_, questionId: string) => {
    return confirmPendingQuestion(questionId);
  });

  ipcMain.handle('prompter:cancel-copilot-question', (_, questionId: string) => {
    const success = copilotSession.cancelQuestion(questionId);
    if (success) clearQuestionReviewTimer();
    return { success };
  });

  ipcMain.handle(
    'prompter:edit-copilot-question',
    (_, questionId: string, text: string) => {
      const settings = store.getSettings();
      const success = copilotSession.editQuestion(
        questionId,
        typeof text === 'string' ? text : '',
        settings.copilotReviewDelayMs
      );
      if (success) scheduleQuestionReview(questionId);
      return { success };
    }
  );

  ipcMain.handle('prompter:test-llm', async (_, override?: Partial<PrompterSettings>) => {
    const current = store.getSettings();
    const merged: PrompterSettings = { ...current, ...(override || {}) };
    return llmService.testConnection(merged);
  });

  ipcMain.handle('prompter:analyze-project', async (_, override?: Partial<PrompterSettings>) => {
    const current = store.getSettings();
    const merged: PrompterSettings = {
      ...current,
      ...(override || {}),
      contextFolderPath: current.contextFolderPath
    };
    const analysisFolder = current.contextFolderPath;
    const analysisNotes = current.contextCustomNotes;
    if (
      analysisFolder &&
      contextIndexer.getStats()?.folderPath !== analysisFolder
    ) {
      contextIndexer.indexFolder(analysisFolder);
    }
    const analysisFingerprint = contextIndexer.getProjectFingerprint();
    const result = await llmService.analyzeProjectForNotes(merged, contextIndexer);
    if (result.success && result.notes) {
      const latestSettings = store.getSettings();
      if (
        latestSettings.contextFolderPath !== analysisFolder ||
        latestSettings.contextCustomNotes !== analysisNotes ||
        contextIndexer.getProjectFingerprint() !== analysisFingerprint
      ) {
        return {
          success: false,
          error:
            current.language === 'ru'
              ? 'Контекст проекта изменился во время анализа. Запустите анализ снова.'
              : current.language === 'uk'
                ? 'Контекст проєкту змінився під час аналізу. Запустіть аналіз знову.'
                : 'Project context changed while analysis was running. Start analysis again.'
        };
      }
      const updated = store.saveSettings({ contextCustomNotes: result.notes });
      broadcastToWindows('prompter:settings-updated', updated);
    }
    return result;
  });

  ipcMain.handle(
    'prompter:ask-copilot',
    (_, customPrompt?: string, context?: CopilotRequestContext) => {
    const snapshot = copilotSession.getSnapshot();
    if (
      !context ||
      context.sessionId !== snapshot.sessionId ||
      context.generation !== snapshot.generation
    ) {
      return { requestId: '' };
    }
    if (snapshot.pendingQuestion && !customPrompt?.trim()) {
      const confirmed = confirmPendingQuestion(snapshot.pendingQuestion.id);
      return { requestId: confirmed.requestId || '' };
    }

    const latestSystemUtterance = getLatestSystemUtterance(snapshot.transcript);
    if (!customPrompt?.trim() && latestSystemUtterance) {
      latestSystemUtterance.entryIds.forEach((entryId) =>
        handledQuestionTranscriptIds.add(entryId)
      );
    }
    const requestId = triggerCopilotAnswer(
      customPrompt?.trim() || latestSystemUtterance?.text
    );
    return { requestId };
    }
  );

  ipcMain.handle('prompter:clear-copilot-answer', () => {
    clearQuestionReviewTimer();
    clearHandledQuestions();
    llmService.cancelActiveAnswer();
    llmService.clearHistory();
    copilotSession.clearConversation();
    broadcastToWindows('prompter:transcript-updated', []);
    broadcastToWindows('prompter:copilot-answer', {
      requestId: `clear_${Date.now()}`,
      sessionId: copilotSession.getSnapshot().sessionId,
      status: 'idle',
      question: '',
      fullText: '',
      citations: []
    });
  });

  ipcMain.handle('prompter:get-transcript', () => {
    return copilotSession.getSnapshot().transcript;
  });

  ipcMain.handle('prompter:clear-transcript', () => {
    clearQuestionReviewTimer();
    clearHandledQuestions();
    llmService.cancelActiveAnswer();
    llmService.clearHistory();
    copilotSession.clearConversation();
    broadcastToWindows('prompter:transcript-updated', []);
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

app.on('before-quit', () => {
  clearQuestionReviewTimer();
  clearHandledQuestions();
  llmService.cancelActiveAnswer();
  copilotSession.stop();
  void systemAudioCapture.stop();
  windowManager.destroyAll();
});

app.on('will-quit', () => {
  windowManager.destroyAll();
  shortcutManager.unregister();
});

app.on('window-all-closed', () => {
  windowManager.destroyAll();
  app.quit();
});
