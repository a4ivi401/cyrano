import { useState, useEffect, useRef, useCallback } from 'react';
import { PrompterSettings } from '../../../common/types';
import { TRANSLATIONS } from '../../../common/i18n';

interface UsePrompterScrollProps {
  settings: PrompterSettings;
  containerRef: React.RefObject<HTMLDivElement>;
  enabled?: boolean;
}

export function usePrompterScroll({
  settings,
  containerRef,
  enabled = true
}: UsePrompterScrollProps) {
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [speed, setSpeed] = useState<number>(settings.speed);
  const [progress, setProgress] = useState<number>(0);
  const [hudMessage, setHudMessage] = useState<string | null>(null);

  const scrollAccumulatorRef = useRef<number>(0);
  const lastTimeRef = useRef<number | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const hudTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const t = TRANSLATIONS[settings.language || 'en'];

  const showTemporaryHud = useCallback((msg: string) => {
    setHudMessage(msg);
    if (hudTimeoutRef.current) clearTimeout(hudTimeoutRef.current);
    hudTimeoutRef.current = setTimeout(() => {
      setHudMessage(null);
    }, 1200);
  }, []);

  const togglePlay = useCallback(() => {
    if (!enabled) return;
    setIsPlaying((prev) => {
      const next = !prev;
      showTemporaryHud(next ? t.hudPlaying : t.hudPaused);
      return next;
    });
  }, [enabled, showTemporaryHud, t]);

  const rewind = useCallback(() => {
    scrollAccumulatorRef.current = 0;
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
    setProgress(0);
    if (enabled) {
      showTemporaryHud(t.hudRewound);
    }
  }, [containerRef, enabled, showTemporaryHud, t]);

  const adjustSpeed = useCallback(
    (delta: number) => {
      if (!enabled) return;
      setSpeed((prev) => {
        const next = Math.max(10, Math.min(300, prev + delta));
        showTemporaryHud(`⚡ ${next} PX/S`);
        return next;
      });
    },
    [containerRef, enabled, showTemporaryHud]
  );

  // Sync speed if updated from settings
  useEffect(() => {
    setSpeed(settings.speed);
  }, [settings.speed]);

  // Handle IPC events from main process (triggered by global shortcuts)
  useEffect(() => {
    if (!window.electronAPI) return;

    const unsubs = [
      window.electronAPI.onTogglePlay(togglePlay),
      window.electronAPI.onRewind(rewind),
      window.electronAPI.onAdjustSpeed((delta) => adjustSpeed(delta)),
      window.electronAPI.onStart(() => {
        if (enabled) {
          setIsPlaying(true);
        }
        rewind();
      })
    ];

    return () => {
      unsubs.forEach((unsub) => unsub());
    };
  }, [togglePlay, rewind, adjustSpeed, enabled]);

  // Main animation frame loop (ONLY runs in Teleprompter mode when enabled === true)
  useEffect(() => {
    if (!enabled) {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
      lastTimeRef.current = null;
      return;
    }

    const loop = (timestamp: DOMHighResTimeStamp) => {
      if (lastTimeRef.current === null) {
        lastTimeRef.current = timestamp;
      }
      const dt = (timestamp - lastTimeRef.current) / 1000;
      lastTimeRef.current = timestamp;

      if (isPlaying && containerRef.current) {
        const container = containerRef.current;
        const maxScroll = container.scrollHeight - container.clientHeight;

        if (maxScroll > 0) {
          scrollAccumulatorRef.current += speed * dt;

          if (scrollAccumulatorRef.current >= maxScroll) {
            scrollAccumulatorRef.current = maxScroll;
            container.scrollTop = maxScroll;
            setProgress(100);

            if (settings.autoRewindOnEnd) {
              rewind();
            } else {
              setIsPlaying(false);
              showTemporaryHud('✓ COMPLETED');
            }
          } else {
            container.scrollTop = scrollAccumulatorRef.current;
            setProgress((scrollAccumulatorRef.current / maxScroll) * 100);
          }
        }
      }

      rafIdRef.current = requestAnimationFrame(loop);
    };

    rafIdRef.current = requestAnimationFrame(loop);

    return () => {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
      lastTimeRef.current = null;
    };
  }, [enabled, isPlaying, speed, settings.autoRewindOnEnd, containerRef, rewind, showTemporaryHud]);

  return {
    isPlaying,
    speed,
    progress,
    hudMessage,
    togglePlay,
    rewind,
    adjustSpeed
  };
}
