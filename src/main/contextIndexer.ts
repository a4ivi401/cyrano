import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { ContextFolderStats } from '../common/types';

export type SourceConstructSignal =
  | 'declaration-like'
  | 'block-like'
  | 'access-modifier'
  | 'inheritance'
  | 'interface'
  | 'loop'
  | 'condition'
  | 'import'
  | 'comment'
  | 'call'
  | 'validation'
  | 'storage'
  | 'api'
  | 'data-flow';

export type SourceConcept =
  | 'architecture'
  | 'encapsulation'
  | 'inheritance'
  | 'interfaces'
  | 'loops'
  | 'conditions'
  | 'validation'
  | 'storage'
  | 'api'
  | 'data-flow';

export interface SourceChunk {
  sourceId: string;
  relativePath: string;
  startLine: number;
  endLine: number;
  content: string;
  fileHash: string;
  fileFingerprint: string;
  extension: string;
  tokens: string[];
  symbols: string[];
  constructSignals: SourceConstructSignal[];
  previousSourceId?: string;
  nextSourceId?: string;
}

export interface SourceRetrievalOptions {
  maxCandidates?: number;
  maxTotalChars?: number;
  maxPerFile?: number;
  includeKeyFiles?: boolean;
}

export interface SourceRetrievalCandidate extends SourceChunk {
  score: number;
  label: string;
  matchedTokens: string[];
  matchedConcepts: SourceConcept[];
}

export interface SourceRetrievalResult {
  query: string;
  projectFingerprint: string | null;
  expandedTokens: string[];
  detectedConcepts: SourceConcept[];
  candidates: SourceRetrievalCandidate[];
}

export interface ResolvedSource extends SourceChunk {
  projectFingerprint: string;
  label: string;
}

export interface ContextIndexMetadata {
  folderPath: string;
  projectFingerprint: string;
  indexedAt: number;
  fileCount: number;
  chunkCount: number;
  totalChars: number;
  reusedFileCount: number;
  reindexedFileCount: number;
}

interface IndexedChunk extends SourceChunk {
  tokenCounts: Map<string, number>;
  tokenCount: number;
  symbolSet: Set<string>;
  constructSet: Set<SourceConstructSignal>;
}

interface IndexedFile {
  relativePath: string;
  realPath: string;
  content: string;
  size: number;
  byteSize: number;
  mtimeMs: number;
  ctimeMs: number;
  lineCount: number;
  fileHash: string;
  fileFingerprint: string;
  extension: string;
  isKeyFile: boolean;
  pathTokens: Set<string>;
  chunks: IndexedChunk[];
}

interface IgnoreRule {
  basePath: string;
  negated: boolean;
  directoryOnly: boolean;
  hasSlash: boolean;
  matcher: RegExp;
}

interface ChunkDraft {
  startLine: number;
  endLine: number;
  content: string;
}

interface ConceptDefinition {
  concept: SourceConcept;
  queryTerms: readonly string[];
  queryPrefixes: readonly string[];
  expansionTokens: readonly string[];
  constructSignals: readonly SourceConstructSignal[];
  pathHints: readonly string[];
}

const IGNORED_DIRS = new Set([
  '.git',
  '.hg',
  '.svn',
  '.idea',
  '.vscode',
  '.claude',
  '.superpowers',
  '.cache',
  '.dart_tool',
  '.gradle',
  '.next',
  '.nuxt',
  '.parcel-cache',
  '.serverless',
  '.svelte-kit',
  '.terraform',
  '.turbo',
  '.angular',
  '.venv',
  '.tox',
  '.mypy_cache',
  '.pytest_cache',
  '.ruff_cache',
  '.ssh',
  '.gnupg',
  '.aws',
  '.kube',
  '__pycache__',
  '__generated__',
  'node_modules',
  'bower_components',
  'cmakefiles',
  'deriveddata',
  'pods',
  'site-packages',
  'vendor',
  'third_party',
  'dist',
  'build',
  'release',
  'coverage',
  'target',
  'out',
  'obj',
  'tmp',
  'temp',
  'venv',
  'generated',
  'cyrano.iconset'
]);

const IGNORED_FILES = new Set([
  '.ds_store',
  '.gitignore',
  '.gitattributes',
  'package-lock.json',
  'pnpm-lock.yaml',
  'yarn.lock',
  'bun.lock',
  'bun.lockb',
  'cargo.lock',
  'poetry.lock',
  'composer.lock',
  'gemfile.lock'
]);

const IGNORED_EXTENSIONS = new Set([
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.webp',
  '.bmp',
  '.tiff',
  '.svg',
  '.icns',
  '.ico',
  '.pdf',
  '.zip',
  '.tar',
  '.gz',
  '.bz2',
  '.xz',
  '.7z',
  '.rar',
  '.dmg',
  '.pkg',
  '.app',
  '.mp3',
  '.wav',
  '.ogg',
  '.flac',
  '.mp4',
  '.mov',
  '.avi',
  '.mkv',
  '.webm',
  '.woff',
  '.woff2',
  '.ttf',
  '.otf',
  '.eot',
  '.onnx',
  '.bin',
  '.safetensors',
  '.pt',
  '.pth',
  '.pyc',
  '.so',
  '.dylib',
  '.dll',
  '.exe',
  '.node',
  '.class',
  '.o',
  '.a',
  '.map',
  '.db',
  '.sqlite',
  '.sqlite3'
]);

const PRIVATE_KEY_EXTENSIONS = new Set([
  '.key',
  '.pem',
  '.p12',
  '.pfx',
  '.ppk',
  '.jks',
  '.keystore',
  '.der'
]);

const KEY_FILE_NAMES = new Set([
  'readme',
  'readme.md',
  'package.json',
  'pyproject.toml',
  'cargo.toml',
  'go.mod',
  'pom.xml',
  'build.gradle',
  'build.gradle.kts',
  'architecture.md',
  'index.md',
  'conventions.md',
  'state.md',
  'gotchas.md',
  'runbook.md',
  'claude.md',
  'tsconfig.json'
]);

const QUERY_STOP_WORDS = new Set([
  'about',
  'are',
  'can',
  'does',
  'explain',
  'for',
  'from',
  'how',
  'is',
  'show',
  'that',
  'the',
  'this',
  'what',
  'where',
  'which',
  'with',
  'как',
  'где',
  'для',
  'зачем',
  'какая',
  'какие',
  'какой',
  'покажи',
  'почему',
  'что',
  'цей',
  'ця',
  'це',
  'як',
  'де',
  'для',
  'навіщо',
  'покажи',
  'чому',
  'що'
]);

const SIGNAL_ORDER: readonly SourceConstructSignal[] = [
  'declaration-like',
  'block-like',
  'access-modifier',
  'inheritance',
  'interface',
  'loop',
  'condition',
  'import',
  'comment',
  'call',
  'validation',
  'storage',
  'api',
  'data-flow'
];

