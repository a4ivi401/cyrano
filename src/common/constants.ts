import { PrompterSettings, LocalWhisperModelId } from './types';

export const DEFAULT_SCRIPT_TEXT = `Welcome to Cyrano!

This teleprompter overlay is completely invisible to OBS, Zoom, Google Meet, QuickTime, and screen shares.

Mouse clicks pass right through this window to any application underneath.

Global Controls:
• ⌃⌥⌘P (Ctrl+Alt+Cmd+P) : Start / Pause scrolling
• ⌃⌥⌘A (Ctrl+Alt+Cmd+A) : Ask AI Copilot (instant answer from live meeting audio)
• ⌃⌥⌘X (Ctrl+Alt+Cmd+X) : Close overlay & return to Settings
• ⌃⌥⌘R (Ctrl+Alt+Cmd+R) : Rewind script to top
• ⌃⌥⌘↑ / ↓ : Adjust scroll speed (+/- 10 px/s)

Position this window right beneath your webcam lens to maintain natural eye contact with your audience.`;

export const DEFAULT_SYSTEM_PROMPT = `You are a real-time AI Copilot for project defenses, exams with teachers, and technical interviews, displayed inside a stealth Cyrano teleprompter overlay.
Analyze the live conversation transcript (where [Interlocutor] is the teacher/interviewer and [Me] is the user), previous dialogue turns, alongside the provided project code (with line numbers) and project notes.

Rules for your response:
1. Direct, Spoken Answer: Answer the teacher's or interlocutor's latest question directly, accurately, and in the same language the question was asked (e.g. Ukrainian, Russian, or English).
2. Multi-Turn Context Continuity: If the question is a follow-up or referential query (e.g. "покажи де це", "а де у тебе написана колекція?", "чому саме цей метод?", "де це викликається?"), ALWAYS resolve what concept, class, or data structure is being referred to using the previous answers and context.
3. Summary Bullets: Begin immediately with 2–4 concise bullet points (using • ) with bold keywords highlighting the core answer so the user grasps the point in 2 seconds.
4. Exact Code Annotations & Line References:
   When the teacher asks where something is implemented, to show code, or whenever referencing project files, include a dedicated section:
   "### 📍 Де показати у коді (Файл та рядок)" (or "### 📍 Где показать в коде" / "### 📍 Code Reference"):
   - Exact annotation: 📁 **\`path/to/file.ext:line_number\`** (e.g. \`src/models/Collection.ts:42-58\`).
   - Function/Class/Method name: e.g. \`class CustomCollection<T>\`, \`public Add(item: T)\`.
   - Clear instructor tip: 1 short spoken sentence telling the user what to point at on the screen for the teacher (e.g. "Покажіть викладачу рядки 45–52, де оголошено масив і метод розширення місткості.").
5. Detailed Answer: Follow with section "### Подробный ответ" (or "### Детальна відповідь" / "### Detailed Answer"):
   - "#### Основной ответ": 2–4 clear, natural sentences the student can immediately read out loud to the teacher.
   - "#### Ключевые моменты": 3–4 structured bullet points detailing specific technical facts, architecture choices, time complexity, or design patterns used in the project.
6. Keep technical terms bolded or in backticks.
7. No filler greetings, meta-disclaimers, or intro phrases.`;

export const WHISPER_MODEL_CATALOG: {
  id: LocalWhisperModelId;
  name: string;
  sizeLabel: string;
  description: string;
}[] = [
  {
    id: 'onnx-community/whisper-tiny',
    name: 'Whisper Tiny (Ultra-Fast)',
    sizeLabel: '~75 MB',
    description: 'Fastest CPU/NPU latency (~0.2s). Best for clear speech and low RAM.'
  },
  {
    id: 'onnx-community/whisper-base',
    name: 'Whisper Base (Balanced)',
    sizeLabel: '~140 MB',
    description: 'Optimal balance of speed (~0.4s) and multilingual accuracy (RU/EN/UK).'
  },
  {
    id: 'onnx-community/whisper-small',
    name: 'Whisper Small (High Accuracy)',
    sizeLabel: '~250 MB',
    description: 'Strong recognition of mixed Russian/English technical terminology (~0.8s).'
  },
  {
    id: 'onnx-community/whisper-large-v3-turbo',
    name: 'Whisper Large v3 Turbo (Pro)',
    sizeLabel: '~550 MB',
    description: 'Near-cloud accuracy for complex dev jargon and noisy calls (~1.2s on Apple Silicon).'
  }
];

