import { Language } from './types';

export interface Translations {
  appName: string;
  appBadge: string;
  appSubtitle: string;
  launchButton: string;
  savedToast: string;
  resetConfirm: string;
  resetButton: string;

  // Tabs
  tabScript: string;
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
  stealthNotesHeading: string;
  stealthNote1Title: string;
  stealthNote1Desc: string;
  stealthNote2Title: string;
  stealthNote2Desc: string;
  stealthNote3Title: string;
  stealthNote3Desc: string;

  // Overlay HUD
  hudPlaying: string;
  hudPaused: string;
  hudRewound: string;
  hudSpeed: string;

  // Sample script
  sampleScript: string;
}

export const TRANSLATIONS: Record<Language, Translations> = {
  en: {
    appName: 'CYRANO',
    appBadge: 'macOS STEALTH',
    appSubtitle: 'Invisible to OBS & Screen Sharing (NSWindowSharingNone)',
    launchButton: 'Launch Teleprompter',
    savedToast: 'Saved',
    resetConfirm: 'Reset all settings to default values?',
    resetButton: 'Reset Defaults',

    tabScript: 'Script Editor',
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
    hotkeysSubheading: 'Control scrolling without ever taking focus away from your presentation.',
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

    sampleScript: `Welcome to Cyrano!

This teleprompter overlay is completely invisible to OBS, Zoom, Google Meet, QuickTime, and screen shares.

Mouse clicks pass right through this window to any application underneath.

Global Controls:
• ⌃⌥⌘P (Ctrl+Alt+Cmd+P) : Start / Pause scrolling
• ⌃⌥⌘X (Ctrl+Alt+Cmd+X) : Close overlay & return to Settings
• ⌃⌥⌘R (Ctrl+Alt+Cmd+R) : Rewind script to top
• ⌃⌥⌘↑ / ↓ : Adjust scroll speed (+/- 10 px/s)

Position this window right beneath your webcam lens to maintain natural eye contact with your audience.`
  },

  ru: {
    appName: 'CYRANO',
    appBadge: 'macOS STEALTH',
    appSubtitle: 'Невидим для OBS и записи экрана (NSWindowSharingNone)',
    launchButton: 'Запустить суфлер',
    savedToast: 'Сохранено',
    resetConfirm: 'Сбросить все настройки к исходным значениям?',
    resetButton: 'Сбросить настройки',

    tabScript: 'Текст сценария',
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
    hotkeysSubheading: 'Управляйте суфлером во время показа слайдов, не переключая фокус окон.',
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

    sampleScript: `Добро пожаловать в Cyrano!

Этот телесуфлер полностью невидим для OBS, Zoom, Google Meet, QuickTime и демонстрации экрана.

Клики мыши проходят сквозь окно прямо в программы под ним — вы можете листать слайды, открывать вкладки и работать как обычно.

Глобальные горячие клавиши:
• ⌃⌥⌘P (Ctrl+Alt+Cmd+P) : Старт / Пауза прокрутки
• ⌃⌥⌘X (Ctrl+Alt+Cmd+X) : Закрыть суфлер и вернуться в настройки
• ⌃⌥⌘R (Ctrl+Alt+Cmd+R) : Перемотать текст в начало
• ⌃⌥⌘↑ / ↓ : Регулировка скорости (+/- 10 пкс/с)

Расположите окно прямо под глазком веб-камеры, чтобы сохранить естественный зрительный контакт со зрителями.`
  },

  uk: {
    appName: 'CYRANO',
    appBadge: 'macOS STEALTH',
    appSubtitle: 'Невидимий для OBS та запису екрана (NSWindowSharingNone)',
    launchButton: 'Запустити суфлер',
    savedToast: 'Збережено',
    resetConfirm: 'Скинути всі налаштування до початкових значень?',
    resetButton: 'Скинути налаштування',

    tabScript: 'Текст сценарію',
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
    hotkeysSubheading: 'Керуйте суфлером під час показу слайдів, не перемикаючи фокус вікон.',
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

    sampleScript: `Ласкаво просимо до Cyrano!

Цей телесуфлер повністю невидимий для OBS, Zoom, Google Meet, QuickTime та демонстрації екрана.

Кліки миші проходять крізь вікно прямо в додатки під ним — ви можете перемикати слайди, натискати посилання та працювати як зазвичай.

Глобальні гарячі клавіші:
• ⌃⌥⌘P (Ctrl+Alt+Cmd+P) : Старт / Пауза прокручування
• ⌃⌥⌘X (Ctrl+Alt+Cmd+X) : Закрити суфлер та повернутися до налаштувань
• ⌃⌥⌘R (Ctrl+Alt+Cmd+R) : Перемотати текст на початок
• ⌃⌥⌘↑ / ↓ : Регулювання швидкості (+/- 10 пкс/с)

Розташуйте вікно прямо під веб-камерою, щоб підтримувати природний зоровий контакт з аудиторією.`
  }
};
