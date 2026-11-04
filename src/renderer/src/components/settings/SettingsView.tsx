import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Play,
  RotateCcw,
  Sliders,
  Type,
  Monitor,
  Keyboard,
  Shield,
  Eye,
  FileText,
  Check,
  Move,
  Bot,
  Mic,
  Folder,
  Download,
  RefreshCw,
  Zap,
  Sparkles,
  Volume2,
  AlertCircle,
  ExternalLink,
  Laptop
} from 'lucide-react';
import { CyranoLogo } from '../common/CyranoLogo';
import {
  PrompterSettings,
  PresetPosition,
  DisplayInfo,
  Language,
  LLMProvider,
  STTProvider,
  LocalWhisperModelId,
  CopilotTriggerMode,
  STTLanguage,
  WhisperModelInfo,
  WhisperDownloadProgress,
  ContextFolderStats
} from '../../../../common/types';
import {
  DEFAULT_SETTINGS,
  LLM_ENDPOINT_PRESETS,
  WHISPER_MODEL_CATALOG
} from '../../../../common/constants';
import { TRANSLATIONS } from '../../../../common/i18n';
import { PermissionStatus, PermissionState } from '../../../../common/electronApi';

interface FontOption {
  label: string;
  value: string;
}

interface AudioDeviceOption {
  deviceId: string;
  label: string;
}

