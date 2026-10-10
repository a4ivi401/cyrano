import { BrowserWindow, screen, app } from 'electron';
import * as path from 'path';
import { PrompterSettings, WindowBounds, PresetPosition } from '../common/types';

export class WindowManager {
  private settingsWindow: BrowserWindow | null = null;
  private overlayWindow: BrowserWindow | null = null;
  private isPrompterActive: boolean = false;

  private getPreloadPath(): string {
    return path.join(__dirname, '../preload/index.js');
  }

  private getAppUrl(route: string): string {
    const devUrl = process.env.VITE_DEV_SERVER_URL;
    if (devUrl) {
      return `${devUrl}/#${route}`;
    }
    const htmlPath = path.join(__dirname, '../renderer/index.html');
    return `file://${htmlPath}#${route}`;
  }

  // 1. Settings Window Lifecycle
  public createSettingsWindow(): BrowserWindow {
    if (this.settingsWindow && !this.settingsWindow.isDestroyed()) {
      if (this.settingsWindow.isMinimized()) this.settingsWindow.restore();
      this.settingsWindow.show();
      this.settingsWindow.focus();
      return this.settingsWindow;
    }

    this.settingsWindow = new BrowserWindow({
      width: 980,
      height: 740,
      minWidth: 840,
      minHeight: 600,
      title: 'Cyrano — Teleprompter Settings',
      titleBarStyle: 'hiddenInset',
      trafficLightPosition: { x: 16, y: 16 },
      show: false,
      backgroundColor: '#0d1117',
      webPreferences: {
        preload: this.getPreloadPath(),
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: false
      }
    });

    this.settingsWindow.loadURL(this.getAppUrl('/settings'));

    this.settingsWindow.once('ready-to-show', () => {
      if (!this.isPrompterActive && this.settingsWindow) {
        this.settingsWindow.show();
      }
    });

    this.settingsWindow.on('closed', () => {
      this.settingsWindow = null;
    });

    return this.settingsWindow;
  }

  public showSettings(): void {
    if (!this.settingsWindow || this.settingsWindow.isDestroyed()) {
      this.createSettingsWindow();
      return;
    }
    this.settingsWindow.show();
    this.settingsWindow.focus();
  }

  public hideSettings(): void {
    if (this.settingsWindow && !this.settingsWindow.isDestroyed()) {
      this.settingsWindow.hide();
    }
  }

  // 2. Geometry Calculation for Overlay
  public calculateOverlayBounds(settings: PrompterSettings): { x: number; y: number; width: number; height: number } {
    const primaryDisplay = screen.getPrimaryDisplay();
    const { x: dispX, y: dispY, width: dispW, height: dispH } = primaryDisplay.workArea;

    let width = settings.width || 720;
    let height = settings.height || 260;
    let x = settings.xPosition;
    let y = settings.yPosition;

    switch (settings.presetPosition) {
      case 'top-center':
        width = Math.min(settings.width || 720, dispW - 40);
        height = settings.height || 260;
        x = Math.round(dispX + (dispW - width) / 2);
        y = dispY + 16;
        break;

      case 'top-full':
        width = Math.round(dispW * 0.92);
        height = settings.height || 240;
        x = Math.round(dispX + (dispW - width) / 2);
        y = dispY + 12;
        break;

      case 'center':
        width = Math.min(settings.width || 760, dispW - 60);
        height = Math.min(settings.height || 380, dispH - 60);
        x = Math.round(dispX + (dispW - width) / 2);
        y = Math.round(dispY + (dispH - height) / 2);
        break;

      case 'left-sidebar':
        width = 380;
        height = Math.round(dispH * 0.75);
        x = dispX + 24;
        y = Math.round(dispY + (dispH - height) / 2);
        break;

      case 'right-sidebar':
        width = 380;
        height = Math.round(dispH * 0.75);
        x = dispX + dispW - width - 24;
        y = Math.round(dispY + (dispH - height) / 2);
        break;

      case 'custom':
      default:
        if (x < 0) {
          x = Math.round(dispX + (dispW - width) / 2);
        }
        if (y < 0) {
          y = dispY + 24;
        }
        break;
    }

    return { x, y, width, height };
  }

  // 3. Overlay Window Lifecycle
  public createOrUpdateOverlay(settings: PrompterSettings): BrowserWindow {
    const bounds = this.calculateOverlayBounds(settings);

    if (this.overlayWindow && !this.overlayWindow.isDestroyed()) {
      this.overlayWindow.setBounds(bounds);
      return this.overlayWindow;
    }

    this.overlayWindow = new BrowserWindow({
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height,
      frame: false,
      transparent: true,
      backgroundColor: '#00000000',
      hasShadow: false,
      resizable: false,
      movable: false,
      focusable: false,      // Prevent stealing focus from target app
      skipTaskbar: true,     // Exclude from taskbar
      show: false,
      type: 'panel',         // NSPanel on macOS
      webPreferences: {
        preload: this.getPreloadPath(),
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: false
      }
    });

    // 1. OBS / Screen Share Invisibility: sets NSWindowSharingNone
    this.overlayWindow.setContentProtection(true);

    // 2. High window level: stays above full-screen apps and keynote presentations
    this.overlayWindow.setAlwaysOnTop(true, 'screen-saver', 1);
    this.overlayWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });

    // 3. Click-Through: all mouse clicks pass to the underlying window
    this.overlayWindow.setIgnoreMouseEvents(true, { forward: true });

    this.overlayWindow.loadURL(this.getAppUrl('/overlay'));

    this.overlayWindow.on('closed', () => {
      this.overlayWindow = null;
    });

    return this.overlayWindow;
  }

  // 4. Prompter Activation & Deactivation
  public startPrompter(settings: PrompterSettings): void {
    this.isPrompterActive = true;

    // Create or position overlay window
    const overlay = this.createOrUpdateOverlay(settings);

    // Send latest settings to overlay
    overlay.webContents.once('did-finish-load', () => {
      overlay.webContents.send('prompter:settings-updated', settings);
      overlay.webContents.send('prompter:start');
    });
    if (!overlay.webContents.isLoading()) {
      overlay.webContents.send('prompter:settings-updated', settings);
      overlay.webContents.send('prompter:start');
    }

    // Hide Settings window
    this.hideSettings();

    // Hide app from Dock and Cmd+Tab app switcher
    if (app.dock) {
      app.dock.hide();
    }

    // Show overlay without taking focus away from whatever app user is in
    overlay.showInactive();
  }

  public stopPrompter(): void {
    this.isPrompterActive = false;

    // Hide overlay
    if (this.overlayWindow && !this.overlayWindow.isDestroyed()) {
      this.overlayWindow.hide();
    }

    // Restore app presence in Dock
    if (app.dock) {
      app.dock.show();
    }

    // Show settings window
    this.showSettings();
  }

  public getOverlay(): BrowserWindow | null {
    return this.overlayWindow && !this.overlayWindow.isDestroyed() ? this.overlayWindow : null;
  }

  public getSettingsWindow(): BrowserWindow | null {
    return this.settingsWindow && !this.settingsWindow.isDestroyed() ? this.settingsWindow : null;
  }

  public getIsPrompterActive(): boolean {
    return this.isPrompterActive;
  }
}
