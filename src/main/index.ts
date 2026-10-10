import { app, ipcMain, screen } from 'electron';
import { SettingsStore } from './store';
import { WindowManager } from './windowManager';
import { ShortcutManager } from './shortcuts';
import { getAvailableFonts } from './fonts';
import { PrompterSettings } from '../common/types';

// Enforce single instance lock
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
}

const store = new SettingsStore();
const windowManager = new WindowManager();
const shortcutManager = new ShortcutManager();

function registerShortcuts(settings: PrompterSettings) {
  shortcutManager.register(settings, {
    onClose: () => {
      windowManager.stopPrompter();
      shortcutManager.unregister();
    },
    onTogglePlay: () => {
      const overlay = windowManager.getOverlay();
      if (overlay) {
        overlay.webContents.send('prompter:toggle-play');
      }
    },
    onRewind: () => {
      const overlay = windowManager.getOverlay();
      if (overlay) {
        overlay.webContents.send('prompter:rewind');
      }
    },
    onSpeedAdjust: (delta: number) => {
      const overlay = windowManager.getOverlay();
      if (overlay) {
        overlay.webContents.send('prompter:adjust-speed', delta);
      }
    }
  });
}

app.whenReady().then(() => {
  // Create settings window
  windowManager.createSettingsWindow();

  // IPC Handlers
  ipcMain.handle('prompter:get-settings', () => {
    return store.getSettings();
  });

  ipcMain.handle('prompter:save-settings', (_, newSettings: Partial<PrompterSettings>) => {
    const updated = store.saveSettings(newSettings);
    // If overlay is already active, update its bounds & settings immediately
    const overlay = windowManager.getOverlay();
    if (overlay) {
      const bounds = windowManager.calculateOverlayBounds(updated);
      overlay.setBounds(bounds);
      overlay.webContents.send('prompter:settings-updated', updated);
      registerShortcuts(updated);
    }
    return updated;
  });

  ipcMain.handle('prompter:start', (_, overrideSettings?: PrompterSettings) => {
    const settings = overrideSettings ? store.saveSettings(overrideSettings) : store.getSettings();
    windowManager.startPrompter(settings);
    registerShortcuts(settings);
    return { success: true };
  });

  ipcMain.handle('prompter:stop', () => {
    windowManager.stopPrompter();
    shortcutManager.unregister();
    return { success: true };
  });

  ipcMain.handle('prompter:get-fonts', () => {
    return getAvailableFonts();
  });

  ipcMain.handle('prompter:get-displays', () => {
    const primary = screen.getPrimaryDisplay();
    return screen.getAllDisplays().map((disp) => ({
      id: disp.id,
      label: disp.label || `Display ${disp.id} (${disp.bounds.width}x${disp.bounds.height})`,
      bounds: disp.bounds,
      workArea: disp.workArea,
      isPrimary: disp.id === primary.id
    }));
  });

  ipcMain.handle('prompter:validate-shortcut', (_, accelerator: string) => {
    return ShortcutManager.isValidAccelerator(accelerator);
  });

  app.on('activate', () => {
    if (!windowManager.getIsPrompterActive()) {
      windowManager.showSettings();
    }
  });
});

app.on('second-instance', () => {
  if (!windowManager.getIsPrompterActive()) {
    windowManager.showSettings();
  }
});

app.on('will-quit', () => {
  shortcutManager.unregister();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
