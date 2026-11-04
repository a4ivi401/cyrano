# Cyrano AI Documentation

Invisible desktop teleprompter for macOS with ScreenCaptureKit bypass, true AppKit transparency, and unobtrusive floating overlay.

## Tech Stack
- **Framework**: Electron 33.2.1 + Node.js 20
- **UI & View**: React 18.3.1, TypeScript 5.7.2, Lucide React
- **Build Pipeline**: Vite 5.4.11, esbuild, electron-builder 25.1.8
- **Platform APIs**: macOS AppKit (`NSWindowSharingNone`, `setIgnoreMouseEvents`, `dock.hide`)

## Development & Build Commands
- `npm run dev`: Launch development environment (renderer Vite HMR + main process)
- `npm run build`: Compile renderer, main, and preload bundles
- `npm run typecheck`: Strict TypeScript check (`tsc --noEmit`)
- `npm run package:mac`: Package macOS universal DMG installer
- `npm run lint`: ESLint check

## Documentation Map
- [STATE.md](STATE.md) — Current sprint status, active tasks, next steps, handoff context.
- [ARCHITECTURE.md](ARCHITECTURE.md) — Multi-process architecture, window management, stealth mechanics.
- [CONVENTIONS.md](CONVENTIONS.md) — Code formatting, design system tokens, TypeScript & React idioms.
- [GOTCHAS.md](GOTCHAS.md) — macOS AppKit window sharing, transparency pitfalls, CoreGraphics icon generation.
- [RUNBOOK.md](RUNBOOK.md) — Local execution, DMG building, troubleshooting, distribution.
