import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  CopilotAnswerEvent,
  PrompterSettings,
  TranscriptEntry
} from '../../../../common/types';
import { DEFAULT_SETTINGS } from '../../../../common/constants';
import { TRANSLATIONS } from '../../../../common/i18n';
import { usePrompterScroll } from '../../hooks/usePrompterScroll';
import { useAudioCapture } from '../../hooks/useAudioCapture';

function formatHotkey(key: string, isMac: boolean): string {
  if (!key) return '';
  if (isMac) {
    return key
      .replace(/Control/g, '⌃')
      .replace(/Command/g, '⌘')
      .replace(/Cmd/g, '⌘')
      .replace(/Alt/g, '⌥')
      .replace(/Option/g, '⌥')
      .replace(/Shift/g, '⇧')
      .replace(/Up/g, '↑')
      .replace(/Down/g, '↓')
      .replace(/Left/g, '←')
      .replace(/Right/g, '→')
      .replace(/Return|Enter/g, '↵')
      .replace(/\+/g, '');
  }
  return key
    .replace(/Command/g, 'Shift')
    .replace(/Cmd/g, 'Shift')
    .replace(/Up/g, '↑')
    .replace(/Down/g, '↓');
}

/**
 * Lightweight inline markdown parser for **bold** text and `inline code`.
 */
