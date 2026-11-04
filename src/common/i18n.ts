import { Language } from './types';

export interface Translations {
  appName: string;
  appBadge: string;
  appSubtitle: string;
  launchButton: string;
  savedToast: string;
  resetConfirm: string;
  resetButton: string;

  // Mode Switcher
  modePrompter: string;
  modeCopilot: string;
  modeBadgePrompter: string;
  modeBadgeCopilot: string;
  viewStandard: string;
  viewCompact: string;
  copilotCompactLabel: string;
  copilotCompactHint: string;
  copilotOpacityHeading: string;
  copilotOpacityLabel: string;
  copilotGlassHint: string;
  miniWindowButton: string;
  expandWindowButton: string;

  // Tabs
  tabScript: string;
  tabCopilot: string;
  tabAudioContext: string;
  tabAppearance: string;
  tabPosition: string;
  tabHotkeys: string;

  // Script Tab
  scriptHeading: string;
  scriptSubheading: string;
  scriptPlaceholder: string;
  wordsLabel: string;
  charsLabel: string;
  durationLabel: string;
  durationMinutes: string;
  durationSeconds: string;
  wpmCadenceHint: string;
  loadSampleButton: string;
  clearButton: string;

  // Copilot Tab (LLM & Providers)
  copilotHeading: string;
  copilotSubheading: string;
  presetProviderLabel: string;
  customBaseUrlLabel: string;
  customBaseUrlHint: string;
  apiKeyLabel: string;
  apiKeyPlaceholder: string;
  modelLabel: string;
  modelPlaceholder: string;
  testConnectionButton: string;
  testingConnection: string;
  connectionSuccess: string;
  connectionFailed: string;
  triggerModeHeading: string;
  triggerModeLabel: string;
  triggerModeBoth: string;
  triggerModeBothDesc: string;
  triggerModeHotkey: string;
  triggerModeHotkeyDesc: string;
  triggerModeAuto: string;
  triggerModeAutoDesc: string;
  systemPromptHeading: string;
  systemPromptHint: string;

  // Audio & Context Tab
  audioContextHeading: string;
  audioContextSubheading: string;
  audioCaptureHeading: string;
  captureSystemLabel: string;
  captureSystemHint: string;
  captureMicLabel: string;
  captureMicHint: string;
  permissionsHeading: string;
  permissionScreenLabel: string;
  permissionScreenHint: string;
  permissionMicLabel: string;
  permissionMicHint: string;
  permissionAccessibilityLabel: string;
  permissionAccessibilityHint: string;
  checkPermissionsButton: string;
  checkAllPermissionsButton: string;
  testSystemAudioButton: string;
  testingSystemAudio: string;
  testMicButton: string;
  testingMic: string;
  testAccessibilityButton: string;
  systemAudioActive: string;
  micActive: string;
  accessibilityActive: string;
  micPermissionPrompt: string;
  permissionGranted: string;
  permissionDenied: string;
  permissionNotNeeded: string;
  permissionUnknown: string;
  permissionRestricted: string;
  checkingPermissions: string;
  openSystemSettings: string;
  sttEngineHeading: string;
  sttEngineLocal: string;
  sttEngineCloud: string;
  localModelsLabel: string;
  downloadModelButton: string;
  downloadingModel: string;
  modelReady: string;
  cloudSttUrlLabel: string;
  cloudSttKeyLabel: string;
  cloudSttModelLabel: string;
  sttLanguageLabel: string;
  projectContextHeading: string;
  projectFolderLabel: string;
  chooseFolderButton: string;
  noFolderSelected: string;
  filesIndexed: string;
  charactersIndexed: string;
  analyzeProjectButton: string;
  analyzingProject: string;
  analyzeProjectHint: string;
  analyzeProjectSuccess: string;
  customNotesLabel: string;
  customNotesPlaceholder: string;

  // Appearance Tab
  appearanceHeading: string;
  appearanceSubheading: string;
  scrollSpeedLabel: string;
  scrollSpeedUnit: string;
  wpmEquivalent: string;
  speedSlow: string;
  speedNormal: string;
  speedFast: string;
  typographyHeading: string;
  systemFontLabel: string;
  fontSizeLabel: string;
  textShadowLabel: string;
  textShadowHint: string;
  backgroundHeading: string;
  bgOpacityLabel: string;
  bgOpacityTransparent: string;
  bgOpacityTranslucent: string;
  bgOpacityOpaque: string;
  textColorLabel: string;
  bgColorLabel: string;
  focalGuideHeading: string;
  focalGuideLabel: string;
  focalGuideHint: string;
  focalPositionLabel: string;
  focalPositionUnit: string;
  mirrorHeading: string;
  mirrorLabel: string;
  mirrorHint: string;

  // Position Tab
  positionHeading: string;
  positionSubheading: string;
  presetsHeading: string;
  presetTopCenterTitle: string;
  presetTopCenterDesc: string;
  presetTopFullTitle: string;
  presetTopFullDesc: string;
  presetCenterTitle: string;
  presetCenterDesc: string;
  presetLeftTitle: string;
  presetLeftDesc: string;
  presetRightTitle: string;
  presetRightDesc: string;
  presetCustomTitle: string;
  presetCustomDesc: string;
  customGeometryHeading: string;
  windowWidthLabel: string;
  windowHeightLabel: string;
  verticalOffsetLabel: string;
  verticalOffsetHint: string;

  // Hotkeys Tab
  hotkeysHeading: string;
  hotkeysSubheading: string;
  actionToggle: string;
  actionToggleDesc: string;
  actionClose: string;
  actionCloseDesc: string;
  actionRewind: string;
  actionRewindDesc: string;
  actionSpeedUp: string;
  actionSpeedUpDesc: string;
  actionSpeedDown: string;
  actionSpeedDownDesc: string;
  actionAskAI: string;
  actionAskAIDesc: string;
  stealthNotesHeading: string;
  stealthNote1Title: string;
  stealthNote1Desc: string;
  stealthNote2Title: string;
  stealthNote2Desc: string;
  stealthNote3Title: string;
  stealthNote3Desc: string;

