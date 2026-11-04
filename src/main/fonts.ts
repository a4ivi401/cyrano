import * as fs from 'fs';
import * as path from 'path';
import { COMMON_SYSTEM_FONTS } from '../common/constants';

export function getAvailableFonts(): { label: string; value: string }[] {
  const fonts = [...COMMON_SYSTEM_FONTS];
  const detected = new Set<string>();

  // Check common macOS, Windows & Linux font directories for additional typography
  const fontDirs =
    process.platform === 'win32'
      ? [process.env.WINDIR ? path.join(process.env.WINDIR, 'Fonts') : 'C:\\Windows\\Fonts']
      : process.platform === 'linux'
        ? [
            '/usr/share/fonts',
            '/usr/local/share/fonts',
            path.join(process.env.HOME || '', '.local/share/fonts')
          ]
        : ['/System/Library/Fonts', '/Library/Fonts'];

  const scanDir = (dir: string, depth = 0) => {
    if (depth > 2) return;
    try {
      if (!fs.existsSync(dir)) return;
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory()) {
          scanDir(path.join(dir, entry.name), depth + 1);
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name).toLowerCase();
          if (['.ttf', '.otf', '.ttc'].includes(ext)) {
            const name = path.basename(entry.name, ext);
            const cleanName = name
              .replace(/[-_]/g, ' ')
              .replace(/\b(Regular|Bold|Italic|Medium|Light|Thin|Black|Heavy)\b/gi, '')
              .trim();
            if (cleanName && cleanName.length > 2 && !detected.has(cleanName)) {
              detected.add(cleanName);
            }
          }
        }
      }
    } catch {
      // Ignore directory access errors
    }
  };

  for (const dir of fontDirs) {
    scanDir(dir, 0);
  }

  // Add detected unique fonts
  for (const fontName of Array.from(detected).sort()) {
    if (!fonts.some((f) => f.label.toLowerCase().includes(fontName.toLowerCase()))) {
      fonts.push({
        label: fontName,
        value: `"${fontName}", sans-serif`
      });
    }
  }

  return fonts;
}
