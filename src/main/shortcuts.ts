import { globalShortcut } from 'electron';
import { PrompterSettings } from '../common/types';

export interface ShortcutHandlers {
  onClose: () => void;
  onTogglePlay: () => void;
  onRewind: () => void;
  onSpeedAdjust: (delta: number) => void;
  onAskAI?: () => void;
}

export class ShortcutManager {
  private registered: boolean = false;

  public register(settings: PrompterSettings, handlers: ShortcutHandlers): void {
    this.unregister();

    const registerKey = (key: string, name: string, callback: () => void) => {
      if (!key) return;
      const isNonMac = process.platform !== 'darwin';
      // On Windows & Linux, Command/Super is reserved by the OS (Xbox Game Bar / GNOME / KDE),
      // so we map Control+Alt+Command+* to Control+Alt+Shift+*.
      const normalizedKey =
        isNonMac && key.includes('Command')
          ? key.replace(/Command/g, 'Shift').replace(/Cmd/g, 'Shift')
          : key;

      try {
        const ok = globalShortcut.register(normalizedKey, callback);
        if (!ok) {
          console.warn(`[ShortcutManager] Failed to register ${name}: ${normalizedKey}`);
        }
      } catch (err) {
        console.error(`[ShortcutManager] Error registering ${name} (${normalizedKey}):`, err);
      }
    };

    // Close Overlay & Return to Settings
    registerKey(settings.hotkeyClose, 'Close Overlay', handlers.onClose);

    // Play / Pause Toggle
    registerKey(settings.hotkeyToggle, 'Play/Pause', handlers.onTogglePlay);

    // Rewind to Top
    registerKey(settings.hotkeyRewind, 'Rewind', handlers.onRewind);

    // Speed Up (+10 px/s)
    registerKey(settings.hotkeySpeedUp, 'Speed Up', () => handlers.onSpeedAdjust(10));

    // Speed Down (-10 px/s)
    registerKey(settings.hotkeySpeedDown, 'Speed Down', () => handlers.onSpeedAdjust(-10));

    // Ask AI Copilot
    if (handlers.onAskAI && settings.hotkeyAskAI) {
      registerKey(settings.hotkeyAskAI, 'Ask AI Copilot', handlers.onAskAI);
    }

    this.registered = true;
  }

  public unregister(): void {
    if (this.registered) {
      globalShortcut.unregisterAll();
      this.registered = false;
    }
  }

  public static isValidAccelerator(accelerator: string): boolean {
    if (!accelerator || typeof accelerator !== 'string') return false;
    try {
      const ok = globalShortcut.register(accelerator, () => {});
      if (ok) {
        globalShortcut.unregister(accelerator);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }
}