const CONCEPT_DEFINITIONS: readonly ConceptDefinition[] = [
  {
    concept: 'architecture',
    queryTerms: ['architecture', 'entry point', 'project structure', 'архитектура', 'точка входа', 'структура проекта', 'архітектура', 'точка входу', 'структура проєкту'],
    queryPrefixes: ['architect', 'component', 'layer', 'module', 'структур', 'архитектур', 'модул', 'компонент', 'сло', 'архітектур', 'шар'],
    expansionTokens: ['app', 'application', 'bootstrap', 'component', 'config', 'controller', 'core', 'dependency', 'engine', 'index', 'main', 'module', 'router', 'server', 'service'],
    constructSignals: ['declaration-like', 'import', 'data-flow'],
    pathHints: ['app', 'architecture', 'bootstrap', 'config', 'controller', 'core', 'index', 'main', 'module', 'router', 'server', 'service']
  },
  {
    concept: 'encapsulation',
    queryTerms: ['access modifier', 'getter setter', 'модификатор доступа', 'модифікатор доступу'],
    queryPrefixes: ['encapsulat', 'private', 'protected', 'инкапсул', 'приват', 'інкапсул'],
    expansionTokens: ['access', 'field', 'getter', 'internal', 'private', 'protected', 'property', 'public', 'setter'],
    constructSignals: ['access-modifier', 'declaration-like'],
    pathHints: ['class', 'domain', 'entity', 'model']
  },
  {
    concept: 'inheritance',
    queryTerms: ['base class', 'parent class', 'super class', 'базовый класс', 'родительский класс', 'базовий клас', 'батьківський клас'],
    queryPrefixes: ['extend', 'inherit', 'subclass', 'superclass', 'наслед', 'родитель', 'успадк', 'батьків'],
    expansionTokens: ['base', 'class', 'extends', 'implements', 'inherit', 'override', 'parent', 'super'],
    constructSignals: ['inheritance', 'declaration-like'],
    pathHints: ['base', 'class', 'model']
  },
  {
    concept: 'interfaces',
    queryTerms: ['abstract class', 'абстрактный класс', 'абстрактний клас'],
    queryPrefixes: ['interface', 'protocol', 'contract', 'abstract', 'интерфейс', 'протокол', 'контракт', 'абстракц', 'інтерфейс'],
    expansionTokens: ['abstract', 'contract', 'implements', 'interface', 'protocol', 'trait'],
    constructSignals: ['interface', 'declaration-like'],
    pathHints: ['contract', 'interface', 'protocol', 'types']
  },
  {
    concept: 'loops',
    queryTerms: [],
    queryPrefixes: ['loop', 'iteration', 'iterate', 'цикл', 'итерац', 'повтор', 'ітерац'],
    expansionTokens: ['each', 'filter', 'for', 'foreach', 'iterate', 'loop', 'map', 'reduce', 'repeat', 'while'],
    constructSignals: ['loop', 'call'],
    pathHints: []
  },
  {
    concept: 'conditions',
    queryTerms: ['branching logic', 'условный оператор', 'умовний оператор'],
    queryPrefixes: ['condition', 'branch', 'услов', 'ветвлен', 'умов', 'розгалуж'],
    expansionTokens: ['case', 'else', 'guard', 'if', 'match', 'switch', 'when'],
    constructSignals: ['condition'],
    pathHints: []
  },
  {
    concept: 'validation',
    queryTerms: ['error handling', 'обработка ошибок', 'обробка помилок'],
    queryPrefixes: ['validat', 'verify', 'sanitize', 'constraint', 'валидац', 'провер', 'коррект', 'ошиб', 'валід', 'перевір', 'помил'],
    expansionTokens: ['assert', 'check', 'constraint', 'error', 'guard', 'invalid', 'parse', 'sanitize', 'schema', 'validate', 'verify'],
    constructSignals: ['validation', 'condition'],
    pathHints: ['schema', 'validator']
  },
  {
    concept: 'storage',
    queryTerms: ['data storage', 'file system', 'база данных', 'хранение данных', 'база даних', 'зберігання даних'],
    queryPrefixes: ['storage', 'database', 'persist', 'repository', 'collection', 'хран', 'сохран', 'репозитор', 'коллекц', 'сховищ', 'збері', 'репозитор', 'колекц'],
    expansionTokens: ['cache', 'collection', 'database', 'db', 'file', 'model', 'persist', 'query', 'repository', 'save', 'sql', 'store'],
    constructSignals: ['storage', 'data-flow'],
    pathHints: ['cache', 'database', 'db', 'model', 'repository', 'storage', 'store']
  },
  {
    concept: 'api',
    queryTerms: ['client server', 'http request', 'апи', 'клиент сервер', 'клієнт сервер'],
    queryPrefixes: ['api', 'endpoint', 'request', 'response', 'route', 'controller', 'эндпоинт', 'запрос', 'ответ', 'маршрут', 'контроллер', 'ендпоінт', 'запит', 'відповід', 'контролер'],
    expansionTokens: ['api', 'client', 'controller', 'endpoint', 'fetch', 'handler', 'http', 'request', 'response', 'route', 'router', 'server'],
    constructSignals: ['api', 'call', 'data-flow'],
    pathHints: ['api', 'client', 'controller', 'handler', 'route', 'router', 'server']
  },
  {
    concept: 'data-flow',
    queryTerms: ['data flow', 'control flow', 'input output', 'поток данных', 'передача данных', 'потік даних', 'передача даних'],
    queryPrefixes: ['pipeline', 'workflow', 'event', 'state', 'transform', 'обработ', 'событ', 'состояни', 'оброб', 'поді', 'стан'],
    expansionTokens: ['dispatch', 'emit', 'event', 'flow', 'handler', 'input', 'output', 'pipeline', 'state', 'stream', 'transform'],
    constructSignals: ['data-flow', 'call', 'import'],
    pathHints: ['event', 'flow', 'pipeline', 'state', 'store']
  }
];

const MAX_FILES = 2500;
const MAX_FILE_BYTES = 2 * 1024 * 1024;
const MAX_TOTAL_BYTES = 32 * 1024 * 1024;
const MAX_DEPTH = 20;
const MAX_VISITED_DIRS = 8000;
const MAX_VISITED_ENTRIES = 60000;
const MAX_CHUNKS = 10000;
const MAX_CHUNK_LINES = 120;
const MAX_CHUNK_CHARS = 10000;
const CHUNK_OVERLAP_LINES = 8;
const MAX_TOKEN_OCCURRENCES = 2048;
const MAX_PUBLIC_TOKENS = 256;
const MAX_SYMBOLS = 64;
const MAX_IGNORE_FILE_BYTES = 256 * 1024;
const MAX_IGNORE_PATTERN_LENGTH = 512;
const MAX_RETRIEVAL_CANDIDATES = 50;
const MAX_RETRIEVAL_CHARS = 256000;
const MAX_STATIC_SUMMARY_CHARS = 64000;
const MAX_STATIC_TREE_CHARS = 12000;
const MAX_CUSTOM_NOTES_CHARS = 16000;
const INDEX_VERSION = 'context-index-v2';

function compareText(a: string, b: string): number {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

function clampInteger(value: number | undefined, fallback: number, min: number, max: number): number {
  if (value === undefined || !Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, Math.floor(value)));
}

function hashValue(value: string | Buffer): string {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function toPosixPath(value: string): string {
  return value.split(path.sep).join('/');
}

function normalizeFsIdentity(value: string): string {
  const resolved = path.resolve(value);
  return process.platform === 'win32' ? resolved.toLowerCase() : resolved;
}

function sameFsPath(a: string, b: string): boolean {
  return normalizeFsIdentity(a) === normalizeFsIdentity(b);
}

function isInsideRoot(rootPath: string, candidatePath: string): boolean {
  const relative = path.relative(rootPath, candidatePath);
  return relative === '' || (relative !== '..' && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative));
}

function countLines(content: string): number {
  return content.length === 0 ? 0 : content.split('\n').length;
}