export const SettingsView: React.FC = () => {
  const [settings, setSettings] = useState<PrompterSettings>(DEFAULT_SETTINGS);
  const [fonts, setFonts] = useState<FontOption[]>([]);
  const [displays, setDisplays] = useState<DisplayInfo[]>([]);
  const [activeTab, setActiveTab] = useState<
    'script' | 'copilot' | 'audio-context' | 'appearance' | 'position' | 'hotkeys'
  >('script');
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [isLaunching, setIsLaunching] = useState<boolean>(false);

  // Copilot & Audio UI state
  const [whisperModels, setWhisperModels] = useState<WhisperModelInfo[]>(
    WHISPER_MODEL_CATALOG.map((m) => ({ ...m, downloaded: false }))
  );
  const [downloadProgress, setDownloadProgress] = useState<WhisperDownloadProgress | null>(null);
  const [isDownloadingModel, setIsDownloadingModel] = useState<boolean>(false);
  const [contextStats, setContextStats] = useState<ContextFolderStats | null>(null);
  const [isIndexingFolder, setIsIndexingFolder] = useState<boolean>(false);
  const [testingLLM, setTestingLLM] = useState<boolean>(false);
  const [llmTestResult, setLlmTestResult] = useState<{ success: boolean; message: string } | null>(
    null
  );
  const [isAnalyzingProject, setIsAnalyzingProject] = useState<boolean>(false);
  const [analyzeResult, setAnalyzeResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [availableMics, setAvailableMics] = useState<AudioDeviceOption[]>([]);

  // Permissions state
  const [permissions, setPermissions] = useState<PermissionStatus>({
    screen: 'unknown',
    microphone: 'unknown',
    accessibility: 'unknown'
  });
  const [isCheckingPermissions, setIsCheckingPermissions] = useState<boolean>(false);
  const [testingAudioSource, setTestingAudioSource] = useState<'system' | 'mic' | 'accessibility' | null>(null);
  const [testAudioLevel, setTestAudioLevel] = useState<number>(0);
  const [testMessage, setTestMessage] = useState<{
    type: 'system' | 'mic' | 'accessibility';
    success: boolean;
    text: string;
  } | null>(null);

  const activeTestStreamRef = useRef<MediaStream | null>(null);

  const t = TRANSLATIONS[settings.language || 'en'];

  // Clean up any active media stream if window unloads or component unmounts
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (activeTestStreamRef.current) {
        activeTestStreamRef.current.getTracks().forEach((t) => {
          try {
            t.stop();
          } catch {}
        });
        activeTestStreamRef.current = null;
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      handleBeforeUnload();
    };
  }, []);

  // Load initial settings, fonts, displays, whisper models & context stats
  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.getSettings().then((loaded) => {
        setSettings(loaded);
        if (loaded.appMode === 'copilot') {
          setActiveTab('copilot');
        }
        if (loaded.contextFolderPath) {
          window.electronAPI?.getContextStats(loaded.contextFolderPath).then((stats) => {
            setContextStats(stats);
          });
        }
      });

      if (window.electronAPI.checkPermissions) {
        window.electronAPI.checkPermissions().then((status) => {
          if (status) setPermissions(status);
        });
      }

      window.electronAPI.getFonts().then((f) => {
        setFonts(f);
      });

      window.electronAPI.getDisplays().then((d) => {
        setDisplays(d);
      });

      window.electronAPI.getWhisperModels().then((models) => {
        if (models && models.length > 0) {
          setWhisperModels(models);
        }
      });

      const unsubDownload = window.electronAPI.onWhisperDownloadProgress((prog) => {
        setDownloadProgress(prog);
        if (prog.status === 'ready' || prog.status === 'error') {
          setIsDownloadingModel(false);
          window.electronAPI?.getWhisperModels().then((m) => {
            if (m) setWhisperModels(m);
          });
        }
      });

      const unsubSettings = window.electronAPI.onSettingsUpdated((updated) => {
        setSettings(updated);
      });

      return () => {
        unsubDownload();
        unsubSettings();
      };
    }
  }, []);

  // Enumerate input audio devices (microphones)
  useEffect(() => {
    if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
      navigator.mediaDevices
        .enumerateDevices()
        .then((devices) => {
          const mics = devices
            .filter((d) => d.kind === 'audioinput')
            .map((d, index) => ({
              deviceId: d.deviceId,
              label: d.label || `Microphone ${index + 1}`
            }));
          setAvailableMics(mics);
        })
        .catch(() => {
          // Ignore
        });
    }
  }, []);

  // Word count and estimated reading time for prompter mode
  const stats = useMemo(() => {
    const text = settings.text.trim();
    if (!text) return { words: 0, characters: 0, estimatedMinutes: 0 };
    const words = text.split(/\s+/).filter(Boolean).length;
    const characters = text.length;
    const estimatedMinutes = Math.max(1, Math.ceil(words / 135));
    return { words, characters, estimatedMinutes };
  }, [settings.text]);

  const updateSetting = <K extends keyof PrompterSettings>(key: K, value: PrompterSettings[K]) => {
    const nextSettings = { ...settings, [key]: value };
    setSettings(nextSettings);

    if (window.electronAPI) {
      window.electronAPI.saveSettings({ [key]: value });
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 1500);
    }
  };

  const handleLaunch = async () => {
    if (!window.electronAPI || isLaunching) return;
    setIsLaunching(true);
    try {
      await window.electronAPI.startPrompter(settings);
    } finally {
      setIsLaunching(false);
    }
  };

  const handlePresetChange = (preset: PresetPosition) => {
    let width = settings.width;
    let height = settings.height;
    let yPosition = settings.yPosition;

    switch (preset) {
      case 'top-center':
        width = 720;
        height = 260;
        yPosition = 24;
        break;
      case 'top-full':
        width = 1440;
        height = 220;
        yPosition = 16;
        break;
      case 'center':
        width = 800;
        height = 500;
        yPosition = -1;
        break;
      case 'left-sidebar':
        width = 460;
        height = 800;
        yPosition = -1;
        break;
      case 'right-sidebar':
        width = 460;
        height = 800;
        yPosition = -1;
        break;
      case 'custom':
        break;
    }

    const updated: Partial<PrompterSettings> = {
      presetPosition: preset,
      width,
      height,
      yPosition
    };

    setSettings((prev) => ({ ...prev, ...updated }));
    if (window.electronAPI) {
      window.electronAPI.saveSettings(updated);
    }
  };

  const handleResetDefaults = () => {
    if (confirm(t.resetConfirm)) {
      setSettings(DEFAULT_SETTINGS);
      if (window.electronAPI) {
        window.electronAPI.saveSettings(DEFAULT_SETTINGS);
      }
    }
  };

  // Select Context Folder Dialog
  const handleSelectFolder = async () => {
    if (!window.electronAPI) return;
    setIsIndexingFolder(true);
    try {
      const statsResult = await window.electronAPI.selectContextFolder();
      setContextStats(statsResult);
      if (statsResult?.folderPath) {
        setSettings((prev) => ({ ...prev, contextFolderPath: statsResult.folderPath }));
      }
    } finally {
      setIsIndexingFolder(false);
    }
  };

  const handleRefreshFolder = async () => {
    if (!window.electronAPI) return;
    setIsIndexingFolder(true);
    try {
      const statsResult = await window.electronAPI.refreshContextFolder();
      setContextStats(statsResult);
    } finally {
      setIsIndexingFolder(false);
    }
  };

  // Download Local Whisper Model
  const handleDownloadModel = async (modelId: LocalWhisperModelId) => {
    if (!window.electronAPI || isDownloadingModel) return;
    setIsDownloadingModel(true);
    setDownloadProgress({
      modelId,
      status: 'downloading',
      progress: 1
    });

    try {
      await window.electronAPI.downloadWhisperModel(modelId);
    } catch {
      setIsDownloadingModel(false);
    }
  };

  // Test LLM Connection
  const handleTestLLM = async () => {
    if (!window.electronAPI || testingLLM) return;
    setTestingLLM(true);
    setLlmTestResult(null);

    try {
      const res = await window.electronAPI.testLLMConnection(settings);
      setLlmTestResult(res);
    } catch (err: any) {
      setLlmTestResult({
        success: false,
        message: err?.message || t.connectionFailed
      });
    } finally {
      setTestingLLM(false);
    }
  };

  // Analyze Project with Connected AI Model & Populate Notes
  const handleAnalyzeProject = async () => {
    if (!window.electronAPI || isAnalyzingProject) return;

    let folderPath = settings.contextFolderPath;
    if (!folderPath) {
      setIsIndexingFolder(true);
      try {
        const statsResult = await window.electronAPI.selectContextFolder();
        setContextStats(statsResult);
        if (statsResult?.folderPath) {
          folderPath = statsResult.folderPath;
          setSettings((prev) => ({ ...prev, contextFolderPath: statsResult.folderPath }));
        }
      } finally {
        setIsIndexingFolder(false);
      }
    }

    if (!folderPath) return;

    setIsAnalyzingProject(true);
    setAnalyzeResult(null);

    try {
      const res = await window.electronAPI.analyzeProjectWithAI({
        ...settings,
        contextFolderPath: folderPath
      });
      if (res.success && res.notes) {
        setSettings((prev) => ({ ...prev, contextCustomNotes: res.notes! }));
        setAnalyzeResult({
          success: true,
          message: t.analyzeProjectSuccess
        });
      } else {
        setAnalyzeResult({
          success: false,
          message: res.error || t.connectionFailed
        });
      }
    } catch (err: any) {
      setAnalyzeResult({
        success: false,
        message: err?.message || t.connectionFailed
      });
    } finally {
      setIsAnalyzingProject(false);
    }
  };

  const isNonMac =
    typeof navigator !== 'undefined' && !navigator.userAgent.toLowerCase().includes('mac');

  // Convert electron accelerator to readable symbols for macOS, Windows, or Linux
  const formatHotkey = (accelerator: string) => {
    if (isNonMac) {
      return accelerator
        .replace(/CommandOrControl/g, 'Ctrl')
        .replace(/Command/g, 'Shift')
        .replace(/Cmd/g, 'Shift')
        .replace(/Control/g, 'Ctrl')
        .replace(/Up/g, '↑')
        .replace(/Down/g, '↓')
        .replace(/Left/g, '←')
        .replace(/Right/g, '→')
        .replace(/\+/g, '+');
    }
    return accelerator
      .replace(/CommandOrControl/g, '⌘')
      .replace(/Command/g, '⌘')
      .replace(/Cmd/g, '⌘')
      .replace(/Control/g, '⌃')
      .replace(/Ctrl/g, '⌃')
      .replace(/Alt/g, '⌥')
      .replace(/Option/g, '⌥')
      .replace(/Shift/g, '⇧')
      .replace(/Up/g, '↑')
      .replace(/Down/g, '↓')
      .replace(/Left/g, '←')
      .replace(/Right/g, '→')
      .replace(/\+/g, '');
  };

  const handleOpenSettings = (pane: 'screen' | 'microphone' | 'accessibility') => {
    if (window.electronAPI?.openSystemPreferences) {
      window.electronAPI.openSystemPreferences(pane);
    }
  };

  const handleCheckAllPermissions = async () => {
    if (!window.electronAPI || isCheckingPermissions) return;
    setIsCheckingPermissions(true);
    try {
      const status = await window.electronAPI.checkPermissions();
      setPermissions(status);
    } finally {
      setIsCheckingPermissions(false);
    }
  };

  const handleTestMicrophone = async () => {
    if (testingAudioSource) return;
    setTestingAudioSource('mic');
    setTestAudioLevel(0);
    setTestMessage(null);

    let stream: MediaStream | null = null;
    let audioCtx: AudioContext | null = null;
    let animFrameId: number | null = null;

    try {
      if (window.electronAPI?.requestPermission) {
        await window.electronAPI.requestPermission('microphone');
      }

      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          deviceId:
            settings.micDeviceId && settings.micDeviceId !== 'default'
              ? { ideal: settings.micDeviceId }
              : undefined,
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: true
        },
        video: false
      });
      activeTestStreamRef.current = stream;

      audioCtx = new AudioContext();
      if (audioCtx.state === 'suspended') {
        void audioCtx.resume();
      }

      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 512;
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      let maxLevel = 0;
      const startTime = performance.now();

      const updateMeter = () => {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        const level = Math.min(100, Math.round((avg / 128) * 100));
        setTestAudioLevel(level);
        if (level > maxLevel) maxLevel = level;

        if (performance.now() - startTime < 4000) {
          animFrameId = requestAnimationFrame(updateMeter);
        }
      };
      animFrameId = requestAnimationFrame(updateMeter);

      if (window.electronAPI?.checkPermissions) {
        const p = await window.electronAPI.checkPermissions();
        setPermissions(p);
      }

      await new Promise((res) => setTimeout(res, 4000));

      setTestMessage({
        type: 'mic',
        success: true,
        text: maxLevel > 2 ? t.micActive : `${t.permissionGranted} (${t.micPermissionPrompt})`
      });
    } catch (err: any) {
      console.warn('[SettingsView] Mic test error:', err);
      setTestMessage({
        type: 'mic',
        success: false,
        text: err?.message || t.permissionDenied
      });
      if (window.electronAPI?.checkPermissions) {
        const p = await window.electronAPI.checkPermissions();
        setPermissions(p);
      }
    } finally {
      if (animFrameId) cancelAnimationFrame(animFrameId);
      if (stream) {
        stream.getTracks().forEach((tr) => tr.stop());
      }
      activeTestStreamRef.current = null;
      if (audioCtx && audioCtx.state !== 'closed') {
        void audioCtx.close();
      }
      setTestingAudioSource(null);
      setTestAudioLevel(0);
    }
  };

  const handleTestSystemAudio = async () => {
    if (testingAudioSource) return;
    setTestingAudioSource('system');
    setTestAudioLevel(0);
    setTestMessage(null);

    let stream: MediaStream | null = null;
    let audioCtx: AudioContext | null = null;
    let animFrameId: number | null = null;

    try {
      stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: {
          autoGainControl: false,
          echoCancellation: false,
          noiseSuppression: false
        }
      });
      activeTestStreamRef.current = stream;

      const audioTracks = stream.getAudioTracks();
      if (audioTracks.length === 0) {
        throw new Error('Аудиопоток не получен. Разрешите «Запись экрана» (Screen Recording) для Cyrano.');
      }

      stream.getVideoTracks().forEach((vt) => {
        vt.enabled = false;
      });

      audioCtx = new AudioContext();
      if (audioCtx.state === 'suspended') {
        void audioCtx.resume();
      }

      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 512;
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      let maxLevel = 0;
      const startTime = performance.now();

      const updateMeter = () => {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        const level = Math.min(100, Math.round((avg / 128) * 100));
        setTestAudioLevel(level);
        if (level > maxLevel) maxLevel = level;

        if (performance.now() - startTime < 4000) {
          animFrameId = requestAnimationFrame(updateMeter);
        }
      };
      animFrameId = requestAnimationFrame(updateMeter);

      if (window.electronAPI?.checkPermissions) {
        const p = await window.electronAPI.checkPermissions();
        setPermissions(p);
      }

      await new Promise((res) => setTimeout(res, 4000));

      setTestMessage({
        type: 'system',
        success: true,
        text: t.systemAudioActive
      });
    } catch (err: any) {
      console.warn('[SettingsView] System audio test error:', err);
      setTestMessage({
        type: 'system',
        success: false,
        text: err?.message || t.permissionDenied
      });
      if (window.electronAPI?.checkPermissions) {
        const p = await window.electronAPI.checkPermissions();
        setPermissions(p);
      }
    } finally {
      if (animFrameId) cancelAnimationFrame(animFrameId);
      if (stream) {
        stream.getTracks().forEach((tr) => tr.stop());
      }
      activeTestStreamRef.current = null;
      if (audioCtx && audioCtx.state !== 'closed') {
        void audioCtx.close();
      }
      setTestingAudioSource(null);
      setTestAudioLevel(0);
    }
  };

  const handleTestAccessibility = async () => {
    if (!window.electronAPI || testingAudioSource) return;
    setTestingAudioSource('accessibility');
    setTestMessage(null);
    try {
      const isGranted = await window.electronAPI.requestPermission('accessibility');
      const p = await window.electronAPI.checkPermissions();
      setPermissions(p);
      const ok = isGranted || p.accessibility === 'granted';
      setTestMessage({
        type: 'accessibility',
        success: ok,
        text: ok ? t.accessibilityActive : t.permissionDenied
      });
    } catch (err: any) {
      setTestMessage({
        type: 'accessibility',
        success: false,
        text: err?.message || t.permissionDenied
      });
    } finally {
      setTestingAudioSource(null);
    }
  };

  const renderPermissionBadge = (state: PermissionState) => {
    switch (state) {
      case 'granted':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/30 whitespace-nowrap">
            <Check className="w-3 h-3 text-emerald-400" />
            <span>{t.permissionGranted}</span>
          </span>
        );
      case 'denied':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-400 bg-rose-950/40 px-2 py-0.5 rounded border border-rose-500/30 whitespace-nowrap">
            <AlertCircle className="w-3 h-3 text-rose-400" />
            <span>{t.permissionDenied}</span>
          </span>
        );
      case 'restricted':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-400 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-500/30 whitespace-nowrap">
            <AlertCircle className="w-3 h-3 text-amber-400" />
            <span>{t.permissionRestricted}</span>
          </span>
        );
      case 'not-needed':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 bg-slate-800/40 px-2 py-0.5 rounded border border-slate-700/40 whitespace-nowrap">
            <span>{t.permissionNotNeeded}</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-300 bg-amber-950/30 px-2 py-0.5 rounded border border-amber-500/30 whitespace-nowrap">
            <span>{t.permissionUnknown}</span>
          </span>
        );
    }
  };

  const renderPermissionsCard = () => (
    <div className="card-box">
      <div className="card-title justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-blue-400 flex-shrink-0" />
          <span>{t.permissionsHeading}</span>
        </div>
        <button
          onClick={handleCheckAllPermissions}
          disabled={isCheckingPermissions || !!testingAudioSource}
          className="btn-secondary text-[11px] py-1 px-2.5"
          title={t.checkAllPermissionsButton}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isCheckingPermissions ? 'animate-spin' : ''}`} />
          <span>{isCheckingPermissions ? t.checkingPermissions : t.checkAllPermissionsButton}</span>
        </button>
      </div>

      <div className="space-y-3 pt-1">
        {/* Permission 1: System / Laptop Audio (Screen Recording) */}
        <div className="p-3 rounded-lg bg-[#141822] border border-[#252d3d] space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div className="flex items-start gap-2.5 min-w-0">
              <Laptop className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-semibold text-white">{t.permissionScreenLabel}</span>
                  {renderPermissionBadge(permissions.screen)}
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">{t.permissionScreenHint}</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 flex-shrink-0 self-end sm:self-auto">
              <button
                onClick={handleTestSystemAudio}
                disabled={!!testingAudioSource}
                className="btn-secondary text-[11px]"
                title={t.testSystemAudioButton}
              >
                {testingAudioSource === 'system' ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-400" />
                ) : (
                  <Volume2 className="w-3.5 h-3.5 text-blue-400" />
                )}
                <span>
                  {testingAudioSource === 'system'
                    ? t.testingSystemAudio
                    : t.testSystemAudioButton}
                </span>
              </button>

              {permissions.screen !== 'granted' && permissions.screen !== 'not-needed' && (
                <button
                  onClick={() => handleOpenSettings('screen')}
                  className="btn-secondary text-[11px] text-slate-300 hover:text-white"
                  title={t.openSystemSettings}
                >
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                  <span>{t.openSystemSettings}</span>
                </button>
              )}
            </div>
          </div>

          {/* System Audio Testing Volume Meter */}
          {testingAudioSource === 'system' && (
            <div className="pt-2 border-t border-[#1e2433] space-y-1.5">
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-300 flex items-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
                  <span>{t.testingSystemAudio}</span>
                </span>
                <span className="font-semibold text-blue-400">{testAudioLevel}%</span>
              </div>
              <div className="w-full bg-[#1e2433] h-2 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-blue-500 via-indigo-400 to-emerald-400 h-full transition-all duration-75"
                  style={{ width: `${Math.max(6, testAudioLevel)}%` }}
                />
              </div>
            </div>
          )}

          {/* Test System Audio Result Message */}
          {testMessage?.type === 'system' && (
            <div
              className={`text-xs px-3 py-2 rounded-md border flex items-center justify-between ${
                testMessage.success
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                  : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
              }`}
            >
              <span>{testMessage.text}</span>
              <button
                onClick={() => setTestMessage(null)}
                className="text-[10px] text-slate-400 hover:text-white ml-2 cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}
        </div>

        {/* Permission 2: Microphone Access */}
        <div className="p-3 rounded-lg bg-[#141822] border border-[#252d3d] space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div className="flex items-start gap-2.5 min-w-0">
              <Mic className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-semibold text-white">{t.permissionMicLabel}</span>
                  {renderPermissionBadge(permissions.microphone)}
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">{t.permissionMicHint}</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 flex-shrink-0 self-end sm:self-auto">
              <button
                onClick={handleTestMicrophone}
                disabled={!!testingAudioSource}
                className="btn-secondary text-[11px]"
                title={t.testMicButton}
              >
                {testingAudioSource === 'mic' ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                ) : (
                  <Mic className="w-3.5 h-3.5 text-emerald-400" />
                )}
                <span>
                  {testingAudioSource === 'mic'
                    ? t.testingMic
                    : t.testMicButton}
                </span>
              </button>

              {permissions.microphone !== 'granted' && permissions.microphone !== 'not-needed' && (
                <button
                  onClick={() => handleOpenSettings('microphone')}
                  className="btn-secondary text-[11px] text-slate-300 hover:text-white"
                  title={t.openSystemSettings}
                >
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                  <span>{t.openSystemSettings}</span>
                </button>
              )}
            </div>
          </div>

          {/* Microphone Testing Volume Meter */}
          {testingAudioSource === 'mic' && (
            <div className="pt-2 border-t border-[#1e2433] space-y-1.5">
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-300 flex items-center gap-1.5">
                  <Mic className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                  <span>{t.micPermissionPrompt}</span>
                </span>
                <span className="font-semibold text-emerald-400">{testAudioLevel}%</span>
              </div>
              <div className="w-full bg-[#1e2433] h-2 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-emerald-500 via-teal-400 to-blue-400 h-full transition-all duration-75"
                  style={{ width: `${Math.max(6, testAudioLevel)}%` }}
                />
              </div>
            </div>
          )}

          {/* Test Mic Result Message */}
          {testMessage?.type === 'mic' && (
            <div
              className={`text-xs px-3 py-2 rounded-md border flex items-center justify-between ${
                testMessage.success
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                  : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
              }`}
            >
              <span>{testMessage.text}</span>
              <button
                onClick={() => setTestMessage(null)}
                className="text-[10px] text-slate-400 hover:text-white ml-2 cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}
        </div>

        {/* Permission 3: Accessibility (Global Hotkeys) */}
        <div className="p-3 rounded-lg bg-[#141822] border border-[#252d3d] space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div className="flex items-start gap-2.5 min-w-0">
              <Keyboard className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-semibold text-white">{t.permissionAccessibilityLabel}</span>
                  {renderPermissionBadge(permissions.accessibility)}
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">{t.permissionAccessibilityHint}</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 flex-shrink-0 self-end sm:self-auto">
              <button
                onClick={handleTestAccessibility}
                disabled={!!testingAudioSource}
                className="btn-secondary text-[11px]"
                title={t.testAccessibilityButton}
              >
                {testingAudioSource === 'accessibility' ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-purple-400" />
                ) : (
                  <Check className="w-3.5 h-3.5 text-purple-400" />
                )}
                <span>
                  {testingAudioSource === 'accessibility'
                    ? t.checkingPermissions
                    : t.testAccessibilityButton}
                </span>
              </button>

              {permissions.accessibility !== 'granted' && permissions.accessibility !== 'not-needed' && (
                <button
                  onClick={() => handleOpenSettings('accessibility')}
                  className="btn-secondary text-[11px] text-slate-300 hover:text-white"
                  title={t.openSystemSettings}
                >
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                  <span>{t.openSystemSettings}</span>
                </button>
              )}
            </div>
          </div>

          {/* Test Accessibility Result Message */}
          {testMessage?.type === 'accessibility' && (
            <div
              className={`text-xs px-3 py-2 rounded-md border flex items-center justify-between ${
                testMessage.success
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                  : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
              }`}
            >
              <span>{testMessage.text}</span>
              <button
                onClick={() => setTestMessage(null)}
                className="text-[10px] text-slate-400 hover:text-white ml-2 cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderProjectContextCard = () => (
    <div className="card-box">
      <div className="card-title justify-between">
        <div className="flex items-center gap-2">
          <Folder className="w-4 h-4 text-blue-400 flex-shrink-0" />
          <span>{t.projectContextHeading}</span>
        </div>
        {contextStats && (
          <span className="text-[11px] font-normal text-slate-400">
            <strong className="text-slate-200">{contextStats.fileCount}</strong> {t.filesIndexed} •{' '}
            <strong className="text-slate-200">
              {Math.max(1, Math.round(contextStats.totalChars / 1024))} KB
            </strong>{' '}
            {t.charactersIndexed}
          </span>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <input
            type="text"
            readOnly
            value={settings.contextFolderPath || ''}
            placeholder={t.noFolderSelected}
            className="form-input text-xs flex-1 min-w-0"
          />
          <button
            onClick={handleSelectFolder}
            disabled={isIndexingFolder || isAnalyzingProject}
            className="btn-secondary"
          >
            <Folder className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{t.chooseFolderButton}</span>
          </button>
          {settings.contextFolderPath && (
            <button
              onClick={handleRefreshFolder}
              disabled={isIndexingFolder || isAnalyzingProject}
              className="btn-secondary px-2.5"
              title="Refresh Folder"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isIndexingFolder ? 'animate-spin' : ''}`} />
            </button>
          )}
          <button
            onClick={handleAnalyzeProject}
            disabled={isAnalyzingProject || isIndexingFolder}
            className="btn-primary"
            title={t.analyzeProjectHint}
          >
            <Sparkles
              className={`w-3.5 h-3.5 flex-shrink-0 ${isAnalyzingProject ? 'animate-spin' : ''}`}
            />
            <span>{isAnalyzingProject ? t.analyzingProject : t.analyzeProjectButton}</span>
          </button>
        </div>

        <p className="control-desc">{t.analyzeProjectHint}</p>

        {analyzeResult && (
          <div
            className={`text-xs px-3 py-2 rounded-md border ${
              analyzeResult.success
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
            }`}
          >
            {analyzeResult.message}
          </div>
        )}
      </div>

      {/* Custom Notes / Auto-Generated Defense Cheat Sheet */}
      <div className="space-y-1.5 pt-2 border-t border-[#1e2433]">
        <label className="control-label block">{t.customNotesLabel}</label>
        <textarea
          rows={6}
          value={settings.contextCustomNotes}
          onChange={(e) => updateSetting('contextCustomNotes', e.target.value)}
          placeholder={t.customNotesPlaceholder}
          className="form-textarea text-xs"
        />
      </div>
    </div>
  );

  return (
    <div className="app-container">
      {/* Titlebar / Drag Region */}
      <div className="titlebar" style={isNonMac ? { paddingLeft: '20px' } : undefined}>
        <div className="titlebar-brand">
          <CyranoLogo size={26} />
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-semibold tracking-tight text-white whitespace-nowrap">
              {t.appName}
            </h1>
            {isSaved && (
              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 whitespace-nowrap ml-1">
                <Check className="w-3 h-3" />
                <span>{t.savedToast}</span>
              </span>
            )}
          </div>
        </div>

        {/* Action Controls & Language Switcher */}
        <div className="titlebar-controls">
          {/* App Mode Toggle (Prompter / Copilot) */}
          <div className="flex items-center bg-[#151922] rounded-md p-0.5 border border-[#252d3d] flex-shrink-0">
            <button
              onClick={() => {
                updateSetting('appMode', 'prompter');
                if (activeTab === 'copilot') {
                  setActiveTab('script');
                }
              }}
              className={`px-2.5 py-1 text-[11px] font-medium rounded transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                settings.appMode === 'prompter'
                  ? 'bg-[#252d3d] text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-3 h-3 flex-shrink-0" />
              <span>{t.modePrompter}</span>
            </button>
            <button
              onClick={() => {
                updateSetting('appMode', 'copilot');
                if (activeTab === 'script') {
                  setActiveTab('copilot');
                }
              }}
              className={`px-2.5 py-1 text-[11px] font-medium rounded transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                settings.appMode === 'copilot'
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Bot className="w-3 h-3 flex-shrink-0" />
              <span>{t.modeCopilot}</span>
            </button>
          </div>

          {/* Segmented Language Switcher */}
          <div className="flex items-center bg-[#151922] rounded-md p-0.5 border border-[#252d3d] flex-shrink-0">
            {(['en', 'ru', 'uk'] as Language[]).map((lang) => (
              <button
                key={lang}
                onClick={() => updateSetting('language', lang)}
                className={`px-2 py-1 text-[11px] font-medium rounded transition-colors cursor-pointer whitespace-nowrap ${
                  (settings.language || 'en') === lang
                    ? 'bg-[#252d3d] text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title={lang === 'en' ? 'English' : lang === 'ru' ? 'Русский' : 'Українська'}
              >
                {lang.toUpperCase()}
              </button>
            ))}
          </div>

          <button onClick={handleLaunch} disabled={isLaunching} className="btn-primary">
            <Play className="w-3.5 h-3.5 fill-current flex-shrink-0" />
            <span>{t.launchButton}</span>
            <kbd className="ml-0.5 text-[10px] bg-blue-800/80 text-white border-blue-400/40">
              {formatHotkey(
                settings.appMode === 'copilot'
                  ? settings.hotkeyAskAI || 'Control+Alt+Command+A'
                  : settings.hotkeyToggle
              )}
            </kbd>
          </button>
        </div>
      </div>

      {/* Main App Body */}
      <div className="main-body">
        {/* Navigation Sidebar */}
        <div className="sidebar">
          <div className="nav-list">
            <button
              onClick={() => setActiveTab('script')}
              className={`nav-item ${activeTab === 'script' ? 'active' : ''}`}
            >
              <FileText className="w-4 h-4 flex-shrink-0" />
              <span>{t.tabScript}</span>
            </button>

            <button
              onClick={() => setActiveTab('copilot')}
              className={`nav-item ${activeTab === 'copilot' ? 'active' : ''}`}
            >
              <Bot className="w-4 h-4 flex-shrink-0" />
              <span>{t.tabCopilot}</span>
            </button>

            <button
              onClick={() => setActiveTab('audio-context')}
              className={`nav-item ${activeTab === 'audio-context' ? 'active' : ''}`}
            >
              <Mic className="w-4 h-4 flex-shrink-0" />
              <span>{t.tabAudioContext}</span>
            </button>

            <button
              onClick={() => setActiveTab('appearance')}
              className={`nav-item ${activeTab === 'appearance' ? 'active' : ''}`}
            >
              <Sliders className="w-4 h-4 flex-shrink-0" />
              <span>{t.tabAppearance}</span>
            </button>

            <button
              onClick={() => setActiveTab('position')}
              className={`nav-item ${activeTab === 'position' ? 'active' : ''}`}
            >
              <Move className="w-4 h-4 flex-shrink-0" />
              <span>{t.tabPosition}</span>
            </button>

            <button
              onClick={() => setActiveTab('hotkeys')}
              className={`nav-item ${activeTab === 'hotkeys' ? 'active' : ''}`}
            >
              <Keyboard className="w-4 h-4 flex-shrink-0" />
              <span>{t.tabHotkeys}</span>
            </button>
          </div>

          {/* Stealth Status Info Card */}
          <div className="stealth-status-card space-y-1.5">
            <div className="flex items-center space-x-1.5 text-emerald-400 font-medium">
              <Shield className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{t.stealthNotesHeading}</span>
            </div>
            <p className="leading-normal text-slate-400">{t.stealthNote1Desc}</p>
          </div>
        </div>

        {/* Tab Content Panel */}
        <div className="content-area">
          {/* TAB 1: SCRIPT EDITOR (PROMPTER MODE) */}
          {activeTab === 'script' && (
            <div className="panel-container">
              <div className="panel-header">
                <div>
                  <h2 className="panel-title">{t.scriptHeading}</h2>
                  <p className="panel-subtitle">{t.scriptSubheading}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => updateSetting('text', t.sampleScript)}
                    className="btn-secondary"
                  >
                    <FileText className="w-3.5 h-3.5 text-slate-400" />
                    <span>{t.loadSampleButton}</span>
                  </button>
                  <button
                    onClick={() => updateSetting('text', '')}
                    className="btn-secondary text-slate-400 hover:text-rose-400"
                  >
                    {t.clearButton}
                  </button>
                </div>
              </div>

              {/* Textarea */}
              <div className="relative">
                <textarea
                  value={settings.text}
                  onChange={(e) => updateSetting('text', e.target.value)}
                  placeholder={t.scriptPlaceholder}
                  className="script-textarea"
                />
              </div>

              {/* Stats Bar */}
              <div className="script-stats-bar">
                <div className="flex items-center space-x-4">
                  <span>
                    {t.wordsLabel}: <strong className="text-slate-200">{stats.words}</strong>
                  </span>
                  <span>
                    {t.charsLabel}: <strong className="text-slate-200">{stats.characters}</strong>
                  </span>
                  <span>
                    {t.durationLabel}:{' '}
                    <strong className="text-blue-400">
                      ~{stats.estimatedMinutes} {t.durationMinutes}
                    </strong>
                  </span>
                </div>
                <div className="text-[11px] text-slate-500">{t.wpmCadenceHint}</div>
              </div>
            </div>
          )}

          {/* TAB 2: AI COPILOT SETTINGS (LLM & REASONING) */}
          {activeTab === 'copilot' && (
            <div className="panel-container">
              <div>
                <h2 className="panel-title">{t.copilotHeading}</h2>
                <p className="panel-subtitle">{t.copilotSubheading}</p>
              </div>

              {/* Step 1: LLM Provider & Connection */}
              <div className="card-box">
                <div className="card-title justify-between">
                  <div className="flex items-center gap-2">
                    <Bot className="w-4 h-4 text-blue-400 flex-shrink-0" />
                    <span>{t.presetProviderLabel}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {LLM_ENDPOINT_PRESETS.map((preset) => {
                      const isActive =
                        settings.llmProvider === preset.provider &&
                        settings.llmBaseUrl === preset.baseUrl;
                      return (
                        <button
                          key={preset.id}
                          onClick={() => {
                            const updated: Partial<PrompterSettings> = {
                              llmProvider: preset.provider as LLMProvider,
                              llmBaseUrl: preset.baseUrl,
                              llmModel: preset.defaultModel
                            };
                            setSettings((prev) => ({ ...prev, ...updated }));
                            window.electronAPI?.saveSettings(updated);
                          }}
                          className={`px-2 py-1 text-[11px] font-medium rounded border transition-colors cursor-pointer whitespace-nowrap ${
                            isActive
                              ? 'bg-blue-600/20 text-blue-300 border-blue-500/60'
                              : 'bg-[#1a202d] text-slate-300 border-[#252d3d] hover:border-blue-500/50 hover:text-white'
                          }`}
                        >
                          {preset.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Base URL + Test Connection */}
                <div className="space-y-1">
                  <label className="control-label block">{t.customBaseUrlLabel}</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={settings.llmBaseUrl}
                      onChange={(e) => updateSetting('llmBaseUrl', e.target.value)}
                      placeholder={
                        settings.llmProvider === 'anthropic'
                          ? 'https://api.anthropic.com'
                          : 'https://openrouter.ai/api/v1'
                      }
                      className="form-input flex-1 min-w-0"
                    />
                    <button
                      onClick={handleTestLLM}
                      disabled={testingLLM}
                      className="btn-secondary"
                    >
                      <RefreshCw
                        className={`w-3.5 h-3.5 flex-shrink-0 ${testingLLM ? 'animate-spin' : ''}`}
                      />
                      <span>{testingLLM ? t.testingConnection : t.testConnectionButton}</span>
                    </button>
                  </div>
                  {llmTestResult ? (
                    <p
                      className={`text-xs pt-0.5 ${
                        llmTestResult.success ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {llmTestResult.message}
                    </p>
                  ) : (
                    <p className="control-desc">{t.customBaseUrlHint}</p>
                  )}
                </div>

                {/* Model + API Key in 2 columns */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="control-label block">{t.modelLabel}</label>
                    <input
                      type="text"
                      value={settings.llmModel}
                      onChange={(e) => updateSetting('llmModel', e.target.value)}
                      placeholder={t.modelPlaceholder}
                      className="form-input"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="control-label block">{t.apiKeyLabel}</label>
                    <input
                      type="password"
                      value={settings.llmApiKey}
                      onChange={(e) => updateSetting('llmApiKey', e.target.value)}
                      placeholder={t.apiKeyPlaceholder}
                      className="form-input"
                    />
                  </div>
                </div>
              </div>

              {/* Step 2: Trigger Mode */}
              <div className="card-box">
                <div className="card-title">
                  <Zap className="w-4 h-4 text-blue-400 flex-shrink-0" />
                  <span>{t.triggerModeLabel}</span>
                </div>

                <div className="grid grid-cols-3 gap-2.5">
                  {[
                    {
                      id: 'both',
                      title: t.triggerModeBoth,
                      desc: t.triggerModeBothDesc
                    },
                    {
                      id: 'hotkey',
                      title: t.triggerModeHotkey,
                      desc: t.triggerModeHotkeyDesc
                    },
                    {
                      id: 'auto',
                      title: t.triggerModeAuto,
                      desc: t.triggerModeAutoDesc
                    }
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() =>
                        updateSetting('copilotTriggerMode', item.id as CopilotTriggerMode)
                      }
                      className={`preset-card ${
                        settings.copilotTriggerMode === item.id ? 'active' : ''
                      }`}
                    >
                      <div className="preset-card-title">{item.title}</div>
                      <div className="preset-card-desc">{item.desc}</div>
                    </button>
                  ))}
                </div>

                {/* Compact Overlay HUD Toggle */}
                <div className="control-row pt-2.5 border-t border-[#1e2433]">
                  <div className="pr-4">
                    <span className="control-label block">{t.copilotCompactLabel}</span>
                    <span className="control-desc">{t.copilotCompactHint}</span>
                  </div>
                  <label className="toggle-switch flex-shrink-0">
                    <input
                      type="checkbox"
                      checked={Boolean(settings.copilotCompact)}
                      onChange={(e) => updateSetting('copilotCompact', e.target.checked)}
                    />
                    <span className="toggle-slider" />
                  </label>
                </div>
              </div>

              {/* Step 3: Overlay Background & Opacity */}
              <div className="card-box">
                <div className="card-title">
                  <Eye className="w-4 h-4 text-blue-400 flex-shrink-0" />
                  <span>{t.copilotOpacityHeading}</span>
                </div>

                <div className="space-y-3">
                  <div className="control-row">
                    <div>
                      <span className="control-label">{t.copilotOpacityLabel}</span>
                      <span className="control-desc block">
                        {(settings.copilotOpacity ?? 0.85) === 0 ? t.copilotGlassHint : ''}
                      </span>
                    </div>
                    <span className="control-value">{Math.round((settings.copilotOpacity ?? 0.85) * 100)}%</span>
                  </div>

                  {/* Quick Opacity Presets */}
                  <div className="flex items-center gap-2">
                    {[
                      { val: 0, label: '0% (Glass)' },
                      { val: 0.15, label: '15%' },
                      { val: 0.35, label: '35%' },
                      { val: 0.65, label: '65%' },
                      { val: 0.85, label: '85%' },
                      { val: 1.0, label: '100%' }
                    ].map((preset) => (
                      <button
                        key={preset.val}
                        onClick={() => updateSetting('copilotOpacity', preset.val)}
                        className={`flex-1 py-1.5 px-2 text-[11px] font-medium rounded-md border transition-colors cursor-pointer ${
                          Math.abs((settings.copilotOpacity ?? 0.85) - preset.val) < 0.05
                            ? 'bg-[#2563eb] text-white border-blue-400'
                            : 'bg-[#1a202d] text-slate-400 border-[#252d3d] hover:text-slate-200 hover:border-[#333d52]'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>

                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={settings.copilotOpacity ?? 0.85}
                    onChange={(e) => updateSetting('copilotOpacity', Number(e.target.value))}
                  />
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>{t.bgOpacityTransparent}</span>
                    <span>{t.bgOpacityTranslucent}</span>
                    <span>{t.bgOpacityOpaque}</span>
                  </div>
                </div>
              </div>

              {/* Step 4: System Prompt Instructions */}
              <div className="card-box">
                <div className="card-title">
                  <FileText className="w-4 h-4 text-blue-400 flex-shrink-0" />
                  <span>{t.systemPromptHeading}</span>
                </div>
                <textarea
                  rows={3}
                  value={settings.llmSystemPrompt}
                  onChange={(e) => updateSetting('llmSystemPrompt', e.target.value)}
                  className="form-textarea text-xs"
                />
                <p className="control-desc">{t.systemPromptHint}</p>
              </div>
            </div>
          )}

          {/* TAB 3: AUDIO & PROJECT CONTEXT */}
          {activeTab === 'audio-context' && (
            <div className="panel-container">
              <div>
                <h2 className="panel-title">{t.audioContextHeading}</h2>
                <p className="panel-subtitle">{t.audioContextSubheading}</p>
              </div>

              {/* System Permissions & Live Hardware Checks */}
              {renderPermissionsCard()}

              {/* Audio Source Toggles */}
              <div className="card-box">
                <div className="card-title">
                  <Mic className="w-4 h-4 text-blue-400" />
                  <span>{t.audioCaptureHeading}</span>
                </div>

                {/* System Audio Loopback */}
                <div className="control-row">
                  <div>
                    <span className="control-label block">{t.captureSystemLabel}</span>
                    <span className="control-desc">{t.captureSystemHint}</span>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={settings.captureSystemAudio}
                      onChange={(e) => updateSetting('captureSystemAudio', e.target.checked)}
                    />
                    <span className="toggle-slider" />
                  </label>
                </div>

                {/* User Microphone */}
                <div className="control-row pt-2 border-t border-[#1e2433]">
                  <div>
                    <span className="control-label block">{t.captureMicLabel}</span>
                    <span className="control-desc">{t.captureMicHint}</span>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={settings.captureMicAudio}
                      onChange={(e) => updateSetting('captureMicAudio', e.target.checked)}
                    />
                    <span className="toggle-slider" />
                  </label>
                </div>

                {/* Microphone Selection */}
                {settings.captureMicAudio && availableMics.length > 0 && (
                  <div className="space-y-1.5 pt-2 border-t border-[#1e2433]">
                    <label className="control-label">{t.captureMicLabel}</label>
                    <select
                      value={settings.micDeviceId}
                      onChange={(e) => updateSetting('micDeviceId', e.target.value)}
                      className="form-select"
                    >
                      <option value="">Default Microphone</option>
                      {availableMics.map((mic) => (
                        <option key={mic.deviceId} value={mic.deviceId}>
                          {mic.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Speech-to-Text (STT) Engine */}
              <div className="card-box">
                <div className="card-title">
                  <Bot className="w-4 h-4 text-blue-400" />
                  <span>{t.sttEngineHeading}</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => updateSetting('sttProvider', 'local-whisper')}
                    className={`preset-card ${
                      settings.sttProvider === 'local-whisper' ? 'active' : ''
                    }`}
                  >
                    <div className="preset-card-title">{t.sttEngineLocal}</div>
                    <div className="preset-card-desc">Built-in ONNX Whisper, zero API cost</div>
                  </button>

                  <button
                    onClick={() => updateSetting('sttProvider', 'cloud-whisper')}
                    className={`preset-card ${
                      settings.sttProvider === 'cloud-whisper' ? 'active' : ''
                    }`}
                  >
                    <div className="preset-card-title">{t.sttEngineCloud}</div>
                    <div className="preset-card-desc">Cloud Whisper API via URL</div>
                  </button>
                </div>

                {/* STT Language */}
                <div className="space-y-1.5">
                  <label className="control-label">{t.sttLanguageLabel}</label>
                  <select
                    value={settings.sttLanguage}
                    onChange={(e) => updateSetting('sttLanguage', e.target.value as STTLanguage)}
                    className="form-select"
                  >
                    <option value="auto">Auto-detect (RU / EN / UK)</option>
                    <option value="ru">Русский (Russian)</option>
                    <option value="en">English</option>
                    <option value="uk">Українська (Ukrainian)</option>
                  </select>
                </div>

                {/* Local Whisper Model Selector & Manager */}
                {settings.sttProvider === 'local-whisper' && (
                  <div className="space-y-3 pt-2 border-t border-[#1e2433]">
                    <label className="control-label block">{t.localModelsLabel}</label>
                    <div className="space-y-2">
                      {whisperModels.map((m) => {
                        const isSelected = settings.localWhisperModel === m.id;
                        const isDownloading =
                          isDownloadingModel && downloadProgress?.modelId === m.id;

                        return (
                          <div
                            key={m.id}
                            className={`p-3 rounded-lg border transition-all flex items-center justify-between ${
                              isSelected
                                ? 'bg-[#1a202d] border-blue-500/80 text-white'
                                : 'bg-[#141822] border-[#252d3d] text-slate-300'
                            }`}
                          >
                            <div
                              className="cursor-pointer flex-1"
                              onClick={() =>
                                updateSetting('localWhisperModel', m.id as LocalWhisperModelId)
                              }
                            >
                              <div className="flex items-center space-x-2">
                                <span className="text-xs font-semibold">{m.name}</span>
                                <span className="text-[10px] bg-[#252d3d] text-slate-300 px-1.5 py-0.5 rounded">
                                  {m.sizeLabel}
                                </span>
                                {m.downloaded && (
                                  <span className="text-[10px] text-emerald-400 font-medium flex items-center space-x-1">
                                    <Check className="w-3 h-3" />
                                    <span>{t.modelReady}</span>
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-400 mt-1">{m.description}</p>
                            </div>

                            <div className="ml-3">
                              {m.downloaded ? (
                                <button
                                  onClick={() =>
                                    updateSetting('localWhisperModel', m.id as LocalWhisperModelId)
                                  }
                                  className={`btn-secondary text-[11px] ${
                                    isSelected ? 'bg-blue-600 text-white border-blue-500' : ''
                                  }`}
                                >
                                  {isSelected ? 'Active' : 'Select'}
                                </button>
                              ) : (
                                <button
                                  onClick={() =>
                                    handleDownloadModel(m.id as LocalWhisperModelId)
                                  }
                                  disabled={isDownloadingModel}
                                  className="btn-secondary text-[11px] text-blue-400 border-blue-500/40 hover:bg-blue-900/30"
                                >
                                  <Download className="w-3 h-3" />
                                  <span>
                                    {isDownloading ? `${downloadProgress?.progress}%` : t.downloadModelButton}
                                  </span>
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {downloadProgress && downloadProgress.status === 'downloading' && (
                      <div className="space-y-1 p-2 bg-[#1a202d] rounded border border-[#252d3d]">
                        <div className="flex justify-between text-[11px] text-slate-300">
                          <span>
                            {t.downloadingModel}: {downloadProgress.file || 'ONNX weights'}
                          </span>
                          <span>{downloadProgress.progress}%</span>
                        </div>
                        <div className="w-full bg-[#252d3d] h-1.5 rounded overflow-hidden">
                          <div
                            className="bg-blue-500 h-full transition-all duration-200"
                            style={{ width: `${downloadProgress.progress}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Cloud STT Settings */}
                {settings.sttProvider === 'cloud-whisper' && (
                  <div className="space-y-2.5 pt-2 border-t border-[#1e2433]">
                    <div className="space-y-1">
                      <label className="control-label">{t.cloudSttUrlLabel}</label>
                      <input
                        type="text"
                        value={settings.cloudSttBaseUrl}
                        onChange={(e) => updateSetting('cloudSttBaseUrl', e.target.value)}
                        placeholder="https://api.openai.com/v1"
                        className="form-input"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="control-label">{t.cloudSttKeyLabel}</label>
                      <input
                        type="password"
                        value={settings.cloudSttApiKey}
                        onChange={(e) => updateSetting('cloudSttApiKey', e.target.value)}
                        placeholder="Leave blank to reuse LLM API Key"
                        className="form-input"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Project Workspace Folder Context */}
              {renderProjectContextCard()}
            </div>
          )}

          {/* TAB 4: APPEARANCE (SPEED & STYLE) */}
          {activeTab === 'appearance' && (
            <div className="panel-container">
              <div>
                <h2 className="panel-title">{t.appearanceHeading}</h2>
                <p className="panel-subtitle">{t.appearanceSubheading}</p>
              </div>

              {/* Scrolling Speed */}
              <div className="card-box">
                <div className="control-row">
                  <div>
                    <label className="control-label">{t.scrollSpeedLabel}</label>
                    <p className="control-desc">{t.scrollSpeedUnit}</p>
                  </div>
                  <div className="text-right">
                    <span className="control-value">{settings.speed} px/s</span>
                    <p className="text-[10px] text-slate-400">
                      ≈ {Math.round(settings.speed * 2.8)} {t.wpmEquivalent}
                    </p>
                  </div>
                </div>
                <input
                  type="range"
                  min="10"
                  max="200"
                  step="5"
                  value={settings.speed}
                  onChange={(e) => updateSetting('speed', Number(e.target.value))}
                />
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>{t.speedSlow}</span>
                  <span>{t.speedNormal}</span>
                  <span>{t.speedFast}</span>
                </div>
              </div>

              {/* Font Controls */}
              <div className="card-box">
                <div className="card-title">
                  <Type className="w-4 h-4 text-blue-400" />
                  <span>{t.typographyHeading}</span>
                </div>

                {/* Font Family */}
                <div className="space-y-1.5">
                  <label className="control-label">{t.systemFontLabel}</label>
                  <select
                    value={settings.fontFamily}
                    onChange={(e) => updateSetting('fontFamily', e.target.value)}
                    className="form-select"
                  >
                    {fonts.map((f) => (
                      <option key={f.value} value={f.value}>
                        {f.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Font Size */}
                <div className="space-y-2">
                  <div className="control-row">
                    <span className="control-label">{t.fontSizeLabel}</span>
                    <span className="control-value">{settings.fontSize} px</span>
                  </div>
                  <input
                    type="range"
                    min="18"
                    max="64"
                    step="2"
                    value={settings.fontSize}
                    onChange={(e) => updateSetting('fontSize', Number(e.target.value))}
                  />
                </div>

                {/* Text Shadow Toggle */}
                <div className="control-row pt-1">
                  <div>
                    <span className="control-label">{t.textShadowLabel}</span>
                    <span className="control-desc block">{t.textShadowHint}</span>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={settings.textShadow}
                      onChange={(e) => updateSetting('textShadow', e.target.checked)}
                    />
                    <span className="toggle-slider" />
                  </label>
                </div>
              </div>

              {/* Background & Opacity */}
              <div className="card-box">
                <div className="card-title">
                  <Eye className="w-4 h-4 text-blue-400" />
                  <span>{t.backgroundHeading}</span>
                </div>

                {/* Opacity with Quick Presets */}
                <div className="space-y-3">
                  <div className="control-row">
                    <div>
                      <span className="control-label">{t.bgOpacityLabel}</span>
                      <span className="control-desc block">
                        {settings.bgOpacity === 0 ? '100% Glass (Only text floats on screen)' : ''}
                      </span>
                    </div>
                    <span className="control-value">{Math.round(settings.bgOpacity * 100)}%</span>
                  </div>

                  {/* Quick Opacity Presets */}
                  <div className="flex items-center gap-2">
                    {[
                      { val: 0, label: '0% (Glass)' },
                      { val: 0.15, label: '15%' },
                      { val: 0.35, label: '35%' },
                      { val: 0.65, label: '65%' },
                      { val: 0.9, label: '90%' }
                    ].map((preset) => (
                      <button
                        key={preset.val}
                        onClick={() => updateSetting('bgOpacity', preset.val)}
                        className={`flex-1 py-1.5 px-2 text-[11px] font-medium rounded-md border transition-colors cursor-pointer ${
                          Math.abs(settings.bgOpacity - preset.val) < 0.05
                            ? 'bg-[#2563eb] text-white border-blue-400'
                            : 'bg-[#1a202d] text-slate-400 border-[#252d3d] hover:text-slate-200 hover:border-[#333d52]'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>

                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={settings.bgOpacity}
                    onChange={(e) => updateSetting('bgOpacity', Number(e.target.value))}
                  />
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>{t.bgOpacityTransparent}</span>
                    <span>{t.bgOpacityTranslucent}</span>
                    <span>{t.bgOpacityOpaque}</span>
                  </div>
                </div>

                {/* AI Copilot HUD Opacity */}
                <div className="space-y-3 pt-3 border-t border-[#1e2433]">
                  <div className="control-row">
                    <div>
                      <span className="control-label">{t.copilotOpacityHeading}</span>
                      <span className="control-desc block">
                        {(settings.copilotOpacity ?? 0.85) === 0 ? t.copilotGlassHint : ''}
                      </span>
                    </div>
                    <span className="control-value">{Math.round((settings.copilotOpacity ?? 0.85) * 100)}%</span>
                  </div>

                  {/* Quick Opacity Presets */}
                  <div className="flex items-center gap-2">
                    {[
                      { val: 0, label: '0% (Glass)' },
                      { val: 0.15, label: '15%' },
                      { val: 0.35, label: '35%' },
                      { val: 0.65, label: '65%' },
                      { val: 0.85, label: '85%' },
                      { val: 1.0, label: '100%' }
                    ].map((preset) => (
                      <button
                        key={preset.val}
                        onClick={() => updateSetting('copilotOpacity', preset.val)}
                        className={`flex-1 py-1.5 px-2 text-[11px] font-medium rounded-md border transition-colors cursor-pointer ${
                          Math.abs((settings.copilotOpacity ?? 0.85) - preset.val) < 0.05
                            ? 'bg-[#2563eb] text-white border-blue-400'
                            : 'bg-[#1a202d] text-slate-400 border-[#252d3d] hover:text-slate-200 hover:border-[#333d52]'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>

                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={settings.copilotOpacity ?? 0.85}
                    onChange={(e) => updateSetting('copilotOpacity', Number(e.target.value))}
                  />
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>{t.bgOpacityTransparent}</span>
                    <span>{t.bgOpacityTranslucent}</span>
                    <span>{t.bgOpacityOpaque}</span>
                  </div>
                </div>

                {/* Color Pickers */}
                <div className="grid grid-cols-2 gap-4 pt-1">
                  <div className="flex items-center space-x-3">
                    <input
                      type="color"
                      value={settings.textColor}
                      onChange={(e) => updateSetting('textColor', e.target.value)}
                    />
                    <div>
                      <span className="control-label block">{t.textColorLabel}</span>
                      <span className="text-[10px] text-slate-400">{settings.textColor}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <input
                      type="color"
                      value={settings.bgColor}
                      onChange={(e) => updateSetting('bgColor', e.target.value)}
                    />
                    <div>
                      <span className="control-label block">{t.bgColorLabel}</span>
                      <span className="text-[10px] text-slate-400">{settings.bgColor}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Prompter Guide Lines */}
              <div className="card-box">
                <div className="control-row">
                  <div>
                    <span className="control-label block">{t.focalGuideLabel}</span>
                    <span className="control-desc">{t.focalGuideHint}</span>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={settings.showFocalGuide}
                      onChange={(e) => updateSetting('showFocalGuide', e.target.checked)}
                    />
                    <span className="toggle-slider" />
                  </label>
                </div>

                {settings.showFocalGuide && (
                  <div className="space-y-2 pt-2 border-t border-[#1e2433]">
                    <div className="control-row">
                      <span className="control-label">{t.focalPositionLabel}</span>
                      <span className="control-value">{settings.focalGuidePosition}%</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="60"
                      step="5"
                      value={settings.focalGuidePosition}
                      onChange={(e) =>
                        updateSetting('focalGuidePosition', Number(e.target.value))
                      }
                    />
                  </div>
                )}

                {/* Flip Horizontal */}
                <div className="control-row pt-2 border-t border-[#1e2433]">
                  <div>
                    <span className="control-label block">{t.mirrorLabel}</span>
                    <span className="control-desc">{t.mirrorHint}</span>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={settings.flipHorizontal}
                      onChange={(e) => updateSetting('flipHorizontal', e.target.checked)}
                    />
                    <span className="toggle-slider" />
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: POSITION & SIZE */}
          {activeTab === 'position' && (
            <div className="panel-container">
              <div>
                <h2 className="panel-title">{t.positionHeading}</h2>
                <p className="panel-subtitle">{t.positionSubheading}</p>
              </div>

              {/* Compact Overlay HUD Toggle */}
              <div className="card-box">
                <div className="control-row">
                  <div className="pr-4">
                    <span className="control-label block">{t.copilotCompactLabel}</span>
                    <span className="control-desc">{t.copilotCompactHint}</span>
                  </div>
                  <label className="toggle-switch flex-shrink-0">
                    <input
                      type="checkbox"
                      checked={Boolean(settings.copilotCompact)}
                      onChange={(e) => updateSetting('copilotCompact', e.target.checked)}
                    />
                    <span className="toggle-slider" />
                  </label>
                </div>
              </div>

              {/* Placement Presets */}
              <div className="card-box">
                <label className="control-label block">{t.presetsHeading}</label>
                <div className="preset-grid">
                  {[
                    {
                      id: 'top-center',
                      label: t.presetTopCenterTitle,
                      desc: t.presetTopCenterDesc
                    },
                    {
                      id: 'top-full',
                      label: t.presetTopFullTitle,
                      desc: t.presetTopFullDesc
                    },
                    {
                      id: 'center',
                      label: t.presetCenterTitle,
                      desc: t.presetCenterDesc
                    },
                    {
                      id: 'left-sidebar',
                      label: t.presetLeftTitle,
                      desc: t.presetLeftDesc
                    },
                    {
                      id: 'right-sidebar',
                      label: t.presetRightTitle,
                      desc: t.presetRightDesc
                    },
                    {
                      id: 'custom',
                      label: t.presetCustomTitle,
                      desc: t.presetCustomDesc
                    }
                  ].map((p) => (
                    <button
                      key={p.id}
                      onClick={() => handlePresetChange(p.id as PresetPosition)}
                      className={`preset-card ${settings.presetPosition === p.id ? 'active' : ''}`}
                    >
                      <div className="preset-card-title">{p.label}</div>
                      <div className="preset-card-desc">{p.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Dimension Sliders */}
              <div className="card-box">
                <label className="control-label block">{t.customGeometryHeading}</label>

                {/* Width */}
                <div className="space-y-2">
                  <div className="control-row">
                    <span className="control-label">{t.windowWidthLabel}</span>
                    <span className="control-value">{settings.width} px</span>
                  </div>
                  <input
                    type="range"
                    min="360"
                    max="1920"
                    step="20"
                    value={settings.width}
                    onChange={(e) => {
                      updateSetting('width', Number(e.target.value));
                      updateSetting('presetPosition', 'custom');
                    }}
                  />
                </div>

                {/* Height */}
                <div className="space-y-2">
                  <div className="control-row">
                    <span className="control-label">{t.windowHeightLabel}</span>
                    <span className="control-value">{settings.height} px</span>
                  </div>
                  <input
                    type="range"
                    min="150"
                    max="1080"
                    step="10"
                    value={settings.height}
                    onChange={(e) => {
                      updateSetting('height', Number(e.target.value));
                      updateSetting('presetPosition', 'custom');
                    }}
                  />
                </div>
              </div>

              {/* Display Information */}
              {displays.length > 0 && (
                <div className="card-box">
                  <div className="card-title">
                    <Monitor className="w-4 h-4 text-blue-400" />
                    <span>Connected Displays</span>
                  </div>
                  <div className="space-y-1.5 pt-1">
                    {displays.map((d) => (
                      <div
                        key={d.id}
                        className="flex items-center justify-between text-xs px-3 py-2 bg-[#1a202d] rounded-md text-slate-300 border border-[#252d3d]"
                      >
                        <div className="flex items-center space-x-2">
                          <span>{d.label}</span>
                          {d.isPrimary && (
                            <span className="text-[10px] bg-[#252d3d] text-blue-400 px-1.5 py-0.5 rounded font-medium border border-blue-500/20">
                              Main Screen
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-400">
                          {d.bounds.width} × {d.bounds.height}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 6: GLOBAL HOTKEYS */}
          {activeTab === 'hotkeys' && (
            <div className="panel-container">
              <div>
                <h2 className="panel-title">{t.hotkeysHeading}</h2>
                <p className="panel-subtitle">{t.hotkeysSubheading}</p>
              </div>

              <div className="card-box divide-y divide-[#1e2433]">
                {/* Ask AI Copilot */}
                <div className="py-2.5 flex items-center justify-between first:pt-0">
                  <div>
                    <span className="control-label block">{t.actionAskAI}</span>
                    <span className="control-desc">{t.actionAskAIDesc}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <kbd className="text-blue-400 border-blue-500/30">
                      {formatHotkey(settings.hotkeyAskAI || 'Control+Alt+Command+A')}
                    </kbd>
                  </div>
                </div>

                {/* Play / Pause (Prompter) */}
                <div className="py-2.5 flex items-center justify-between">
                  <div>
                    <span className="control-label block">{t.actionToggle}</span>
                    <span className="control-desc">{t.actionToggleDesc}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <kbd>{formatHotkey(settings.hotkeyToggle)}</kbd>
                  </div>
                </div>

                {/* Close Overlay */}
                <div className="py-2.5 flex items-center justify-between">
                  <div>
                    <span className="control-label block">{t.actionClose}</span>
                    <span className="control-desc">{t.actionCloseDesc}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <kbd>{formatHotkey(settings.hotkeyClose)}</kbd>
                  </div>
                </div>

                {/* Rewind */}
                <div className="py-2.5 flex items-center justify-between">
                  <div>
                    <span className="control-label block">{t.actionRewind}</span>
                    <span className="control-desc">{t.actionRewindDesc}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <kbd>{formatHotkey(settings.hotkeyRewind)}</kbd>
                  </div>
                </div>

                {/* Speed Adjustments */}
                <div className="py-2.5 flex items-center justify-between last:pb-0">
                  <div>
                    <span className="control-label block">
                      {t.actionSpeedUp} / {t.actionSpeedDown}
                    </span>
                    <span className="control-desc">{t.actionSpeedUpDesc}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <kbd>{formatHotkey(settings.hotkeySpeedUp)}</kbd>
                    <span className="text-slate-500 text-xs">/</span>
                    <kbd>{formatHotkey(settings.hotkeySpeedDown)}</kbd>
                  </div>
                </div>
              </div>

              {/* Reset Defaults Button */}
              <div className="pt-2">
                <button onClick={handleResetDefaults} className="btn-secondary">
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{t.resetButton}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
