import { contextBridge, ipcRenderer } from 'electron';
import { PrompterSettings, DisplayInfo } from '../common/types';

const electronAPI = {
  getSettings: (): Promise<PrompterSettings> => ipcRenderer.invoke('prompter:get-settings'),
  saveSettings: (settings: Partial<PrompterSettings>): Promise<PrompterSettings> =>
    ipcRenderer.invoke('prompter:save-settings', settings),
  startPrompter: (settings?: PrompterSettings): Promise<{ success: boolean }> =>
    ipcRenderer.invoke('prompter:start', settings),
  stopPrompter: (): Promise<{ success: boolean }> => ipcRenderer.invoke('prompter:stop'),
  getFonts: (): Promise<{ label: string; value: string }[]> => ipcRenderer.invoke('prompter:get-fonts'),
  getDisplays: (): Promise<DisplayInfo[]> => ipcRenderer.invoke('prompter:get-displays'),
  validateShortcut: (accelerator: string): Promise<boolean> =>
    ipcRenderer.invoke('prompter:validate-shortcut', accelerator),

  // Overlay Events
  onSettingsUpdated: (callback: (settings: PrompterSettings) => void): (() => void) => {
    const handler = (_: any, settings: PrompterSettings) => callback(settings);
    ipcRenderer.on('prompter:settings-updated', handler);
    return () => ipcRenderer.removeListener('prompter:settings-updated', handler);
  },
  onTogglePlay: (callback: () => void): (() => void) => {
    const handler = () => callback();
    ipcRenderer.on('prompter:toggle-play', handler);
    return () => ipcRenderer.removeListener('prompter:toggle-play', handler);
  },
  onRewind: (callback: () => void): (() => void) => {
    const handler = () => callback();
    ipcRenderer.on('prompter:rewind', handler);
    return () => ipcRenderer.removeListener('prompter:rewind', handler);
  },
  onAdjustSpeed: (callback: (delta: number) => void): (() => void) => {
    const handler = (_: any, delta: number) => callback(delta);
    ipcRenderer.on('prompter:adjust-speed', handler);
    return () => ipcRenderer.removeListener('prompter:adjust-speed', handler);
  },
  onStart: (callback: () => void): (() => void) => {
    const handler = () => callback();
    ipcRenderer.on('prompter:start', handler);
    return () => ipcRenderer.removeListener('prompter:start', handler);
  }
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);