function decodeTextBuffer(buffer: Buffer): string | null {
  if (buffer.length === 0) return null;

  let text: string;
  if (buffer.length >= 2 && buffer[0] === 0xff && buffer[1] === 0xfe) {
    if ((buffer.length - 2) % 2 !== 0) return null;
    text = buffer.subarray(2).toString('utf16le');
  } else if (buffer.length >= 2 && buffer[0] === 0xfe && buffer[1] === 0xff) {
    if ((buffer.length - 2) % 2 !== 0) return null;
    const swapped = Buffer.allocUnsafe(buffer.length - 2);
    for (let index = 2; index < buffer.length; index += 2) {
      swapped[index - 2] = buffer[index + 1];
      swapped[index - 1] = buffer[index];
    }
    text = swapped.toString('utf16le');
  } else {
    const checkLength = Math.min(buffer.length, 8192);
    for (let index = 0; index < checkLength; index += 1) {
      if (buffer[index] === 0) return null;
    }
    text = buffer.toString('utf8');
  }

  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);

  let replacementCount = 0;
  let controlCount = 0;
  for (let index = 0; index < text.length; index += 1) {
    const code = text.charCodeAt(index);
    if (code === 0xfffd) replacementCount += 1;
    if (code < 32 && code !== 9 && code !== 10 && code !== 12 && code !== 13) {
      controlCount += 1;
    }
  }

  if (replacementCount > Math.max(4, text.length * 0.005)) return null;
  if (controlCount > Math.max(4, text.length * 0.01)) return null;

  const normalized = text.replace(/\r\n?/g, '\n');
  return normalized.length > 0 ? normalized : null;
}

function containsSecretMaterial(content: string, relativePath: string): boolean {
  const configLike = /\.(?:json|ya?ml|toml|ini|cfg|conf|config|properties|tfvars|xml)$/i.test(
    relativePath
  );
  const secretKey =
    '(?:[\\w.-]+[_-])?(?:api[_-]?key|client[_-]?secret|access[_-]?token|auth[_-]?token|npmAuthToken|password)';
  const quotedSecretAssignment = new RegExp(
    `["']?${secretKey}["']?\\s*(?::|=|=>)\\s*["'][^"']+["']`,
    'i'
  );
  const xmlSecretElement = new RegExp(
    `<${secretKey}>[^<]+<\\/${secretKey}>`,
    'i'
  );
  return (
    /-----BEGIN (?:[A-Z0-9]+ )?PRIVATE KEY-----/.test(content) ||
    /\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/.test(content) ||
    /\bxox[baprs]-[A-Za-z0-9-]{20,}\b/.test(content) ||
    /\bgh[pousr]_[A-Za-z0-9]{30,}\b/.test(content) ||
    /\bsk-(?:proj-|svcacct-)?[A-Za-z0-9_-]{20,}\b/.test(content) ||
    /\beyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/.test(content) ||
    /["']?(?:[\w.-]+[_-])?(?:api[_-]?key|client[_-]?secret|access[_-]?token|auth[_-]?token|npmAuthToken|password)["']?\s*[:=]\s*["']?[A-Za-z0-9_./+=-]{16,}["']?/i.test(
      content
    ) ||
    quotedSecretAssignment.test(content) ||
    xmlSecretElement.test(content) ||
    (configLike &&
      /["']?(?:[\w.-]+[_-])?(?:api[_-]?key|client[_-]?secret|access[_-]?token|auth[_-]?token|npmAuthToken|password)["']?\s*[:=]\s*(?:"[^"]+"|'[^']+'|[^\s,;}]+)/i.test(
        content
      ))
  );
}

function isClearlyGenerated(relativePath: string, content: string): boolean {
  const lowerName = path.posix.basename(relativePath).toLowerCase();
  if (lowerName.includes('.min.')) return true;

  const header = content.split('\n', 10).join('\n');
  return (
    /(?:^|\s)@generated(?:\s|$)/i.test(header) ||
    /<auto-generated[\s>]/i.test(header) ||
    /(?:automatically|machine)[ -]generated/i.test(header) ||
    /do not edit[^\n]{0,80}generated/i.test(header)
  );
}

function isSecretFile(relativePath: string, fileName: string): boolean {
  const lowerName = fileName.toLowerCase();
  const lowerPath = relativePath.toLowerCase();
  const extension = path.extname(lowerName);

  if (lowerName.startsWith('.env')) return true;
  if (/\.tfvars(?:\.json)?$/.test(lowerName) || /\.tfstate(?:\.backup)?$/.test(lowerName)) return true;
  if (PRIVATE_KEY_EXTENSIONS.has(extension)) return true;
  if (/^id_(?:rsa|dsa|ecdsa|ed25519)(?:\.pub)?$/.test(lowerName)) return true;
  if (/^(?:\.npmrc|\.pypirc|\.netrc|_netrc|\.htpasswd|\.yarnrc(?:\.yml)?|auth\.json|nuget\.config)$/.test(lowerName)) return true;
  if (/^(?:secrets?\.json|credentials?\.json|service-account\.json)$/.test(lowerName)) return true;
  if (/(?:^|[._-])(?:credentials?|secrets?|service[._-]?account)(?:[._-]|$)/.test(lowerName)) return true;
  if (lowerPath === '.aws/credentials' || lowerPath === '.docker/config.json' || lowerPath === '.kube/config') return true;

  return false;
}

function isKeyProjectFile(relativePath: string): boolean {
  const lowerPath = relativePath.toLowerCase();
  const lowerName = path.posix.basename(lowerPath);
  return (
    KEY_FILE_NAMES.has(lowerName) ||
    lowerPath.startsWith('docs/') ||
    /(?:^|\/)(?:types?|schema)(?:[._-]|\/|$)/.test(lowerPath)
  );
}

function addToken(counts: Map<string, number>, token: string): void {
  const normalized = token.normalize('NFKC').toLowerCase();
  if (normalized.length < 2 || normalized.length > 80) return;
  if (!/[\p{L}\p{N}]/u.test(normalized)) return;
  counts.set(normalized, (counts.get(normalized) ?? 0) + 1);
}

function extractTokenCounts(text: string, maxOccurrences = MAX_TOKEN_OCCURRENCES): Map<string, number> {
  const counts = new Map<string, number>();
  const matches = text.match(/[\p{L}\p{N}_$.-]+/gu) ?? [];
  let occurrences = 0;

  for (const rawToken of matches) {
    if (occurrences >= maxOccurrences) break;

    const compound = rawToken.replace(/^[.$_-]+|[.$_-]+$/g, '');
    if (compound) {
      addToken(counts, compound);
      occurrences += 1;
    }

    const separated = rawToken
      .replace(/([\p{Lu}]+)([\p{Lu}][\p{Ll}])/gu, '$1 $2')
      .replace(/([\p{Ll}\p{N}])([\p{Lu}])/gu, '$1 $2')
      .split(/[\s_$.-]+/u);

    for (const part of separated) {
      if (occurrences >= maxOccurrences) break;
      if (!part || part === compound) continue;
      addToken(counts, part);
      occurrences += 1;
    }
  }

  return counts;
}

function publicTokensFromCounts(counts: Map<string, number>): string[] {
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1] || compareText(a[0], b[0]))
    .slice(0, MAX_PUBLIC_TOKENS)
    .map(([token]) => token);
}

