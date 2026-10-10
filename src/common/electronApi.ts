import { PrompterSettings, DisplayInfo } from '../common/types';

export interface IElectronAPI {
  getSettings: () => Promise<PrompterSettings>;
  saveSettings: (settings: Partial<PrompterSettings>) => Promise<PrompterSettings>;
  startPrompter: (settings?: PrompterSettings) => Promise<{ success: boolean }>;
  stopPrompter: () => Promise<{ success: boolean }>;
  getFonts: () => Promise<{ label: string; value: string }[]>;
  getDisplays: () => Promise<DisplayInfo[]>;
  validateShortcut: (accelerator: string) => Promise<boolean>;

  onSettingsUpdated: (callback: (settings: PrompterSettings) => void) => () => void;
  onTogglePlay: (callback: () => void) => () => void;
  onRewind: (callback: () => void) => () => void;
  onAdjustSpeed: (callback: (delta: number) => void) => () => void;
  onStart: (callback: () => void) => () => void;
}
