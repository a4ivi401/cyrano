import { Language } from './types';

export interface Translations {
  appName: string;
  appBadge: string;
  appSubtitle: string;
  launchCopilotButton: string;
  launchPrompterButton: string;
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
  navCopilotSection: string;
  navTeleprompterSection: string;
  navGeneralSection: string;

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
  reviewDelayLabel: string;
  reviewDelayHint: string;
  reviewDelaySeconds: string;
  systemPromptHeading: string;
  systemPromptHint: string;
  providerProtocolLabel: string;
  providerProtocolAnthropic: string;
  providerProtocolOpenAI: string;
  providerProtocolHint: string;
  advancedSettingsHeading: string;
  advancedSettingsHint: string;

  // Copilot Readiness
  readinessHeading: string;
  readinessSubheading: string;
  readinessRefreshButton: string;
  readinessChecking: string;
  readinessUnavailable: string;
  readinessLlmTitle: string;
  readinessLlmConfigured: string;
  readinessLlmNotConfigured: string;
  readinessApiKeyConfigured: string;
  readinessApiKeyNotRequired: string;
  readinessAudioTitle: string;
  readinessAudioSystemConfigured: string;
  readinessAudioMicConfigured: string;
  readinessAudioBothConfigured: string;
  readinessAudioNotConfigured: string;
  readinessSystemLoopbackUnsupported: string;
  readinessAutoNeedsSystem: string;
  readinessSttTitle: string;
  readinessSttLocalReady: string;
  readinessSttCloudConfigured: string;
  readinessSttNotConfigured: string;
  readinessSttDownloading: string;
  readinessSttValidating: string;
  readinessSttPartial: string;
  readinessSttFailed: string;
  readinessProjectTitle: string;
  readinessProjectMissing: string;
  readinessProjectUpdated: string;
  readinessStatusReady: string;
  readinessStatusWarning: string;
  readinessStatusBlocked: string;
  readinessStatusChecking: string;
  readinessTestLlm: string;
  readinessTestAudio: string;
  readinessManageStt: string;
  readinessChooseProject: string;
  readinessRefreshProject: string;
  readinessLaunchReady: string;
  readinessLaunchReadyHint: string;
  readinessLaunchBlocked: string;
  readinessLaunchBlockedHint: string;
  readinessProjectOptionalHint: string;
  launchBlockedSummary: string;
  launchSettingsChanged: string;

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
  modelStatusMissing: string;
  modelStatusPartial: string;
  modelStatusLoading: string;
  modelStatusError: string;
  selectModelButton: string;
  selectedModelButton: string;
  retryButton: string;
  cancelButton: string;
  validatingModel: string;
  modelDownloadErrorHeading: string;
  modelDownloadErrorFallback: string;
  modelDownloadCancelled: string;
  modelProgressFallback: string;
  whisperTinyName: string;
  whisperBaseName: string;
  whisperSmallName: string;
  whisperTurboName: string;
  whisperTinyDesc: string;
  whisperBaseDesc: string;
  whisperSmallDesc: string;
  whisperTurboDesc: string;
  sttLocalDesc: string;
  sttCloudDesc: string;
  cloudSttUrlLabel: string;
  cloudSttKeyLabel: string;
  cloudSttModelLabel: string;
  cloudSttKeyPlaceholder: string;
  sttLanguageLabel: string;
  sttLanguageAuto: string;
  sttLanguageRussian: string;
  sttLanguageEnglish: string;
  sttLanguageUkrainian: string;
  defaultMicrophoneLabel: string;
  systemAudioNoTrack: string;
  systemAudioNoSignal: string;
  micNoSignal: string;
  dismissMessageLabel: string;
  refreshFolderLabel: string;
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

  // Live Copilot HUD
  hudPhaseIdle: string;
  hudPhaseAwaitingAudio: string;
  hudPhaseListening: string;
  hudPhaseCapturing: string;
  hudPhaseTranscribing: string;
  hudPhaseReviewing: string;
  hudPhaseAnswering: string;
  hudPhasePaused: string;
  hudPhaseError: string;
  hudSystemAudioLabel: string;
  hudMicrophoneLabel: string;
  hudSttLabel: string;
  hudProjectLabel: string;
  hudSessionLabel: string;
  hudSystemAudioDisabled: string;
  hudSystemAudioWaiting: string;
  hudSystemAudioConnecting: string;
  hudSystemAudioActive: string;
  hudSystemAudioSpeaking: string;
  hudSystemAudioPaused: string;
  hudMicrophoneWaiting: string;
  hudMicrophoneConnecting: string;
  hudMicrophoneActive: string;
  hudMicrophoneSpeaking: string;
  hudMicrophonePaused: string;
  hudSttQueue: string;
  hudSttTranscribing: string;
  hudSttReady: string;
  hudSttLocal: string;
  hudSttCloud: string;
  hudProjectSelected: string;
  hudProjectNone: string;
  hudProjectStale: string;
  hudEnableMeetingAudio: string;
  hudEnableMeetingAudioHint: string;
  hudEnableMicrophone: string;
  hudEnableMicrophoneHint: string;
  hudAudioDisabled: string;
  hudAudioDisabledHint: string;
  hudAsk: string;
  hudAsking: string;
  hudPause: string;
  hudResume: string;
  hudScrollUp: string;
  hudScrollDown: string;
  hudClear: string;
  hudCollapse: string;
  hudExpand: string;
  hudClose: string;
  hudQuestionDetected: string;
  hudAnswerIn: string;
  hudAnswerStarting: string;
  hudAnswerNow: string;
  hudEditQuestion: string;
  hudEditQuestionLabel: string;
  hudSaveQuestion: string;
  hudCancelEditing: string;
  hudQuestionLabel: string;
  hudAnswerHeading: string;
  hudGenerating: string;
  hudVerifiedSources: string;
  hudVerifiedSource: string;
  hudAudioErrorHeading: string;
  hudSttErrorHeading: string;
  hudLlmErrorHeading: string;
  hudProjectErrorHeading: string;
  hudSessionErrorHeading: string;
  hudRetryAudio: string;
  hudRetryStt: string;
  hudRetryAnswer: string;
  hudSystemCaptureFailed: string;
  hudMicrophoneCaptureFailed: string;
  hudTranscriptionFailed: string;
  hudSessionUnavailable: string;
  hudActionFailed: string;
  hudWaitingHeading: string;
  hudWaitingBody: string;
  sampleScript: string;
}

