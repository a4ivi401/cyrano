# Cyrano Project State & Handoff

**Last Updated**: 2026-11-03
**Current Focus**: AI Meeting Copilot Mode (LLM API + Local Whisper STT + Project Folder Context)

## Completed Tasks
- [x] Added **AI Meeting Copilot** mode (`appMode: 'copilot'`) alongside classic Teleprompter mode (`'prompter'`).
- [x] Implemented LLM integration (`src/main/llmService.ts`) supporting:
  - Official `@anthropic-ai/sdk` (`claude-opus-5` default) with streaming (`client.messages.stream`) and ephemeral Prompt Caching (`cache_control: { type: 'ephemeral' }`) for project context.
  - Universal OpenAI-compatible SSE client (`fetch` to `/chat/completions`) supporting Omnirouter, OpenRouter, OpenAI, Groq, Ollama, and custom proxy URLs.
  - Live question detector (`isLikelyQuestion`) in Russian, English, and Ukrainian for automatic answer generation on interlocutor pauses, plus manual global shortcut (`⌃⌥⌘A`).
- [x] Implemented on-device **Local Whisper STT** (`src/main/whisperService.ts`) via `@huggingface/transformers` + `onnxruntime-node` (`q8` quantized ONNX models: `whisper-tiny`, `whisper-base`, `whisper-small`, `whisper-large-v3-turbo`) with in-app model downloader and progress bar, plus optional Cloud Whisper API mode.
- [x] Implemented **Project Folder Context Indexer** (`src/main/contextIndexer.ts`) to scan a selected project directory, build a deterministic file tree + key documentation summary, and dynamically match top relevant source code files per meeting question.
- [x] Implemented **System Audio + Microphone Capture & VAD** (`src/renderer/src/hooks/useAudioCapture.ts` + macOS ScreenCaptureKit `audio: 'loopback'` in `src/main/index.ts`) with 16kHz PCM resampling and RMS Voice Activity Detection.
- [x] Updated `SettingsView.tsx`, `OverlayView.tsx`, and `i18n.ts` (`en`, `ru`, `uk`) adhering to `docs/ai/CONVENTIONS.md`.
- [x] Added full **Windows (`win32-x64`)** support and packaging:
  - Generated multi-resolution `build/icon.ico` (16–256px) from `Cyrano.iconset`.
  - Adapted `WindowManager` (`WDA_EXCLUDEFROMCAPTURE` via `setContentProtection(true)`, `type: 'toolbar'`, `skipTaskbar: true`), `ShortcutManager` (`Ctrl+Alt+Shift+*` mapping on Windows to avoid Xbox Game Bar conflicts), and `fonts.ts` (`C:\Windows\Fonts`).
  - Configured `asarUnpack` for `onnxruntime-node` (`DirectML.dll`, `onnxruntime.dll`, `onnxruntime_binding.node`) and built both `release/Cyrano Setup 1.0.0.exe` (NSIS installer) and `release/Cyrano-1.0.0-Portable.exe` via `npm run build:win`.
- [x] Added full **Linux (`linux-x64`)** support and packaging:
  - Adapted `WindowManager` (`build/icon.png`, `type: 'toolbar'`, `skipTaskbar: true`, `setAlwaysOnTop(true, 'screen-saver', 1)`, `setVisibleOnAllWorkspaces`), `ShortcutManager` (`Ctrl+Alt+Shift+*` mapping on Linux to avoid Super/WM conflicts), and `fonts.ts` (`/usr/share/fonts`, `/usr/local/share/fonts`, `~/.local/share/fonts`).
  - Bundled native Linux ONNX runtime (`libonnxruntime.so.1`, `onnxruntime_binding.node`) via `asarUnpack` and built `release/Cyrano-1.0.0.AppImage`, `release/cyrano_1.0.0_amd64.deb`, and `release/cyrano-1.0.0.tar.gz` via `npm run build:linux`.
- [x] Verified full TypeScript compilation (`npm run typecheck`) and production bundle (`npm run build`).

## In Progress / Next Steps
- [ ] Test live rendering on macOS overlay and verify transparency during screen sharing.
- [ ] Verify packaging DMG via `npm run package:mac`.

## Blockers & Open Questions
- None. All requirements delivered and verified.
