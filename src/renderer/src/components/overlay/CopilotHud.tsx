import React, { useCallback, useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import {
  AlertTriangle,
  Check,
  ChevronDown,
  ChevronUp,
  LoaderCircle,
  Maximize2,
  Mic,
  Minimize2,
  Pause,
  Pencil,
  Play,
  RefreshCw,
  Send,
  Trash2,
  Volume2,
  X
} from 'lucide-react';
import {
  CopilotAnswerEvent,
  CopilotErrorCode,
  CopilotSessionPhase,
  CopilotSessionSnapshot,
  PrompterSettings
} from '../../../../common/types';
import { TRANSLATIONS, Translations } from '../../../../common/i18n';
import { useAudioCapture } from '../../hooks/useAudioCapture';

interface CopilotHudProps {
  settings: PrompterSettings;
  answerScrollRef: React.RefObject<HTMLDivElement>;
}

interface AudioControls {
  flushAndTranscribe: () => Promise<string>;
  resetBuffers: () => void;
}

interface CaptureErrors {
  error: string | null;
  systemError: string | null;
  micError: string | null;
}

type ErrorKind = 'audio' | 'stt' | 'llm' | 'project' | 'session';
type ActionError = 'action' | 'session' | null;

const EMPTY_CAPTURE_ERRORS: CaptureErrors = {
  error: null,
  systemError: null,
  micError: null
};

const EMPTY_SESSION: CopilotSessionSnapshot = {
  sessionId: 'session_idle',
  generation: 0,
  phase: 'idle',
  transcript: [],
  answer: '',
  citations: [],
  audio: {
    systemEnabled: false,
    systemActive: false,
    systemSpeaking: false,
    micEnabled: false,
    micActive: false,
    micSpeaking: false,
    audioLevel: 0,
    queueDepth: 0
  },
  updatedAt: 0
};

function hexToRgba(hex: string, alpha: number): string {
  let cleanHex = hex.replace('#', '');
  if (cleanHex.length === 3) {
    cleanHex = cleanHex
      .split('')
      .map((character) => character + character)
      .join('');
  }
  const value = parseInt(cleanHex, 16);
  const red = (value >> 16) & 255;
  const green = (value >> 8) & 255;
  const blue = value & 255;
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

function interpolate(template: string, values: Record<string, string | number>): string {
  return Object.entries(values).reduce(
    (result, [key, value]) => result.replace(`{${key}}`, String(value)),
    template
  );
}

function restoreClickThrough(): void {
  window.setTimeout(() => {
    window.electronAPI?.setIgnoreMouseEvents?.(true, { forward: true });
  }, 0);
}

function getPhaseLabel(
  translations: Translations,
  phase: CopilotSessionPhase,
  paused: boolean
): string {
  if (paused) return translations.hudPhasePaused;
  switch (phase) {
    case 'idle':
      return translations.hudPhaseIdle;
    case 'awaiting-audio-permission':
      return translations.hudPhaseAwaitingAudio;
    case 'listening':
      return translations.hudPhaseListening;
    case 'capturing':
      return translations.hudPhaseCapturing;
    case 'transcribing':
      return translations.hudPhaseTranscribing;
    case 'reviewing-question':
      return translations.hudPhaseReviewing;
    case 'answering':
      return translations.hudPhaseAnswering;
    case 'paused':
      return translations.hudPhasePaused;
    case 'error':
      return translations.hudPhaseError;
  }
}

function classifyErrorCode(code: CopilotErrorCode): ErrorKind {
  switch (code) {
    case 'AUDIO_PERMISSION_DENIED':
    case 'SYSTEM_AUDIO_NO_TRACK':
    case 'SYSTEM_AUDIO_NO_SIGNAL':
      return 'audio';
    case 'MODEL_INCOMPLETE':
    case 'MODEL_NATIVE_RUNTIME_MISSING':
    case 'STT_BACKLOG_LIMIT':
    case 'TRANSCRIPTION_FAILED':
      return 'stt';
    case 'LLM_UNAUTHORIZED':
    case 'LLM_EMPTY_RESPONSE':
    case 'LLM_REQUEST_FAILED':
      return 'llm';
    case 'PROJECT_INDEX_STALE':
      return 'project';
    case 'UNKNOWN':
      return 'session';
  }
}

function getLocalizedSessionError(
  translations: Translations,
  code: CopilotErrorCode
): string {
  const kind = classifyErrorCode(code);
  switch (kind) {
    case 'audio':
      return translations.hudSystemCaptureFailed;
    case 'stt':
      return translations.hudTranscriptionFailed;
    case 'llm':
      return translations.hudLlmErrorHeading;
    case 'project':
      return translations.hudProjectStale;
    case 'session':
      return translations.hudSessionUnavailable;
  }
}

function usePrefersReducedMotion(): boolean {
  const [reducedMotion, setReducedMotion] = useState(() =>
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  return reducedMotion;
}

function renderInlineMarkdown(text: string): React.ReactNode[] {
  const tokens: React.ReactNode[] = [];
  const expression = /(\*\*[^*]+\*\*|`[^`]+`)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = expression.exec(text)) !== null) {
    if (match.index > lastIndex) tokens.push(text.slice(lastIndex, match.index));
    const token = match[0];
    if (token.startsWith('**')) {
      tokens.push(<strong key={match.index}>{token.slice(2, -2)}</strong>);
    } else {
      tokens.push(<code key={match.index}>{token.slice(1, -1)}</code>);
    }
    lastIndex = match.index + token.length;
  }

  if (lastIndex < text.length) tokens.push(text.slice(lastIndex));
  return tokens;
}

function MarkdownAnswer({ content, isTyping }: { content: string; isTyping: boolean }) {
  return (
    <div className="copilot-hud-markdown">
      {content.split('\n').map((rawLine, index) => {
        const line = rawLine.trimEnd();
        if (!line.trim()) return <div className="copilot-hud-markdown-space" key={index} />;

        const heading = line.match(/^(#{1,4})\s+(.+)$/);
        if (heading) {
          return (
            <div className={`copilot-hud-markdown-heading level-${heading[1].length}`} key={index}>
              {renderInlineMarkdown(heading[2])}
            </div>
          );
        }

        const bullet = line.match(/^(?:\s*[-*\u2022]|\d+\.)\s+(.+)$/);
        if (bullet) {
          return (
            <div className="copilot-hud-markdown-bullet" key={index}>
              <span aria-hidden="true" />
              <div>{renderInlineMarkdown(bullet[1])}</div>
            </div>
          );
        }

        return (
          <div className="copilot-hud-markdown-paragraph" key={index}>
            {renderInlineMarkdown(line)}
          </div>
        );
      })}
      {isTyping && <span className="copilot-hud-typing-cursor" aria-hidden="true" />}
    </div>
  );
}

function StatusItem({
  label,
  value,
  tone
}: {
  label: string;
  value: string;
  tone: 'ready' | 'active' | 'warning' | 'error' | 'muted';
}) {
  return (
    <div className={`copilot-hud-status-item tone-${tone}`} aria-label={`${label}: ${value}`}>
      <span className="copilot-hud-status-dot" aria-hidden="true" />
      <span className="copilot-hud-status-label">{label}</span>
      <span className="copilot-hud-status-value">{value}</span>
    </div>
  );
}

function CopilotAudioCapture({
  settings,
  sessionId,
  sessionGeneration,
  paused,
  onControls,
  onErrors
}: {
  settings: PrompterSettings;
  sessionId: string;
  sessionGeneration: number;
  paused: boolean;
  onControls: (controls: AudioControls | null) => void;
  onErrors: (errors: CaptureErrors) => void;
}) {
  const capture = useAudioCapture({
    enabled: true,
    settings,
    sessionId,
    sessionGeneration,
    paused
  });

  useEffect(() => {
    onControls({
      flushAndTranscribe: capture.flushAndTranscribe,
      resetBuffers: capture.resetBuffers
    });
    return () => onControls(null);
  }, [capture.flushAndTranscribe, capture.resetBuffers, onControls]);

  useEffect(() => {
    onErrors({
      error: capture.error,
      systemError: capture.systemError,
      micError: capture.micError
    });
  }, [capture.error, capture.systemError, capture.micError, onErrors]);

  return null;
}

export function CopilotHud({ settings, answerScrollRef }: CopilotHudProps) {
  const t = TRANSLATIONS[settings.language || 'en'];
  const reducedMotion = usePrefersReducedMotion();
  const [snapshot, setSnapshot] = useState<CopilotSessionSnapshot>(EMPTY_SESSION);
  const [streamTarget, setStreamTarget] = useState('');
  const [displayedAnswer, setDisplayedAnswer] = useState('');
  const [captureMounted, setCaptureMounted] = useState(false);
  const [captureKey, setCaptureKey] = useState(0);
  const [captureErrors, setCaptureErrors] = useState<CaptureErrors>(EMPTY_CAPTURE_ERRORS);
  const [paused, setPaused] = useState(false);
  const [collapsedOverride, setCollapsedOverride] = useState<boolean | null>(null);
  const [isAsking, setIsAsking] = useState(false);
  const [pendingAction, setPendingAction] = useState<'confirm' | 'cancel' | 'edit' | null>(null);
  const [actionError, setActionError] = useState<ActionError>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editDraft, setEditDraft] = useState('');
  const [countdownSeconds, setCountdownSeconds] = useState(0);

  const snapshotRef = useRef(snapshot);
  const audioControlsRef = useRef<AudioControls | null>(null);
  const askingRef = useRef(false);
  const editDraftRef = useRef('');
  const editOriginalRef = useRef('');
  const collapsedRef = useRef(false);

  const handleControls = useCallback((controls: AudioControls | null) => {
    audioControlsRef.current = controls;
  }, []);

  const handleCaptureErrors = useCallback((errors: CaptureErrors) => {
    setCaptureErrors(errors);
  }, []);

  useEffect(() => {
    return () => {
      window.electronAPI?.setIgnoreMouseEvents?.(true, { forward: true });
      window.electronAPI?.setOverlayFocusable?.(false);
    };
  }, []);

  useEffect(() => {
    const api = window.electronAPI;
    if (!api) {
      setActionError('session');
      return;
    }

    let disposed = false;
    let subscriptionRevision = 0;
    const applySnapshot = (nextSnapshot: CopilotSessionSnapshot) => {
      if (disposed) return;
      if (nextSnapshot.updatedAt < snapshotRef.current.updatedAt) return;
      subscriptionRevision += 1;
      snapshotRef.current = nextSnapshot;
      setSnapshot(nextSnapshot);
      setStreamTarget(nextSnapshot.answer);
      setActionError((current) => (current === 'session' ? null : current));
    };

    const unsubscribeSession = api.onCopilotSessionUpdated(applySnapshot);
    const unsubscribeAnswer = api.onCopilotAnswer((event: CopilotAnswerEvent) => {
      const activeSnapshot = snapshotRef.current;
      if (!event.sessionId || event.sessionId !== activeSnapshot.sessionId) return;
      if (!activeSnapshot.activeRequestId || event.requestId !== activeSnapshot.activeRequestId) return;
      if (typeof event.fullText === 'string') setStreamTarget(event.fullText);
    });

    const initialRevision = subscriptionRevision;
    void api
      .getCopilotSession()
      .then((initialSnapshot) => {
        if (!disposed && subscriptionRevision === initialRevision) applySnapshot(initialSnapshot);
      })
      .catch(() => {
        if (!disposed) setActionError('session');
      });

    return () => {
      disposed = true;
      unsubscribeSession();
      unsubscribeAnswer();
    };
  }, []);

  useEffect(() => {
    if (reducedMotion) {
      setDisplayedAnswer(streamTarget);
      return;
    }
    if (!streamTarget) {
      setDisplayedAnswer('');
      return;
    }
    if (!streamTarget.startsWith(displayedAnswer)) {
      setDisplayedAnswer(streamTarget);
      return;
    }
    if (displayedAnswer === streamTarget) return;

    const timer = window.setTimeout(() => {
      const remaining = streamTarget.length - displayedAnswer.length;
      const step = Math.max(3, Math.ceil(remaining * 0.35));
      setDisplayedAnswer(streamTarget.slice(0, displayedAnswer.length + step));
    }, 16);
    return () => window.clearTimeout(timer);
  }, [displayedAnswer, reducedMotion, streamTarget]);

  useEffect(() => {
    const pending = snapshot.pendingQuestion;
    setIsEditing(false);
    if (!pending) window.electronAPI?.setOverlayFocusable?.(false);
    setEditDraft(pending?.text || '');
    editDraftRef.current = pending?.text || '';
    editOriginalRef.current = pending?.text || '';
  }, [snapshot.pendingQuestion?.id]);

  useEffect(() => {
    editDraftRef.current = editDraft;
  }, [editDraft]);

  useEffect(() => {
    const pending = snapshot.pendingQuestion;
    if (!pending) {
      setCountdownSeconds(0);
      return;
    }

    const update = () => {
      setCountdownSeconds(Math.max(0, Math.ceil((pending.reviewEndsAt - Date.now()) / 1000)));
    };
    update();
    const timer = window.setInterval(update, 100);
    return () => window.clearInterval(timer);
  }, [snapshot.pendingQuestion?.id, snapshot.pendingQuestion?.reviewEndsAt]);

  useEffect(() => {
    const pending = snapshot.pendingQuestion;
    const api = window.electronAPI;
    if (!isEditing || !pending || !api) return;

    const keepReviewOpen = () => {
      const text = editDraftRef.current.trim() || editOriginalRef.current;
      if (text) void api.editCopilotQuestion(pending.id, text);
    };
    keepReviewOpen();
    const timer = window.setInterval(keepReviewOpen, 750);
    return () => window.clearInterval(timer);
  }, [isEditing, snapshot.pendingQuestion?.id]);

  useEffect(() => {
    if (snapshot.activeRequestId && answerScrollRef.current) {
      answerScrollRef.current.scrollTop = 0;
    }
  }, [answerScrollRef, snapshot.activeRequestId]);

  const snapshotErrorKind = snapshot.error ? classifyErrorCode(snapshot.error.code) : null;
  const localCaptureError = [
    captureErrors.systemError && !snapshot.audio.micActive ? t.hudSystemCaptureFailed : null,
    captureErrors.micError && !snapshot.audio.systemActive ? t.hudMicrophoneCaptureFailed : null,
    !captureErrors.systemError && !captureErrors.micError && captureErrors.error
      ? t.hudTranscriptionFailed
      : null
  ]
    .filter((message): message is string => Boolean(message))
    .join(' ');
  const errorKind: ErrorKind | null = snapshotErrorKind
    ? snapshotErrorKind
    : captureErrors.systemError || captureErrors.micError
      ? 'audio'
      : captureErrors.error
        ? 'stt'
        : null;
  const errorMessage = snapshot.error
    ? getLocalizedSessionError(t, snapshot.error.code)
    : localCaptureError;
  const hasAnswer = Boolean(
    streamTarget || displayedAnswer || snapshot.phase === 'answering'
  );
  const hasBodyContent = Boolean(snapshot.pendingQuestion || errorMessage || hasAnswer || actionError);
  const automaticCollapsed = settings.copilotCompact && captureMounted && !hasBodyContent;
  const isCollapsed = snapshot.pendingQuestion
    ? false
    : collapsedOverride ?? automaticCollapsed;
  collapsedRef.current = isCollapsed;

  const startCapture = useCallback(() => {
    if (!settings.captureSystemAudio && !settings.captureMicAudio) return;

    setActionError(null);
    setPaused(false);
    setCaptureErrors(EMPTY_CAPTURE_ERRORS);
    flushSync(() => {
      setCaptureKey((current) => current + 1);
      setCaptureMounted(true);
    });
    window.setTimeout(() => {
      window.electronAPI?.setIgnoreMouseEvents?.(true, { forward: true });
    }, 0);

    const api = window.electronAPI;
    if (!api) return;

    const currentSnapshot = snapshotRef.current;
    if (currentSnapshot.phase === 'idle') {
      void api.startCopilotSession().catch(() => setActionError('session'));
    } else if (
      currentSnapshot.error &&
      classifyErrorCode(currentSnapshot.error.code) === 'audio'
    ) {
      void api
        .stopCopilotSession()
        .then(() => api.startCopilotSession())
        .catch(() => setActionError('session'));
    }
  }, [settings.captureMicAudio, settings.captureSystemAudio]);

  const togglePause = useCallback(async () => {
    const api = window.electronAPI;
    if (!api) return;
    const nextPaused = !paused;
    audioControlsRef.current?.resetBuffers();
    setPaused(nextPaused);
    try {
      await api.setCopilotPaused(nextPaused);
    } catch {
      setPaused(!nextPaused);
      setActionError('action');
    }
  }, [paused]);

  const clearConversation = useCallback(async () => {
    const api = window.electronAPI;
    if (!api) return;
    setActionError(null);
    audioControlsRef.current?.resetBuffers();
    try {
      await api.clearCopilotAnswer();
    } catch {
      setActionError('action');
    } finally {
      restoreClickThrough();
    }
  }, []);

  const askManually = useCallback(async () => {
    if (askingRef.current) return;
    const api = window.electronAPI;
    if (!api) return;

    askingRef.current = true;
    setIsAsking(true);
    setActionError(null);
    const snapshotAtStart = snapshotRef.current;
    const pendingAtStart = snapshotAtStart.pendingQuestion;

    try {
      const flushedText = (await audioControlsRef.current?.flushAndTranscribe())?.trim() || '';
      const currentSnapshot = snapshotRef.current;
      if (
        currentSnapshot.sessionId !== snapshotAtStart.sessionId ||
        currentSnapshot.generation !== snapshotAtStart.generation
      ) {
        return;
      }
      const pending = currentSnapshot.pendingQuestion;

      if (pendingAtStart && pending?.id !== pendingAtStart.id) return;
      if (pending) {
        const confirmed = await api.confirmCopilotQuestion(pending.id);
        if (!confirmed.success) throw new Error('confirm-failed');
      } else {
        await api.askCopilot(
          settings.captureSystemAudio ? undefined : flushedText || undefined,
          {
            sessionId: snapshotAtStart.sessionId,
            generation: snapshotAtStart.generation
          }
        );
      }
    } catch {
      setActionError('action');
    } finally {
      askingRef.current = false;
      setIsAsking(false);
    }
  }, [settings.captureSystemAudio]);

  const confirmQuestion = useCallback(async (questionId: string) => {
    const api = window.electronAPI;
    if (!api) return;
    setPendingAction('confirm');
    setActionError(null);
    try {
      const result = await api.confirmCopilotQuestion(questionId);
      if (!result.success) setActionError('action');
    } catch {
      setActionError('action');
    } finally {
      setPendingAction(null);
      restoreClickThrough();
    }
  }, []);

  const cancelQuestion = useCallback(async (questionId: string) => {
    const api = window.electronAPI;
    if (!api) return;
    setPendingAction('cancel');
    setActionError(null);
    try {
      const result = await api.cancelCopilotQuestion(questionId);
      if (!result.success) setActionError('action');
    } catch {
      setActionError('action');
    } finally {
      setPendingAction(null);
      restoreClickThrough();
    }
  }, []);

  const beginEditing = useCallback((questionId: string, text: string) => {
    window.electronAPI?.setOverlayFocusable?.(true);
    setEditDraft(text);
    editDraftRef.current = text;
    editOriginalRef.current = text;
    setIsEditing(true);
    void window.electronAPI?.editCopilotQuestion(questionId, text).catch(() => {
      setActionError('action');
    });
  }, []);

  const saveQuestion = useCallback(async (questionId: string) => {
    const api = window.electronAPI;
    const text = editDraftRef.current.trim();
    if (!api || !text) return;
    setPendingAction('edit');
    setActionError(null);
    try {
      const result = await api.editCopilotQuestion(questionId, text);
      if (result.success) {
        setIsEditing(false);
        window.electronAPI?.setOverlayFocusable?.(false);
      } else {
        setActionError('action');
      }
    } catch {
      setActionError('action');
    } finally {
      setPendingAction(null);
    }
  }, []);

  const cancelEditing = useCallback(async (questionId: string) => {
    const api = window.electronAPI;
    if (!api) return;
    try {
      const result = await api.editCopilotQuestion(questionId, editOriginalRef.current);
      if (result.success) {
        setEditDraft(editOriginalRef.current);
        setIsEditing(false);
        window.electronAPI?.setOverlayFocusable?.(false);
      } else {
        setActionError('action');
      }
    } catch {
      setActionError('action');
    }
  }, []);

  const retryRecognition = useCallback(async () => {
    const api = window.electronAPI;
    if (!api) return;
    setActionError(null);
    audioControlsRef.current?.resetBuffers();
    try {
      await api.recoverCopilotSession();
    } catch {
      setActionError('action');
    } finally {
      restoreClickThrough();
    }
  }, []);

  const retryAnswer = useCallback(async () => {
    const api = window.electronAPI;
    if (!api || askingRef.current) return;
    askingRef.current = true;
    setIsAsking(true);
    setActionError(null);
    try {
      const activeSnapshot = snapshotRef.current;
      await api.askCopilot(activeSnapshot.activeQuestion || undefined, {
        sessionId: activeSnapshot.sessionId,
        generation: activeSnapshot.generation
      });
    } catch {
      setActionError('action');
    } finally {
      askingRef.current = false;
      setIsAsking(false);
    }
  }, []);

  const toggleCollapsed = useCallback(() => {
    setCollapsedOverride(!collapsedRef.current);
  }, []);

  useEffect(() => {
    const api = window.electronAPI;
    if (!api) return;
    const unsubscribers = [
      api.onShortcutAskAI(() => void askManually()),
      api.onRewind(() => void clearConversation()),
      api.onTogglePlay(toggleCollapsed),
      api.onAdjustSpeed((delta) => {
        answerScrollRef.current?.scrollBy({
          top: delta > 0 ? -120 : 120,
          behavior: reducedMotion ? 'auto' : 'smooth'
        });
      })
    ];
    return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
  }, [answerScrollRef, askManually, clearConversation, reducedMotion, toggleCollapsed]);

  const scrollAnswer = (direction: -1 | 1) => {
    answerScrollRef.current?.scrollBy({
      top: direction * 120,
      behavior: reducedMotion ? 'auto' : 'smooth'
    });
  };

  const handleInteractiveMouseEnter = () => {
    window.electronAPI?.setIgnoreMouseEvents?.(false);
  };
  const handleInteractiveMouseLeave = () => {
    window.electronAPI?.setIgnoreMouseEvents?.(true, { forward: true });
  };
  const interactiveProps = {
    onMouseEnter: handleInteractiveMouseEnter,
    onMouseLeave: handleInteractiveMouseLeave
  };

  const phaseLabel = errorKind ? t.hudPhaseError : getPhaseLabel(t, snapshot.phase, paused);
  const phaseTone =
    errorKind || snapshot.phase === 'error'
      ? 'error'
      : paused || snapshot.phase === 'reviewing-question' || snapshot.phase === 'transcribing'
        ? 'warning'
        : snapshot.phase === 'answering'
          ? 'active'
          : snapshot.phase === 'listening' || snapshot.phase === 'capturing'
            ? 'ready'
            : 'muted';

  const systemAudioHasError = Boolean(
    captureErrors.systemError ||
      (snapshotErrorKind === 'audio' && settings.captureSystemAudio)
  );
  const systemAudioValue = !settings.captureSystemAudio
    ? t.hudSystemAudioDisabled
    : !captureMounted
      ? t.hudSystemAudioWaiting
      : systemAudioHasError
        ? t.hudPhaseError
        : paused
          ? t.hudSystemAudioPaused
          : snapshot.audio.systemSpeaking
            ? t.hudSystemAudioSpeaking
            : snapshot.audio.systemActive
              ? t.hudSystemAudioActive
              : t.hudSystemAudioConnecting;
  const systemAudioTone = systemAudioHasError
    ? 'error'
    : paused
      ? 'warning'
      : snapshot.audio.systemSpeaking
        ? 'active'
        : snapshot.audio.systemActive
          ? 'ready'
          : 'muted';

  const microphoneHasError = Boolean(
    captureErrors.micError ||
      (snapshotErrorKind === 'audio' && !settings.captureSystemAudio)
  );
  const microphoneValue = !captureMounted
    ? t.hudMicrophoneWaiting
    : microphoneHasError
      ? t.hudPhaseError
      : paused
        ? t.hudMicrophonePaused
        : snapshot.audio.micSpeaking
          ? t.hudMicrophoneSpeaking
          : snapshot.audio.micActive
            ? t.hudMicrophoneActive
            : t.hudMicrophoneConnecting;
  const microphoneTone = microphoneHasError
    ? 'error'
    : paused
      ? 'warning'
      : snapshot.audio.micSpeaking
        ? 'active'
        : snapshot.audio.micActive
          ? 'ready'
          : 'muted';

  const sttValue =
    errorKind === 'stt'
      ? t.hudPhaseError
      : snapshot.audio.queueDepth > 0
        ? interpolate(t.hudSttQueue, { count: snapshot.audio.queueDepth })
        : snapshot.phase === 'transcribing'
          ? t.hudSttTranscribing
          : snapshot.transcript.length > 0
            ? t.hudSttReady
            : settings.sttProvider === 'cloud-whisper'
              ? t.hudSttCloud
              : t.hudSttLocal;
  const sttTone =
    errorKind === 'stt'
      ? 'error'
      : snapshot.audio.queueDepth > 0 || snapshot.phase === 'transcribing'
        ? 'warning'
        : snapshot.transcript.length > 0
          ? 'ready'
          : 'muted';

  const projectValue = errorKind === 'project'
    ? t.hudProjectStale
    : settings.contextFolderPath
      ? t.hudProjectSelected
      : t.hudProjectNone;
  const projectTone = errorKind === 'project'
    ? 'error'
    : settings.contextFolderPath
      ? 'muted'
      : 'warning';
  const isTyping = Boolean(streamTarget && displayedAnswer.length < streamTarget.length);
  const countdownText = countdownSeconds > 0
    ? interpolate(t.hudAnswerIn, { seconds: countdownSeconds })
    : t.hudAnswerStarting;
  const pending = snapshot.pendingQuestion;
  const countdownProgress = pending
    ? Math.max(
        0,
        Math.min(
          100,
          ((pending.reviewEndsAt - Date.now()) / Math.max(1, pending.reviewEndsAt - pending.createdAt)) * 100
        )
      )
    : 0;

  const errorHeading =
    errorKind === 'audio'
      ? t.hudAudioErrorHeading
      : errorKind === 'stt'
        ? t.hudSttErrorHeading
        : errorKind === 'llm'
          ? t.hudLlmErrorHeading
          : errorKind === 'project'
            ? t.hudProjectErrorHeading
            : t.hudSessionErrorHeading;
  const canRetryRecognition =
    errorKind === 'stt' &&
    snapshot.error?.code !== 'MODEL_INCOMPLETE' &&
    snapshot.error?.code !== 'MODEL_NATIVE_RUNTIME_MISSING';

  const opacity = Math.max(0, Math.min(1, settings.copilotOpacity ?? settings.bgOpacity));
  const toolbarHasScrollableAnswer = Boolean(displayedAnswer);
  const captureButtonLabel = settings.captureSystemAudio
    ? t.hudEnableMeetingAudio
    : settings.captureMicAudio
      ? t.hudEnableMicrophone
      : t.hudAudioDisabled;
  const captureButtonHint = settings.captureSystemAudio
    ? t.hudEnableMeetingAudioHint
    : settings.captureMicAudio
      ? t.hudEnableMicrophoneHint
      : t.hudAudioDisabledHint;
  const CaptureIcon = settings.captureSystemAudio ? Volume2 : Mic;

  return (
    <div className="copilot-hud-root">
      {captureMounted && (
        <CopilotAudioCapture
          key={captureKey}
          settings={settings}
          sessionId={snapshot.sessionId}
          sessionGeneration={snapshot.generation}
          paused={paused}
          onControls={handleControls}
          onErrors={handleCaptureErrors}
        />
      )}

      <section
        className={`copilot-hud-shell${isCollapsed ? ' is-collapsed' : ''}`}
        style={{
          backgroundColor: hexToRgba(settings.bgColor || '#0c1017', opacity),
          fontFamily: settings.fontFamily
        }}
        aria-label={t.modeCopilot}
      >
        <header className="copilot-hud-statusbar">
          <div className="copilot-hud-status-list">
            <StatusItem
              label={t.hudSystemAudioLabel}
              value={systemAudioValue}
              tone={systemAudioTone}
            />
            {settings.captureMicAudio && (
              <StatusItem
                label={t.hudMicrophoneLabel}
                value={microphoneValue}
                tone={microphoneTone}
              />
            )}
            <StatusItem label={t.hudSttLabel} value={sttValue} tone={sttTone} />
            <StatusItem label={t.hudProjectLabel} value={projectValue} tone={projectTone} />
            <StatusItem label={t.hudSessionLabel} value={phaseLabel} tone={phaseTone} />
          </div>

          <div className="copilot-hud-toolbar copilot-hud-interactive" {...interactiveProps}>
            {captureMounted && (
              <>
                <button
                  type="button"
                  className="copilot-hud-button is-primary"
                  onClick={() => void askManually()}
                  disabled={isAsking}
                  aria-label={isAsking ? t.hudAsking : t.hudAsk}
                >
                  {isAsking ? (
                    <LoaderCircle className="copilot-hud-spinner" aria-hidden="true" />
                  ) : (
                    <Send aria-hidden="true" />
                  )}
                  <span>{isAsking ? t.hudAsking : t.hudAsk}</span>
                </button>
                <button
                  type="button"
                  className="copilot-hud-button"
                   onClick={() => void togglePause()}
                  aria-label={paused ? t.hudResume : t.hudPause}
                  aria-pressed={paused}
                >
                  {paused ? <Play aria-hidden="true" /> : <Pause aria-hidden="true" />}
                  <span>{paused ? t.hudResume : t.hudPause}</span>
                </button>
              </>
            )}

            <div className="copilot-hud-icon-group">
              {toolbarHasScrollableAnswer && (
                <>
                  <button
                    type="button"
                    className="copilot-hud-icon-button"
                    onClick={() => scrollAnswer(-1)}
                    aria-label={t.hudScrollUp}
                    title={t.hudScrollUp}
                  >
                    <ChevronUp aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    className="copilot-hud-icon-button"
                    onClick={() => scrollAnswer(1)}
                    aria-label={t.hudScrollDown}
                    title={t.hudScrollDown}
                  >
                    <ChevronDown aria-hidden="true" />
                  </button>
                </>
              )}
              {hasBodyContent && (
                <button
                  type="button"
                  className="copilot-hud-icon-button"
                  onClick={() => void clearConversation()}
                  aria-label={t.hudClear}
                  title={t.hudClear}
                >
                  <Trash2 aria-hidden="true" />
                </button>
              )}
              <button
                type="button"
                className="copilot-hud-icon-button"
                onClick={toggleCollapsed}
                aria-label={isCollapsed ? t.hudExpand : t.hudCollapse}
                aria-expanded={!isCollapsed}
                title={isCollapsed ? t.hudExpand : t.hudCollapse}
              >
                {isCollapsed ? <Maximize2 aria-hidden="true" /> : <Minimize2 aria-hidden="true" />}
              </button>
              <button
                type="button"
                className="copilot-hud-icon-button is-close"
                onClick={() => void window.electronAPI?.stopPrompter()}
                aria-label={t.hudClose}
                title={t.hudClose}
              >
                <X aria-hidden="true" />
              </button>
            </div>
          </div>
        </header>

        <span className="copilot-hud-sr-only" role="status" aria-live="polite" aria-atomic="true">
          {phaseLabel}
        </span>

        {!isCollapsed && (
          <div className="copilot-hud-content">
            {pending && (
              <section
                className="copilot-hud-question copilot-hud-interactive"
                aria-labelledby="copilot-hud-question-heading"
                {...interactiveProps}
              >
                <div className="copilot-hud-question-top">
                  <span id="copilot-hud-question-heading">{t.hudQuestionDetected}</span>
                  <span role="status" aria-live="polite" aria-atomic="true">
                    {countdownText}
                  </span>
                </div>
                <div className="copilot-hud-countdown" aria-hidden="true">
                  <span style={{ width: `${countdownProgress}%` }} />
                </div>

                {isEditing ? (
                  <form
                    className="copilot-hud-question-editor"
                    onSubmit={(event) => {
                      event.preventDefault();
                      void saveQuestion(pending.id);
                    }}
                  >
                    <label htmlFor="copilot-hud-question-input">{t.hudEditQuestionLabel}</label>
                    <textarea
                      id="copilot-hud-question-input"
                      value={editDraft}
                      onChange={(event) => setEditDraft(event.target.value)}
                      rows={2}
                      autoFocus
                    />
                    <div className="copilot-hud-question-actions">
                      <button
                        type="submit"
                        className="copilot-hud-button is-primary"
                        disabled={!editDraft.trim() || pendingAction === 'edit'}
                      >
                        <Check aria-hidden="true" />
                        <span>{t.hudSaveQuestion}</span>
                      </button>
                      <button
                        type="button"
                        className="copilot-hud-button"
                        onClick={() => void cancelEditing(pending.id)}
                      >
                        <X aria-hidden="true" />
                        <span>{t.hudCancelEditing}</span>
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    <p className="copilot-hud-question-text">{pending.text}</p>
                    <div className="copilot-hud-question-actions">
                      <button
                        type="button"
                        className="copilot-hud-button is-primary"
                        onClick={() => void confirmQuestion(pending.id)}
                        disabled={pendingAction !== null}
                      >
                        <Send aria-hidden="true" />
                        <span>{t.hudAnswerNow}</span>
                      </button>
                      <button
                        type="button"
                        className="copilot-hud-button is-danger"
                        onClick={() => void cancelQuestion(pending.id)}
                        disabled={pendingAction !== null}
                      >
                        <X aria-hidden="true" />
                        <span>{t.cancelButton}</span>
                      </button>
                      <button
                        type="button"
                        className="copilot-hud-button"
                        onClick={() => beginEditing(pending.id, pending.text)}
                        disabled={pendingAction !== null}
                      >
                        <Pencil aria-hidden="true" />
                        <span>{t.hudEditQuestion}</span>
                      </button>
                    </div>
                  </>
                )}
              </section>
            )}

            {errorMessage && (
              <section
                className="copilot-hud-error copilot-hud-interactive"
                role="alert"
                {...interactiveProps}
              >
                <AlertTriangle aria-hidden="true" />
                <div className="copilot-hud-error-copy">
                  <strong>{errorHeading}</strong>
                  <p>{errorMessage}</p>
                </div>
                {errorKind === 'audio' && (
                  <button type="button" className="copilot-hud-button" onClick={startCapture}>
                    <RefreshCw aria-hidden="true" />
                    <span>{t.hudRetryAudio}</span>
                  </button>
                )}
                {canRetryRecognition && (
                  <button type="button" className="copilot-hud-button" onClick={retryRecognition}>
                    <RefreshCw aria-hidden="true" />
                    <span>{t.hudRetryStt}</span>
                  </button>
                )}
                {errorKind === 'llm' && (
                  <button
                    type="button"
                    className="copilot-hud-button"
                    onClick={() => void retryAnswer()}
                    disabled={isAsking}
                  >
                    <RefreshCw aria-hidden="true" />
                    <span>{t.hudRetryAnswer}</span>
                  </button>
                )}
              </section>
            )}

            {actionError && (
              <div className="copilot-hud-action-error" role="alert">
                {actionError === 'session' ? t.hudSessionUnavailable : t.hudActionFailed}
              </div>
            )}

            {!captureMounted && !pending && !errorMessage && !hasAnswer && (
              <section
                className="copilot-hud-enable-card copilot-hud-interactive"
                {...interactiveProps}
              >
                <CaptureIcon aria-hidden="true" />
                <div>
                  <h2>{captureButtonLabel}</h2>
                  <p>{captureButtonHint}</p>
                </div>
                <button
                  type="button"
                  className="copilot-hud-button is-primary"
                  onClick={startCapture}
                  disabled={!settings.captureSystemAudio && !settings.captureMicAudio}
                >
                  <CaptureIcon aria-hidden="true" />
                  <span>{captureButtonLabel}</span>
                </button>
              </section>
            )}

            {hasAnswer && (
              <section
                className="copilot-hud-answer copilot-hud-interactive"
                aria-labelledby="copilot-hud-answer-heading"
                {...interactiveProps}
              >
                {snapshot.activeQuestion && (
                  <div className="copilot-hud-active-question">
                    <span>{t.hudQuestionLabel}</span>
                    <strong>{snapshot.activeQuestion}</strong>
                  </div>
                )}
                <div className="copilot-hud-answer-heading">
                  <h2 id="copilot-hud-answer-heading">
                    {snapshot.phase === 'answering' ? t.hudGenerating : t.hudAnswerHeading}
                  </h2>
                  {snapshot.phase === 'answering' && (
                    <LoaderCircle className="copilot-hud-spinner" aria-hidden="true" />
                  )}
                </div>
                <div
                  ref={answerScrollRef}
                  className="copilot-hud-answer-scroll"
                  style={{
                    color: settings.textColor,
                    fontSize: `${Math.max(13, Math.min(settings.fontSize || 15, 20))}px`
                  }}
                  aria-live={snapshot.phase === 'answering' ? 'off' : 'polite'}
                  aria-busy={snapshot.phase === 'answering'}
                  aria-label={t.hudAnswerHeading}
                  tabIndex={0}
                >
                  {displayedAnswer ? (
                    <MarkdownAnswer content={displayedAnswer} isTyping={isTyping} />
                  ) : (
                    <p className="copilot-hud-generating-copy">{t.hudGenerating}</p>
                  )}
                </div>

                {snapshot.citations.length > 0 && (
                  <div className="copilot-hud-citations" aria-label={t.hudVerifiedSources}>
                    <span className="copilot-hud-citations-label">{t.hudVerifiedSources}</span>
                    {snapshot.citations.map((citation) => (
                      <span
                        className="copilot-hud-citation"
                        key={citation.id}
                        aria-label={`${t.hudVerifiedSource}: ${citation.label}`}
                      >
                        <Check aria-hidden="true" />
                        <span>{citation.label}</span>
                      </span>
                    ))}
                  </div>
                )}
              </section>
            )}

            {captureMounted && !pending && !errorMessage && !hasAnswer && !actionError && (
              <section className="copilot-hud-waiting">
                <Volume2 aria-hidden="true" />
                <div>
                  <h2>{t.hudWaitingHeading}</h2>
                  <p>{t.hudWaitingBody}</p>
                </div>
              </section>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
