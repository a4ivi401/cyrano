# Cyrano Project State & Handoff

**Last Updated**: 2026-11-11
**Current Focus**: Reliable Copilot pipeline and cross-platform release verification

## Completed Tasks
- [x] Added **AI Meeting Copilot** mode (`appMode: 'copilot'`) alongside classic Teleprompter mode (`'prompter'`).
- [x] Implemented LLM integration (`src/main/llmService.ts`) supporting:
  - Official `@anthropic-ai/sdk` (`claude-opus-5` default) with streaming (`client.messages.stream`) and ephemeral Prompt Caching (`cache_control: { type: 'ephemeral' }`) for project context.
  - Universal OpenAI-compatible SSE client (`fetch` to `/chat/completions`) supporting Omnirouter, OpenRouter, OpenAI, Groq, Ollama, and custom proxy URLs.
  - Live question detector (`isLikelyQuestion`) in Russian, English, and Ukrainian for automatic answer generation on interlocutor pauses, plus manual global shortcut (`⌃⌥⌘A`).
- [x] Implemented on-device **Local Whisper STT** (`src/main/whisperService.ts`) via `@huggingface/transformers` + `onnxruntime-node` (`q8` quantized ONNX models: `whisper-tiny`, `whisper-base`, `whisper-small`, `whisper-large-v3-turbo`) with in-app model downloader and progress bar, plus optional Cloud Whisper API mode.
- [x] Implemented **Project Folder Context Indexer** (`src/main/contextIndexer.ts`) to scan a selected project directory, build a deterministic file tree + key documentation summary, and dynamically match top relevant source code files per meeting question.
- [x] Implemented **System Audio + Microphone Capture & VAD** (`src/main/systemAudioCapture.ts` + `src/renderer/src/hooks/useAudioCapture.ts`) with direct macOS CoreAudio Tap PCM, Windows display-media loopback, 16kHz resampling, and RMS Voice Activity Detection.
- [x] Updated `SettingsView.tsx`, `OverlayView.tsx`, and `i18n.ts` (`en`, `ru`, `uk`) adhering to `docs/ai/CONVENTIONS.md`.
- [x] Added full **Windows (`win32-x64`)** support and packaging:
  - Generated multi-resolution `build/icon.ico` (16–256px) from `Cyrano.iconset`.
  - Adapted `WindowManager` (`WDA_EXCLUDEFROMCAPTURE` via `setContentProtection(true)`, `type: 'toolbar'`, `skipTaskbar: true`), `ShortcutManager` (`Ctrl+Alt+Shift+*` mapping on Windows to avoid Xbox Game Bar conflicts), and `fonts.ts` (`C:\Windows\Fonts`).
  - Configured `asarUnpack` for `onnxruntime-node` (`DirectML.dll`, `onnxruntime.dll`, `onnxruntime_binding.node`) and built both `release/Cyrano Setup 1.0.0.exe` (NSIS installer) and `release/Cyrano-1.0.0-Portable.exe` via `npm run build:win`.
- [x] Added full **Linux (`linux-x64`)** support and packaging:
  - Adapted `WindowManager` (`build/icon.png`, `type: 'toolbar'`, `skipTaskbar: true`, `setAlwaysOnTop(true, 'screen-saver', 1)`, `setVisibleOnAllWorkspaces`), `ShortcutManager` (`Ctrl+Alt+Shift+*` mapping on Linux to avoid Super/WM conflicts), and `fonts.ts` (`/usr/share/fonts`, `/usr/local/share/fonts`, `~/.local/share/fonts`).
  - Bundled native Linux ONNX runtime (`libonnxruntime.so.1`, `onnxruntime_binding.node`) via `asarUnpack` and built `release/Cyrano-1.0.0.AppImage`, `release/cyrano_1.0.0_amd64.deb`, and `release/cyrano-1.0.0.tar.gz` via `npm run build:linux`.
- [x] Verified full TypeScript compilation (`npm run typecheck`) and production bundle (`npm run build`).

## Reliable Copilot Update
- [x] Copilot-first readiness screen and click-gated live HUD.
- [x] Ordered native PCM/AudioWorklet capture with truthful system/microphone identities.
- [x] Hybrid pending-question review, cancellation, editing, and manual confirmation.
- [x] Atomic Whisper model manager with complete manifests and cancellation.
- [x] Universal line-aware project chunks, concept retrieval, and validated citations.
- [x] Empty-question and fictional-reference fallbacks removed.
- [x] Session/request IDs prevent stale streamed answers from replacing current state.
- [x] Local Tailwind production build replaces the runtime CDN dependency.
- [x] Unit tests, typecheck, production build, and Windows unpacked artifact audit.
- [x] Classic Teleprompter preserved and visually smoke-tested.

## Remaining Platform Validation
- [ ] Run a real WASAPI loopback call on Windows hardware or a suitable Windows runner.
- [x] Verified packaged macOS System Audio Recording permission, live signal, VAD, and system-source transcription.
- [ ] Verify macOS screen-share exclusion manually after the CoreAudio migration.

## Known Constraint
Cross-building can verify package contents but cannot prove live WASAPI behavior. That check remains a Windows platform smoke test.
Windows uses Electron loopback. macOS 14.2+ uses the bundled, signed AudioTee CoreAudio helper and asks only for System Audio Recording; it does not record the screen. Linux users must explicitly enable a supported microphone source, and no hidden fallback is used. Linux Copilot keeps the HUD interactive across its bounds because Electron does not forward hover events through a click-through window there.