function extractSymbols(content: string): string[] {
  const symbols = new Set<string>();
  const patterns: RegExp[] = [
    /\b(?:class|struct|enum|interface|trait|protocol|record|type|function|func|fn|def|sub|module|namespace)\s+([\p{L}_$][\p{L}\p{N}_$]*)/giu,
    /(?:^|\n)\s*(?:export\s+)?(?:async\s+)?(?:const|let|var|val|field)\s+([\p{L}_$][\p{L}\p{N}_$]*)/giu,
    /(?:^|\n)\s*(?:public|private|protected|internal)?\s*(?:static\s+)?[\p{L}_$][\p{L}\p{N}_$<>,.?\[\]]*\s+([\p{L}_$][\p{L}\p{N}_$]*)\s*\(/giu
  ];

  for (const pattern of patterns) {
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(content)) !== null && symbols.size < MAX_SYMBOLS) {
      if (match[1]) symbols.add(match[1]);
    }
    if (symbols.size >= MAX_SYMBOLS) break;
  }

  return Array.from(symbols).sort(compareText);
}

function detectConstructSignals(content: string): SourceConstructSignal[] {
  const signals = new Set<SourceConstructSignal>();

  if (/\b(?:class|struct|enum|interface|trait|protocol|record|type|function|func|fn|def|sub|module|namespace)\b/i.test(content) || /(?:^|\n)\s*(?:const|let|var|val)\s+[\p{L}_$]/iu.test(content)) {
    signals.add('declaration-like');
  }
  if (/[{}]/.test(content) || /(?:^|\n)\s*(?:begin|end)\b/i.test(content) || /:\s*\n[ \t]+\S/.test(content)) {
    signals.add('block-like');
  }
  if (/\b(?:public|private|protected|internal|package-private|friend|readonly)\b/i.test(content)) {
    signals.add('access-modifier');
  }
  if (/\b(?:extends|inherits|super|override|overrides|subclass)\b/i.test(content)) {
    signals.add('inheritance');
  }
  if (/\b(?:interface|protocol|trait|implements|implementation)\b/i.test(content)) {
    signals.add('interface');
  }
  if (/\b(?:for|foreach|while|repeat|loop|iterate|reduce|filter|map)\b/i.test(content)) {
    signals.add('loop');
  }
  if (/\b(?:if|else|elseif|elif|switch|case|when|match|unless|guard)\b/i.test(content) || /\?[^\n:]+:/.test(content)) {
    signals.add('condition');
  }
  if (/\b(?:import|include|require|using|use|from|package)\b/i.test(content)) {
    signals.add('import');
  }
  if (/(?:^|\n)\s*(?:\/\/|#|\/\*|\*|<!--|--|;\s*[^;])/m.test(content)) {
    signals.add('comment');
  }
  if (/\b[\p{L}_$][\p{L}\p{N}_$]*\s*\(/u.test(content)) {
    signals.add('call');
  }
  if (/\b(?:assert|check|constraint|guard|invalid|sanitize|schema|validate|validation|validator|verify)\w*\b/i.test(content)) {
    signals.add('validation');
  }
  if (/\b(?:cache|collection|database|datasource|db|persist|query|repository|save|sql|storage|store)\w*\b/i.test(content)) {
    signals.add('storage');
  }
  if (/\b(?:api|client|controller|endpoint|fetch|handler|http|request|response|route|router|server)\w*\b/i.test(content)) {
    signals.add('api');
  }
  if (/\b(?:dispatch|emit|event|flow|input|output|pipe|pipeline|publish|state|stream|subscribe|transform)\w*\b/i.test(content)) {
    signals.add('data-flow');
  }

  return SIGNAL_ORDER.filter((signal) => signals.has(signal));
}

function buildChunkDrafts(content: string, maxChunks: number): ChunkDraft[] | null {
  if (maxChunks <= 0) return null;

  const lines = content.split('\n');
  const chunks: ChunkDraft[] = [];
  let startIndex = 0;

  while (startIndex < lines.length) {
    const firstLine = lines[startIndex];
    if (firstLine.length > MAX_CHUNK_CHARS) {
      for (let offset = 0; offset < firstLine.length; offset += MAX_CHUNK_CHARS) {
        chunks.push({
          startLine: startIndex + 1,
          endLine: startIndex + 1,
          content: firstLine.slice(offset, offset + MAX_CHUNK_CHARS)
        });
        if (chunks.length > maxChunks) return null;
      }
      startIndex += 1;
      continue;
    }

    let endIndex = startIndex;
    let charCount = 0;
    while (endIndex < lines.length && endIndex - startIndex < MAX_CHUNK_LINES) {
      const nextLength = lines[endIndex].length + (endIndex > startIndex ? 1 : 0);
      if (endIndex > startIndex && charCount + nextLength > MAX_CHUNK_CHARS) break;
      if (nextLength > MAX_CHUNK_CHARS) break;
      charCount += nextLength;
      endIndex += 1;
    }

    if (endIndex === startIndex) {
      endIndex += 1;
    }

    chunks.push({
      startLine: startIndex + 1,
      endLine: endIndex,
      content: lines.slice(startIndex, endIndex).join('\n')
    });
    if (chunks.length > maxChunks) return null;

    if (endIndex >= lines.length) break;
    const linesInChunk = endIndex - startIndex;
    const overlap = Math.min(CHUNK_OVERLAP_LINES, Math.floor(linesInChunk / 4));
    startIndex = Math.max(startIndex + 1, endIndex - overlap);
  }

  return chunks;
}

function escapeRegexCharacter(character: string): string {
  return /[\\^$.*+?()[\]{}|]/.test(character) ? `\\${character}` : character;
}

function globToRegExp(pattern: string): RegExp | null {
  let source = '';

  for (let index = 0; index < pattern.length; index += 1) {
    const character = pattern[index];

    if (character === '\\' && index + 1 < pattern.length) {
      index += 1;
      source += escapeRegexCharacter(pattern[index]);
      continue;
    }

    if (character === '*') {
      const isDouble = pattern[index + 1] === '*';
      if (isDouble) {
        while (pattern[index + 1] === '*') index += 1;
        if (pattern[index + 1] === '/') {
          index += 1;
          source += '(?:.*/)?';
        } else {
          source += '.*';
        }
      } else {
        source += '[^/]*';
      }
      continue;
    }

    if (character === '?') {
      source += '[^/]';
      continue;
    }

    if (character === '[') {
      const closingIndex = pattern.indexOf(']', index + 1);
      if (closingIndex > index + 1) {
        let body = pattern.slice(index + 1, closingIndex);
        const negated = body.startsWith('!');
        if (negated) body = body.slice(1);
        body = body.replace(/\\/g, '\\\\').replace(/\[/g, '\\[').replace(/\]/g, '\\]');
        source += `[${negated ? '^' : ''}${body}]`;
        index = closingIndex;
        continue;
      }
    }

    source += escapeRegexCharacter(character);
  }

  try {
    return new RegExp(`^${source}$`);
  } catch {
    return null;
  }
}

function parseIgnoreFile(content: string, basePath: string): IgnoreRule[] {
  const rules: IgnoreRule[] = [];

  for (const rawLine of content.split(/\r?\n/)) {
    let pattern = rawLine.trim();
    if (!pattern || pattern.startsWith('#') || pattern.length > MAX_IGNORE_PATTERN_LENGTH) continue;

    let negated = false;
    if (pattern.startsWith('\\#') || pattern.startsWith('\\!')) {
      pattern = pattern.slice(1);
    } else if (pattern.startsWith('!')) {
      negated = true;
      pattern = pattern.slice(1);
    }

    if (!pattern) continue;

    const directoryOnly = pattern.endsWith('/');
    if (directoryOnly) pattern = pattern.replace(/\/+$/, '');

    let hasSlash = pattern.includes('/');
    if (pattern.startsWith('/')) {
      pattern = pattern.replace(/^\/+/, '');
      hasSlash = true;
    }

    if (!pattern) continue;
    const matcher = globToRegExp(pattern);
    if (!matcher) continue;

    rules.push({ basePath, negated, directoryOnly, hasSlash, matcher });
  }

  return rules;
}

function readIgnoreRules(directoryPath: string, basePath: string): IgnoreRule[] {
  const ignorePath = path.join(directoryPath, '.gitignore');
  try {
    const stat = fs.lstatSync(ignorePath);
    if (!stat.isFile() || stat.isSymbolicLink() || stat.size > MAX_IGNORE_FILE_BYTES) return [];
    return parseIgnoreFile(fs.readFileSync(ignorePath, 'utf8'), basePath);
  } catch {
    return [];
  }
}

function isIgnoredByRules(relativePath: string, isDirectory: boolean, rules: readonly IgnoreRule[]): boolean {
  let ignored = false;

  for (const rule of rules) {
    let scopedPath: string;
    if (!rule.basePath) {
      scopedPath = relativePath;
    } else if (relativePath.startsWith(`${rule.basePath}/`)) {
      scopedPath = relativePath.slice(rule.basePath.length + 1);
    } else {
      continue;
    }

    const candidate = rule.hasSlash ? scopedPath : path.posix.basename(scopedPath);
    if (rule.directoryOnly && !isDirectory) continue;
    if (rule.matcher.test(candidate)) ignored = !rule.negated;
  }

  return ignored;
}

function detectConcepts(query: string, queryTokens: readonly string[]): ConceptDefinition[] {
  const normalizedQuery = query.normalize('NFKC').toLowerCase();
  return CONCEPT_DEFINITIONS.filter((definition) => {
    if (definition.queryTerms.some((term) => normalizedQuery.includes(term))) return true;
    return definition.queryPrefixes.some((prefix) =>
      queryTokens.some((token) => token === prefix || token.startsWith(prefix))
    );
  });
}

function sourcePriority(relativePath: string): number {
  const lower = relativePath.toLowerCase();
  let score = 0;
  if (/(?:^|\/)(?:main|index|app|server|core|engine|service|store|controller|model|router|api|hook)(?:[._/-]|$)/.test(lower)) {
    score += 10;
  }
  if (/\.(?:ts|tsx|py|js|jsx|java|cs|go|rs|cpp|c|h|hpp|php|rb|kt|kts|swift|scala|vue|svelte)$/i.test(lower)) {
    score += 5;
  }
  if (lower.split('/').length <= 2) score += 2;
  return score;
}

export class ContextIndexer {
  private currentFolderPath = '';
  private rootRealPath = '';
  private projectFingerprint = '';
  private files: IndexedFile[] = [];
  private chunks: IndexedChunk[] = [];
  private indexedAt = 0;
  private chunksById = new Map<string, IndexedChunk>();
  private filesByPath = new Map<string, IndexedFile>();
  private documentFrequency = new Map<string, number>();
  private averageChunkTokenCount = 0;
  private basenameCounts = new Map<string, number>();
  private indexMetadata: ContextIndexMetadata | null = null;

  public indexFolder(folderPath: string): ContextFolderStats | null {
    if (!folderPath) {
      this.resetState();
      return null;
    }

    let requestedPath: string;
    let rootRealPath: string;
    try {
      requestedPath = path.resolve(folderPath);
      const stat = fs.statSync(requestedPath);
      if (!stat.isDirectory()) {
        this.resetState();
        return null;
      }
      rootRealPath = fs.realpathSync(requestedPath);
    } catch {
      this.resetState();
      return null;
    }

    const sameRoot = this.rootRealPath !== '' && sameFsPath(this.rootRealPath, rootRealPath);
    const previousFiles = sameRoot
      ? new Map(this.files.map((file) => [file.relativePath, file]))
      : new Map<string, IndexedFile>();

    if (!sameRoot) this.resetState();

    try {
      const rootIdentity = hashValue(`${INDEX_VERSION}\0${normalizeFsIdentity(rootRealPath)}`);
      const collected: IndexedFile[] = [];
      let totalBytes = 0;
      let totalChunks = 0;
      let visitedDirectories = 0;
      let visitedEntries = 0;
      let reusedFileCount = 0;
      let reindexedFileCount = 0;
      let traversalLimitReached = false;

      const walk = (currentDirectory: string, relativeDirectory: string, depth: number, inheritedRules: readonly IgnoreRule[]): void => {
        if (
          traversalLimitReached ||
          depth > MAX_DEPTH ||
          visitedDirectories >= MAX_VISITED_DIRS ||
          collected.length >= MAX_FILES ||
          totalChunks >= MAX_CHUNKS
        ) {
          return;
        }

        visitedDirectories += 1;
        const activeRules = [
          ...inheritedRules,
          ...readIgnoreRules(currentDirectory, relativeDirectory)
        ];

        let entries: fs.Dirent[];
        try {
          entries = fs.readdirSync(currentDirectory, { withFileTypes: true });
        } catch {
          return;
        }
        entries.sort((a, b) => compareText(a.name, b.name));

        for (const entry of entries) {
          if (visitedEntries >= MAX_VISITED_ENTRIES) {
            traversalLimitReached = true;
            break;
          }
          if (collected.length >= MAX_FILES || totalChunks >= MAX_CHUNKS) {
            traversalLimitReached = true;
            break;
          }
          visitedEntries += 1;

          const lowerName = entry.name.toLowerCase();
          const fullPath = path.join(currentDirectory, entry.name);
          const relativePath = relativeDirectory
            ? `${relativeDirectory}/${entry.name}`
            : entry.name;

          let entryStat: fs.Stats;
          try {
            entryStat = fs.lstatSync(fullPath);
          } catch {
            continue;
          }
          if (entryStat.isSymbolicLink()) continue;

          const isDirectory = entryStat.isDirectory();
          if (isIgnoredByRules(relativePath, isDirectory, activeRules)) continue;

          if (isDirectory) {
            if (lowerName.startsWith('.env') || lowerName === '.secrets' || lowerName === '.credentials') continue;
            if (IGNORED_DIRS.has(lowerName)) continue;
            let realDirectory: string;
            try {
              realDirectory = fs.realpathSync(fullPath);
            } catch {
              continue;
            }
            if (!isInsideRoot(rootRealPath, realDirectory)) continue;
            walk(realDirectory, relativePath, depth + 1, activeRules);
            continue;
          }

          if (!entryStat.isFile()) continue;
          if (IGNORED_FILES.has(lowerName) || isSecretFile(relativePath, entry.name)) continue;

          const extension = path.extname(lowerName);
          if (IGNORED_EXTENSIONS.has(extension)) continue;
          if (entryStat.size === 0 || entryStat.size > MAX_FILE_BYTES) continue;
          if (totalBytes + entryStat.size > MAX_TOTAL_BYTES) continue;

          let realFilePath: string;
          try {
            realFilePath = fs.realpathSync(fullPath);
          } catch {
            continue;
          }
          if (!isInsideRoot(rootRealPath, realFilePath)) continue;

          const previous = previousFiles.get(relativePath);
          if (
            previous &&
            previous.byteSize === entryStat.size &&
            previous.mtimeMs === entryStat.mtimeMs &&
            previous.ctimeMs === entryStat.ctimeMs &&
            sameFsPath(previous.realPath, realFilePath) &&
            totalChunks + previous.chunks.length <= MAX_CHUNKS
          ) {
            collected.push(previous);
            totalBytes += previous.byteSize;
            totalChunks += previous.chunks.length;
            reusedFileCount += 1;
            continue;
          }

          let buffer: Buffer;
          let postReadStat: fs.Stats;
          try {
            buffer = fs.readFileSync(realFilePath);
            postReadStat = fs.lstatSync(realFilePath);
          } catch {
            continue;
          }
          if (
            !postReadStat.isFile() ||
            postReadStat.isSymbolicLink() ||
            buffer.length !== postReadStat.size ||
            postReadStat.size > MAX_FILE_BYTES ||
            postReadStat.mtimeMs !== entryStat.mtimeMs ||
            postReadStat.ctimeMs !== entryStat.ctimeMs
          ) {
            continue;
          }

          const content = decodeTextBuffer(buffer);
          if (!content || containsSecretMaterial(content, relativePath) || isClearlyGenerated(relativePath, content)) continue;

          const indexedFile = this.createIndexedFile({
            relativePath,
            realPath: realFilePath,
            content,
            buffer,
            stat: postReadStat,
            rootIdentity,
            maxChunks: MAX_CHUNKS - totalChunks
          });
          if (!indexedFile) continue;

          collected.push(indexedFile);
          totalBytes += indexedFile.byteSize;
          totalChunks += indexedFile.chunks.length;
          reindexedFileCount += 1;
        }
      };

      walk(rootRealPath, '', 0, []);
      collected.sort((a, b) => compareText(a.relativePath, b.relativePath));

      const chunks = collected.flatMap((file) => file.chunks);
      const chunksById = new Map<string, IndexedChunk>();
      const filesByPath = new Map<string, IndexedFile>();
      const documentFrequency = new Map<string, number>();
      const basenameCounts = new Map<string, number>();
      let tokenCount = 0;

      for (const file of collected) {
        filesByPath.set(file.relativePath, file);
        const basename = path.posix.basename(file.relativePath).toLowerCase();
        basenameCounts.set(basename, (basenameCounts.get(basename) ?? 0) + 1);
      }

      for (const chunk of chunks) {
        chunksById.set(chunk.sourceId, chunk);
        tokenCount += chunk.tokenCount;
        for (const token of chunk.tokenCounts.keys()) {
          documentFrequency.set(token, (documentFrequency.get(token) ?? 0) + 1);
        }
      }

      const fingerprintInput = collected
        .map((file) => `${file.relativePath}\0${file.fileHash}\0${file.lineCount}`)
        .join('\0');
      const projectFingerprint = hashValue(`${INDEX_VERSION}\0${rootIdentity}\0${fingerprintInput}`);
      const indexedAt = Date.now();
      const totalChars = collected.reduce((sum, file) => sum + file.size, 0);

      this.currentFolderPath = folderPath;
      this.rootRealPath = rootRealPath;
      this.projectFingerprint = projectFingerprint;
      this.files = collected;
      this.chunks = chunks;
      this.indexedAt = indexedAt;
      this.chunksById = chunksById;
      this.filesByPath = filesByPath;
      this.documentFrequency = documentFrequency;
      this.averageChunkTokenCount = chunks.length > 0 ? tokenCount / chunks.length : 0;
      this.basenameCounts = basenameCounts;
      this.indexMetadata = {
        folderPath,
        projectFingerprint,
        indexedAt,
        fileCount: collected.length,
        chunkCount: chunks.length,
        totalChars,
        reusedFileCount,
        reindexedFileCount
      };

      return this.getStats();
    } catch {
      this.resetState();
      return null;
    }
  }

  public getStats(): ContextFolderStats | null {
    if (!this.currentFolderPath) return null;

    return {
      folderPath: this.currentFolderPath,
      fileCount: this.files.length,
      totalChars: this.files.reduce((sum, file) => sum + file.size, 0),
      topFiles: this.files.slice(0, 12).map((file) => file.relativePath),
      indexedAt: this.indexedAt
    };
  }

  public getProjectFingerprint(): string | null {
    return this.projectFingerprint || null;
  }

  public getIndexMetadata(): ContextIndexMetadata | null {
    return this.indexMetadata ? { ...this.indexMetadata } : null;
  }

  public getSourceChunks(): SourceChunk[] {
    return this.chunks.map((chunk) => this.toPublicChunk(chunk));
  }

  public querySourceChunks(queryText: string, options: SourceRetrievalOptions = {}): SourceRetrievalResult {
    const query = queryText.trim();
    const emptyResult: SourceRetrievalResult = {
      query,
      projectFingerprint: this.projectFingerprint || null,
      expandedTokens: [],
      detectedConcepts: [],
      candidates: []
    };
    if (!query || this.chunks.length === 0) return emptyResult;

    const rawQueryTokens = Array.from(extractTokenCounts(query, 128).keys()).slice(0, 64);
    const concepts = detectConcepts(query, rawQueryTokens);
    const lexicalTokens = rawQueryTokens.filter((token) => !QUERY_STOP_WORDS.has(token));
    const tokenWeights = new Map<string, number>();
    const originalTokens = new Set(lexicalTokens);

    for (const token of lexicalTokens) tokenWeights.set(token, 1.6);
    for (const definition of concepts) {
      for (const token of definition.expansionTokens) {
        if (!tokenWeights.has(token)) tokenWeights.set(token, 0.45);
      }
    }

    const maxCandidates = clampInteger(options.maxCandidates, 8, 0, MAX_RETRIEVAL_CANDIDATES);
    const maxTotalChars = clampInteger(options.maxTotalChars, 32000, 0, MAX_RETRIEVAL_CHARS);
    const maxPerFile = clampInteger(options.maxPerFile, 2, 1, MAX_RETRIEVAL_CANDIDATES);
    const includeKeyFiles = options.includeKeyFiles !== false;
    if (maxCandidates === 0 || maxTotalChars === 0 || tokenWeights.size === 0) {
      return {
        ...emptyResult,
        expandedTokens: Array.from(tokenWeights.keys()),
        detectedConcepts: concepts.map((definition) => definition.concept)
      };
    }

    const documentCount = this.chunks.length;
    const averageLength = this.averageChunkTokenCount || 1;
    const scored: Array<{
      chunk: IndexedChunk;
      score: number;
      matchedTokens: string[];
      matchedConcepts: SourceConcept[];
    }> = [];

    for (const chunk of this.chunks) {
      const file = this.filesByPath.get(chunk.relativePath);
      if (!file || (!includeKeyFiles && file.isKeyFile)) continue;

      let score = 0;
      const matchedTokens = new Set<string>();
      const matchedConcepts: SourceConcept[] = [];
      const lowerPath = file.relativePath.toLowerCase();

      for (const [token, weight] of tokenWeights) {
        const termFrequency = chunk.tokenCounts.get(token) ?? 0;
        if (termFrequency > 0) {
          const documentFrequency = this.documentFrequency.get(token) ?? 0;
          const inverseDocumentFrequency = Math.log(
            1 + (documentCount - documentFrequency + 0.5) / (documentFrequency + 0.5)
          );
          const lengthNormalization =
            termFrequency + 1.2 * (0.25 + 0.75 * (chunk.tokenCount / averageLength));
          score += weight * inverseDocumentFrequency * ((termFrequency * 2.2) / lengthNormalization);
          matchedTokens.add(token);
        }

        if (file.pathTokens.has(token)) {
          score += originalTokens.has(token) ? 6 : 1.8;
          matchedTokens.add(token);
        } else if (token.length >= 3 && lowerPath.includes(token)) {
          score += originalTokens.has(token) ? 2.5 : 0.8;
          matchedTokens.add(token);
        }

        if (chunk.symbolSet.has(token)) {
          score += originalTokens.has(token) ? 5 : 1.5;
          matchedTokens.add(token);
        }
      }

      for (const definition of concepts) {
        let conceptEvidence = false;
        for (const signal of definition.constructSignals) {
          if (chunk.constructSet.has(signal)) {
            score += 3.5;
            conceptEvidence = true;
          }
        }
        for (const hint of definition.pathHints) {
          if (file.pathTokens.has(hint)) {
            score += 2.25;
            conceptEvidence = true;
          }
        }
        if (definition.expansionTokens.some((token) => chunk.tokenCounts.has(token))) {
          conceptEvidence = true;
        }
        if (definition.concept === 'architecture' && file.isKeyFile) {
          score += 2;
          conceptEvidence = true;
        }
        if (conceptEvidence) matchedConcepts.push(definition.concept);
      }

      if (score > 0) {
        scored.push({
          chunk,
          score,
          matchedTokens: Array.from(matchedTokens).sort(compareText),
          matchedConcepts
        });
      }
    }

    scored.sort(
      (a, b) =>
        b.score - a.score ||
        compareText(a.chunk.relativePath, b.chunk.relativePath) ||
        a.chunk.startLine - b.chunk.startLine ||
        compareText(a.chunk.sourceId, b.chunk.sourceId)
    );

    const selected: SourceRetrievalCandidate[] = [];
    const perFileCounts = new Map<string, number>();
    let charBudget = maxTotalChars;

    for (const item of scored) {
      if (selected.length >= maxCandidates) break;
      const fileCount = perFileCounts.get(item.chunk.relativePath) ?? 0;
      if (fileCount >= maxPerFile || item.chunk.content.length > charBudget) continue;

      selected.push({
        ...this.toPublicChunk(item.chunk),
        score: Number(item.score.toFixed(6)),
        label: this.formatChunkLabel(item.chunk),
        matchedTokens: item.matchedTokens,
        matchedConcepts: [...item.matchedConcepts]
      });
      perFileCounts.set(item.chunk.relativePath, fileCount + 1);
      charBudget -= item.chunk.content.length;
    }

    return {
      query,
      projectFingerprint: this.projectFingerprint || null,
      expandedTokens: Array.from(tokenWeights.keys()),
      detectedConcepts: concepts.map((definition) => definition.concept),
      candidates: selected
    };
  }

  public resolveSourceId(sourceId: string): ResolvedSource | null {
    if (!this.projectFingerprint || !this.rootRealPath) return null;
    const chunk = this.chunksById.get(sourceId);
    if (!chunk) return null;
    const file = this.filesByPath.get(chunk.relativePath);
    if (!file || chunk.endLine > file.lineCount || chunk.startLine < 1) return null;

    try {
      const currentRoot = fs.realpathSync(this.rootRealPath);
      if (!sameFsPath(currentRoot, this.rootRealPath)) return null;

      const stat = fs.lstatSync(file.realPath);
      if (!stat.isFile() || stat.isSymbolicLink() || stat.size !== file.byteSize) return null;

      const currentRealPath = fs.realpathSync(file.realPath);
      if (!sameFsPath(currentRealPath, file.realPath) || !isInsideRoot(currentRoot, currentRealPath)) {
        return null;
      }

      const buffer = fs.readFileSync(currentRealPath);
      if (buffer.length !== file.byteSize || hashValue(buffer) !== file.fileHash) return null;

      return {
        ...this.toPublicChunk(chunk),
        projectFingerprint: this.projectFingerprint,
        label: this.formatChunkLabel(chunk)
      };
    } catch {
      return null;
    }
  }

  public validateSourceId(sourceId: string): boolean {
    return this.resolveSourceId(sourceId) !== null;
  }

  public formatSourceLabel(sourceId: string): string | null {
    return this.resolveSourceId(sourceId)?.label ?? null;
  }

  /**
   * Builds a deterministic, cache-friendly project context block.
   * Contains no timestamps or volatile values so prompt caching remains stable.
   */
  public getStaticProjectSummary(customNotes?: string): string {
    let output = '';
    const append = (block: string): boolean => {
      if (!block) return false;
      const separator = output ? '\n\n' : '';
      if (output.length + separator.length + block.length > MAX_STATIC_SUMMARY_CHARS) return false;
      output += `${separator}${block}`;
      return true;
    };
    const remaining = (): number => MAX_STATIC_SUMMARY_CHARS - output.length - (output ? 2 : 0);

    if (customNotes?.trim()) {
      const header = '=== USER BACKGROUND / NOTES ===';
      const noteBudget = Math.min(MAX_CUSTOM_NOTES_CHARS, remaining());
      const notes = this.truncatePlainText(customNotes.trim(), Math.max(0, noteBudget - header.length - 1));
      append(notes ? `${header}\n${notes}` : header.slice(0, noteBudget));
    }

    if (!this.currentFolderPath || this.files.length === 0) return output;

    const folderName = path.basename(this.currentFolderPath);
    const treeLines = this.files.map((file) => `  - ${file.relativePath}`);
    const treeBudget = Math.min(MAX_STATIC_TREE_CHARS, remaining());
    append(
      this.formatLineBlock(
        `=== PROJECT WORKSPACE: ${folderName} ===\nFile Tree (${this.files.length} files):`,
        treeLines,
        treeBudget
      )
    );

    return output;
  }

  /**
   * Compatibility wrapper for existing prompt construction. New code should use
   * querySourceChunks so candidate IDs can be retained and verified.
   */
  public getRelevantFilesForQuery(queryText: string, maxFiles = 5, maxChars = 24000): string {
    if (!this.files.length || !queryText.trim()) return '';

    const fileLimit = clampInteger(maxFiles, 5, 0, MAX_RETRIEVAL_CANDIDATES);
    const charLimit = clampInteger(maxChars, 24000, 0, MAX_RETRIEVAL_CHARS);
    if (fileLimit === 0 || charLimit === 0) return '';

    const retrieval = this.querySourceChunks(queryText, {
      maxCandidates: fileLimit,
      maxTotalChars: charLimit,
      maxPerFile: 1,
      includeKeyFiles: false
    });

    let selected: SourceChunk[] = retrieval.candidates;
    if (selected.length === 0) {
      const seenFiles = new Set<string>();
      selected = this.chunks
        .filter((chunk) => {
          const file = this.filesByPath.get(chunk.relativePath);
          if (!file || file.isKeyFile || seenFiles.has(file.relativePath)) return false;
          seenFiles.add(file.relativePath);
          return true;
        })
        .sort(
          (a, b) =>
            sourcePriority(b.relativePath) - sourcePriority(a.relativePath) ||
            compareText(a.relativePath, b.relativePath) ||
            a.startLine - b.startLine
        )
        .slice(0, Math.min(fileLimit, 3))
        .map((chunk) => this.toPublicChunk(chunk));
    }

    let output = '';
    for (const chunk of selected) {
      const separator = output ? '\n\n' : '';
      const header = `--- RELEVANT SOURCE: [${chunk.sourceId}] ${chunk.relativePath} (lines ${chunk.startLine}-${chunk.endLine}) ---`;
      const bodyBudget = charLimit - output.length - separator.length - header.length - 1;
      if (bodyBudget <= 0) break;
      const body = this.formatWithLineNumbers(chunk.content, bodyBudget, chunk.startLine);
      if (!body) continue;
      output += `${separator}${header}\n${body}`;
    }

    return output;
  }

  /**
   * Builds a bounded code and architecture snapshot for one-shot project analysis.
   */
  public getDeepProjectSnapshotForAnalysis(maxChars = 56000): string {
    if (!this.currentFolderPath || this.files.length === 0) return '';

    const limit = clampInteger(maxChars, 56000, 0, MAX_RETRIEVAL_CHARS);
    if (limit === 0) return '';

    let output = '';
    const append = (block: string): boolean => {
      if (!block) return false;
      const separator = output ? '\n\n' : '';
      if (output.length + separator.length + block.length > limit) return false;
      output += `${separator}${block}`;
      return true;
    };
    const remaining = (): number => limit - output.length - (output ? 2 : 0);

    const folderName = path.basename(this.currentFolderPath);
    if (!append(this.truncatePlainText(`=== PROJECT NAME: ${folderName} ===`, remaining()))) return '';

    const treeLines = this.files.map((file) => `  - ${file.relativePath} (${file.size} chars)`);
    const treeBudget = Math.min(MAX_STATIC_TREE_CHARS, remaining());
    append(
      this.formatLineBlock(
        `=== COMPLETE FILE TREE (${this.files.length} files) ===`,
        treeLines,
        treeBudget
      )
    );

    const keyFiles = this.files.filter((file) => file.isKeyFile);
    for (const file of keyFiles) {
      const block = this.buildNumberedFileBlock(
        `--- CONFIG / DOC FILE: ${file.relativePath} ---`,
        file,
        Math.min(6000, remaining())
      );
      if (!block || !append(block)) break;
    }

    const sourceFiles = this.files
      .filter((file) => !file.isKeyFile)
      .sort(
        (a, b) =>
          sourcePriority(b.relativePath) - sourcePriority(a.relativePath) ||
          compareText(a.relativePath, b.relativePath)
      );

    for (const file of sourceFiles) {
      const block = this.buildNumberedFileBlock(
        `--- SOURCE FILE: ${file.relativePath} ---`,
        file,
        Math.min(5000, remaining())
      );
      if (!block || !append(block)) break;
    }

    return output;
  }

  private createIndexedFile(params: {
    relativePath: string;
    realPath: string;
    content: string;
    buffer: Buffer;
    stat: fs.Stats;
    rootIdentity: string;
    maxChunks: number;
  }): IndexedFile | null {
    const { relativePath, realPath, content, buffer, stat, rootIdentity, maxChunks } = params;
    const drafts = buildChunkDrafts(content, maxChunks);
    if (!drafts || drafts.length === 0) return null;

    const fileHash = hashValue(buffer);
    const fileFingerprint = hashValue(`${INDEX_VERSION}\0${relativePath}\0${fileHash}`);
    const extension = path.posix.extname(relativePath).toLowerCase();
    const pathTokenCounts = extractTokenCounts(relativePath, 256);
    const chunks: IndexedChunk[] = drafts.map((draft, index) => {
      const tokenCounts = extractTokenCounts(`${relativePath}\n${draft.content}`);
      const symbols = extractSymbols(draft.content);
      const constructSignals = detectConstructSignals(draft.content);
      const sourceId = `src_${hashValue(
        `${INDEX_VERSION}\0${rootIdentity}\0${fileFingerprint}\0${draft.startLine}\0${draft.endLine}\0${index}`
      ).slice(0, 32)}`;

      return {
        sourceId,
        relativePath,
        startLine: draft.startLine,
        endLine: draft.endLine,
        content: draft.content,
        fileHash,
        fileFingerprint,
        extension,
        tokens: publicTokensFromCounts(tokenCounts),
        symbols,
        constructSignals,
        tokenCounts,
        tokenCount: Array.from(tokenCounts.values()).reduce((sum, count) => sum + count, 0),
        symbolSet: new Set(symbols.map((symbol) => symbol.normalize('NFKC').toLowerCase())),
        constructSet: new Set(constructSignals)
      };
    });

    for (let index = 0; index < chunks.length; index += 1) {
      if (index > 0) chunks[index].previousSourceId = chunks[index - 1].sourceId;
      if (index + 1 < chunks.length) chunks[index].nextSourceId = chunks[index + 1].sourceId;
    }

    return {
      relativePath,
      realPath,
      content,
      size: content.length,
      byteSize: buffer.length,
      mtimeMs: stat.mtimeMs,
      ctimeMs: stat.ctimeMs,
      lineCount: countLines(content),
      fileHash,
      fileFingerprint,
      extension,
      isKeyFile: isKeyProjectFile(relativePath),
      pathTokens: new Set(pathTokenCounts.keys()),
      chunks
    };
  }

  private toPublicChunk(chunk: IndexedChunk): SourceChunk {
    return {
      sourceId: chunk.sourceId,
      relativePath: chunk.relativePath,
      startLine: chunk.startLine,
      endLine: chunk.endLine,
      content: chunk.content,
      fileHash: chunk.fileHash,
      fileFingerprint: chunk.fileFingerprint,
      extension: chunk.extension,
      tokens: [...chunk.tokens],
      symbols: [...chunk.symbols],
      constructSignals: [...chunk.constructSignals],
      previousSourceId: chunk.previousSourceId,
      nextSourceId: chunk.nextSourceId
    };
  }

  private formatChunkLabel(chunk: Pick<SourceChunk, 'relativePath' | 'startLine' | 'endLine'>): string {
    const basename = path.posix.basename(chunk.relativePath);
    const hasCollision = (this.basenameCounts.get(basename.toLowerCase()) ?? 0) > 1;
    const name = hasCollision ? chunk.relativePath : basename;
    return `${name}(${chunk.startLine}-${chunk.endLine})`;
  }

  private formatWithLineNumbers(content: string, maxChars: number, startLine = 1): string {
    if (maxChars <= 0) return '';
    const lines = content.split('\n');
    let output = '';

    for (let index = 0; index < lines.length; index += 1) {
      const lineNumber = startLine + index;
      const formattedLine = `${lineNumber}: ${lines[index]}\n`;
      if (output.length + formattedLine.length > maxChars) {
        const marker = `... [truncated before line ${lineNumber}]\n`;
        if (output.length + marker.length <= maxChars) output += marker;
        break;
      }
      output += formattedLine;
    }

    return output;
  }

  private formatLineBlock(header: string, lines: readonly string[], maxChars: number): string {
    if (maxChars <= 0) return '';
    if (header.length >= maxChars) return header.slice(0, maxChars);

    let output = header;
    for (const line of lines) {
      const addition = `\n${line}`;
      if (output.length + addition.length > maxChars) {
        const marker = '\n  ... [truncated]';
        if (output.length + marker.length <= maxChars) output += marker;
        break;
      }
      output += addition;
    }
    return output;
  }

  private buildNumberedFileBlock(header: string, file: IndexedFile, maxChars: number): string {
    if (maxChars <= header.length + 1) return '';
    const body = this.formatWithLineNumbers(file.content, maxChars - header.length - 1);
    return body ? `${header}\n${body}` : '';
  }

  private truncatePlainText(content: string, maxChars: number): string {
    if (maxChars <= 0) return '';
    if (content.length <= maxChars) return content;
    const marker = '\n... [truncated]';
    if (marker.length >= maxChars) return content.slice(0, maxChars);
    return `${content.slice(0, maxChars - marker.length)}${marker}`;
  }

  private resetState(): void {
    this.currentFolderPath = '';
    this.rootRealPath = '';
    this.projectFingerprint = '';
    this.files = [];
    this.chunks = [];
    this.indexedAt = 0;
    this.chunksById = new Map();
    this.filesByPath = new Map();
    this.documentFrequency = new Map();
    this.averageChunkTokenCount = 0;
    this.basenameCounts = new Map();
    this.indexMetadata = null;
  }
}
