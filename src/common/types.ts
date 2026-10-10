export type PresetPosition =
  | 'top-center'
  | 'top-full'
  | 'center'
  | 'left-sidebar'
  | 'right-sidebar'
  | 'custom';

export type Language = 'en' | 'ru' | 'uk';

export interface PrompterSettings {
  // Localization
  language: Language;

  // Script content
  text: string;

  // Typography & Appearance
  fontSize: number; // 16 to 72 px
  fontFamily: string;
  textColor: string;
  textShadow: boolean;
  bgColor: string;
  bgOpacity: number; // 0.0 to 1.0
  showFocalGuide: boolean;
  focalGuidePosition: number; // 10 to 90 %
  flipHorizontal: boolean;

  // Window geometry
  width: number;
  height: number;
  xPosition: number; // -1 for auto-center
  yPosition: number;
  presetPosition: PresetPosition;

  // Scroll engine
  speed: number; // px per second (10 to 300)
  autoRewindOnEnd: boolean;

  // Global hotkeys (Electron Accelerator format)
  hotkeyClose: string;
  hotkeyToggle: string;
  hotkeyRewind: string;
  hotkeySpeedUp: string;
  hotkeySpeedDown: string;
}

export interface DisplayInfo {
  id: number;
  label: string;
  bounds: { x: number; y: number; width: number; height: number };
  workArea: { x: number; y: number; width: number; height: number };
  isPrimary: boolean;
}

export interface WindowBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PrompterState {
  isPlaying: boolean;
  speed: number;
  progressPercent: number;
}