export const LLM_ENDPOINT_PRESETS = [
  {
    id: 'anthropic',
    label: 'Claude API',
    provider: 'anthropic' as const,
    baseUrl: 'https://api.anthropic.com',
    defaultModel: 'claude-opus-5'
  },
  {
    id: 'openrouter',
    label: 'OpenRouter',
    provider: 'openai-compatible' as const,
    baseUrl: 'https://openrouter.ai/api/v1',
    defaultModel: 'anthropic/claude-opus-5'
  },
  {
    id: 'omnirouter',
    label: 'Omnirouter',
    provider: 'openai-compatible' as const,
    baseUrl: 'https://api.omnirouter.ai/v1',
    defaultModel: 'claude-opus-5'
  },
  {
    id: 'openai',
    label: 'OpenAI',
    provider: 'openai-compatible' as const,
    baseUrl: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4o'
  },
  {
    id: 'ollama',
    label: 'Ollama (Local)',
    provider: 'openai-compatible' as const,
    baseUrl: 'http://localhost:11434/v1',
    defaultModel: 'qwen2.5-coder:14b'
  }
];

export const DEFAULT_SETTINGS: PrompterSettings = {
  language: 'ru',
  appMode: 'prompter',
  copilotCompact: true,
  copilotOpacity: 0.85,
  text: DEFAULT_SCRIPT_TEXT,

  fontSize: 24,
  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro", "Helvetica Neue", sans-serif',
  textColor: '#FFFFFF',
  textShadow: true,
  bgColor: '#000000',
  bgOpacity: 0.65,
  showFocalGuide: true,
  focalGuidePosition: 25,
  flipHorizontal: false,

  width: 760,
  height: 300,
  xPosition: -1, // center
  yPosition: 24, // right under webcam / menu bar
  presetPosition: 'top-center',

  speed: 45,
  autoRewindOnEnd: false,

  hotkeyClose: 'Control+Alt+Command+X',
  hotkeyToggle: 'Control+Alt+Command+P',
  hotkeyRewind: 'Control+Alt+Command+R',
  hotkeySpeedUp: 'Control+Alt+Command+Up',
  hotkeySpeedDown: 'Control+Alt+Command+Down',
  hotkeyAskAI: 'Control+Alt+Command+A',

  // LLM Configuration
  llmProvider: 'anthropic',
  llmApiKey: '',
  llmBaseUrl: 'https://api.anthropic.com',
  llmModel: 'claude-opus-5',
  llmSystemPrompt: DEFAULT_SYSTEM_PROMPT,
  copilotTriggerMode: 'both',

  // Audio & STT Configuration
  sttProvider: 'local-whisper',
  localWhisperModel: 'onnx-community/whisper-base',
  cloudSttBaseUrl: 'https://api.openai.com/v1',
  cloudSttApiKey: '',
  cloudSttModel: 'whisper-1',
  sttLanguage: 'auto',
  captureSystemAudio: true,
  captureMicAudio: true,
  micDeviceId: 'default',
  systemAudioDeviceId: 'loopback',

  // Project / Folder Context
  contextFolderPath: '',
  contextCustomNotes: ''
};

export const COMMON_SYSTEM_FONTS = [
  { label: 'System Default (SF Pro / Segoe UI / Ubuntu)', value: '-apple-system, BlinkMacSystemFont, "SF Pro", "Segoe UI", Ubuntu, Cantarell, sans-serif' },
  { label: 'Segoe UI (Windows)', value: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif' },
  { label: 'Ubuntu / Cantarell (Linux)', value: 'Ubuntu, Cantarell, "DejaVu Sans", "Liberation Sans", sans-serif' },
  { label: 'Helvetica Neue', value: '"Helvetica Neue", Helvetica, Arial, sans-serif' },
  { label: 'Menlo / Consolas / Monospace', value: 'Menlo, Consolas, "Ubuntu Mono", "DejaVu Sans Mono", Monaco, "Courier New", monospace' },
  { label: 'Monaco (Monospace)', value: 'Monaco, Consolas, Menlo, monospace' },
  { label: 'Arial', value: 'Arial, Helvetica, sans-serif' },
  { label: 'Avenir Next', value: '"Avenir Next", Avenir, "Segoe UI", sans-serif' },
  { label: 'Georgia (Serif)', value: 'Georgia, serif' },
  { label: 'Times New Roman (Serif)', value: '"Times New Roman", Times, serif' },
  { label: 'Courier New (Monospace)', value: '"Courier New", Courier, monospace' },
  { label: 'Trebuchet MS', value: '"Trebuchet MS", sans-serif' },
  { label: 'Verdana', value: 'Verdana, Geneva, sans-serif' }
];
