# Reliable AI Copilot Implementation Plan

Design: `docs/superpowers/specs/2026-11-06-reliable-ai-copilot-design.md`

## 1. Contracts and session state

Files:
- `src/common/types.ts`
- `src/common/electronApi.ts`
- `src/preload/index.ts`
- `src/main/index.ts`

Add readiness, session snapshot, question candidate, citation, model-operation and project-index contracts. Make main process own active session/request IDs and reject stale actions/events. Preserve existing teleprompter IPC.

Verify: `pnpm typecheck`.

## 2. Deterministic Whisper models and Windows packaging

Files:
- `src/main/whisperModelManager.ts` (new)
- `src/main/whisperService.ts`
- `scripts/download-whisper-model.js`
- `scripts/verify-package.js` (new)
- `package.json`
- `pnpm-workspace.yaml`

Separate manifest/download/cache validation from inference. Repair partial caches, expose progress/error/cancel, load verified local paths, include Windows Sharp packages in packaging and add artifact verification.

Verify: model manifest unit checks, offline local load smoke where resources exist, `pnpm build`.

## 3. Ordered audio and STT pipeline

Files:
- `src/renderer/src/audio/capture.worklet.ts` (new)
- `src/renderer/src/hooks/useAudioCapture.ts`
- `src/main/transcriptionQueue.ts` (new)
- `src/main/index.ts`

Use an AudioWorklet, explicit source policy, adaptive endpointing and ordered queue. Remove ambient mic fallback and surface every capture/transcription failure. Auto-trigger only from system entries.

Verify: synthetic PCM/VAD tests and source-policy integration tests.

## 4. Project chunks, retrieval and citations

Files:
- `src/main/contextIndexer.ts`
- `src/main/llmService.ts`
- `src/common/types.ts`

Index line-aware chunks, respect ignored/secrets, retain project fingerprint, rank generic code constructs and expose only opaque source IDs to the LLM. Resolve model markers to validated citations and clear project-scoped history on folder changes.

Verify: multi-language fixtures for concepts and invalid citation tests.

## 5. LLM transports and answer lifecycle

Files:
- `src/main/llmService.ts`
- `src/main/index.ts`

Remove fictional examples and empty-question fallback. Add request scoping, timeout, final-buffer handling, JSON/SSE/NDJSON support and explicit empty-response errors.

Verify: mocked provider streams and cancellation tests.

## 6. Copilot-first settings and readiness

Files:
- `src/renderer/src/components/settings/SettingsView.tsx`
- `src/renderer/src/index.css`
- `src/common/i18n.ts`
- `src/common/constants.ts`

Make Copilot primary for new installs, add the approved readiness screen and keep advanced settings in dedicated sections. Keep Teleprompter complete and second in navigation.

Verify: typecheck, responsive manual check and localization audit.

## 7. Approved live HUD

Files:
- `src/renderer/src/components/overlay/OverlayView.tsx`
- `src/renderer/src/index.css`

Render truthful source/STT/project status, pending question countdown, answer-now/cancel/edit controls and structured citation labels. Filter stale session/request events. Preserve teleprompter renderer path.

Verify: renderer state tests and manual overlay smoke.

## 8. End-to-end verification

Add the smallest test runner compatible with Vite/TypeScript, run all tests, typecheck and production build. Audit the Windows unpacked artifact; document that a real WASAPI test still requires Windows hardware/runner.

Commands:
- `pnpm test`
- `pnpm typecheck`
- `pnpm build`
- `pnpm verify:package -- release/win-unpacked`
