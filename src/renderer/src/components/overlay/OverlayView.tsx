import React, { useEffect, useRef, useState } from 'react';
import { PrompterSettings } from '../../../../common/types';
import { DEFAULT_SETTINGS } from '../../../../common/constants';
import { usePrompterScroll } from '../../hooks/usePrompterScroll';
import { CopilotHud } from './CopilotHud';

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

export const OverlayView: React.FC = () => {
  const [settings, setSettings] = useState<PrompterSettings>(DEFAULT_SETTINGS);
  const containerRef = useRef<HTMLDivElement>(null);
  const isCopilotMode = settings.appMode === 'copilot';

  const { progress, hudMessage } = usePrompterScroll({
    settings,
    containerRef,
    enabled: !isCopilotMode
  });

  useEffect(() => {
    const api = window.electronAPI;
    if (!api) return;

    let active = true;
    void api.getSettings().then((nextSettings) => {
      if (active) setSettings(nextSettings);
    });
    const unsubscribe = api.onSettingsUpdated((nextSettings) => {
      setSettings(nextSettings);
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  if (isCopilotMode) {
    return <CopilotHud settings={settings} answerScrollRef={containerRef} />;
  }

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
