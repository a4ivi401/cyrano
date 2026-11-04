# Cyrano Gotchas & Verified Facts

## 1. macOS Window Sharing Protection (`setContentProtection`)
- In Electron on macOS, `win.setContentProtection(true)` maps directly to AppKit `-[NSWindow setSharingType:NSWindowSharingNone]`.
- This prevents the window from appearing in Zoom, Microsoft Teams, Google Meet, OBS Studio, and Apple ScreenCaptureKit recording frames.
- **Gotcha**: If `setContentProtection` is toggled off, frames may briefly leak to capture buffers before the window is hidden. Always keep protection set during overlay initialization.

## 2. Click-Through Behavior on macOS
- `win.setIgnoreMouseEvents(true, { forward: true })` passes click and scroll events through to the window below.
- **Gotcha**: `{ forward: true }` is critical on macOS. Calling `win.setIgnoreMouseEvents(true)` without `{ forward: true }` can swallow hover and drag events in some AppKit window configurations.

## 3. True Window Transparency
- In Electron, achieving 100% true glass transparency requires all three layers to be transparent:
  1. `BrowserWindow` creation option: `transparent: true`, `backgroundColor: '#00000000'`.
  2. HTML root: `html, body, #root { background: transparent !important; }`.
  3. Overlay container: convert user hex color + opacity to `rgba(r, g, b, alpha)`.

## 4. macOS App Icon Generation (`iconutil`)
- macOS requires `.icns` files containing standard Apple resolutions:
  - `icon_16x16.png`, `icon_16x16@2x.png` (32x32)
  - `icon_32x32.png`, `icon_32x32@2x.png` (64x64)
  - `icon_128x128.png`, `icon_128x128@2x.png` (256x256)
  - `icon_256x256.png`, `icon_256x256@2x.png` (512x512)
  - `icon_512x512.png`, `icon_512x512@2x.png` (1024x1024)
- Generating these without third-party tools (like ImageMagick or librsvg) can be done cleanly using macOS native Swift 6.4 + Apple CoreGraphics script combined with `sips` and `/usr/bin/iconutil -c icns Cyrano.iconset`.
