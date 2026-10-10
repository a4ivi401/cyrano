# Cyrano 🎭

> **The Invisibility-First Teleprompter for macOS**  
> Read your script directly from your screen with perfect eye contact—completely invisible to Zoom, Google Meet, Microsoft Teams, OBS Studio, QuickTime, and ScreenCaptureKit.

---

## 🌟 Key Features

- 🕵️ **100% Invisible to Screen Sharing & Recording**  
  Uses native macOS `NSWindowSharingNone` window protection (`setContentProtection(true)`). Even while actively broadcasting your display or recording via OBS, the prompter is physically visible to you alone.
- 🖱️ **Non-Clickable / Click-Through Overlay**  
  Mouse events pass completely through the overlay (`setIgnoreMouseEvents(true, { forward: true })`). Click links, advance slides, scroll pages, and switch windows underneath with zero interruption.
- 🫥 **Automatic Dock & App Switcher Vanishing**  
  The moment the prompter launches, Cyrano hides itself from the macOS Dock and the `Cmd + Tab` app switcher (`app.dock.hide()`). Closing the overlay smoothly restores the app to the Dock (`app.dock.show()`).
- ⌨️ **Conflict-Free Global Hotkeys**  
  Control your prompter without ever bringing Cyrano into focus. Uses 4-modifier Hyper shortcuts (`Control + Option + Command`) by default to guarantee zero conflict with macOS system hotkeys.
- 📐 **Flexible Placement Presets & Geometry**  
  - **Top-Center (Camera Mount):** Placed directly under your MacBook or external webcam for natural eye contact.
  - **Top Full Width:** A subtle banner at the top edge of your screen.
  - **Screen Center / Left Column / Right Column / Custom:** Adjust width, height, and coordinates freely.
- 🌐 **Multi-Language Support (i18n)**  
  Instant switching between English (`EN`), Russian (`RU`), and Ukrainian (`UK`) with localized sample presentation scripts.
- 🪟 **True Crystal Glass Transparency (0%–100%)**  
  True transparent overlay mode allows 100% clear glass where only the crisp floating text and focal guide line appear over your desktop, preventing eye fatigue.
- 📦 **One-Click macOS DMG Distribution**  
  Automated build pipeline with `electron-builder` producing a standalone `.dmg` installer with `/Applications` drag-and-drop shortcut.
- ⚡ **Delta-Time Jitter-Free Smooth Scrolling**  
  Sub-pixel delta-time scrolling using `requestAnimationFrame`, ensuring identical, buttery-smooth scrolling across 60Hz and 120Hz ProMotion displays.
- 👁️ **Eye-Line Focal Guide & Mirror Mode**  
  Features an adjustable horizontal eye-contact line and optional horizontal flip for physical beam-splitter teleprompter glass.

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
- macOS 12.0 (Monterey) or later
- Node.js 18+ (Node 20+ recommended)
- `npm` or `pnpm`

### Setup

```bash
# 1. Clone or navigate to the project directory
cd cyrano

# 2. Install dependencies
npm install

# 3. Start development mode
npm run dev
```

### Production Build & Packaging

```bash
# Compile renderer (Vite), main process (esbuild), and preload script
npm run build

# Launch compiled application locally
npm start

# Package standalone macOS .app bundle
npm run package

# Build distributable macOS .dmg installer (in release/ folder)
npm run build:dmg
# or: npm run dist:mac
```

The resulting disk image is generated at `release/Cyrano-1.0.0-arm64.dmg` ready for drag-and-drop installation to `/Applications`.

---

## 🛠️ Tech Stack

- **Runtime:** [Electron 33](https://www.electronjs.org/)
- **UI Framework:** [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Bundler:** [Vite 5](https://vitejs.dev/) (Renderer) + [esbuild](https://esbuild.github.io/) (Main / Preload)
- **Icons:** [lucide-react](https://lucide.dev/)
- **Architecture:** Multi-window hash routing (`/#/settings` for Settings, `/#/overlay` for Prompter)

---

## 📄 License

MIT License. Built for seamless, confident speaking and presentations.