export const TRANSLATIONS: Record<Language, Translations> = {
  en: {
    appName: 'CYRANO',
    appBadge: '',
    appSubtitle: 'Invisible to OBS, Zoom & Screen Sharing (NSWindowSharingNone)',
    launchCopilotButton: 'Launch Copilot',
    launchPrompterButton: 'Launch Teleprompter',
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

    tabScript: 'Teleprompter',
    tabCopilot: 'AI Copilot',
    tabAudioContext: 'Audio & Context',
    tabAppearance: 'Speed & Style',
    tabPosition: 'Position & Size',
    tabHotkeys: 'Global Hotkeys',
    navCopilotSection: 'Copilot',
    navTeleprompterSection: 'Teleprompter',
    navGeneralSection: 'Shared settings',

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

    copilotHeading: 'AI Copilot',
    copilotSubheading: 'Prepare the answer model, meeting audio, speech recognition, and project context before your session.',
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
    reviewDelayLabel: 'Question review window',
    reviewDelayHint: 'Time to cancel or edit a detected question before it is sent.',
    reviewDelaySeconds: '{seconds} sec',
    systemPromptHeading: 'Copilot Behavior (System Prompt)',
    systemPromptHint: 'Tailor how the AI formats spoken answers and technical bullet points for your meeting.',
    providerProtocolLabel: 'API protocol',
    providerProtocolAnthropic: 'Anthropic Messages API',
    providerProtocolOpenAI: 'OpenAI-compatible API',
    providerProtocolHint: 'Choose the wire protocol used by this endpoint. Custom URLs do not detect it automatically.',
    advancedSettingsHeading: 'Advanced Copilot settings',
    advancedSettingsHint: 'Provider, answer trigger, overlay appearance, and system prompt',

    readinessHeading: 'Ready for your session',
    readinessSubheading: 'Check the four systems Copilot needs before joining the call.',
    readinessRefreshButton: 'Refresh readiness',
    readinessChecking: 'Checking current status...',
    readinessUnavailable: 'Readiness could not be checked. Try again before launching Copilot.',
    readinessLlmTitle: 'Answer model',
    readinessLlmConfigured: 'Configured, but not tested in this settings session',
    readinessLlmNotConfigured: 'Add the endpoint, model, and API key, then test the connection.',
    readinessApiKeyConfigured: 'API key set',
    readinessApiKeyNotRequired: 'local endpoint without a key',
    readinessAudioTitle: 'Meeting audio',
    readinessAudioSystemConfigured: 'System audio is enabled; run a signal test.',
    readinessAudioMicConfigured: 'Microphone is enabled; run a signal test.',
    readinessAudioBothConfigured: 'System audio and microphone are enabled; run a signal test.',
    readinessAudioNotConfigured: 'Enable at least one permitted audio source.',
    readinessSystemLoopbackUnsupported: 'System loopback requires Windows or macOS 13+. Enable the microphone explicitly on this platform.',
    readinessAutoNeedsSystem: 'Automatic-only mode requires supported system loopback audio.',
    readinessSttTitle: 'Speech recognition',
    readinessSttLocalReady: 'Local model files are verified and ready',
    readinessSttCloudConfigured: 'Cloud STT is configured; it will be verified when Copilot starts',
    readinessSttNotConfigured: 'Configure cloud STT credentials or choose a local model.',
    readinessSttDownloading: 'Downloading the selected local model',
    readinessSttValidating: 'Validating and loading the selected local model',
    readinessSttPartial: 'The selected local model is incomplete. Retry the download.',
    readinessSttFailed: 'The selected local model is unavailable.',
    readinessProjectTitle: 'Project context',
    readinessProjectMissing: 'No project selected. Copilot can launch without code context.',
    readinessProjectUpdated: 'indexed',
    readinessStatusReady: 'Ready',
    readinessStatusWarning: 'Needs attention',
    readinessStatusBlocked: 'Blocked',
    readinessStatusChecking: 'Checking',
    readinessTestLlm: 'Test model',
    readinessTestAudio: 'Test audio',
    readinessManageStt: 'Manage model',
    readinessChooseProject: 'Choose project',
    readinessRefreshProject: 'Refresh project',
    readinessLaunchReady: 'Copilot can launch',
    readinessLaunchReadyHint: 'Meeting audio will request permission and be verified when the overlay starts.',
    readinessLaunchBlocked: 'Copilot needs attention',
    readinessLaunchBlockedHint: 'Resolve the blocked rows above before launching.',
    readinessProjectOptionalHint: 'Project context is optional and does not block launch.',
    launchBlockedSummary: 'Launch blocked by',
    launchSettingsChanged: 'Settings changed during validation. Start again with the updated configuration.',

    audioContextHeading: 'Audio Capture & Project Context',
    audioContextSubheading: 'Capture system audio + mic, run Whisper on-device, and provide workspace code context.',
    audioCaptureHeading: 'Audio Stream Sources',
    captureSystemLabel: 'Capture System Sound (Meeting Speakers)',
    captureSystemHint: 'Uses native loopback to transcribe other participants in Zoom, Meet, Teams, etc.',
    captureMicLabel: 'Capture User Microphone',
    captureMicHint: 'Transcribes your own voice so the AI understands full conversational context',
    permissionsHeading: 'System Permissions',
    permissionScreenLabel: 'System Audio Recording',
    permissionScreenHint: 'On macOS 14.2+, captures meeting audio directly without recording the screen.',
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
    modelStatusMissing: 'Not downloaded',
    modelStatusPartial: 'Incomplete',
    modelStatusLoading: 'Preparing',
    modelStatusError: 'Error',
    selectModelButton: 'Select',
    selectedModelButton: 'Selected',
    retryButton: 'Retry',
    cancelButton: 'Cancel',
    validatingModel: 'Validating model...',
    modelDownloadErrorHeading: 'Model download failed',
    modelDownloadErrorFallback: 'The model could not be downloaded from Hugging Face.',
    modelDownloadCancelled: 'Model download cancelled.',
    modelProgressFallback: 'model files',
    whisperTinyName: 'Whisper Tiny (Fastest)',
    whisperBaseName: 'Whisper Base (Balanced)',
    whisperSmallName: 'Whisper Small (Higher accuracy)',
    whisperTurboName: 'Whisper Large v3 Turbo (Maximum accuracy)',
    whisperTinyDesc: 'Fastest on CPU. Best for clear speech and systems with limited memory.',
    whisperBaseDesc: 'Recommended balance of speed and multilingual technical accuracy.',
    whisperSmallDesc: 'Higher accuracy for mixed-language technical terminology.',
    whisperTurboDesc: 'Highest local accuracy, with greater memory and CPU requirements.',
    sttLocalDesc: 'Offline recognition on this computer',
    sttCloudDesc: 'Recognition through an explicit cloud API',
    cloudSttUrlLabel: 'Cloud STT Base URL',
    cloudSttKeyLabel: 'Cloud STT API Key',
    cloudSttModelLabel: 'Cloud STT Model Name',
    cloudSttKeyPlaceholder: 'Leave blank to reuse the LLM API key',
    sttLanguageLabel: 'Recognition Language',
    sttLanguageAuto: 'Auto-detect (RU / EN / UK)',
    sttLanguageRussian: 'Russian',
    sttLanguageEnglish: 'English',
    sttLanguageUkrainian: 'Ukrainian',
    defaultMicrophoneLabel: 'Default microphone',
    systemAudioNoTrack: 'System audio did not start. Allow Cyrano under System Audio Recording Only in Privacy & Security, then retry.',
    systemAudioNoSignal: 'The audio track opened, but no live signal was detected. Play meeting audio and retry.',
    micNoSignal: 'Microphone access was granted, but no live signal was detected.',
    dismissMessageLabel: 'Dismiss message',
    refreshFolderLabel: 'Refresh project folder',
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

    hudPhaseIdle: 'Idle',
    hudPhaseAwaitingAudio: 'Waiting for audio',
    hudPhaseListening: 'Listening',
    hudPhaseCapturing: 'Hearing speech',
    hudPhaseTranscribing: 'Transcribing',
    hudPhaseReviewing: 'Review question',
    hudPhaseAnswering: 'Answering',
    hudPhasePaused: 'Paused',
    hudPhaseError: 'Error',
    hudSystemAudioLabel: 'System audio',
    hudMicrophoneLabel: 'Microphone',
    hudSttLabel: 'STT',
    hudProjectLabel: 'Project',
    hudSessionLabel: 'Session',
    hudSystemAudioDisabled: 'Disabled',
    hudSystemAudioWaiting: 'Not enabled',
    hudSystemAudioConnecting: 'Connecting',
    hudSystemAudioActive: 'Active',
    hudSystemAudioSpeaking: 'Speech detected',
    hudSystemAudioPaused: 'Paused',
    hudMicrophoneWaiting: 'Not enabled',
    hudMicrophoneConnecting: 'Connecting',
    hudMicrophoneActive: 'Active user source',
    hudMicrophoneSpeaking: 'User speaking',
    hudMicrophonePaused: 'Paused',
    hudSttQueue: 'Queue: {count}',
    hudSttTranscribing: 'Transcribing',
    hudSttReady: 'Operational',
    hudSttLocal: 'Local Whisper',
    hudSttCloud: 'Cloud STT',
    hudProjectSelected: 'Selected',
    hudProjectNone: 'Not selected',
    hudProjectStale: 'Index stale',
    hudEnableMeetingAudio: 'Enable meeting audio',
    hudEnableMeetingAudioHint: 'Start system-audio capture. Cyrano never substitutes the microphone for meeting audio.',
    hudEnableMicrophone: 'Enable microphone',
    hudEnableMicrophoneHint: 'Start the microphone as a user source. It does not trigger automatic meeting questions.',
    hudAudioDisabled: 'Audio capture is disabled',
    hudAudioDisabledHint: 'Enable system audio or microphone in Settings before using Copilot.',
    hudAsk: 'Ask',
    hudAsking: 'Asking...',
    hudPause: 'Pause',
    hudResume: 'Resume',
    hudScrollUp: 'Scroll answer up',
    hudScrollDown: 'Scroll answer down',
    hudClear: 'Clear conversation',
    hudCollapse: 'Collapse HUD',
    hudExpand: 'Expand HUD',
    hudClose: 'Close overlay',
    hudQuestionDetected: 'Question recognized',
    hudAnswerIn: 'Answer in {seconds}s',
    hudAnswerStarting: 'Starting answer...',
    hudAnswerNow: 'Answer now',
    hudEditQuestion: 'Edit',
    hudEditQuestionLabel: 'Question text',
    hudSaveQuestion: 'Save question',
    hudCancelEditing: 'Cancel editing',
    hudQuestionLabel: 'Question',
    hudAnswerHeading: 'Answer',
    hudGenerating: 'Generating answer...',
    hudVerifiedSources: 'Verified sources',
    hudVerifiedSource: 'Verified source',
    hudAudioErrorHeading: 'Audio capture needs attention',
    hudSttErrorHeading: 'Speech recognition failed',
    hudLlmErrorHeading: 'Answer generation failed',
    hudProjectErrorHeading: 'Project context needs attention',
    hudSessionErrorHeading: 'Copilot session failed',
    hudRetryAudio: 'Retry audio',
    hudRetryStt: 'Retry recognition',
    hudRetryAnswer: 'Retry answer',
    hudSystemCaptureFailed: 'System audio capture failed. Check the shared source and retry.',
    hudMicrophoneCaptureFailed: 'Microphone capture failed. Check the selected input and retry.',
    hudTranscriptionFailed: 'Speech recognition failed. Check the STT model and retry.',
    hudSessionUnavailable: 'The Copilot session is unavailable. Close the overlay and launch it again.',
    hudActionFailed: 'The action could not be completed. Try again.',
    hudWaitingHeading: 'Listening for a question',
    hudWaitingBody: 'Capture stays active while answers are generated. Only system audio can trigger automatic questions.',

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
    launchCopilotButton: 'Запустить Copilot',
    launchPrompterButton: 'Запустить телесуфлер',
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

    tabScript: 'Телесуфлер',
    tabCopilot: 'AI Copilot',
    tabAudioContext: 'Звук и Контекст',
    tabAppearance: 'Стиль и скорость',
    tabPosition: 'Позиция и размер',
    tabHotkeys: 'Горячие клавиши',
    navCopilotSection: 'Copilot',
    navTeleprompterSection: 'Телесуфлер',
    navGeneralSection: 'Общие настройки',

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

    copilotHeading: 'AI Copilot',
    copilotSubheading: 'Подготовьте модель ответа, звук созвона, распознавание речи и контекст проекта перед занятием.',
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
    reviewDelayLabel: 'Проверка вопроса',
    reviewDelayHint: 'Время на отмену или исправление вопроса перед отправкой.',
    reviewDelaySeconds: '{seconds} сек',
    systemPromptHeading: 'Системный промпт (Инструкция ассистенту)',
    systemPromptHint: 'Задает формат ответов (краткий тезис для произнесения вслух + факты по проекту).',
    providerProtocolLabel: 'Протокол API',
    providerProtocolAnthropic: 'Anthropic Messages API',
    providerProtocolOpenAI: 'OpenAI-совместимый API',
    providerProtocolHint: 'Выберите протокол запросов для этого адреса. Для произвольного URL он не определяется автоматически.',
    advancedSettingsHeading: 'Расширенные настройки Copilot',
    advancedSettingsHint: 'Провайдер, запуск ответа, вид оверлея и системный промпт',

    readinessHeading: 'Готовность к занятию',
    readinessSubheading: 'Проверьте четыре компонента, необходимые Copilot перед созвоном.',
    readinessRefreshButton: 'Обновить готовность',
    readinessChecking: 'Проверяю текущее состояние...',
    readinessUnavailable: 'Не удалось проверить готовность. Повторите проверку перед запуском Copilot.',
    readinessLlmTitle: 'Модель ответа',
    readinessLlmConfigured: 'Настроена, но не проверена в этой сессии настроек',
    readinessLlmNotConfigured: 'Укажите адрес, модель и API-ключ, затем проверьте подключение.',
    readinessApiKeyConfigured: 'API-ключ указан',
    readinessApiKeyNotRequired: 'локальный адрес без ключа',
    readinessAudioTitle: 'Звук созвона',
    readinessAudioSystemConfigured: 'Системный звук включён, но сигнал ещё не проверен.',
    readinessAudioMicConfigured: 'Микрофон включён, но сигнал ещё не проверен.',
    readinessAudioBothConfigured: 'Системный звук и микрофон включены, но сигнал ещё не проверен.',
    readinessAudioNotConfigured: 'Включите хотя бы один разрешённый источник звука.',
    readinessSystemLoopbackUnsupported: 'Системный loopback требует Windows или macOS 13+. На этой платформе явно включите микрофон.',
    readinessAutoNeedsSystem: 'Полностью автоматический режим требует поддерживаемый системный loopback.',
    readinessSttTitle: 'Распознавание речи',
    readinessSttLocalReady: 'Файлы локальной модели проверены и готовы',
    readinessSttCloudConfigured: 'Облачный STT настроен и будет проверен при запуске Copilot',
    readinessSttNotConfigured: 'Настройте доступ к облачному STT или выберите локальную модель.',
    readinessSttDownloading: 'Загружается выбранная локальная модель',
    readinessSttValidating: 'Проверяю и загружаю выбранную локальную модель',
    readinessSttPartial: 'Выбранная локальная модель загружена не полностью. Повторите загрузку.',
    readinessSttFailed: 'Выбранная локальная модель недоступна.',
    readinessProjectTitle: 'Контекст проекта',
    readinessProjectMissing: 'Проект не выбран. Copilot можно запустить без контекста кода.',
    readinessProjectUpdated: 'проиндексировано',
    readinessStatusReady: 'Готово',
    readinessStatusWarning: 'Нужно внимание',
    readinessStatusBlocked: 'Блокирует запуск',
    readinessStatusChecking: 'Проверка',
    readinessTestLlm: 'Проверить модель',
    readinessTestAudio: 'Проверить звук',
    readinessManageStt: 'Настроить модель',
    readinessChooseProject: 'Выбрать проект',
    readinessRefreshProject: 'Обновить проект',
    readinessLaunchReady: 'Copilot можно запускать',
    readinessLaunchReadyHint: 'При запуске оверлей запросит доступ и проверит звук созвона.',
    readinessLaunchBlocked: 'Copilot требует настройки',
    readinessLaunchBlockedHint: 'Устраните блокирующие проблемы в строках выше.',
    readinessProjectOptionalHint: 'Контекст проекта необязателен и не блокирует запуск.',
    launchBlockedSummary: 'Запуск блокируют',
    launchSettingsChanged: 'Настройки изменились во время проверки. Запустите ещё раз с новой конфигурацией.',

    audioContextHeading: 'Захват звука и контекст проекта',
    audioContextSubheading: 'Слушайте звук мита и микрофон, распознавайте речь локально и передавайте код проекта.',
    audioCaptureHeading: 'Источники аудиопотока',
    captureSystemLabel: 'Захватывать системный звук (Собеседники / Преподаватель)',
    captureSystemHint: 'Перехватывает речь из Zoom, Google Meet, Teams, Discord, Telegram',
    captureMicLabel: 'Захватывать микрофон пользователя',
    captureMicHint: 'Записывает ваши реплики, чтобы ИИ понимал полный контекст диалога',
    permissionsHeading: 'Системные разрешения',
    permissionScreenLabel: 'Запись системного звука',
    permissionScreenHint: 'На macOS 14.2+ захватывает звук созвона напрямую, без записи экрана.',
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
    modelStatusMissing: 'Не загружена',
    modelStatusPartial: 'Загружена частично',
    modelStatusLoading: 'Подготовка',
    modelStatusError: 'Ошибка',
    selectModelButton: 'Выбрать',
    selectedModelButton: 'Выбрана',
    retryButton: 'Повторить',
    cancelButton: 'Отменить',
    validatingModel: 'Проверяю модель...',
    modelDownloadErrorHeading: 'Ошибка загрузки модели',
    modelDownloadErrorFallback: 'Не удалось загрузить модель с Hugging Face.',
    modelDownloadCancelled: 'Загрузка модели отменена.',
    modelProgressFallback: 'файлы модели',
    whisperTinyName: 'Whisper Tiny (Самая быстрая)',
    whisperBaseName: 'Whisper Base (Сбалансированная)',
    whisperSmallName: 'Whisper Small (Повышенная точность)',
    whisperTurboName: 'Whisper Large v3 Turbo (Максимальная точность)',
    whisperTinyDesc: 'Самая быстрая на CPU. Подходит для чистой речи и устройств с небольшим объёмом памяти.',
    whisperBaseDesc: 'Рекомендуемый баланс скорости и точности технической речи на нескольких языках.',
    whisperSmallDesc: 'Повышенная точность для смешанной технической терминологии.',
    whisperTurboDesc: 'Максимальная локальная точность с повышенными требованиями к памяти и CPU.',
    sttLocalDesc: 'Офлайн-распознавание на этом компьютере',
    sttCloudDesc: 'Распознавание через явно настроенный облачный API',
    cloudSttUrlLabel: 'URL облачного STT эндпоинта',
    cloudSttKeyLabel: 'API-ключ облачного STT',
    cloudSttModelLabel: 'Название модели облачного STT',
    cloudSttKeyPlaceholder: 'Оставьте пустым, чтобы использовать ключ LLM',
    sttLanguageLabel: 'Язык распознавания',
    sttLanguageAuto: 'Определять автоматически (RU / EN / UK)',
    sttLanguageRussian: 'Русский',
    sttLanguageEnglish: 'Английский',
    sttLanguageUkrainian: 'Украинский',
    defaultMicrophoneLabel: 'Микрофон по умолчанию',
    systemAudioNoTrack: 'Системный звук не запустился. Разрешите Cyrano доступ в разделе «Только запись системного звука» и повторите тест.',
    systemAudioNoSignal: 'Аудиодорожка открыта, но живой сигнал не обнаружен. Включите звук созвона и повторите тест.',
    micNoSignal: 'Доступ к микрофону разрешён, но живой сигнал не обнаружен.',
    dismissMessageLabel: 'Закрыть сообщение',
    refreshFolderLabel: 'Обновить папку проекта',
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

    hudPhaseIdle: 'Ожидание',
    hudPhaseAwaitingAudio: 'Ожидаю звук',
    hudPhaseListening: 'Слушаю',
    hudPhaseCapturing: 'Слышу речь',
    hudPhaseTranscribing: 'Распознаю',
    hudPhaseReviewing: 'Проверка вопроса',
    hudPhaseAnswering: 'Формирую ответ',
    hudPhasePaused: 'Пауза',
    hudPhaseError: 'Ошибка',
    hudSystemAudioLabel: 'Системный звук',
    hudMicrophoneLabel: 'Микрофон',
    hudSttLabel: 'STT',
    hudProjectLabel: 'Проект',
    hudSessionLabel: 'Сессия',
    hudSystemAudioDisabled: 'Выключен',
    hudSystemAudioWaiting: 'Не включён',
    hudSystemAudioConnecting: 'Подключение',
    hudSystemAudioActive: 'Активен',
    hudSystemAudioSpeaking: 'Обнаружена речь',
    hudSystemAudioPaused: 'На паузе',
    hudMicrophoneWaiting: 'Не включён',
    hudMicrophoneConnecting: 'Подключение',
    hudMicrophoneActive: 'Источник пользователя',
    hudMicrophoneSpeaking: 'Вы говорите',
    hudMicrophonePaused: 'На паузе',
    hudSttQueue: 'В очереди: {count}',
    hudSttTranscribing: 'Распознавание',
    hudSttReady: 'Работает',
    hudSttLocal: 'Локальный Whisper',
    hudSttCloud: 'Облачный STT',
    hudProjectSelected: 'Выбран',
    hudProjectNone: 'Не выбран',
    hudProjectStale: 'Индекс устарел',
    hudEnableMeetingAudio: 'Включить звук созвона',
    hudEnableMeetingAudioHint: 'Запустите захват системного звука. Cyrano никогда не подменяет звук созвона микрофоном.',
    hudEnableMicrophone: 'Включить микрофон',
    hudEnableMicrophoneHint: 'Запустите микрофон как источник пользователя. Он не запускает автоответ на вопросы созвона.',
    hudAudioDisabled: 'Захват звука выключен',
    hudAudioDisabledHint: 'Включите системный звук или микрофон в настройках Copilot.',
    hudAsk: 'Спросить',
    hudAsking: 'Отправляю...',
    hudPause: 'Пауза',
    hudResume: 'Продолжить',
    hudScrollUp: 'Прокрутить ответ вверх',
    hudScrollDown: 'Прокрутить ответ вниз',
    hudClear: 'Очистить диалог',
    hudCollapse: 'Свернуть HUD',
    hudExpand: 'Развернуть HUD',
    hudClose: 'Закрыть оверлей',
    hudQuestionDetected: 'Вопрос распознан',
    hudAnswerIn: 'Ответ через {seconds} с',
    hudAnswerStarting: 'Запускаю ответ...',
    hudAnswerNow: 'Ответить сейчас',
    hudEditQuestion: 'Исправить',
    hudEditQuestionLabel: 'Текст вопроса',
    hudSaveQuestion: 'Сохранить вопрос',
    hudCancelEditing: 'Отменить правку',
    hudQuestionLabel: 'Вопрос',
    hudAnswerHeading: 'Ответ',
    hudGenerating: 'Формирую ответ...',
    hudVerifiedSources: 'Проверенные ссылки',
    hudVerifiedSource: 'Проверенная ссылка',
    hudAudioErrorHeading: 'Проверьте захват звука',
    hudSttErrorHeading: 'Ошибка распознавания речи',
    hudLlmErrorHeading: 'Не удалось сформировать ответ',
    hudProjectErrorHeading: 'Проверьте контекст проекта',
    hudSessionErrorHeading: 'Ошибка сессии Copilot',
    hudRetryAudio: 'Повторить захват',
    hudRetryStt: 'Повторить распознавание',
    hudRetryAnswer: 'Повторить ответ',
    hudSystemCaptureFailed: 'Не удалось захватить системный звук. Проверьте источник и повторите попытку.',
    hudMicrophoneCaptureFailed: 'Не удалось захватить микрофон. Проверьте выбранный вход и повторите попытку.',
    hudTranscriptionFailed: 'Не удалось распознать речь. Проверьте модель STT и повторите попытку.',
    hudSessionUnavailable: 'Сессия Copilot недоступна. Закройте оверлей и запустите его снова.',
    hudActionFailed: 'Не удалось выполнить действие. Повторите попытку.',
    hudWaitingHeading: 'Слушаю вопрос',
    hudWaitingBody: 'Захват остаётся активным во время ответа. Автоответ запускают только вопросы из системного звука.',

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
    launchCopilotButton: 'Запустити Copilot',
    launchPrompterButton: 'Запустити телесуфлер',
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

    tabScript: 'Телесуфлер',
    tabCopilot: 'AI Copilot',
    tabAudioContext: 'Звук та Контекст',
    tabAppearance: 'Стиль і швидкість',
    tabPosition: 'Позиція та розмір',
    tabHotkeys: 'Гарячі клавіші',
    navCopilotSection: 'Copilot',
    navTeleprompterSection: 'Телесуфлер',
    navGeneralSection: 'Спільні налаштування',

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

    copilotHeading: 'AI Copilot',
    copilotSubheading: 'Підготуйте модель відповіді, звук дзвінка, розпізнавання мовлення та контекст проєкту перед заняттям.',
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
    reviewDelayLabel: 'Перевірка питання',
    reviewDelayHint: 'Час на скасування або виправлення питання перед надсиланням.',
    reviewDelaySeconds: '{seconds} с',
    systemPromptHeading: 'Системний промпт (Інструкція асистенту)',
    systemPromptHint: 'Задає формат відповідей (коротка теза для усного озвучення + факти по проекту).',
    providerProtocolLabel: 'Протокол API',
    providerProtocolAnthropic: 'Anthropic Messages API',
    providerProtocolOpenAI: 'OpenAI-сумісний API',
    providerProtocolHint: 'Виберіть протокол запитів для цієї адреси. Для довільного URL він не визначається автоматично.',
    advancedSettingsHeading: 'Розширені налаштування Copilot',
    advancedSettingsHint: 'Провайдер, запуск відповіді, вигляд оверлею та системний промпт',

    readinessHeading: 'Готовність до заняття',
    readinessSubheading: 'Перевірте чотири компоненти, потрібні Copilot перед дзвінком.',
    readinessRefreshButton: 'Оновити готовність',
    readinessChecking: 'Перевіряю поточний стан...',
    readinessUnavailable: 'Не вдалося перевірити готовність. Повторіть перевірку перед запуском Copilot.',
    readinessLlmTitle: 'Модель відповіді',
    readinessLlmConfigured: 'Налаштована, але не перевірена в цій сесії налаштувань',
    readinessLlmNotConfigured: 'Вкажіть адресу, модель та API-ключ, потім перевірте підключення.',
    readinessApiKeyConfigured: 'API-ключ указано',
    readinessApiKeyNotRequired: 'локальна адреса без ключа',
    readinessAudioTitle: 'Звук дзвінка',
    readinessAudioSystemConfigured: 'Системний звук увімкнено, але сигнал ще не перевірено.',
    readinessAudioMicConfigured: 'Мікрофон увімкнено, але сигнал ще не перевірено.',
    readinessAudioBothConfigured: 'Системний звук і мікрофон увімкнено, але сигнал ще не перевірено.',
    readinessAudioNotConfigured: 'Увімкніть принаймні одне дозволене джерело звуку.',
    readinessSystemLoopbackUnsupported: 'Системний loopback потребує Windows або macOS 13+. На цій платформі явно увімкніть мікрофон.',
    readinessAutoNeedsSystem: 'Повністю автоматичний режим потребує підтримуваний системний loopback.',
    readinessSttTitle: 'Розпізнавання мовлення',
    readinessSttLocalReady: 'Файли локальної моделі перевірені та готові',
    readinessSttCloudConfigured: 'Хмарний STT налаштовано та буде перевірено під час запуску Copilot',
    readinessSttNotConfigured: 'Налаштуйте доступ до хмарного STT або виберіть локальну модель.',
    readinessSttDownloading: 'Завантажується вибрана локальна модель',
    readinessSttValidating: 'Перевіряю та завантажую вибрану локальну модель',
    readinessSttPartial: 'Вибрану локальну модель завантажено не повністю. Повторіть завантаження.',
    readinessSttFailed: 'Вибрана локальна модель недоступна.',
    readinessProjectTitle: 'Контекст проєкту',
    readinessProjectMissing: 'Проєкт не вибрано. Copilot можна запустити без контексту коду.',
    readinessProjectUpdated: 'проіндексовано',
    readinessStatusReady: 'Готово',
    readinessStatusWarning: 'Потребує уваги',
    readinessStatusBlocked: 'Блокує запуск',
    readinessStatusChecking: 'Перевірка',
    readinessTestLlm: 'Перевірити модель',
    readinessTestAudio: 'Перевірити звук',
    readinessManageStt: 'Налаштувати модель',
    readinessChooseProject: 'Вибрати проєкт',
    readinessRefreshProject: 'Оновити проєкт',
    readinessLaunchReady: 'Copilot можна запускати',
    readinessLaunchReadyHint: 'Під час запуску оверлей запитає доступ і перевірить звук дзвінка.',
    readinessLaunchBlocked: 'Copilot потребує налаштування',
    readinessLaunchBlockedHint: 'Усуньте блокувальні проблеми в рядках вище.',
    readinessProjectOptionalHint: 'Контекст проєкту необов’язковий і не блокує запуск.',
    launchBlockedSummary: 'Запуск блокують',
    launchSettingsChanged: 'Налаштування змінилися під час перевірки. Запустіть ще раз з новою конфігурацією.',

    audioContextHeading: 'Захоплення звуку та контекст проекту',
    audioContextSubheading: 'Слухайте звук міта та мікрофон, розпізнавайте мову локально та передавайте код проекту.',
    audioCaptureHeading: 'Джерела аудіопотоку',
    captureSystemLabel: 'Захоплювати системний звук (Співрозмовники / Викладач)',
    captureSystemHint: 'Перехоплює мову із Zoom, Google Meet, Teams, Discord, Telegram',
    captureMicLabel: 'Захоплювати мікрофон користувача',
    captureMicHint: 'Записує ваші репліки, щоб ШІ розумів повний контекст розмови',
    permissionsHeading: 'Системні дозволи',
    permissionScreenLabel: 'Запис системного звуку',
    permissionScreenHint: 'На macOS 14.2+ захоплює звук дзвінка напряму, без запису екрана.',
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
    modelStatusMissing: 'Не завантажена',
    modelStatusPartial: 'Завантажена частково',
    modelStatusLoading: 'Підготовка',
    modelStatusError: 'Помилка',
    selectModelButton: 'Вибрати',
    selectedModelButton: 'Вибрана',
    retryButton: 'Повторити',
    cancelButton: 'Скасувати',
    validatingModel: 'Перевіряю модель...',
    modelDownloadErrorHeading: 'Помилка завантаження моделі',
    modelDownloadErrorFallback: 'Не вдалося завантажити модель з Hugging Face.',
    modelDownloadCancelled: 'Завантаження моделі скасовано.',
    modelProgressFallback: 'файли моделі',
    whisperTinyName: 'Whisper Tiny (Найшвидша)',
    whisperBaseName: 'Whisper Base (Збалансована)',
    whisperSmallName: 'Whisper Small (Підвищена точність)',
    whisperTurboName: 'Whisper Large v3 Turbo (Максимальна точність)',
    whisperTinyDesc: 'Найшвидша на CPU. Підходить для чистого мовлення та пристроїв із невеликим обсягом пам’яті.',
    whisperBaseDesc: 'Рекомендований баланс швидкості та точності технічного мовлення кількома мовами.',
    whisperSmallDesc: 'Підвищена точність для змішаної технічної термінології.',
    whisperTurboDesc: 'Максимальна локальна точність із підвищеними вимогами до пам’яті та CPU.',
    sttLocalDesc: 'Офлайн-розпізнавання на цьому комп’ютері',
    sttCloudDesc: 'Розпізнавання через явно налаштований хмарний API',
    cloudSttUrlLabel: 'URL хмарного STT ендпоінта',
    cloudSttKeyLabel: 'API-ключ хмарного STT',
    cloudSttModelLabel: 'Назва моделі хмарного STT',
    cloudSttKeyPlaceholder: 'Залиште порожнім, щоб використовувати ключ LLM',
    sttLanguageLabel: 'Мова розпізнавання',
    sttLanguageAuto: 'Визначати автоматично (RU / EN / UK)',
    sttLanguageRussian: 'Російська',
    sttLanguageEnglish: 'Англійська',
    sttLanguageUkrainian: 'Українська',
    defaultMicrophoneLabel: 'Мікрофон за замовчуванням',
    systemAudioNoTrack: 'Системний звук не запустився. Дозвольте Cyrano доступ у розділі «Лише запис системного звуку» та повторіть тест.',
    systemAudioNoSignal: 'Аудіодоріжку відкрито, але живий сигнал не виявлено. Увімкніть звук дзвінка та повторіть тест.',
    micNoSignal: 'Доступ до мікрофона дозволено, але живий сигнал не виявлено.',
    dismissMessageLabel: 'Закрити повідомлення',
    refreshFolderLabel: 'Оновити папку проєкту',
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

    hudPhaseIdle: 'Очікування',
    hudPhaseAwaitingAudio: 'Очікую звук',
    hudPhaseListening: 'Слухаю',
    hudPhaseCapturing: 'Чую мовлення',
    hudPhaseTranscribing: 'Розпізнаю',
    hudPhaseReviewing: 'Перевірка запитання',
    hudPhaseAnswering: 'Формую відповідь',
    hudPhasePaused: 'Пауза',
    hudPhaseError: 'Помилка',
    hudSystemAudioLabel: 'Системний звук',
    hudMicrophoneLabel: 'Мікрофон',
    hudSttLabel: 'STT',
    hudProjectLabel: 'Проєкт',
    hudSessionLabel: 'Сесія',
    hudSystemAudioDisabled: 'Вимкнено',
    hudSystemAudioWaiting: 'Не ввімкнено',
    hudSystemAudioConnecting: 'Підключення',
    hudSystemAudioActive: 'Активний',
    hudSystemAudioSpeaking: 'Виявлено мовлення',
    hudSystemAudioPaused: 'На паузі',
    hudMicrophoneWaiting: 'Не ввімкнено',
    hudMicrophoneConnecting: 'Підключення',
    hudMicrophoneActive: 'Джерело користувача',
    hudMicrophoneSpeaking: 'Ви говорите',
    hudMicrophonePaused: 'На паузі',
    hudSttQueue: 'У черзі: {count}',
    hudSttTranscribing: 'Розпізнавання',
    hudSttReady: 'Працює',
    hudSttLocal: 'Локальний Whisper',
    hudSttCloud: 'Хмарний STT',
    hudProjectSelected: 'Вибрано',
    hudProjectNone: 'Не вибрано',
    hudProjectStale: 'Індекс застарів',
    hudEnableMeetingAudio: 'Увімкнути звук дзвінка',
    hudEnableMeetingAudioHint: 'Запустіть захоплення системного звуку. Cyrano ніколи не підміняє звук дзвінка мікрофоном.',
    hudEnableMicrophone: 'Увімкнути мікрофон',
    hudEnableMicrophoneHint: 'Запустіть мікрофон як джерело користувача. Він не запускає автовідповідь на запитання дзвінка.',
    hudAudioDisabled: 'Захоплення звуку вимкнено',
    hudAudioDisabledHint: 'Увімкніть системний звук або мікрофон у налаштуваннях Copilot.',
    hudAsk: 'Запитати',
    hudAsking: 'Надсилаю...',
    hudPause: 'Пауза',
    hudResume: 'Продовжити',
    hudScrollUp: 'Прокрутити відповідь угору',
    hudScrollDown: 'Прокрутити відповідь униз',
    hudClear: 'Очистити діалог',
    hudCollapse: 'Згорнути HUD',
    hudExpand: 'Розгорнути HUD',
    hudClose: 'Закрити оверлей',
    hudQuestionDetected: 'Запитання розпізнано',
    hudAnswerIn: 'Відповідь через {seconds} с',
    hudAnswerStarting: 'Запускаю відповідь...',
    hudAnswerNow: 'Відповісти зараз',
    hudEditQuestion: 'Виправити',
    hudEditQuestionLabel: 'Текст запитання',
    hudSaveQuestion: 'Зберегти запитання',
    hudCancelEditing: 'Скасувати редагування',
    hudQuestionLabel: 'Запитання',
    hudAnswerHeading: 'Відповідь',
    hudGenerating: 'Формую відповідь...',
    hudVerifiedSources: 'Перевірені посилання',
    hudVerifiedSource: 'Перевірене посилання',
    hudAudioErrorHeading: 'Перевірте захоплення звуку',
    hudSttErrorHeading: 'Помилка розпізнавання мовлення',
    hudLlmErrorHeading: 'Не вдалося сформувати відповідь',
    hudProjectErrorHeading: 'Перевірте контекст проєкту',
    hudSessionErrorHeading: 'Помилка сесії Copilot',
    hudRetryAudio: 'Повторити захоплення',
    hudRetryStt: 'Повторити розпізнавання',
    hudRetryAnswer: 'Повторити відповідь',
    hudSystemCaptureFailed: 'Не вдалося захопити системний звук. Перевірте джерело та повторіть спробу.',
    hudMicrophoneCaptureFailed: 'Не вдалося захопити мікрофон. Перевірте вибраний вхід і повторіть спробу.',
    hudTranscriptionFailed: 'Не вдалося розпізнати мовлення. Перевірте модель STT і повторіть спробу.',
    hudSessionUnavailable: 'Сесія Copilot недоступна. Закрийте оверлей і запустіть його знову.',
    hudActionFailed: 'Не вдалося виконати дію. Повторіть спробу.',
    hudWaitingHeading: 'Слухаю запитання',
    hudWaitingBody: 'Захоплення залишається активним під час відповіді. Автовідповідь запускають лише запитання із системного звуку.',

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
