# Cyrano

> **A cross-platform AI Copilot for project defenses, with a built-in stealth teleprompter.**
> Cyrano listens to meeting audio, transcribes questions with local or cloud Whisper, and answers with verified project file and line references.

---

## 🌟 Key Features

- **AI Copilot readiness check** for the answer model, meeting audio, STT, and project context.
- **Local Whisper by default**, with explicit optional cloud STT and atomic model downloads.
- **Hybrid question flow** with automatic detection, a cancellation window, manual confirmation, and editable transcripts.
- **Verified code references** derived only from indexed source chunks, formatted as `Filename.ext(start-end)`.
- **Source-aware audio**: system loopback is the interlocutor; the microphone is never used as a hidden fallback.
- **Windows, macOS, and Linux packaging**, including audited Windows Sharp and ONNX native modules.
- **Classic teleprompter mode** with the existing scrolling, focal guide, mirror, positioning, and hotkeys.

- **Protected overlay** using Electron content protection where supported; screen-share exclusion must be smoke-tested on each target platform.
- **Click-through behavior** outside interactive Copilot controls.
- **Global hotkeys** with platform-specific normalization for macOS, Windows, and Linux.
- **Flexible placement and opacity**, including focal-guide and mirror options for the Teleprompter.
- **English, Russian, and Ukrainian localization**.
- **Offline UI styling** bundled into the application rather than loaded from a CDN.

---

## ⌨️ Global Shortcuts

You can operate the prompter while interacting with Keynote, slides, or terminal windows:

| Action | Default macOS Hotkey | Description |
|---|---|---|
| **Toggle Play / Pause** | `⌃⌥⌘P` (`Ctrl+Alt+Cmd+P`) | Starts or pauses scrolling instantly |
| **Close Overlay** | `⌃⌥⌘X` (`Ctrl+Alt+Cmd+X`) | Closes the overlay and restores the Dock icon |
| **Rewind to Start** | `⌃⌥⌘R` (`Ctrl+Alt+Cmd+R`) | Rewinds script to top (0% progress) |
| **Speed Up** | `⌃⌥⌘↑` (`Ctrl+Alt+Cmd+Up`) | Increases scrolling speed by +10 px/s |
| **Slow Down** | `⌃⌥⌘↓` (`Ctrl+Alt+Cmd+Down`) | Decreases scrolling speed by -10 px/s |

*All shortcuts can be viewed and customized in the Settings panel.*

---

## 🔬 How the Stealth Engine Works

### 1. Screen Sharing & OBS Invisibility (`NSWindowSharingNone`)
macOS compositing operates under the Quartz WindowServer. In Cyrano, the overlay window is configured with:

```typescript
overlayWindow.setContentProtection(true);
```

At the AppKit native level, Electron maps this call directly to:
```objc
-[NSWindow setSharingType:NSWindowSharingNone];
```

When macOS ScreenCaptureKit, Zoom, OBS Studio, or QuickTime captures display or window buffers, the WindowServer completely omits this window layer from the capture buffer. However, the display server still renders it onto your physical monitor panel.

### 2. Click-Through Behavior
```typescript
overlayWindow.setIgnoreMouseEvents(true, { forward: true });
```
This instructs macOS to route all mouse movements, clicks, drags, and wheel events to whatever window is underneath the overlay.

### 3. Mission Control & Spaces Persistence
```typescript
overlayWindow.setAlwaysOnTop(true, 'screen-saver', 1);
overlayWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
```
This ensures your script remains visible even when switching macOS Spaces or presenting keynote decks in native full-screen mode.

### 4. Dock & App Switcher Hiding
```typescript
// When overlay opens:
app.dock.hide();

// When overlay closes (via ⌃⌥⌘X):
app.dock.show();
```
Keeps your desktop presentation clean and prevents attendees or viewers from noticing Cyrano running in the Dock.

---

## 🚀 Installation & Getting Started

### Prerequisites
- Windows 10/11, macOS 12+, or a supported Linux desktop
- Node.js 20+
- `pnpm`

### Setup

```bash
# 1. Clone or navigate to the project directory
cd cyrano

# 2. Install dependencies
pnpm install

# 3. Start development mode
pnpm dev
```

### Production Build & Packaging

```bash
# Unit tests, typecheck, and production build
pnpm test
pnpm typecheck
pnpm build

# Launch compiled application locally
pnpm start

# Prepare bundled Tiny/Base Whisper resources when required
pnpm download:model

# Platform packages
pnpm dist:mac
pnpm dist:win
pnpm dist:linux
```

---

## 🛠️ Tech Stack

- **Runtime:** [Electron 45](https://www.electronjs.org/)
- **UI Framework:** [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Bundler:** [Vite 5](https://vitejs.dev/) (Renderer) + [esbuild](https://esbuild.github.io/) (Main / Preload)
- **Icons:** [lucide-react](https://lucide.dev/)
- **STT:** Hugging Face Transformers + ONNX Runtime, or a compatible cloud transcription API
- **LLM:** Anthropic Messages API and OpenAI-compatible endpoints
- **Architecture:** Electron main-process session orchestration with Settings and protected Overlay renderers

---

## 📄 License

MIT License. Built for seamless, confident speaking and presentations.
