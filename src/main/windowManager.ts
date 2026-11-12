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

    const isMac = process.platform === 'darwin';

    this.settingsWindow = new BrowserWindow({
      width: 1020,
      height: 740,
      minWidth: 860,
      minHeight: 620,
      resizable: true,
      maximizable: true,
      fullscreenable: false,
      title: 'Cyrano — AI Copilot & Teleprompter',
      titleBarStyle: isMac ? 'hiddenInset' : 'default',
      trafficLightPosition: isMac ? { x: 16, y: 16 } : undefined,
      autoHideMenuBar: true,
      icon: !isMac
        ? path.join(
            __dirname,
            process.platform === 'win32' ? '../../build/icon.ico' : '../../build/icon.png'
          )
        : undefined,
      show: false,
      backgroundColor: '#0d1117',
      webPreferences: {
        preload: this.getPreloadPath(),
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: false,
        backgroundThrottling: false
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
      // If prompter is not active, closing the settings window should cleanly exit the application
      if (!this.isPrompterActive) {
        this.destroyAll();
        app.quit();
      }
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

    // Dedicated geometry for AI Copilot HUD Window (Cyrano floating overlay)
    if (settings.appMode === 'copilot') {
      const isCompact = Boolean(settings.copilotCompact);
      let width = Math.min(isCompact ? 720 : 860, dispW - 32);
      let height = Math.min(isCompact ? 360 : 560, dispH - 32);

      let x = dispX + Math.round((dispW - width) / 2);
      let y = dispY + 14;

      switch (settings.presetPosition) {
        case 'right-sidebar':
          x = dispX + dispW - width - 20;
          y = dispY + 20;
          break;
        case 'left-sidebar':
          x = dispX + 20;
          y = dispY + 20;
          break;
        case 'center':
          x = dispX + Math.round((dispW - width) / 2);
          y = dispY + Math.round((dispH - height) / 2);
          break;
        case 'top-full':
          width = Math.round(dispW * 0.92);
          x = dispX + Math.round((dispW - width) / 2);
          y = dispY + 12;
          break;
        case 'custom':
          width = Math.max(480, Math.min(settings.width || width, dispW - 32));
          height = Math.max(280, Math.min(settings.height || height, dispH - 32));
          x = settings.xPosition < 0
            ? dispX + Math.round((dispW - width) / 2)
            : Math.max(dispX, Math.min(settings.xPosition, dispX + dispW - width));
          y = settings.yPosition < 0
            ? dispY + 14
            : Math.max(dispY, Math.min(settings.yPosition, dispY + dispH - height));
          break;
        case 'top-center':
        default:
          x = dispX + Math.round((dispW - width) / 2);
          y = dispY + 14;
          break;
      }

      return { x, y, width, height };
    }

    // Classic Teleprompter Geometry
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

  // 3. Overlay Window Lifecycle (Stealth, Non-Clickable Click-Through HUD)
  public createOrUpdateOverlay(settings: PrompterSettings): BrowserWindow {
    const bounds = this.calculateOverlayBounds(settings);

    if (this.overlayWindow && !this.overlayWindow.isDestroyed()) {
      this.overlayWindow.setBounds(bounds);
      this.overlayWindow.setMovable(false);
      this.overlayWindow.setFocusable(
        process.platform === 'linux' && settings.appMode === 'copilot'
      );
      // Re-assert screen capture exclusion (WDA_EXCLUDEFROMCAPTURE / NSWindowSharingNone)
      this.overlayWindow.setContentProtection(true);
      const keepCopilotInteractive = process.platform === 'linux' && settings.appMode === 'copilot';
      this.overlayWindow.setIgnoreMouseEvents(!keepCopilotInteractive, { forward: true });
      return this.overlayWindow;
    }

    const isMac = process.platform === 'darwin';

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
      focusable: process.platform === 'linux' && settings.appMode === 'copilot',
      skipTaskbar: true,     // Exclude from taskbar (Windows & Linux)
      show: false,
      type: isMac ? 'panel' : undefined, // Standard frameless on Windows to ensure DWM respects SetWindowDisplayAffinity
      webPreferences: {
        preload: this.getPreloadPath(),
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: false,
        backgroundThrottling: false
      }
    });

    // 1. OBS / Screen Share Invisibility:
    // Sets NSWindowSharingNone on macOS and WDA_EXCLUDEFROMCAPTURE on Windows 10/11
    this.overlayWindow.setContentProtection(true);

    // Re-assert content protection on show and ready-to-show events because
    // Windows DWM can reset window display affinity upon show / state transitions
    this.overlayWindow.on('show', () => {
      if (this.overlayWindow && !this.overlayWindow.isDestroyed()) {
        this.overlayWindow.setContentProtection(true);
      }
    });
    this.overlayWindow.once('ready-to-show', () => {
      if (this.overlayWindow && !this.overlayWindow.isDestroyed()) {
        this.overlayWindow.setContentProtection(true);
      }
    });

    // 2. High window level: stays above full-screen apps and presentations
    this.overlayWindow.setAlwaysOnTop(true, 'screen-saver', 1);
    if (isMac || process.platform === 'linux') {
      try {
        this.overlayWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
      } catch {
        // Ignore if window manager does not support workspace pinning
      }
    }

    // 3. Mouse interactivity:
    // In both Teleprompter and AI Copilot modes, the window is click-through (Cyrano model).
    // Mouse clicks pass through seamlessly to Zoom, IDE, browser, presentations.
    // All control is driven by global hotkeys.
    const keepCopilotInteractive = process.platform === 'linux' && settings.appMode === 'copilot';
    this.overlayWindow.setIgnoreMouseEvents(!keepCopilotInteractive, { forward: true });

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

    // Re-assert content protection immediately and after next DWM composition tick
    overlay.setContentProtection(true);
    setTimeout(() => {
      if (overlay && !overlay.isDestroyed()) {
        overlay.setContentProtection(true);
      }
    }, 100);
  }

  public stopPrompter(): void {
    this.isPrompterActive = false;

    // Destroy overlay window so native system-audio and WebAudio sessions release immediately.
    if (this.overlayWindow && !this.overlayWindow.isDestroyed()) {
      try {
        this.overlayWindow.destroy();
      } catch (err) {
        console.warn('[WindowManager] Error destroying overlay window:', err);
      }
      this.overlayWindow = null;
    }

    // Restore app presence in Dock
    if (app.dock) {
      app.dock.show();
    }

    // Show settings window
    this.showSettings();
  }

  public destroyAll(): void {
    this.isPrompterActive = false;
    if (this.overlayWindow && !this.overlayWindow.isDestroyed()) {
      try {
        this.overlayWindow.destroy();
      } catch {
        // Ignore
      }
      this.overlayWindow = null;
    }
    if (this.settingsWindow && !this.settingsWindow.isDestroyed()) {
      try {
        this.settingsWindow.destroy();
      } catch {
        // Ignore
      }
      this.settingsWindow = null;
    }
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