  // Overlay HUD & Copilot
  hudPlaying: string;
  hudPaused: string;
  hudRewound: string;
  hudSpeed: string;
  copilotListening: string;
  copilotThinking: string;
  copilotReady: string;
  copilotQuestionDetected: string;
  copilotNoTranscript: string;
  sampleScript: string;
}

export const TRANSLATIONS: Record<Language, Translations> = {
  en: {
    appName: 'CYRANO',
    appBadge: '',
    appSubtitle: 'Invisible to OBS, Zoom & Screen Sharing (NSWindowSharingNone)',
    launchButton: 'Launch Overlay',
    savedToast: 'Saved',
    resetConfirm: 'Reset all settings to default values?',
    resetButton: 'Reset Defaults',

    modePrompter: 'Teleprompter',
    modeCopilot: 'AI Copilot',
    modeBadgePrompter: 'TELEPROMPTER',
    modeBadgeCopilot: 'MEETING COPILOT',
    viewStandard: 'Standard',
    viewCompact: 'Compact',
    copilotCompactLabel: 'Compact Overlay HUD (Minimal View)',
    copilotCompactHint: 'Slim floating card under the camera that stays out of the way and expands only when printing an AI answer.',
    copilotOpacityHeading: 'AI Copilot Overlay Opacity',
    copilotOpacityLabel: 'Copilot Overlay Background Opacity',
    copilotGlassHint: '100% Glass (Text and controls float over screen)',
    miniWindowButton: 'Mini View',
    expandWindowButton: 'Full View',

    tabScript: 'Script Editor',
    tabCopilot: 'AI & LLM Model',
    tabAudioContext: 'Audio & Context',
    tabAppearance: 'Speed & Style',
    tabPosition: 'Position & Size',
    tabHotkeys: 'Global Hotkeys',

    scriptHeading: 'Script Content',
    scriptSubheading: 'Paste or draft your speech. Formatted for instant high-visibility readability.',
    scriptPlaceholder: 'Paste your script, speech, or presentation notes here...',
    wordsLabel: 'Words',
    charsLabel: 'Characters',
    durationLabel: 'Est. Duration',
    durationMinutes: 'min',
    durationSeconds: 'sec',
    wpmCadenceHint: 'Calculated at typical 135 WPM speaking cadence',
    loadSampleButton: 'Load Sample',
    clearButton: 'Clear',

    copilotHeading: 'AI Meeting Copilot (LLM Setup)',
    copilotSubheading: 'Connect Claude, OpenAI, Omnirouter, or any custom API endpoint to answer interview & meeting questions live.',
    presetProviderLabel: 'Quick Provider Preset',
    customBaseUrlLabel: 'API Base URL',
    customBaseUrlHint: 'e.g. https://api.anthropic.com, https://openrouter.ai/api/v1, https://api.omnirouter.ai/v1',
    apiKeyLabel: 'API Key',
    apiKeyPlaceholder: 'sk-ant-... or sk-...',
    modelLabel: 'Model ID',
    modelPlaceholder: 'claude-opus-5, gpt-4o, etc.',
    testConnectionButton: 'Test Connection',
    testingConnection: 'Testing...',
    connectionSuccess: 'Connection verified!',
    connectionFailed: 'Connection failed',
    triggerModeHeading: 'Answer Trigger Mode',
    triggerModeLabel: 'How to trigger AI generation during call',
    triggerModeBoth: 'Hotkey + Auto-Answer',
    triggerModeBothDesc: 'Answers on question pauses + hotkey trigger',
    triggerModeHotkey: 'Hotkey Only (⌃⌥⌘A)',
    triggerModeHotkeyDesc: 'Generates answer only when you press shortcut',
    triggerModeAuto: 'Auto-Detect Only',
    triggerModeAutoDesc: 'Triggers automatically after a spoken question',
    systemPromptHeading: 'Copilot Behavior (System Prompt)',
    systemPromptHint: 'Tailor how the AI formats spoken answers and technical bullet points for your meeting.',

    audioContextHeading: 'Audio Capture & Project Context',
    audioContextSubheading: 'Capture system audio + mic, run Whisper on-device, and provide workspace code context.',
    audioCaptureHeading: 'Audio Stream Sources',
    captureSystemLabel: 'Capture System Sound (Meeting Speakers)',
    captureSystemHint: 'Uses native loopback to transcribe other participants in Zoom, Meet, Teams, etc.',
    captureMicLabel: 'Capture User Microphone',
    captureMicHint: 'Transcribes your own voice so the AI understands full conversational context',
    permissionsHeading: 'System Permissions',
    permissionScreenLabel: 'Screen Recording',
    permissionScreenHint: 'Required to capture system audio from Zoom, Meet, browser, etc.',
    permissionMicLabel: 'Microphone Access',
    permissionMicHint: 'Required to capture your voice and ambient meeting audio.',
    permissionAccessibilityLabel: 'Accessibility (Optional)',
    permissionAccessibilityHint: 'Enables global hotkeys when other apps are focused.',
    checkPermissionsButton: 'Check Permissions',
    checkAllPermissionsButton: 'Check All Permissions',
    testSystemAudioButton: 'Check Laptop Audio',
    testingSystemAudio: 'Testing audio capture...',
    testMicButton: 'Check Microphone',
    testingMic: 'Testing microphone...',
    testAccessibilityButton: 'Check Accessibility',
    systemAudioActive: 'Laptop sound loopback active',
    micActive: 'Microphone signal active',
    accessibilityActive: 'Accessibility granted',
    micPermissionPrompt: 'Speak into microphone...',
    permissionGranted: 'Granted',
    permissionDenied: 'Denied — Click to Open Settings',
    permissionNotNeeded: 'Not needed on this platform',
    permissionUnknown: 'Not verified',
    permissionRestricted: 'Restricted by system',
    checkingPermissions: 'Checking...',
    openSystemSettings: 'Open System Settings',
    sttEngineHeading: 'Speech-to-Text (STT) Engine',
    sttEngineLocal: 'Local Whisper (Offline)',
    sttEngineCloud: 'Cloud Whisper API',
    localModelsLabel: 'Installed Local Whisper Model',
    downloadModelButton: 'Download',
    downloadingModel: 'Downloading...',
    modelReady: 'Ready',
    cloudSttUrlLabel: 'Cloud STT Base URL',
    cloudSttKeyLabel: 'Cloud STT API Key',
    cloudSttModelLabel: 'Cloud STT Model Name',
    sttLanguageLabel: 'Recognition Language',
    projectContextHeading: 'Project Context & AI Defense Notes',
    projectFolderLabel: 'Target Project Folder',
    chooseFolderButton: 'Choose Folder',
    noFolderSelected: 'No folder selected',
    filesIndexed: 'files indexed',
    charactersIndexed: 'code indexed',
    analyzeProjectButton: 'Analyze Project with AI',
    analyzingProject: 'Analyzing project...',
    analyzeProjectHint: 'AI scans the project folder and writes architecture, key files, and teacher Q&A into notes.',
    analyzeProjectSuccess: 'Project analyzed and saved to notes!',
    customNotesLabel: 'Project Summary & Defense Notes (for fast AI answers)',
    customNotesPlaceholder: 'Click "Analyze Project with AI" above to auto-generate project notes, or type your own...',

    appearanceHeading: 'Speed & Visual Styling',
    appearanceSubheading: 'Tune scrolling rate, typography, and contrast for maximum readability.',
    scrollSpeedLabel: 'Scroll Speed',
    scrollSpeedUnit: 'px/s',
    wpmEquivalent: 'words/min',
    speedSlow: 'Slow (10 px/s)',
    speedNormal: 'Normal (45 px/s)',
    speedFast: 'Fast (200 px/s)',
    typographyHeading: 'Typography & Legibility',
    systemFontLabel: 'macOS System Font',
    fontSizeLabel: 'Font Size',
    textShadowLabel: 'High-Contrast Text Shadow',
    textShadowHint: 'Adds an outline for crisp reading over bright windows & slides',
    backgroundHeading: 'Background & Opacity',
    bgOpacityLabel: 'Overlay Background Opacity',
    bgOpacityTransparent: '100% Transparent (Glass)',
    bgOpacityTranslucent: 'Translucent (65%)',
    bgOpacityOpaque: 'Solid Opaque',
    textColorLabel: 'Text Color',
    bgColorLabel: 'Backdrop Color',
    focalGuideHeading: 'Eye-Line Focal Guide',
    focalGuideLabel: 'Horizontal Eye-Line Guide',
    focalGuideHint: 'Subtle guideline to keep natural eye contact with camera lens',
    focalPositionLabel: 'Eye-Line Vertical Position',
    focalPositionUnit: '% from top',
    mirrorHeading: 'Physical Teleprompter Mirroring',
    mirrorLabel: 'Mirror Mode (Horizontal Flip)',
    mirrorHint: 'Flips text for reflection in physical beam-splitter prompter glass',

    positionHeading: 'Position & Display Geometry',
    positionSubheading: 'Place the prompter right under your camera lens for natural eye contact.',
    presetsHeading: 'Placement Presets',
    presetTopCenterTitle: 'Top-Center (Webcam Mount)',
    presetTopCenterDesc: 'Directly under MacBook or external webcam for perfect eye contact',
    presetTopFullTitle: 'Top Full Width',
    presetTopFullDesc: 'Subtle banner across the top edge of your screen',
    presetCenterTitle: 'Screen Center',
    presetCenterDesc: 'Prominent middle area for standing rehearsals',
    presetLeftTitle: 'Left Column',
    presetLeftDesc: 'Vertical sidebar alongside your presentation slides',
    presetRightTitle: 'Right Column',
    presetRightDesc: 'Vertical sidebar along the right monitor edge',
    presetCustomTitle: 'Custom Coordinates',
    presetCustomDesc: 'Manual pixel dimensions and offsets',
    customGeometryHeading: 'Custom Dimensions',
    windowWidthLabel: 'Window Width',
    windowHeightLabel: 'Window Height',
    verticalOffsetLabel: 'Vertical Position Y',
    verticalOffsetHint: 'Distance from top menu bar (px)',

    hotkeysHeading: 'Conflict-Free Global Hotkeys',
    hotkeysSubheading: 'Control scrolling and prompt the AI without taking focus away from your call.',
    actionToggle: 'Toggle Play / Pause',
    actionToggleDesc: 'Instantly starts or pauses script scrolling',
    actionClose: 'Close Overlay & Restore Dock',
    actionCloseDesc: 'Closes prompter and restores app icon to Dock',
    actionRewind: 'Rewind to Top',
    actionRewindDesc: 'Resets script back to starting position',
    actionSpeedUp: 'Speed Up (+10 px/s)',
    actionSpeedUpDesc: 'Accelerates scrolling speed smoothly',
    actionSpeedDown: 'Slow Down (-10 px/s)',
    actionSpeedDownDesc: 'Decelerates scrolling speed smoothly',
    actionAskAI: 'Ask AI Copilot (Instant Answer)',
    actionAskAIDesc: 'Queries the LLM based on latest spoken questions and project context',
    stealthNotesHeading: 'How Stealth Works',
    stealthNote1Title: 'NSWindowSharingNone Protection',
    stealthNote1Desc: 'Hardware-level macOS WindowServer protection. 100% invisible to OBS, Zoom, Teams, Meet, and ScreenCaptureKit.',
    stealthNote2Title: 'Click-Through Overlay',
    stealthNote2Desc: 'All mouse clicks and gestures pass straight through to Keynote, PowerPoint, or browser windows underneath.',
    stealthNote3Title: 'Dock & App Switcher Hiding',
    stealthNote3Desc: 'Cyrano vanishes from the macOS Dock and Cmd+Tab switcher the moment the overlay starts.',

    hudPlaying: '▶ PLAYING',
    hudPaused: '⏸ PAUSED',
    hudRewound: '⏮ REWOUND TO TOP',
    hudSpeed: '⚡ SPEED',
    copilotListening: '🎙 LISTENING',
    copilotThinking: '🧠 THINKING...',
    copilotReady: '✨ COPILOT READY',
    copilotQuestionDetected: '❓ QUESTION DETECTED',
    copilotNoTranscript: 'Listening for conversation audio...',

    sampleScript: `Welcome to Cyrano!

This teleprompter overlay is completely invisible to OBS, Zoom, Google Meet, QuickTime, and screen shares.

Mouse clicks pass right through this window to any application underneath.

Global Controls:
• ⌃⌥⌘P (Ctrl+Alt+Cmd+P) : Start / Pause scrolling
• ⌃⌥⌘A (Ctrl+Alt+Cmd+A) : Ask AI Copilot (instant answer)
• ⌃⌥⌘X (Ctrl+Alt+Cmd+X) : Close overlay & return to Settings
• ⌃⌥⌘R (Ctrl+Alt+Cmd+R) : Rewind script to top
• ⌃⌥⌘↑ / ↓ : Adjust scroll speed (+/- 10 px/s)

Position this window right beneath your webcam lens to maintain natural eye contact with your audience.`
  },

  ru: {
    appName: 'CYRANO',
    appBadge: '',
    appSubtitle: 'Невидим для OBS, Zoom и записи экрана (NSWindowSharingNone)',
    launchButton: 'Запустить оверлей',
    savedToast: 'Сохранено',
    resetConfirm: 'Сбросить все настройки к исходным значениям?',
    resetButton: 'Сбросить настройки',

    modePrompter: 'Телесуфлер',
    modeCopilot: 'AI Copilot',
    modeBadgePrompter: 'ТЕЛЕСУФЛЕР',
    modeBadgeCopilot: 'AI COPILOT',
    viewStandard: 'Обычный',
    viewCompact: 'Компактный',
    copilotCompactLabel: 'Компактный вид оверлея (не загораживает экран)',
    copilotCompactHint: 'Мини-карточка под камерой: не перекрывает обзор и печатает ответ сразу на месте (без бегущей строки телесуфлера).',
    copilotOpacityHeading: 'Прозрачность оверлея AI Copilot',
    copilotOpacityLabel: 'Прозрачность подложки AI Copilot',
    copilotGlassHint: '100% Стекло (Текст и кнопки парят поверх экрана)',
    miniWindowButton: 'Мини-окно',
    expandWindowButton: 'Полный вид',

    tabScript: 'Текст сценария',
    tabCopilot: 'ИИ и Модели',
    tabAudioContext: 'Звук и Контекст',
    tabAppearance: 'Стиль и скорость',
    tabPosition: 'Позиция и размер',
    tabHotkeys: 'Горячие клавиши',

    scriptHeading: 'Текст сценария',
    scriptSubheading: 'Вставьте или напишите текст вашей речи. Форматируется для моментальной читаемости.',
    scriptPlaceholder: 'Вставьте ваш сценарий, текст доклада или заметки к презентации здесь...',
    wordsLabel: 'Слов',
    charsLabel: 'Символов',
    durationLabel: 'Примерное время',
    durationMinutes: 'мин',
    durationSeconds: 'сек',
    wpmCadenceHint: 'Рассчитано по средней скорости 135 слов в минуту',
    loadSampleButton: 'Загрузить пример',
    clearButton: 'Очистить',

    copilotHeading: 'AI Копилот для встреч и собеседований (LLM)',
    copilotSubheading: 'Подключите Claude, OpenAI, Omnirouter или любой API URL для быстрых подсказок в реальном времени.',
    presetProviderLabel: 'Готовые пресеты провайдеров',
    customBaseUrlLabel: 'API Base URL',
    customBaseUrlHint: 'например: https://api.anthropic.com, https://openrouter.ai/api/v1, https://api.omnirouter.ai/v1',
    apiKeyLabel: 'API-ключ',
    apiKeyPlaceholder: 'sk-ant-... или sk-...',
    modelLabel: 'Идентификатор модели (Model ID)',
    modelPlaceholder: 'claude-opus-5, gpt-4o, qwen2.5-coder и др.',
    testConnectionButton: 'Проверить подключение',
    testingConnection: 'Проверка...',
    connectionSuccess: 'Подключение успешно!',
    connectionFailed: 'Ошибка подключения',
    triggerModeHeading: 'Режим генерации ответов',
    triggerModeLabel: 'Когда нейросеть формирует ответ на созвоне',
    triggerModeBoth: 'Хоткей + Авто-ответ',
    triggerModeBothDesc: 'Авто-ответ после вопроса + по клавише',
    triggerModeHotkey: 'Только хоткей (⌃⌥⌘A)',
    triggerModeHotkeyDesc: 'Ответ только по нажатию клавиши',
    triggerModeAuto: 'Только авто-ответ',
    triggerModeAutoDesc: 'Сразу после вопроса собеседника',
    systemPromptHeading: 'Системный промпт (Инструкция ассистенту)',
    systemPromptHint: 'Задает формат ответов (краткий тезис для произнесения вслух + факты по проекту).',

    audioContextHeading: 'Захват звука и контекст проекта',
    audioContextSubheading: 'Слушайте звук мита и микрофон, распознавайте речь локально и передавайте код проекта.',
    audioCaptureHeading: 'Источники аудиопотока',
    captureSystemLabel: 'Захватывать системный звук (Собеседники / Преподаватель)',
    captureSystemHint: 'Перехватывает речь из Zoom, Google Meet, Teams, Discord, Telegram',
    captureMicLabel: 'Захватывать микрофон пользователя',
    captureMicHint: 'Записывает ваши реплики, чтобы ИИ понимал полный контекст диалога',
    permissionsHeading: 'Системные разрешения',
    permissionScreenLabel: 'Запись экрана',
    permissionScreenHint: 'Необходимо для захвата системного звука из Zoom, Meet, браузера и т.д.',
    permissionMicLabel: 'Доступ к микрофону',
    permissionMicHint: 'Необходим для захвата вашего голоса и окружающего звука мита.',
    permissionAccessibilityLabel: 'Универсальный доступ (опционально)',
    permissionAccessibilityHint: 'Включает глобальные горячие клавиши при фокусе других приложений.',
    checkPermissionsButton: 'Проверить разрешения',
    checkAllPermissionsButton: 'Проверить все разрешения',
    testSystemAudioButton: 'Проверить звук ноутбука',
    testingSystemAudio: 'Тестирование захвата звука...',
    testMicButton: 'Проверить микрофон',
    testingMic: 'Тестирование микрофона...',
    testAccessibilityButton: 'Проверить доступ',
    systemAudioActive: 'Звук с ноутбука успешно захватывается',
    micActive: 'Сигнал с микрофона успешно поступает',
    accessibilityActive: 'Универсальный доступ активен',
    micPermissionPrompt: 'Говорите в микрофон...',
    permissionGranted: 'Разрешено',
    permissionDenied: 'Запрещено — Нажмите для открытия настроек',
    permissionNotNeeded: 'Не требуется на этой платформе',
    permissionUnknown: 'Не проверено',
    permissionRestricted: 'Ограничено системой',
    checkingPermissions: 'Проверка...',
    openSystemSettings: 'Открыть системные настройки',
    sttEngineHeading: 'Движок распознавания речи (STT)',
    sttEngineLocal: 'Локальный Whisper (Офлайн)',
    sttEngineCloud: 'Облачный Whisper API',
    localModelsLabel: 'Локальная модель Whisper',
    downloadModelButton: 'Скачать',
    downloadingModel: 'Загрузка...',
    modelReady: 'Готова',
    cloudSttUrlLabel: 'URL облачного STT эндпоинта',
    cloudSttKeyLabel: 'API-ключ облачного STT',
    cloudSttModelLabel: 'Название модели облачного STT',
    sttLanguageLabel: 'Язык распознавания',
    projectContextHeading: 'Папка проекта и авто-конспект для защиты',
    projectFolderLabel: 'Папка с проектом',
    chooseFolderButton: 'Выбрать папку',
    noFolderSelected: 'Папка с проектом не выбрана',
    filesIndexed: 'файлов в индексе',
    charactersIndexed: 'кода',
    analyzeProjectButton: 'Проанализировать проект ИИ',
    analyzingProject: 'Анализирую проект...',
    analyzeProjectHint: 'Модель сама изучит код выбранной папки и запишет в заметки архитектуру, важные файлы и ответы на вопросы преподавателя.',
    analyzeProjectSuccess: 'Проект проанализирован, важное сохранено в заметки!',
    customNotesLabel: 'Важные заметки по проекту (конспект для быстрых ответов)',
    customNotesPlaceholder: 'Нажмите «Проанализировать проект ИИ» после выбора папки — модель сама заполнит это поле важной информацией по коду для ответов преподавателю...',

    appearanceHeading: 'Скорость и оформление',
    appearanceSubheading: 'Настройте скорость прокрутки, типографику и контрастность под ваш стиль.',
    scrollSpeedLabel: 'Скорость прокрутки',
    scrollSpeedUnit: 'пкс/с',
    wpmEquivalent: 'слов/мин',
    speedSlow: 'Медленно (10 пкс/с)',
    speedNormal: 'Нормально (45 пкс/с)',
    speedFast: 'Быстро (200 пкс/с)',
    typographyHeading: 'Типографика и читаемость',
    systemFontLabel: 'Системный шрифт macOS',
    fontSizeLabel: 'Размер шрифта',
    textShadowLabel: 'Контрастная тень текста',
    textShadowHint: 'Добавляет четкую обводку букв для чтения поверх светлых слайдов и окон',
    backgroundHeading: 'Фон и прозрачность',
    bgOpacityLabel: 'Прозрачность подложки оверлея',
    bgOpacityTransparent: '100% Прозрачный (Только текст)',
    bgOpacityTranslucent: 'Полупрозрачный (65%)',
    bgOpacityOpaque: 'Непрозрачный',
    textColorLabel: 'Цвет текста',
    bgColorLabel: 'Цвет подложки',
    focalGuideHeading: 'Горизонтальная линия взгляда',
    focalGuideLabel: 'Линия зрительного контакта',
    focalGuideHint: 'Тонкая линия-ориентир для естественного зрительного контакта с камерой',
    focalPositionLabel: 'Положение линии взгляда',
    focalPositionUnit: '% от верха',
    mirrorHeading: 'Отражение для физических суфлеров',
    mirrorLabel: 'Зеркальный режим (по горизонтали)',
    mirrorHint: 'Отражает текст для чтения в полупрозрачном стекле телесуфлера',

    positionHeading: 'Позиция и геометрия окна',
    positionSubheading: 'Расположите окно суфлера прямо под объективом камеры для естественного взгляда.',
    presetsHeading: 'Готовые пресеты',
    presetTopCenterTitle: 'По центру сверху (Под камерой)',
    presetTopCenterDesc: 'Прямо под веб-камерой MacBook или монитора для идеального контакта',
    presetTopFullTitle: 'Во всю ширину сверху',
    presetTopFullDesc: 'Широкая компактная полоса в верхней части дисплея',
    presetCenterTitle: 'Центр экрана',
    presetCenterDesc: 'По центру экрана для репетиций стоя',
    presetLeftTitle: 'Левая колонка',
    presetLeftDesc: 'Вертикальная панель слева от презентации',
    presetRightTitle: 'Правая колонка',
    presetRightDesc: 'Вертикальная панель вдоль правого края',
    presetCustomTitle: 'Произвольные размеры',
    presetCustomDesc: 'Ручная настройка ширины, высоты и отступов в пикселях',
    customGeometryHeading: 'Точные размеры',
    windowWidthLabel: 'Ширина окна',
    windowHeightLabel: 'Высота окна',
    verticalOffsetLabel: 'Отступ сверху Y',
    verticalOffsetHint: 'Расстояние от верхней строки меню (пкс)',

    hotkeysHeading: 'Глобальные горячие клавиши',
    hotkeysSubheading: 'Управляйте суфлером во время звонка, не переключая фокус окон.',
    actionToggle: 'Старт / Пауза прокрутки',
    actionToggleDesc: 'Мгновенно запускает или останавливает движение текста',
    actionClose: 'Закрыть оверлей и вернуть Док',
    actionCloseDesc: 'Закрывает суфлер и восстанавливает значок в Dock',
    actionRewind: 'Перемотать в начало',
    actionRewindDesc: 'Возвращает текст на самую первую строчку',
    actionSpeedUp: 'Увеличить скорость (+10 пкс/с)',
    actionSpeedUpDesc: 'Плавно ускоряет прокрутку текста',
    actionSpeedDown: 'Уменьшить скорость (-10 пкс/с)',
    actionSpeedDownDesc: 'Плавно замедляет прокрутку текста',
    actionAskAI: 'Запросить ответ ИИ (AI Copilot)',
    actionAskAIDesc: 'Быстрый анализ последнего вопроса из мита с учетом контекста проекта',
    stealthNotesHeading: 'Как работает режим невидимости',
    stealthNote1Title: 'Защита NSWindowSharingNone',
    stealthNote1Desc: 'Аппаратная защита на уровне macOS WindowServer. Окно на 100% исключено из захвата OBS, Zoom, Teams, Meet и QuickTime.',
    stealthNote2Title: 'Сквозные клики (Click-Through)',
    stealthNote2Desc: 'Все клики и жесты мыши беспрепятственно передаются в Keynote, браузер или слайды под суфлером.',
    stealthNote3Title: 'Скрытие из Dock и Cmd+Tab',
    stealthNote3Desc: 'Cyrano мгновенно исчезает из панели Dock и переключателя окон при запуске оверлея.',

    hudPlaying: '▶ ВОСПРОИЗВЕДЕНИЕ',
    hudPaused: '⏸ ПАУЗА',
    hudRewound: '⏮ В НАЧАЛО',
    hudSpeed: '⚡ СКОРОСТЬ',
    copilotListening: '🎙 СЛУШАЮ МИТ',
    copilotThinking: '🧠 АНАЛИЗ ВОПРОСА...',
    copilotReady: '✨ КОПИЛОТ ГОТОВ',
    copilotQuestionDetected: '❓ ВОПРОС ОБНАРУЖЕН',
    copilotNoTranscript: 'Слушаю аудио созвона и микрофон...',

    sampleScript: `Добро пожаловать в Cyrano!

Этот телесуфлер полностью невидим для OBS, Zoom, Google Meet, QuickTime и демонстрации экрана.

Клики мыши проходят сквозь окно прямо в программы под ним — вы можете листать слайды, открывать вкладки и работать как обычно.

Глобальные горячие клавиши:
• ⌃⌥⌘P (Ctrl+Alt+Cmd+P) : Старт / Пауза прокрутки
• ⌃⌥⌘A (Ctrl+Alt+Cmd+A) : Запросить ответ AI Copilot
• ⌃⌥⌘X (Ctrl+Alt+Cmd+X) : Закрыть суфлер и вернуться в настройки
• ⌃⌥⌘R (Ctrl+Alt+Cmd+R) : Перемотать текст в начало
• ⌃⌥⌘↑ / ↓ : Регулировка скорости (+/- 10 пкс/с)

Расположите окно прямо под глазком веб-камеры, чтобы сохранить естественный зрительный контакт со зрителями.`
  },

  uk: {
    appName: 'CYRANO',
    appBadge: '',
    appSubtitle: 'Невидимий для OBS, Zoom та запису екрана (NSWindowSharingNone)',
    launchButton: 'Запустити оверлей',
    savedToast: 'Збережено',
    resetConfirm: 'Скинути всі налаштування до початкових значень?',
    resetButton: 'Скинути налаштування',

    modePrompter: 'Телесуфлер',
    modeCopilot: 'AI Copilot',
    modeBadgePrompter: 'ТЕЛЕСУФЛЕР',
    modeBadgeCopilot: 'AI COPILOT',
    viewStandard: 'Звичайний',
    viewCompact: 'Компактний',
    copilotCompactLabel: 'Компактний вигляд оверлею (не затуляє екран)',
    copilotCompactHint: 'Міні-картка під камерою: не перекриває огляд і друкує відповідь одразу на місці (без руху телесуфлера).',
    copilotOpacityHeading: 'Прозорість оверлею AI Copilot',
    copilotOpacityLabel: 'Прозорість підкладки AI Copilot',
    copilotGlassHint: '100% Скло (Текст та елементи ширяють над екраном)',
    miniWindowButton: 'Міні-вікно',
    expandWindowButton: 'Повний вигляд',

    tabScript: 'Текст сценарію',
    tabCopilot: 'ШІ та Моделі',
    tabAudioContext: 'Звук та Контекст',
    tabAppearance: 'Стиль і швидкість',
    tabPosition: 'Позиція та розмір',
    tabHotkeys: 'Гарячі клавіші',

    scriptHeading: 'Текст сценарію',
    scriptSubheading: 'Вставте або напишіть текст вашої промови. Форматовано для миттєвої читабельності.',
    scriptPlaceholder: 'Вставте ваш сценарій, текст промови або нотатки до презентації тут...',
    wordsLabel: 'Слів',
    charsLabel: 'Символів',
    durationLabel: 'Орієнтовний час',
    durationMinutes: 'хв',
    durationSeconds: 'сек',
    wpmCadenceHint: 'Розраховано за середньою швидкістю 135 слів на хвилину',
    loadSampleButton: 'Завантажити зразок',
    clearButton: 'Очистити',

    copilotHeading: 'AI Копілот для зустрічей та співбесід (LLM)',
    copilotSubheading: 'Підключіть Claude, OpenAI, Omnirouter або будь-який API URL для швидких підказок у реальному часі.',
    presetProviderLabel: 'Готові пресети провайдерів',
    customBaseUrlLabel: 'API Base URL',
    customBaseUrlHint: 'наприклад: https://api.anthropic.com, https://openrouter.ai/api/v1, https://api.omnirouter.ai/v1',
    apiKeyLabel: 'API-ключ',
    apiKeyPlaceholder: 'sk-ant-... або sk-...',
    modelLabel: 'Ідентифікатор моделі (Model ID)',
    modelPlaceholder: 'claude-opus-5, gpt-4o, qwen2.5-coder тощо',
    testConnectionButton: 'Перевірити підключення',
    testingConnection: 'Перевірка...',
    connectionSuccess: 'Підключення успішне!',
    connectionFailed: 'Помилка підключення',
    triggerModeHeading: 'Режим генерації відповідей',
    triggerModeLabel: 'Коли нейромережа формує відповідь на дзвінку',
    triggerModeBoth: 'Хоткей + Авто-відповідь',
    triggerModeBothDesc: 'Авто-відповідь після запитання + за клавішею',
    triggerModeHotkey: 'Тільки хоткей (⌃⌥⌘A)',
    triggerModeHotkeyDesc: 'Відповідь тільки при натисканні клавіші',
    triggerModeAuto: 'Тільки авто-відповідь',
    triggerModeAutoDesc: 'Одразу після запитання співрозмовника',
    systemPromptHeading: 'Системний промпт (Інструкція асистенту)',
    systemPromptHint: 'Задає формат відповідей (коротка теза для усного озвучення + факти по проекту).',

    audioContextHeading: 'Захоплення звуку та контекст проекту',
    audioContextSubheading: 'Слухайте звук міта та мікрофон, розпізнавайте мову локально та передавайте код проекту.',
    audioCaptureHeading: 'Джерела аудіопотоку',
    captureSystemLabel: 'Захоплювати системний звук (Співрозмовники / Викладач)',
    captureSystemHint: 'Перехоплює мову із Zoom, Google Meet, Teams, Discord, Telegram',
    captureMicLabel: 'Захоплювати мікрофон користувача',
    captureMicHint: 'Записує ваші репліки, щоб ШІ розумів повний контекст розмови',
    permissionsHeading: 'Системні дозволи',
    permissionScreenLabel: 'Запис екрана',
    permissionScreenHint: 'Потрібно для захоплення системного звуку з Zoom, Meet, браузера тощо.',
    permissionMicLabel: 'Доступ до мікрофона',
    permissionMicHint: 'Потрібен для захоплення вашого голосу та навколишнього звуку міта.',
    permissionAccessibilityLabel: 'Універсальний доступ (опціонально)',
    permissionAccessibilityHint: 'Вмикає глобальні гарячі клавіші при фокусі інших додатків.',
    checkPermissionsButton: 'Перевірити дозволи',
    checkAllPermissionsButton: 'Перевірити всі дозволи',
    testSystemAudioButton: 'Перевірити звук ноутбука',
    testingSystemAudio: 'Тестування захоплення звуку...',
    testMicButton: 'Перевірити мікрофон',
    testingMic: 'Тестування мікрофона...',
    testAccessibilityButton: 'Перевірити доступ',
    systemAudioActive: 'Звук з ноутбука успішно захоплюється',
    micActive: 'Сигнал з мікрофона успішно надходить',
    accessibilityActive: 'Універсальний доступ активний',
    micPermissionPrompt: 'Говоріть у мікрофон...',
    permissionGranted: 'Дозволено',
    permissionDenied: 'Заборонено — Натисніть для відкриття налаштувань',
    permissionNotNeeded: 'Не потрібно на цій платформі',
    permissionUnknown: 'Не перевірено',
    permissionRestricted: 'Обмежено системою',
    checkingPermissions: 'Перевірка...',
    openSystemSettings: 'Відкрити системні налаштування',
    sttEngineHeading: 'Двигун розпізнавання мови (STT)',
    sttEngineLocal: 'Локальний Whisper (Офлайн)',
    sttEngineCloud: 'Хмарний Whisper API',
    localModelsLabel: 'Локальна модель Whisper',
    downloadModelButton: 'Завантажити',
    downloadingModel: 'Завантаження...',
    modelReady: 'Готова',
    cloudSttUrlLabel: 'URL хмарного STT ендпоінта',
    cloudSttKeyLabel: 'API-ключ хмарного STT',
    cloudSttModelLabel: 'Назва моделі хмарного STT',
    sttLanguageLabel: 'Мова розпізнавання',
    projectContextHeading: 'Папка проекту та авто-конспект для захисту',
    projectFolderLabel: 'Папка з проектом',
    chooseFolderButton: 'Вибрати папку',
    noFolderSelected: 'Папка не вибрана',
    filesIndexed: 'файлів в індексі',
    charactersIndexed: 'коду',
    analyzeProjectButton: 'Проаналізувати проект ШІ',
    analyzingProject: 'Аналізую проект...',
    analyzeProjectHint: 'Модель сама вивчить код вибраної папки та запише в нотатки архітектуру, важливі файли та відповіді на питання викладача.',
    analyzeProjectSuccess: 'Проект проаналізовано, важливе збережено в нотатки!',
    customNotesLabel: 'Важливі нотатки по проекту (конспект для швидких відповідей)',
    customNotesPlaceholder: 'Натисніть «Проаналізувати проект ШІ» після вибору папки — модель сама заповнить це поле важливою інформацією по коду...',

    appearanceHeading: 'Швидкість та оформлення',
    appearanceSubheading: 'Налаштуйте швидкість прокручування, типографіку та контрастність під ваш виступ.',
    scrollSpeedLabel: 'Швидкість прокручування',
    scrollSpeedUnit: 'пкс/с',
    wpmEquivalent: 'слів/хв',
    speedSlow: 'Повільно (10 пкс/с)',
    speedNormal: 'Нормально (45 пкс/с)',
    speedFast: 'Швидко (200 пкс/с)',
    typographyHeading: 'Типографіка та читабельність',
    systemFontLabel: 'Системний шрифт macOS',
    fontSizeLabel: 'Розмір шрифту',
    textShadowLabel: 'Контрастна тінь тексту',
    textShadowHint: 'Додає чітку обводку літер для читання поверх світлих слайдів та вікон',
    backgroundHeading: 'Фон та прозорість',
    bgOpacityLabel: 'Прозорість підкладки оверлею',
    bgOpacityTransparent: '100% Прозорий (Тільки текст)',
    bgOpacityTranslucent: 'Напівпрозорий (65%)',
    bgOpacityOpaque: 'Непрозорий',
    textColorLabel: 'Колір тексту',
    bgColorLabel: 'Колір підкладки',
    focalGuideHeading: 'Горизонтальна лінія погляду',
    focalGuideLabel: 'Лінія зорового контакту',
    focalGuideHint: 'Тонка лінія-орієнтир для природного зорового контакту з камерою',
    focalPositionLabel: 'Положення лінії погляду',
    focalPositionUnit: '% згори',
    mirrorHeading: 'Відображення для фізичних суфлерів',
    mirrorLabel: 'Дзеркальний режим (по горизонталі)',
    mirrorHint: 'Відображає текст для читання у напівпрозорому склі телесуфлера',

    positionHeading: 'Позиція та геометрія вікна',
    positionSubheading: 'Розташуйте вікно суфлера прямо під об’єктивом камери для природного погляду.',
    presetsHeading: 'Готові пресети',
    presetTopCenterTitle: 'По центру згори (Під камерою)',
    presetTopCenterDesc: 'Прямо під веб-камерою MacBook або монітора для ідеального контакту',
    presetTopFullTitle: 'На всю ширину згори',
    presetTopFullDesc: 'Широка компактна смуга у верхній частині дисплея',
    presetCenterTitle: 'Центр екрана',
    presetCenterDesc: 'По центру екрана для репетицій стоячи',
    presetLeftTitle: 'Ліва колонка',
    presetLeftDesc: 'Вертикальна панель ліворуч від презентації',
    presetRightTitle: 'Права колонка',
    presetRightDesc: 'Вертикальна панель уздовж правого краю',
    presetCustomTitle: 'Довільні розміри',
    presetCustomDesc: 'Ручне налаштування ширини, висоти та відступів у пікселях',
    customGeometryHeading: 'Точні розміри',
    windowWidthLabel: 'Ширина вікна',
    windowHeightLabel: 'Висота вікна',
    verticalOffsetLabel: 'Відступ згори Y',
    verticalOffsetHint: 'Відстань від верхнього меню (пкс)',

    hotkeysHeading: 'Глобальні гарячі клавіші',
    hotkeysSubheading: 'Керуйте суфлером під час дзвінка, не перемикаючи фокус вікон.',
    actionToggle: 'Старт / Пауза прокручування',
    actionToggleDesc: 'Миттєво запускає або зупиняє рух тексту',
    actionClose: 'Закрити оверлей та повернути Док',
    actionCloseDesc: 'Закриває суфлер та відновлює піктограму в Dock',
    actionRewind: 'Перемотати на початок',
    actionRewindDesc: 'Повертає текст на найперший рядок',
    actionSpeedUp: 'Збільшити швидкість (+10 пкс/с)',
    actionSpeedUpDesc: 'Плавно прискорює прокручування тексту',
    actionSpeedDown: 'Зменшити швидкість (-10 пкс/с)',
    actionSpeedDownDesc: 'Плавно сповільнює прокручування тексту',
    actionAskAI: 'Запросити відповідь ШІ (AI Copilot)',
    actionAskAIDesc: 'Швидкий аналіз останнього запитання з міта з урахуванням контексту проекту',
    stealthNotesHeading: 'Як працює режим невидимості',
    stealthNote1Title: 'Захист NSWindowSharingNone',
    stealthNote1Desc: 'Апаратний захист на рівні macOS WindowServer. Вікно на 100% виключено із запису OBS, Zoom, Teams, Meet та QuickTime.',
    stealthNote2Title: 'Наскрізні кліки (Click-Through)',
    stealthNote2Desc: 'Всі кліки та жести миші безперешкодно передаються у Keynote, браузер чи слайди під суфлером.',
    stealthNote3Title: 'Приховування з Dock та Cmd+Tab',
    stealthNote3Desc: 'Cyrano миттєво зникає з панелі Dock та перемикача вікон під час запуску оверлею.',

    hudPlaying: '▶ ВІДТВОРЕННЯ',
    hudPaused: '⏸ ПАУЗА',
    hudRewound: '⏮ НА ПОЧАТОК',
    hudSpeed: '⚡ ШВИДКІСТЬ',
    copilotListening: '🎙 СЛУХАЮ МІТ',
    copilotThinking: '🧠 АНАЛІЗ ПИТАННЯ...',
    copilotReady: '✨ КОПІЛОТ ГОТОВИЙ',
    copilotQuestionDetected: '❓ ПИТАННЯ ВИЯВЛЕНО',
    copilotNoTranscript: 'Слухаю аудіо дзвінка та мікрофон...',

    sampleScript: `Ласкаво просимо до Cyrano!

Цей телесуфлер повністю невидимий для OBS, Zoom, Google Meet, QuickTime та демонстрації екрана.

Кліки миші проходять крізь вікно прямо в додатки під ним — ви можете перемикати слайди, натискати посилання та працювати як зазвичай.

Глобальні гарячі клавіші:
• ⌃⌥⌘P (Ctrl+Alt+Cmd+P) : Старт / Пауза прокручування
• ⌃⌥⌘A (Ctrl+Alt+Cmd+A) : Запитати AI Copilot
• ⌃⌥⌘X (Ctrl+Alt+Cmd+X) : Закрити суфлер та повернутися до налаштувань
• ⌃⌥⌘R (Ctrl+Alt+Cmd+R) : Перемотати текст на початок
• ⌃⌥⌘↑ / ↓ : Регулювання швидкості (+/- 10 пкс/с)

Розташуйте вікно прямо під веб-камерою, щоб підтримувати природний зоровий контакт з аудиторією.`
  }
};
