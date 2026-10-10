import * as fs from 'fs';
import * as path from 'path';
import { COMMON_SYSTEM_FONTS } from '../common/constants';

export function getAvailableFonts(): { label: string; value: string }[] {
  const fonts = [...COMMON_SYSTEM_FONTS];
  const detected = new Set<string>();

  // Check common macOS font directories for additional typography
  const fontDirs = ['/System/Library/Fonts', '/Library/Fonts'];

  for (const dir of fontDirs) {
    try {
      if (fs.existsSync(dir)) {
        const files = fs.readdirSync(dir);
        for (const file of files) {
          const ext = path.extname(file).toLowerCase();
          if (['.ttf', '.otf', '.ttc'].includes(ext)) {
            const name = path.basename(file, ext);
            // Clean up font names (e.g. SFCompactText-Regular -> SF Compact Text)
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
