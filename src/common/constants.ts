import { PrompterSettings } from './types';

export const DEFAULT_SCRIPT_TEXT = `Welcome to Cyrano!

This teleprompter overlay is completely invisible to OBS, Zoom, Google Meet, QuickTime, and screen shares.

Mouse clicks pass right through this window to any application underneath.

Global Controls:
• ⌃⌥⌘P (Ctrl+Alt+Cmd+P) : Start / Pause scrolling
• ⌃⌥⌘X (Ctrl+Alt+Cmd+X) : Close overlay & return to Settings
• ⌃⌥⌘R (Ctrl+Alt+Cmd+R) : Rewind script to top
• ⌃⌥⌘↑ / ↓ : Adjust scroll speed (+/- 10 px/s)

Position this window right beneath your webcam lens to maintain natural eye contact with your audience.`;

export const DEFAULT_SETTINGS: PrompterSettings = {
  language: 'en',
  text: DEFAULT_SCRIPT_TEXT,

  fontSize: 28,
  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro", "Helvetica Neue", sans-serif',
  textColor: '#FFFFFF',
  textShadow: true,
  bgColor: '#000000',
  bgOpacity: 0.65,
  showFocalGuide: true,
  focalGuidePosition: 25,
  flipHorizontal: false,

  width: 720,
  height: 260,
  xPosition: -1, // center
  yPosition: 24, // right under webcam / menu bar
  presetPosition: 'top-center',

  speed: 45,
  autoRewindOnEnd: false,

  hotkeyClose: 'Control+Alt+Command+X',
  hotkeyToggle: 'Control+Alt+Command+P',
  hotkeyRewind: 'Control+Alt+Command+R',
  hotkeySpeedUp: 'Control+Alt+Command+Up',
  hotkeySpeedDown: 'Control+Alt+Command+Down'
};

export const COMMON_SYSTEM_FONTS = [
  { label: 'System Default (San Francisco)', value: '-apple-system, BlinkMacSystemFont, "SF Pro", sans-serif' },
  { label: 'Helvetica Neue', value: '"Helvetica Neue", Helvetica, Arial, sans-serif' },
  { label: 'Menlo (Monospace)', value: 'Menlo, Monaco, "Courier New", monospace' },
  { label: 'Monaco (Monospace)', value: 'Monaco, Menlo, monospace' },
  { label: 'Arial', value: 'Arial, Helvetica, sans-serif' },
  { label: 'Avenir Next', value: '"Avenir Next", Avenir, sans-serif' },
  { label: 'Georgia (Serif)', value: 'Georgia, serif' },
  { label: 'Times New Roman (Serif)', value: '"Times New Roman", Times, serif' },
  { label: 'Courier New (Monospace)', value: '"Courier New", Courier, monospace' },
  { label: 'Trebuchet MS', value: '"Trebuchet MS", sans-serif' },
  { label: 'Verdana', value: 'Verdana, Geneva, sans-serif' }
];
