# Cyrano Runbook & Operational Procedures

## Local Development
```bash
# Install dependencies
pnpm install

# Start development mode (Vite renderer HMR + Electron main process)
pnpm dev
```

## Quality Assurance & Verification
```bash
# Unit tests
pnpm test

# Typecheck TypeScript codebase
pnpm typecheck

# Build application bundles
pnpm build

# Audit an unpacked package (example: Windows)
pnpm verify:package -- release/win-unpacked
```

## Whisper Model Resources
```bash
# Download pinned Tiny and Base model resources atomically
pnpm download:model

# Download every catalog model
pnpm download:model -- --all
```

## Packaging
```bash
pnpm dist:mac
pnpm dist:win
pnpm dist:linux
```
Output files are generated under `release/`. Windows releases should be built on a Windows x64 runner for final native runtime validation.

## macOS System Audio
Test system-audio permissions from the packaged app, not `pnpm dev`: macOS can attribute a development capture to Terminal or the IDE instead of Cyrano.

1. Install `release/Cyrano-1.0.0-arm64.dmg` into `/Applications` and open Cyrano.
2. Run the laptop-audio test. No screen selection is required on macOS 14.2+.
3. Allow Cyrano under **System Audio Recording Only** when macOS asks, then run the test again while meeting audio is playing.

If Cyrano has a stale denied permission, quit it before resetting only this app's entries:

```bash
tccutil reset AudioCapture com.cyrano.teleprompter
```

## Regenerating macOS App Icon
If the logo geometry is modified:
1. Render master 1024x1024 PNG into `build/icon.png`.
2. Create `build/Cyrano.iconset` directory.
3. Downsample using `sips`:
   ```bash
   sips -z 16 16 build/icon.png --out build/Cyrano.iconset/icon_16x16.png
   sips -z 32 32 build/icon.png --out build/Cyrano.iconset/icon_16x16@2x.png
   sips -z 32 32 build/icon.png --out build/Cyrano.iconset/icon_32x32.png
   sips -z 64 64 build/icon.png --out build/Cyrano.iconset/icon_32x32@2x.png
   sips -z 128 128 build/icon.png --out build/Cyrano.iconset/icon_128x128.png
   sips -z 256 256 build/icon.png --out build/Cyrano.iconset/icon_128x128@2x.png
   sips -z 256 256 build/icon.png --out build/Cyrano.iconset/icon_256x256.png
   sips -z 512 512 build/icon.png --out build/Cyrano.iconset/icon_256x256@2x.png
   sips -z 512 512 build/icon.png --out build/Cyrano.iconset/icon_512x512.png
   sips -z 1024 1024 build/icon.png --out build/Cyrano.iconset/icon_512x512@2x.png
   ```
4. Compile binary icns:
   ```bash
   iconutil -c icns build/Cyrano.iconset -o build/icon.icns
   ```
