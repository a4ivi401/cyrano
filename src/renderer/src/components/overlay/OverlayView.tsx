import React, { useRef, useState, useEffect } from 'react';
import { PrompterSettings } from '../../../../common/types';
import { DEFAULT_SETTINGS } from '../../../../common/constants';
import { usePrompterScroll } from '../../hooks/usePrompterScroll';

export const OverlayView: React.FC = () => {
  const [settings, setSettings] = useState<PrompterSettings>(DEFAULT_SETTINGS);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initial fetch of settings
    if (window.electronAPI) {
      window.electronAPI.getSettings().then((s) => setSettings(s));
      const unsub = window.electronAPI.onSettingsUpdated((newSettings) => {
        setSettings(newSettings);
      });
      return () => unsub();
    }
  }, []);

  const { progress, hudMessage } = usePrompterScroll({
    settings,
    containerRef
  });

  // Convert hex color to rgba for background
  const hexToRgba = (hex: string, alpha: number) => {
    let cleanHex = hex.replace('#', '');
    if (cleanHex.length === 3) {
      cleanHex = cleanHex.split('').map((c) => c + c).join('');
    }
    const num = parseInt(cleanHex, 16);
    const r = (num >> 16) & 255;
    const g = (num >> 8) & 255;
    const b = num & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const focalTop = settings.focalGuidePosition || 25;

  return (
    <div
      style={{
        position: 'relative',
        width: '100vw',
        height: '100vh',
        backgroundColor: hexToRgba(settings.bgColor, settings.bgOpacity),
        overflow: 'hidden',
        pointerEvents: 'none', // click-through
        userSelect: 'none'
      }}
    >
      {/* Eye-line / Focal Guide */}
      {settings.showFocalGuide && (
        <div
          style={{
            position: 'absolute',
            top: `${focalTop}%`,
            left: 0,
            right: 0,
            height: '2px',
            background: 'linear-gradient(90deg, transparent 0%, rgba(59, 130, 246, 0.4) 15%, rgba(59, 130, 246, 0.8) 50%, rgba(59, 130, 246, 0.4) 85%, transparent 100%)',
            zIndex: 10,
            pointerEvents: 'none'
          }}
        >
          {/* Subtle focal target notch on left */}
          <div
            style={{
              position: 'absolute',
              left: '12px',
              top: '-4px',
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: '#3b82f6',
              boxShadow: '0 0 6px #3b82f6'
            }}
          />
        </div>
      )}

      {/* Scrolling Text Container with Gradient Fade */}
      <div
        ref={containerRef}
        className="no-scrollbar"
        style={{
          width: '100%',
          height: '100%',
          overflowY: 'scroll',
          paddingLeft: '28px',
          paddingRight: '28px',
          paddingTop: `calc(${focalTop}vh - 1.2em)`,
          paddingBottom: '80vh',
          maskImage: 'linear-gradient(to bottom, transparent 0%, black 12%, black 88%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 12%, black 88%, transparent 100%)',
          transform: settings.flipHorizontal ? 'scaleX(-1)' : 'none'
        }}
      >
        <div
          style={{
            fontFamily: settings.fontFamily,
            fontSize: `${settings.fontSize}px`,
            color: settings.textColor,
            lineHeight: 1.6,
            fontWeight: 500,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            textShadow: settings.textShadow
              ? '0 2px 4px rgba(0, 0, 0, 0.95), 0 0 2px rgba(0, 0, 0, 1)'
              : 'none'
          }}
        >
          {settings.text}
        </div>
      </div>

      {/* Floating Status HUD Pill */}
      {hudMessage && (
        <div
          style={{
            position: 'absolute',
            top: '12px',
            right: '16px',
            backgroundColor: 'rgba(15, 23, 42, 0.85)',
            border: '1px solid rgba(59, 130, 246, 0.4)',
            color: '#f8fafc',
            padding: '4px 10px',
            borderRadius: '9999px',
            fontSize: '11px',
            fontWeight: 600,
            letterSpacing: '0.05em',
            boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
            backdropFilter: 'blur(8px)',
            zIndex: 30,
            transition: 'opacity 0.2s ease',
            pointerEvents: 'none'
          }}
        >
          {hudMessage}
        </div>
      )}

      {/* Reading Progress Indicator Line */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: `${progress}%`,
          height: '2px',
          backgroundColor: '#3b82f6',
          boxShadow: '0 0 4px #3b82f6',
          zIndex: 20,
          transition: 'width 0.1s linear'
        }}
      />
    </div>
  );
};
