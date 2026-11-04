import * as fs from 'fs';
import * as path from 'path';
import { ContextFolderStats } from '../common/types';

interface IndexedFile {
  relativePath: string;
  content: string;
  size: number;
  isKeyFile: boolean;
}

const IGNORED_DIRS = new Set([
  'node_modules',
  '.git',
  'dist',
  'build',
  'release',
  '.next',
  '.nuxt',
  '.venv',
  'venv',
  '__pycache__',
  'target',
  'vendor',
  '.idea',
  '.vscode',
  '.claude',
  'coverage',
  '.cache',
  'out',
  'Cyrano.iconset'
]);

const IGNORED_FILES = new Set([
  'package-lock.json',
  'pnpm-lock.yaml',
  'yarn.lock',
  'bun.lockb',
  'Cargo.lock',
  'poetry.lock',
  '.DS_Store'
]);

const IGNORED_EXTENSIONS = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.icns', '.ico',
  '.pdf', '.zip', '.tar', '.gz', '.dmg', '.pkg', '.app',
  '.mp3', '.wav', '.ogg', '.mp4', '.mov', '.webm',
  '.woff', '.woff2', '.ttf', '.otf', '.eot',
  '.onnx', '.bin', '.safetensors', '.pt', '.pth',
  '.pyc', '.so', '.dylib', '.dll', '.exe', '.node', '.map'
]);

const KEY_FILE_NAMES = new Set([
  'readme.md',
  'package.json',
  'pyproject.toml',
  'cargo.toml',
  'go.mod',
  'architecture.md',
  'index.md',
  'conventions.md',
  'state.md',
  'gotchas.md',
  'runbook.md',
  'claude.md',
  'tsconfig.json'
]);

const MAX_FILES = 250;
const MAX_FILE_BYTES = 48 * 1024; // 48 KB per file
const MAX_DEPTH = 6;

export class ContextIndexer {
  private currentFolderPath: string = '';
  private files: IndexedFile[] = [];
  private indexedAt: number = 0;

  public indexFolder(folderPath: string): ContextFolderStats | null {
    if (!folderPath || !fs.existsSync(folderPath)) {
      this.currentFolderPath = '';
      this.files = [];
      return null;
    }

    try {
      const stat = fs.statSync(folderPath);
      if (!stat.isDirectory()) return null;
    } catch {
      return null;
    }

    this.currentFolderPath = folderPath;
    const collected: IndexedFile[] = [];

    const walk = (currentDir: string, depth: number) => {
      if (depth > MAX_DEPTH || collected.length >= MAX_FILES) return;

      let entries: fs.Dirent[];
      try {
        entries = fs.readdirSync(currentDir, { withFileTypes: true });
      } catch {
        return;
      }

      // Deterministic alphabetical order for prompt caching stability
      entries.sort((a, b) => a.name.localeCompare(b.name));

      for (const entry of entries) {
        if (collected.length >= MAX_FILES) break;

        if (entry.name.startsWith('.') && entry.name !== '.env.example') {
          continue;
        }

        const fullPath = path.join(currentDir, entry.name);
        const relPath = path.relative(folderPath, fullPath);

        if (entry.isDirectory()) {
          if (!IGNORED_DIRS.has(entry.name)) {
            walk(fullPath, depth + 1);
          }
        } else if (entry.isFile()) {
          if (IGNORED_FILES.has(entry.name)) continue;
          const ext = path.extname(entry.name).toLowerCase();
          if (IGNORED_EXTENSIONS.has(ext)) continue;

          try {
            const fileStat = fs.statSync(fullPath);
            if (fileStat.size === 0 || fileStat.size > 512 * 1024) continue;

            const buf = fs.readFileSync(fullPath);
            // Skip binary files containing null bytes in the first 1024 bytes
            const checkLen = Math.min(buf.length, 1024);
            let isBinary = false;
            for (let i = 0; i < checkLen; i++) {
              if (buf[i] === 0) {
                isBinary = true;
                break;
              }
            }
            if (isBinary) continue;

            const rawText = buf.slice(0, MAX_FILE_BYTES).toString('utf-8');
            const lowerName = entry.name.toLowerCase();
            const isKeyFile =
              KEY_FILE_NAMES.has(lowerName) ||
              relPath.toLowerCase().startsWith('docs/') ||
              relPath.toLowerCase().includes('types.ts') ||
              relPath.toLowerCase().includes('schema');

            collected.push({
              relativePath: relPath,
              content: rawText,
              size: rawText.length,
              isKeyFile
            });
          } catch {
            // Skip unreadable file
          }
        }
      }
    };

    walk(folderPath, 0);
    this.files = collected;
    this.indexedAt = Date.now();

    return this.getStats();
  }

