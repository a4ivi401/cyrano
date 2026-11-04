# Cyrano Runbook & Operational Procedures

## Local Development
```bash
# Install dependencies
pnpm install

# Start development mode (Vite renderer HMR + Electron main process)
npm run dev
```

## Quality Assurance & Verification
```bash
# Typecheck TypeScript codebase
npm run typecheck

# Build application bundles
npm run build
```

## Packaging for macOS (.dmg)
```bash
# Build standalone universal macOS application & DMG installer
npm run package:mac
```
Output files will be generated under `dist/` or `release/`.

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
