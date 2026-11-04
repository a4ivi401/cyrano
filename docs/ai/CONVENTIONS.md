# Cyrano Engineering & Design Conventions

## Visual & Design System
- **No AI-Slop**:
  - Never use rainbow gradients (`from-blue-600 via-indigo-500 to-purple-600`).
  - Never use blurry glowing neon shadows (`box-shadow: 0 0 10px #3b82f6`).
  - Never use generic decorative sparkle emojis/icons (`Sparkles`).
- **macOS Native Aesthetic**:
  - Base background: Deep charcoal/slate (`#0c0f15`, `#0f131a`, `#141822`, `#1a202d`).
  - Subtle crisp borders: 1px solid (`#1e2433`, `#252d3d`).
  - Keycaps (`kbd`): Authentic physical bevels with top highlight and dark bottom shelf.
  - Action buttons: Clean solid fills with high contrast and subtle border (`#2563eb`).
  - Titlebars: Always leave `padding-left: 84px` for native macOS traffic lights.

## Code Style & TypeScript
- Strict type definitions in `src/common/types.ts`.
- No `any` types; all IPC payloads must match typed contracts.
- React components must be functional with explicit hooks.
- Immutable state updates using spread operators.

## Internationalization (i18n)
- All user-facing strings must be localized in `src/common/i18n.ts`.
- Supported locales: `en` (English), `ru` (Russian), `uk` (Ukrainian).
- Never hardcode user-facing copy in JSX components without corresponding keys in `TRANSLATIONS`.