  public getStats(): ContextFolderStats | null {
    if (!this.currentFolderPath || this.files.length === 0) {
      if (this.currentFolderPath) {
        return {
          folderPath: this.currentFolderPath,
          fileCount: 0,
          totalChars: 0,
          topFiles: [],
          indexedAt: this.indexedAt || Date.now()
        };
      }
      return null;
    }

    const totalChars = this.files.reduce((sum, f) => sum + f.size, 0);
    const topFiles = this.files.slice(0, 12).map((f) => f.relativePath);

    return {
      folderPath: this.currentFolderPath,
      fileCount: this.files.length,
      totalChars,
      topFiles,
      indexedAt: this.indexedAt
    };
  }

  private formatWithLineNumbers(content: string, maxChars = 8000): string {
    const lines = content.split('\n');
    let output = '';
    for (let i = 0; i < lines.length; i++) {
      const lineNum = i + 1;
      const formattedLine = `${lineNum}: ${lines[i]}\n`;
      if (output.length + formattedLine.length > maxChars) {
        output += `... [truncated at line ${lineNum}]\n`;
        break;
      }
      output += formattedLine;
    }
    return output;
  }

  /**
   * Builds a deterministic, cache-friendly project context block.
   * Contains no timestamps or volatile values so Anthropic Prompt Caching hits 100%.
   */
  public getStaticProjectSummary(customNotes?: string): string {
    const parts: string[] = [];

    if (customNotes && customNotes.trim()) {
      parts.push(`=== USER BACKGROUND / NOTES ===\n${customNotes.trim()}`);
    }

    if (this.currentFolderPath && this.files.length > 0) {
      const folderName = path.basename(this.currentFolderPath);
      const treeLines = this.files.map((f) => `  - ${f.relativePath}`).join('\n');
      parts.push(`=== PROJECT WORKSPACE: ${folderName} ===\nFile Tree (${this.files.length} files):\n${treeLines}`);

      // Add key documentation & config files up to 36,000 chars
      let charBudget = 36000;
      const keyFiles = this.files.filter((f) => f.isKeyFile);
      const keyBlocks: string[] = [];

      for (const kf of keyFiles) {
        if (charBudget <= 0) break;
        const isCode = !kf.relativePath.endsWith('.md') && !kf.relativePath.endsWith('.txt');
        const snippet = isCode
          ? this.formatWithLineNumbers(kf.content, Math.min(charBudget, 8000))
          : kf.content.slice(0, Math.min(kf.content.length, 8000));
        keyBlocks.push(`--- FILE: ${kf.relativePath}${isCode ? ' (with line numbers)' : ''} ---\n${snippet}`);
        charBudget -= snippet.length;
      }

      if (keyBlocks.length > 0) {
        parts.push(`=== KEY PROJECT FILES ===\n${keyBlocks.join('\n\n')}`);
      }
    }

    return parts.join('\n\n');
  }

