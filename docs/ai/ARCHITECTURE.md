# Cyrano Architecture

## Overview
Cyrano is a desktop stealth teleprompter designed specifically for macOS. It allows presenters, speakers, and candidates to read notes with optimal eye contact without audience detection.

## Process Model
Electron follows a multi-process model:
1. **Main Process (`src/main/`)**:
   - Manages application lifecycle (`app.whenReady()`).
   - Coordinates window creation and positioning (`WindowManager`).
   - Handles global keyboard hooks via `globalShortcut`.
   - Persists settings to user filesystem (`electron-store`).
   - Enumerates native macOS system fonts via Node font-manager or fallback AppKit fonts.
2. **Preload Process (`src/preload/`)**:
   - Exposes safe IPC boundary via `contextBridge.exposeInMainWorld('electronAPI', {...})`.
   - Enforces context isolation and disables Node integration in renderers.
3. **Renderer Process (`src/renderer/`)**:
   - React 18 single-page application handling two views:
     - **Settings Window**: Control panel for script editing, speed, typography, opacity, geometry presets, and hotkeys.
     - **Overlay Window**: Floating HUD with transparent background, optical focal guide, smooth auto-scroll, and click-through interactivity.

## Key Modules
- `src/main/windowManager.ts`:
  - `createSettingsWindow()`: Standard titled macOS window with custom titlebar region (`titleBarStyle: 'hiddenInset'`).
  - `createOverlayWindow()`: Full-screen or customized transparent canvas configured with:
    - `transparent: true`
    - `hasShadow: false`
    - `alwaysOnTop: true` with level `'screen-saver'`
    - `setContentProtection(true)` -> AppKit `-[NSWindow setSharingType:NSWindowSharingNone]`
    - `setIgnoreMouseEvents(true, { forward: true })` for seamless click-through.
- `src/main/shortcuts.ts`:
  - Registers global accelerator bindings (`Cmd+Alt+Control+P` toggle, `Cmd+Alt+Control+W` close, speed modifiers, rewinding).
- `src/renderer/src/hooks/usePrompterScroll.ts`:
  - `requestAnimationFrame` dynamic scroller computing fractional pixel offsets based on configured speed and delta time.
- `src/renderer/src/components/common/CyranoLogo.tsx`:
  - Scalable vector rendering of the Cyrano mask and eye-line reticle.
