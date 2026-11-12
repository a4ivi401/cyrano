# Cyrano Architecture

## Overview
Cyrano is a cross-platform Electron application whose primary workflow is an AI Copilot for project defenses and online calls. A classic stealth teleprompter remains available as a secondary mode.

## Process Model
Electron follows a multi-process model:
1. **Main Process (`src/main/`)**:
   - Manages application lifecycle (`app.whenReady()`).
   - Coordinates window creation and positioning (`WindowManager`).
   - Handles global keyboard hooks via `globalShortcut`.
   - Owns the Copilot session, question review timers, ordered STT results, LLM requests, project index, and verified citations.
   - Persists settings to the user-data directory.
   - Manages atomic Whisper model downloads and native runtime validation.
2. **Preload Process (`src/preload/`)**:
   - Exposes safe IPC boundary via `contextBridge.exposeInMainWorld('electronAPI', {...})`.
   - Enforces context isolation and disables Node integration in renderers.
3. **Renderer Process (`src/renderer/`)**:
   - React 18 single-page application handling two views:
      - **Settings Window**: Copilot readiness, provider/audio/STT/project configuration, and Teleprompter settings.
      - **Overlay Window**: Either the live Copilot HUD or the classic scrolling Teleprompter.

## Copilot Data Flow
1. A user click starts truthful system capture through CoreAudio PCM on macOS 14.2+, or display-media loopback on Windows; microphone capture continues through an `AudioWorklet`.
2. Adaptive VAD creates ordered 16 kHz PCM chunks.
3. Local or cloud Whisper produces source-tagged transcript entries.
4. System-audio questions enter a two-second review state before confirmation.
5. `ContextIndexer` retrieves line-aware source chunks with opaque IDs.
6. The LLM may cite only those IDs; main process validates and resolves them to `Filename.ext(start-end)` labels.
7. Session and request IDs prevent stale renderer events from replacing current output.

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
- `src/main/copilotSession.ts`:
  - Authoritative Copilot phase, transcript, pending question, answer, citations, audio health, and errors.
- `src/main/whisperModelManager.ts`:
  - Complete manifests, atomic downloads, bundled/cache recovery, progress, and cancellation.
- `src/main/contextIndexer.ts`:
  - Safe project traversal, line chunks, generic concept retrieval, source resolution, and stale-file validation.
- `src/renderer/src/components/overlay/CopilotHud.tsx`:
  - Click-gated audio start, question review, streamed answer, verified references, and recovery actions.