  /**
   * Finds the most relevant source code files matching keywords in the recent conversation transcript.
   */
  public getRelevantFilesForQuery(queryText: string, maxFiles = 5, maxChars = 24000): string {
    if (!this.files.length || !queryText.trim()) return '';

    const tokens = queryText
      .toLowerCase()
      .replace(/[^\p{L}\p{N}_.-]+/gu, ' ')
      .split(/\s+/)
      .filter((w) => w.length >= 3);

    if (tokens.length === 0) return '';

    const uniqueTokens = Array.from(new Set(tokens));

    const scored = this.files
      .filter((f) => !f.isKeyFile) // Key files are already in the static summary
      .map((file) => {
        let score = 0;
        const lowerPath = file.relativePath.toLowerCase();
        const lowerContent = file.content.toLowerCase();

        for (const token of uniqueTokens) {
          if (lowerPath.includes(token)) {
            score += 10;
          }
          if (lowerContent.includes(token)) {
            score += 2;
          }
        }
        return { file, score };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, maxFiles);

    // If no non-key files matched specific tokens, include up to 3 main source files
    const selectedFiles =
      scored.length > 0
        ? scored.map((s) => s.file)
        : this.files.filter((f) => !f.isKeyFile).slice(0, 3);

    if (selectedFiles.length === 0) return '';

    let charBudget = maxChars;
    const blocks: string[] = [];

    for (const f of selectedFiles) {
      if (charBudget <= 0) break;
      const snippet = this.formatWithLineNumbers(f.content, Math.min(charBudget, 8000));
      blocks.push(`--- RELEVANT SOURCE FILE: ${f.relativePath} (with line numbers) ---\n${snippet}`);
      charBudget -= snippet.length;
    }

    return blocks.join('\n\n');
  }

  /**
   * Builds a rich code & architecture snapshot specifically for one-shot AI Project Analysis
   * (generating teacher/defense notes, key modules, algorithms, and Q&A cheat-sheet).
   */
  public getDeepProjectSnapshotForAnalysis(maxChars = 56000): string {
    if (!this.currentFolderPath || this.files.length === 0) {
      return '';
    }

    const folderName = path.basename(this.currentFolderPath);
    const treeLines = this.files.map((f) => `  - ${f.relativePath} (${f.size} chars)`).join('\n');
    const sections: string[] = [
      `=== PROJECT NAME: ${folderName} ===`,
      `=== COMPLETE FILE TREE (${this.files.length} files) ===\n${treeLines}`
    ];

    let budget = maxChars - sections.join('\n\n').length;

    // 1. Include key config & documentation files first
    const keyFiles = this.files.filter((f) => f.isKeyFile);
    for (const kf of keyFiles) {
      if (budget <= 1000) break;
      const snippet = kf.content.slice(0, Math.min(kf.content.length, 6000));
      sections.push(`--- CONFIG / DOC FILE: ${kf.relativePath} ---\n${snippet}`);
      budget -= snippet.length;
    }

    // 2. Include core source code files (prioritize main/index/app/service/controller/model/components)
    const sourceFiles = this.files
      .filter((f) => !f.isKeyFile)
      .sort((a, b) => {
        const priorityScore = (rel: string) => {
          const lower = rel.toLowerCase();
          let s = 0;
          if (/(main|index|app|server|core|engine|service|store|controller|model|router|api|hook)/i.test(lower)) {
            s += 10;
          }
          if (/\.(ts|tsx|py|js|jsx|java|cs|go|rs|cpp|c|php|rb)$/i.test(lower)) {
            s += 5;
          }
          return s;
        };
        return priorityScore(b.relativePath) - priorityScore(a.relativePath);
      });

    for (const sf of sourceFiles) {
      if (budget <= 1000) break;
      const snippet = sf.content.slice(0, Math.min(sf.content.length, 5000));
      sections.push(`--- SOURCE FILE: ${sf.relativePath} ---\n${snippet}`);
      budget -= snippet.length;
    }

    return sections.join('\n\n');
  }
}