const renderInlineMarkdown = (text: string): React.ReactNode[] => {
  const tokens: React.ReactNode[] = [];
  const regex = /(\*\*[^*]+\*\*|`[^`]+`)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      tokens.push(text.slice(lastIndex, match.index));
    }
    const token = match[0];
    if (token.startsWith('**') && token.endsWith('**')) {
      tokens.push(
        <strong key={match.index} style={{ color: '#ffffff', fontWeight: 650 }}>
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith('`') && token.endsWith('`')) {
      tokens.push(
        <code
          key={match.index}
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.12)',
            color: '#93c5fd',
            padding: '1px 6px',
            borderRadius: '4px',
            fontSize: '0.9em',
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace'
          }}
        >
          {token.slice(1, -1)}
        </code>
      );
    }
    lastIndex = match.index + token.length;
  }
  if (lastIndex < text.length) {
    tokens.push(text.slice(lastIndex));
  }
  return tokens;
};

/**
 * Cyrano structured markdown block renderer for sections, bullets, and paragraphs.
 */
const CyranoMarkdownBlock: React.FC<{ content: string; isTyping: boolean }> = ({
  content,
  isTyping
}) => {
  const lines = content.split('\n');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
      {lines.map((rawLine, idx) => {
        const line = rawLine.trimEnd();

        // Empty line
        if (!line.trim()) {
          return <div key={idx} style={{ height: '6px' }} />;
        }

        // Sub-section header: #### Header
        if (line.startsWith('#### ')) {
          return (
            <div
              key={idx}
              style={{
                fontSize: '14.5px',
                fontWeight: 700,
                color: '#e2e8f0',
                marginTop: '10px',
                marginBottom: '2px',
                letterSpacing: '-0.01em'
              }}
            >
              {line.replace(/^####\s+/, '')}
            </div>
          );
        }

        // Section header: ### Header
        if (line.startsWith('### ')) {
          return (
            <div
              key={idx}
              style={{
                fontSize: '16px',
                fontWeight: 700,
                color: '#ffffff',
                marginTop: '14px',
                marginBottom: '4px',
                letterSpacing: '-0.01em'
              }}
            >
              {line.replace(/^###\s+/, '')}
            </div>
          );
        }

        // Top level header: ## Header or # Header
        if (line.startsWith('## ') || line.startsWith('# ')) {
          return (
            <div
              key={idx}
              style={{
                fontSize: '17px',
                fontWeight: 700,
                color: '#ffffff',
                marginTop: '16px',
                marginBottom: '6px'
              }}
            >
              {line.replace(/^#+\s+/, '')}
            </div>
          );
        }

        // Bullet point: •, -, * or numbered
        const isBullet = /^(\s*[-*•]|\d+\.)\s+/.test(line);
        if (isBullet) {
          const bulletContent = line.replace(/^(\s*[-*•]|\d+\.)\s+/, '');
          return (
            <div
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
                paddingLeft: '2px',
                lineHeight: 1.54,
                color: '#cbd5e1'
              }}
            >
              <span
                style={{
                  color: '#60a5fa',
                  fontSize: '15px',
                  lineHeight: '1.4',
                  flexShrink: 0
                }}
              >
                •
              </span>
              <div style={{ flex: 1 }}>{renderInlineMarkdown(bulletContent)}</div>
            </div>
          );
        }

        // Regular paragraph
        return (
          <div
            key={idx}
            style={{
              lineHeight: 1.54,
              color: '#cbd5e1'
            }}
          >
            {renderInlineMarkdown(line)}
          </div>
        );
      })}

      {isTyping && (
        <span
          style={{
            display: 'inline-block',
            color: '#60a5fa',
            fontWeight: 700,
            animation: 'pulse 1s infinite'
          }}
        >
          ▍
        </span>
      )}
    </div>
  );
};

export const OverlayView: React.FC = () => {
  const [settings, setSettings] = useState<PrompterSettings>(DEFAULT_SETTINGS);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [copilotState, setCopilotState] = useState<{
    status: 'idle' | 'streaming' | 'done' | 'error';
    question: string;
    answer: string;
    error?: string;
  }>({
    status: 'idle',
    question: '',
    answer: ''
  });

  const [displayedAnswer, setDisplayedAnswer] = useState<string>('');
  const [isManuallyCollapsed, setIsManuallyCollapsed] = useState<boolean>(false);
  const [isListeningPaused, setIsListeningPaused] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const audioCaptureRef = useRef<ReturnType<typeof useAudioCapture> | null>(null);

  const isCopilotMode = settings.appMode === 'copilot';

  const audioState = useAudioCapture({
    enabled: isCopilotMode,
    settings,
    paused: isListeningPaused
  });
  audioCaptureRef.current = audioState;

  // Teleprompter scroll hook (disabled in Copilot mode)
  const { progress, hudMessage } = usePrompterScroll({
    settings,
    containerRef,
    enabled: !isCopilotMode
  });

  // Dynamic mouse events forwarding: allows clicking overlay buttons while retaining click-through elsewhere
  const handleInteractiveMouseEnter = useCallback(() => {
    if (window.electronAPI?.setIgnoreMouseEvents) {
      window.electronAPI.setIgnoreMouseEvents(false);
    }
  }, []);

  const handleInteractiveMouseLeave = useCallback(() => {
    if (window.electronAPI?.setIgnoreMouseEvents) {
      window.electronAPI.setIgnoreMouseEvents(true, { forward: true });
    }
  }, []);

  // Handle Ask AI toggle action:
  // 1) If listening: flushes speech, triggers LLM answer, and PAUSES further listening
  // 2) If already paused: RESUMES speech listening and resets buffers
  const handleToggleAskAI = useCallback(
    async (explicitQuestion?: string) => {
      if (isListeningPaused) {
        // Resume listening
        setIsListeningPaused(false);
        audioCaptureRef.current?.resetBuffers();
        return;
      }

      // Currently listening: Flush speech, Ask AI, and PAUSE listening
      setIsListeningPaused(true);
      let q = (explicitQuestion || '').trim();

      // If no explicit question passed, flush audio capture buffer first
      if (!q && audioCaptureRef.current) {
        try {
          const flushed = await audioCaptureRef.current.flushAndTranscribe();
          if (flushed && flushed.trim()) {
            q = flushed.trim();
          }
        } catch {
          // Ignore
        }
      }

      // Instantly provide visual feedback
      setCopilotState((prev) => ({
        ...prev,
        status: 'streaming',
        question: q || prev.question || 'Генерирую ответ на вопрос...',
        answer: ''
      }));

      if (window.electronAPI) {
        window.electronAPI.askCopilot(q || undefined);
      }
    },
    [isListeningPaused]
  );

  // Clear answer, history, and audio buffers completely
  const handleClearAnswer = useCallback(() => {
    setDisplayedAnswer('');
    setTranscript([]);
    setCopilotState({
      status: 'idle',
      question: '',
      answer: ''
    });
    audioCaptureRef.current?.resetBuffers();
    setIsListeningPaused(false);
    if (window.electronAPI) {
      window.electronAPI.clearCopilotAnswer();
      window.electronAPI.clearTranscript();
    }
  }, []);

  useEffect(() => {
    if (!window.electronAPI) return;

    window.electronAPI.getSettings().then((s) => setSettings(s));
    window.electronAPI.getTranscript().then((entries) => {
      if (entries) setTranscript(entries);
    });

    const unsubSettings = window.electronAPI.onSettingsUpdated((newSettings) => {
      setSettings(newSettings);
    });

    const unsubTranscript = window.electronAPI.onTranscriptUpdated((entries) => {
      setTranscript(entries);
    });

    const unsubCopilot = window.electronAPI.onCopilotAnswer((event: CopilotAnswerEvent) => {
      if (event.status === 'idle') {
        setDisplayedAnswer('');
        setCopilotState({
          status: 'idle',
          question: '',
          answer: ''
        });
        return;
      }

      if (event.status === 'thinking') {
        // When AI starts thinking/answering, pause listening so background chatter is not recorded
        setIsListeningPaused(true);
        if (containerRef.current) {
          containerRef.current.scrollTop = 0;
        }
        setDisplayedAnswer('');
        setCopilotState({
          status: 'streaming',
          question: event.question || '',
          answer: ''
        });
      } else if (event.status === 'streaming') {
        setCopilotState((prev) => ({
          ...prev,
          status: 'streaming',
          question: event.question || prev.question,
          answer: event.fullText || ''
        }));
      } else if (event.status === 'done') {
        setCopilotState((prev) => ({
          ...prev,
          status: 'done',
          question: event.question || prev.question,
          answer: event.fullText || prev.answer
        }));
      } else if (event.status === 'error') {
        setCopilotState((prev) => ({
          ...prev,
          status: 'error',
          question: event.question || prev.question,
          error: event.error || 'Error generating response'
        }));
      }
    });

    // Global shortcut: Ask AI / Toggle Listening (e.g. ⌃⌥⌘A)
    const unsubShortcutAskAI = window.electronAPI.onShortcutAskAI(() => {
      void handleToggleAskAI();
    });

    // Global shortcut: Clear Answer and Transcript History (e.g. ⌃⌥⌘R)
    const unsubRewind = window.electronAPI.onRewind(() => {
      if (settings.appMode === 'copilot') {
        handleClearAnswer();
      }
    });

    // Global shortcut: Scroll answer Up / Down (e.g. ⌃⌥⌘Up / ⌃⌥⌘Down)
    const unsubAdjustSpeed = window.electronAPI.onAdjustSpeed((delta: number) => {
      if (settings.appMode === 'copilot' && containerRef.current) {
        // Up arrow: delta > 0 -> scroll up; Down arrow: delta < 0 -> scroll down
        const scrollDelta = delta > 0 ? -120 : 120;
        containerRef.current.scrollBy({ top: scrollDelta, behavior: 'smooth' });
      }
    });

    // Global shortcut: Toggle compact/collapsed view (e.g. ⌃⌥⌘P)
    const unsubTogglePlay = window.electronAPI.onTogglePlay(() => {
      if (settings.appMode === 'copilot') {
        setIsManuallyCollapsed((prev) => !prev);
      }
    });

    return () => {
      unsubSettings();
      unsubTranscript();
      unsubCopilot();
      unsubShortcutAskAI();
      unsubRewind();
      unsubAdjustSpeed();
      unsubTogglePlay();
    };
  }, [handleToggleAskAI, handleClearAnswer, settings.appMode]);

  // Smooth typewriter effect for live streaming tokens
  useEffect(() => {
    const target = copilotState.answer;
    if (!target) {
      setDisplayedAnswer('');
      return;
    }

    if (displayedAnswer === target) {
      return;
    }

    if (!target.startsWith(displayedAnswer)) {
      setDisplayedAnswer(target);
      return;
    }

    const timer = window.setTimeout(() => {
      const remaining = target.length - displayedAnswer.length;
      const step = Math.max(3, Math.ceil(remaining * 0.35));
      setDisplayedAnswer(target.slice(0, displayedAnswer.length + step));
    }, 16);

    return () => window.clearTimeout(timer);
  }, [copilotState.answer, displayedAnswer]);

  const hexToRgba = (hex: string, alpha: number) => {
    let cleanHex = hex.replace('#', '');
    if (cleanHex.length === 3) {
      cleanHex = cleanHex
        .split('')
        .map((c) => c + c)
        .join('');
    }
    const num = parseInt(cleanHex, 16);
    const r = (num >> 16) & 255;
    const g = (num >> 8) & 255;
    const b = num & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const isMac =
    typeof navigator !== 'undefined' && navigator.userAgent.toLowerCase().includes('mac');

  // ============================================================================
  // RENDER MODE 1: CYRANO AI COPILOT HUD
  // ============================================================================
  if (isCopilotMode) {
    const isTyping =
      copilotState.status === 'streaming' || displayedAnswer.length < copilotState.answer.length;
    const hasActiveAnswer = Boolean(copilotState.answer) || Boolean(displayedAnswer);
    const hasActiveError = Boolean(copilotState.error);
    const hasOutput = hasActiveAnswer || isTyping || hasActiveError;
    const isCollapsed = isManuallyCollapsed || (!hasOutput && settings.copilotCompact);

    const recentTranscript = transcript.slice(-3);
    const latestPhrase =
      recentTranscript.length > 0 ? recentTranscript[recentTranscript.length - 1] : null;

    const copilotOpacity =
      typeof settings.copilotOpacity === 'number'
        ? settings.copilotOpacity
        : typeof settings.bgOpacity === 'number'
          ? settings.bgOpacity
          : 0.85;

    const bgAlpha = Math.max(0, Math.min(1, copilotOpacity));

    return (
      <div
        style={{
          width: '100vw',
          height: '100vh',
          backgroundColor: 'transparent',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-start',
          padding: '6px 8px',
          boxSizing: 'border-box',
          userSelect: 'none',
          pointerEvents: 'none', // CLICK-THROUGH: clicks pass directly to underlying window
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif'
        }}
      >
        {/* Cyrano Dark Glass Container */}
        <div
          style={{
            width: '100%',
            height: isCollapsed ? 'auto' : '100%',
            maxHeight: '100%',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: hexToRgba(settings.bgColor || '#0d1017', bgAlpha),
            border:
              bgAlpha === 0
                ? '1px solid rgba(255, 255, 255, 0.08)'
                : '1px solid rgba(255, 255, 255, 0.14)',
            borderRadius: isCollapsed ? '24px' : '18px',
            boxShadow:
              bgAlpha === 0
                ? 'none'
                : `0 20px 50px rgba(0, 0, 0, ${Math.min(0.75, Math.max(0.15, bgAlpha * 0.85))}), 0 4px 16px rgba(0, 0, 0, ${Math.min(0.5, Math.max(0.1, bgAlpha * 0.55))})`,
            backdropFilter:
              bgAlpha === 0 ? 'none' : `blur(${Math.round(28 * Math.max(0.25, bgAlpha))}px)`,
            WebkitBackdropFilter:
              bgAlpha === 0 ? 'none' : `blur(${Math.round(28 * Math.max(0.25, bgAlpha))}px)`,
            overflow: 'hidden',
            pointerEvents: 'none', // All clicks pass straight through
            transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        >
          {/* Top Pill Navigation Bar */}
          <div
            style={{
              padding: '10px 14px 8px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '8px',
              borderBottom: isCollapsed ? 'none' : '1px solid rgba(255, 255, 255, 0.08)',
              flexShrink: 0
            }}
          >
            {/* Left: Pause/Listen Status & Glowing Audio Dots Equalizer */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                pointerEvents: 'auto',
                cursor: 'pointer'
              }}
              onClick={() => handleToggleAskAI()}
              onMouseEnter={handleInteractiveMouseEnter}
              onMouseLeave={handleInteractiveMouseLeave}
              title={
                isListeningPaused
                  ? `Прослушивание на паузе. Нажмите чтобы возобновить (${formatHotkey(settings.hotkeyAskAI || 'Control+Alt+Command+A', isMac)})`
                  : `Слушаю... Нажмите чтобы спросить и поставить на паузу (${formatHotkey(settings.hotkeyAskAI || 'Control+Alt+Command+A', isMac)})`
              }
            >
              {/* Circular Status Icon */}
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  backgroundColor: isListeningPaused
                    ? 'rgba(245, 158, 11, 0.25)'
                    : audioState.systemSpeaking || audioState.micSpeaking
                      ? 'rgba(16, 185, 129, 0.25)'
                      : 'rgba(255, 255, 255, 0.08)',
                  border: `1px solid ${
                    isListeningPaused
                      ? 'rgba(245, 158, 11, 0.85)'
                      : audioState.systemSpeaking || audioState.micSpeaking
                        ? 'rgba(16, 185, 129, 0.8)'
                        : 'rgba(255, 255, 255, 0.15)'
                  }`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: isListeningPaused
                    ? '#fbbf24'
                    : audioState.systemSpeaking || audioState.micSpeaking
                      ? '#34d399'
                      : '#94a3b8',
                  fontSize: '12px',
                  fontWeight: 700,
                  transition: 'all 0.15s ease'
                }}
              >
                {isListeningPaused ? '⏸' : audioState.systemSpeaking || audioState.micSpeaking ? '🎙' : '🎙'}
              </div>

              {/* Glowing VU / Audio Equalizer Dots */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '5px 12px',
                  borderRadius: '16px',
                  backgroundColor: isListeningPaused ? 'rgba(245, 158, 11, 0.08)' : 'rgba(255, 255, 255, 0.05)',
                  border: isListeningPaused ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid rgba(255, 255, 255, 0.1)',
                  transition: 'all 0.15s ease'
                }}
              >
                {isListeningPaused ? (
                  <span style={{ fontSize: '10.5px', fontWeight: 650, color: '#fbbf24', letterSpacing: '0.04em' }}>
                    ПАУЗА
                  </span>
                ) : (
                  [0.12, 0.28, 0.45, 0.62, 0.78, 0.92].map((threshold, idx) => {
                    const norm = audioState.audioLevel / 100;
                    const active = norm >= threshold * 0.25;
                    const loud = norm >= threshold * 0.65;
                    return (
                      <div
                        key={idx}
                        style={{
                          width: '5px',
                          height: '5px',
                          borderRadius: '50%',
                          backgroundColor: loud
                            ? '#10b981'
                            : active
                              ? '#60a5fa'
                              : 'rgba(255, 255, 255, 0.22)',
                          transform: active ? 'scale(1.3)' : 'scale(1)',
                          transition: 'all 0.08s ease'
                        }}
                      />
                    );
                  })
                )}
              </div>
            </div>

            {/* Center / Right: Hotkey Action Pills */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {/* Ask / Resume Listening Pill Button */}
              <button
                type="button"
                onClick={() => handleToggleAskAI()}
                onMouseEnter={handleInteractiveMouseEnter}
                onMouseLeave={handleInteractiveMouseLeave}
                title={
                  isListeningPaused
                    ? `Возобновить прослушивание (${formatHotkey(settings.hotkeyAskAI || 'Control+Alt+Command+A', isMac)})`
                    : `Спросить ИИ и приостановить прослушивание (${formatHotkey(settings.hotkeyAskAI || 'Control+Alt+Command+A', isMac)})`
                }
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 12px',
                  borderRadius: '18px',
                  backgroundColor: isListeningPaused
                    ? 'rgba(16, 185, 129, 0.25)'
                    : isTyping
                      ? 'rgba(37, 99, 235, 0.45)'
                      : 'rgba(255, 255, 255, 0.08)',
                  border: isListeningPaused
                    ? '1px solid rgba(16, 185, 129, 0.85)'
                    : isTyping
                      ? '1px solid rgba(59, 130, 246, 0.85)'
                      : '1px solid rgba(255, 255, 255, 0.22)',
                  fontSize: '12px',
                  fontWeight: 550,
                  color: isListeningPaused ? '#6ee7b7' : '#ffffff',
                  pointerEvents: 'auto',
                  cursor: 'pointer',
                  outline: 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                <span>{isListeningPaused ? '▶ Слушать' : 'Спросить'}</span>
                <kbd
                  style={{
                    padding: '1px 5px',
                    borderRadius: '4px',
                    backgroundColor: isListeningPaused
                      ? 'rgba(16, 185, 129, 0.3)'
                      : 'rgba(255, 255, 255, 0.15)',
                    fontSize: '11px',
                    fontWeight: 600,
                    color: isListeningPaused ? '#a7f3d0' : '#93c5fd'
                  }}
                >
                  {formatHotkey(settings.hotkeyAskAI || 'Control+Alt+Command+A', isMac)}
                </kbd>
              </button>

              {/* Clear Pill Button */}
              <button
                type="button"
                onClick={handleClearAnswer}
                onMouseEnter={handleInteractiveMouseEnter}
                onMouseLeave={handleInteractiveMouseLeave}
                title={`Очистить ответ и историю (${formatHotkey(settings.hotkeyRewind || 'Control+Alt+Command+R', isMac)})`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 10px',
                  borderRadius: '18px',
                  backgroundColor: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.14)',
                  fontSize: '11.5px',
                  color: '#cbd5e1',
                  pointerEvents: 'auto',
                  cursor: 'pointer',
                  outline: 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                <span>Очистить</span>
                <kbd
                  style={{
                    padding: '1px 4px',
                    borderRadius: '4px',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    fontSize: '10.5px',
                    color: '#fda4af'
                  }}
                >
                  {formatHotkey(settings.hotkeyRewind || 'Control+Alt+Command+R', isMac)}
                </kbd>
              </button>

              {/* Scroll Pill */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '4px 10px',
                  borderRadius: '18px',
                  backgroundColor: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  fontSize: '11.5px',
                  color: '#94a3b8'
                }}
              >
                <span>Прокрутка</span>
                <kbd
                  style={{
                    padding: '1px 4px',
                    borderRadius: '4px',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    fontSize: '10.5px',
                    color: '#cbd5e1'
                  }}
                >
                  {isMac ? '⌃⌥⌘↑ / ↓' : 'Ctrl+Alt+Shift+↑/↓'}
                </kbd>
              </div>

              {/* Toggle Compact Pill Button */}
              <button
                type="button"
                onClick={() => setIsManuallyCollapsed((prev) => !prev)}
                onMouseEnter={handleInteractiveMouseEnter}
                onMouseLeave={handleInteractiveMouseLeave}
                title={`Свернуть/Развернуть (${formatHotkey(settings.hotkeyToggle || 'Control+Alt+Command+P', isMac)})`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '4px 8px',
                  borderRadius: '18px',
                  backgroundColor: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  fontSize: '11px',
                  color: '#94a3b8',
                  pointerEvents: 'auto',
                  cursor: 'pointer',
                  outline: 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                <span>{isCollapsed ? '⤢' : '—'}</span>
                <kbd
                  style={{
                    padding: '1px 4px',
                    borderRadius: '4px',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    fontSize: '10px',
                    color: '#cbd5e1'
                  }}
                >
                  {formatHotkey(settings.hotkeyToggle || 'Control+Alt+Command+P', isMac)}
                </kbd>
              </button>

              {/* Close Pill Button */}
              <button
                type="button"
                onClick={() => {
                  if (window.electronAPI) {
                    window.electronAPI.stopPrompter();
                  }
                }}
                onMouseEnter={handleInteractiveMouseEnter}
                onMouseLeave={handleInteractiveMouseLeave}
                title={`Закрыть оверлей (${formatHotkey(settings.hotkeyClose || 'Control+Alt+Command+X', isMac)})`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '4px 8px',
                  borderRadius: '18px',
                  backgroundColor: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  fontSize: '11px',
                  color: '#94a3b8',
                  pointerEvents: 'auto',
                  cursor: 'pointer',
                  outline: 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                <span>✕</span>
                <kbd
                  style={{
                    padding: '1px 4px',
                    borderRadius: '4px',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    fontSize: '10px',
                    color: '#cbd5e1'
                  }}
                >
                  {formatHotkey(settings.hotkeyClose || 'Control+Alt+Command+X', isMac)}
                </kbd>
              </button>
            </div>
          </div>

          {/* Sub-header Line (Cyrano input/status hint line) */}
          <div
            style={{
              padding: '6px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              backgroundColor: 'rgba(255, 255, 255, 0.02)',
              borderBottom: isCollapsed ? 'none' : '1px solid rgba(255, 255, 255, 0.05)',
              fontSize: '11.5px',
              color: '#94a3b8',
              flexShrink: 0
            }}
          >
            {/* Left: Latest speech utterance or status hint */}
            <div
              style={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                flex: 1
              }}
            >
              {isListeningPaused ? (
                <span style={{ color: '#fbbf24', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ fontSize: '11px' }}>⏸</span>
                  <strong>[ПАУЗА]: Прослушивание на паузе — нажмите {formatHotkey(settings.hotkeyAskAI || 'Control+Alt+Command+A', isMac)} или кнопку чтобы продолжить</strong>
                </span>
              ) : audioState.systemSpeaking ? (
                <span style={{ color: '#34d399', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ fontSize: '10px' }}>🟢</span>
                  <strong>[ВСТРЕЧА]: Собеседник говорит...</strong>
                </span>
              ) : audioState.micSpeaking ? (
                <span style={{ color: '#60a5fa', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ fontSize: '10px' }}>🔵</span>
                  <strong>[МИКРОФОН]: Вы говорите...</strong>
                </span>
              ) : audioState.isTranscribing ? (
                <span style={{ color: '#fbbf24', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ fontSize: '10px' }}>⏳</span>
                  <span>Распознавание речи Whisper...</span>
                </span>
              ) : latestPhrase ? (
                <span>
                  <strong style={{ color: latestPhrase.source === 'system' ? '#34d399' : '#60a5fa' }}>
                    {latestPhrase.source === 'system' ? '🗣 [ПРЕПОД]: ' : '🎙 [ВЫ]: '}
                  </strong>
                  {latestPhrase.text}
                </span>
              ) : audioState.error ? (
                <span style={{ color: '#f87171' }}>
                  ⚠ {audioState.error}
                </span>
              ) : (
                <span style={{ color: '#64748b' }}>
                  Слушаю собеседника... (нажмите {formatHotkey(settings.hotkeyAskAI || 'Control+Alt+Command+A', isMac)} чтобы спросить и поставить на паузу)
                </span>
              )}
            </div>

            {/* Right: Audio source badges & STT status */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
              {/* MEET Audio badge */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  fontSize: '9.5px',
                  fontWeight: 600,
                  backgroundColor: isListeningPaused
                    ? 'rgba(245, 158, 11, 0.15)'
                    : audioState.systemSpeaking
                      ? 'rgba(16, 185, 129, 0.35)'
                      : 'rgba(15, 23, 42, 0.65)',
                  border: `1px solid ${
                    isListeningPaused
                      ? 'rgba(245, 158, 11, 0.4)'
                      : audioState.systemSpeaking
                        ? 'rgba(16, 185, 129, 0.9)'
                        : audioState.systemActive
                          ? 'rgba(16, 185, 129, 0.4)'
                          : 'rgba(100, 116, 139, 0.25)'
                  }`,
                  color: isListeningPaused
                    ? '#fbbf24'
                    : audioState.systemSpeaking
                      ? '#34d399'
                      : audioState.systemActive
                        ? '#6ee7b7'
                        : '#64748b'
                }}
              >
                <div
                  style={{
                    width: '4px',
                    height: '4px',
                    borderRadius: '50%',
                    backgroundColor: isListeningPaused
                      ? '#f59e0b'
                      : audioState.systemSpeaking
                        ? '#10b981'
                        : audioState.systemActive
                          ? '#059669'
                          : '#475569'
                  }}
                />
                <span>MEET</span>
              </div>

              {/* MIC Audio badge */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  fontSize: '9.5px',
                  fontWeight: 600,
                  backgroundColor: isListeningPaused
                    ? 'rgba(245, 158, 11, 0.15)'
                    : audioState.micSpeaking
                      ? 'rgba(59, 130, 246, 0.35)'
                      : 'rgba(15, 23, 42, 0.65)',
                  border: `1px solid ${
                    isListeningPaused
                      ? 'rgba(245, 158, 11, 0.4)'
                      : audioState.micSpeaking
                        ? 'rgba(59, 130, 246, 0.9)'
                        : audioState.micActive
                          ? 'rgba(59, 130, 246, 0.4)'
                          : 'rgba(100, 116, 139, 0.25)'
                  }`,
                  color: isListeningPaused
                    ? '#fbbf24'
                    : audioState.micSpeaking
                      ? '#60a5fa'
                      : audioState.micActive
                        ? '#93c5fd'
                        : '#64748b'
                }}
              >
                <div
                  style={{
                    width: '4px',
                    height: '4px',
                    borderRadius: '50%',
                    backgroundColor: isListeningPaused
                      ? '#f59e0b'
                      : audioState.micSpeaking
                        ? '#3b82f6'
                        : audioState.micActive
                          ? '#2563eb'
                          : '#475569'
                  }}
                />
                <span>MIC</span>
              </div>

              {audioState.isTranscribing && (
                <span
                  style={{
                    fontSize: '9.5px',
                    fontWeight: 600,
                    color: '#fbbf24',
                    padding: '1px 5px',
                    borderRadius: '3px',
                    backgroundColor: 'rgba(245, 158, 11, 0.2)',
                    border: '1px solid rgba(245, 158, 11, 0.4)'
                  }}
                >
                  STT...
                </span>
              )}
            </div>
          </div>

          {/* Main Answer & Question Body */}
          {!isCollapsed && (
            <div
              style={{
                flex: 1,
                minHeight: 0,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                padding: '12px 18px 14px 18px'
              }}
            >
              {/* Question Header (Big bold title like Image #3) */}
              {copilotState.question && (
                <div
                  style={{
                    marginBottom: '10px',
                    fontSize: '17px',
                    fontWeight: 700,
                    color: '#ffffff',
                    letterSpacing: '-0.01em',
                    lineHeight: 1.35
                  }}
                >
                  {copilotState.question}
                </div>
              )}

              {/* Scrollable Answer Container */}
              <div
                ref={containerRef}
                style={{
                  flex: 1,
                  minHeight: 0,
                  overflowY: 'auto',
                  paddingRight: '6px',
                  fontFamily: settings.fontFamily || '-apple-system, sans-serif',
                  fontSize: `${Math.max(13, Math.min(settings.fontSize || 15.5, 20))}px`,
                  lineHeight: 1.54,
                  color: settings.textColor || '#cbd5e1',
                  fontWeight: 450,
                  textShadow:
                    settings.textShadow || bgAlpha < 0.6
                      ? '0 1px 3px rgba(0, 0, 0, 0.95), 0 0 2px rgba(0, 0, 0, 1)'
                      : 'none'
                }}
              >
                {copilotState.status === 'error' ? (
                  <div
                    style={{
                      padding: '10px 14px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(225, 29, 72, 0.22)',
                      border: '1px solid rgba(244, 63, 94, 0.4)',
                      color: '#fecdd3',
                      fontSize: '13px'
                    }}
                  >
                    {copilotState.error}
                  </div>
                ) : displayedAnswer ? (
                  <CyranoMarkdownBlock content={displayedAnswer} isTyping={isTyping} />
                ) : (
                  <div
                    style={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#64748b',
                      fontSize: '13px',
                      textAlign: 'center',
                      padding: '16px 20px',
                      gap: '8px'
                    }}
                  >
                    {copilotState.status === 'streaming' ? (
                      <span style={{ color: '#93c5fd', fontSize: '14px', fontWeight: 600 }}>
                        Генерирую ответ... ▍
                      </span>
                    ) : (
                      <>
                        <div style={{ fontWeight: 600, color: '#94a3b8', fontSize: '14.5px' }}>
                          Cyrano Copilot готов к работе
                        </div>
                        <div style={{ maxWidth: '480px', lineHeight: 1.5 }}>
                          Оверлей полностью прозрачен для кликов мыши. Нажмите{' '}
                          <kbd
                            style={{
                              backgroundColor: 'rgba(255, 255, 255, 0.12)',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              color: '#93c5fd',
                              fontWeight: 600
                            }}
                          >
                            {formatHotkey(settings.hotkeyAskAI || 'Control+Alt+Command+A', isMac)}
                          </kbd>{' '}
                          чтобы мгновенно ответить на последний вопрос из созвона.
                        </div>
                        <div style={{ display: 'flex', gap: '14px', marginTop: '6px', fontSize: '11.5px', color: '#64748b' }}>
                          <span>Очистить: <strong style={{ color: '#fda4af' }}>{formatHotkey(settings.hotkeyRewind || 'Control+Alt+Command+R', isMac)}</strong></span>
                          <span>Прокрутка: <strong style={{ color: '#cbd5e1' }}>{isMac ? '⌃⌥⌘↑ / ↓' : 'Ctrl+Alt+Shift+↑/↓'}</strong></span>
                          <span>Свернуть: <strong style={{ color: '#cbd5e1' }}>{formatHotkey(settings.hotkeyToggle || 'Control+Alt+Command+P', isMac)}</strong></span>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ============================================================================
  // RENDER MODE 2: CLASSIC TELEPROMPTER (Scrolling Script + Eye-Line Guide)
  // ============================================================================
  const focalTop = settings.focalGuidePosition || 25;

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        backgroundColor: hexToRgba(settings.bgColor, settings.bgOpacity),
        overflow: 'hidden',
        position: 'relative',
        userSelect: 'none',
        pointerEvents: 'none' // Click-through in teleprompter mode
      }}
    >
      {/* Eye-line focal guide */}
      {settings.showFocalGuide && (
        <div
          style={{
            position: 'absolute',
            top: `${focalTop}%`,
            left: 0,
            right: 0,
            height: '2px',
            backgroundColor: 'rgba(59, 130, 246, 0.4)',
            boxShadow: '0 0 8px rgba(59, 130, 246, 0.6)',
            zIndex: 10
          }}
        />
      )}

      {/* Floating HUD status indicator for teleprompter */}
      {hudMessage && (
        <div
          style={{
            position: 'absolute',
            top: '8px',
            right: '12px',
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            color: '#60a5fa',
            padding: '2px 8px',
            borderRadius: '4px',
            fontSize: '11px',
            fontWeight: 600,
            zIndex: 20
          }}
        >
          {hudMessage}
        </div>
      )}

      {/* Script scrolling container */}
      <div
        ref={containerRef}
        style={{
          width: '100%',
          height: '100%',
          overflowY: 'hidden',
          padding: '20px 24px',
          boxSizing: 'border-box',
          fontFamily: settings.fontFamily,
          fontSize: `${settings.fontSize}px`,
          color: settings.textColor,
          lineHeight: 1.45,
          textShadow: settings.textShadow ? '0 2px 4px rgba(0,0,0,0.9)' : 'none',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          transform: settings.flipHorizontal ? 'scaleX(-1)' : 'none'
        }}
      >
        {settings.text}
      </div>
    </div>
  );
};
