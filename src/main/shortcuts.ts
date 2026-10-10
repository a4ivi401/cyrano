import { globalShortcut } from 'electron';
import { PrompterSettings } from '../common/types';

export interface ShortcutHandlers {
  onClose: () => void;
  onTogglePlay: () => void;
  onRewind: () => void;
  onSpeedAdjust: (delta: number) => void;
}

export class ShortcutManager {
  private registered: boolean = false;

  public register(settings: PrompterSettings, handlers: ShortcutHandlers): void {
    this.unregister();

    const registerKey = (key: string, name: string, callback: () => void) => {
      if (!key) return;
      try {
        const ok = globalShortcut.register(key, callback);
        if (!ok) {
          console.warn(`[ShortcutManager] Failed to register ${name}: ${key}`);
        }
      } catch (err) {
        console.error(`[ShortcutManager] Error registering ${name} (${key}):`, err);
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
