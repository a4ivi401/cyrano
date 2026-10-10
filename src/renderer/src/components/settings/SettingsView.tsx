import React, { useState, useEffect, useMemo } from 'react';
import {
  Play,
  RotateCcw,
  Sliders,
  Type,
  Monitor,
  Keyboard,
  Shield,
  Eye,
  FileText,
  Sparkles,
  Check,
  Move,
  Languages
} from 'lucide-react';
import { PrompterSettings, PresetPosition, DisplayInfo, Language } from '../../../../common/types';
import { DEFAULT_SETTINGS } from '../../../../common/constants';
import { TRANSLATIONS } from '../../../../common/i18n';

interface FontOption {
  label: string;
  value: string;
}

export const SettingsView: React.FC = () => {
  const [settings, setSettings] = useState<PrompterSettings>(DEFAULT_SETTINGS);
  const [fonts, setFonts] = useState<FontOption[]>([]);
  const [displays, setDisplays] = useState<DisplayInfo[]>([]);
  const [activeTab, setActiveTab] = useState<'script' | 'appearance' | 'position' | 'hotkeys'>('script');
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [isLaunching, setIsLaunching] = useState<boolean>(false);

  const t = TRANSLATIONS[settings.language || 'en'];

  // Load initial settings, fonts, and displays
  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.getSettings().then((loaded) => {
        setSettings(loaded);
      });

      window.electronAPI.getFonts().then((f) => {
        setFonts(f);
      });

      window.electronAPI.getDisplays().then((d) => {
        setDisplays(d);
      });
    }
  }, []);

  // Word count and estimated reading time
  const stats = useMemo(() => {
    const text = settings.text.trim();
    if (!text) return { words: 0, characters: 0, estimatedMinutes: 0 };
    const words = text.split(/\s+/).filter(Boolean).length;
    const characters = text.length;
    // Average speaking cadence: ~135 WPM
    const estimatedMinutes = Math.max(1, Math.ceil(words / 135));
    return { words, characters, estimatedMinutes };
  }, [settings.text]);

  const updateSetting = <K extends keyof PrompterSettings>(key: K, value: PrompterSettings[K]) => {
    const nextSettings = { ...settings, [key]: value };
    setSettings(nextSettings);

    if (window.electronAPI) {
      window.electronAPI.saveSettings({ [key]: value });
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 1500);
    }
  };

  const handleLaunch = async () => {
    if (!window.electronAPI || isLaunching) return;
    setIsLaunching(true);
    try {
      await window.electronAPI.startPrompter(settings);
    } finally {
      setIsLaunching(false);
    }
  };

  const handlePresetChange = (preset: PresetPosition) => {
    let width = settings.width;
    let height = settings.height;
    let yPosition = settings.yPosition;

    switch (preset) {
      case 'top-center':
        width = 720;
        height = 260;
        yPosition = 24;
        break;
      case 'top-full':
        width = 1440;
        height = 220;
        yPosition = 16;
        break;
      case 'center':
        width = 800;
        height = 500;
        yPosition = -1;
        break;
      case 'left-sidebar':
        width = 460;
        height = 800;
        yPosition = -1;
        break;
      case 'right-sidebar':
        width = 460;
        height = 800;
        yPosition = -1;
        break;
      case 'custom':
        break;
    }

    const updated: Partial<PrompterSettings> = {
      presetPosition: preset,
      width,
      height,
      yPosition
    };

    setSettings((prev) => ({ ...prev, ...updated }));
    if (window.electronAPI) {
      window.electronAPI.saveSettings(updated);
    }
  };

  const handleResetDefaults = () => {
    if (confirm(t.resetConfirm)) {
      setSettings(DEFAULT_SETTINGS);
      if (window.electronAPI) {
        window.electronAPI.saveSettings(DEFAULT_SETTINGS);
      }
    }
  };

  // Convert electron accelerator like 'Control+Alt+Command+P' to readable macOS symbols
  const formatHotkey = (accelerator: string) => {
    return accelerator
      .replace(/CommandOrControl/g, '⌘')
      .replace(/Command/g, '⌘')
      .replace(/Cmd/g, '⌘')
      .replace(/Control/g, '⌃')
      .replace(/Ctrl/g, '⌃')
      .replace(/Alt/g, '⌥')
      .replace(/Option/g, '⌥')
      .replace(/Shift/g, '⇧')
      .replace(/Up/g, '↑')
      .replace(/Down/g, '↓')
      .replace(/Left/g, '←')
      .replace(/Right/g, '→')
      .replace(/\+/g, ' ');
  };

  return (
    <div className="flex flex-col h-screen select-none" style={{ background: '#0d1117' }}>
      {/* Titlebar / Drag Region for macOS */}
      {/* paddingLeft: 84px guarantees no collision with native macOS window traffic lights (close, minimize, zoom) */}
      <div
        className="flex items-center justify-between py-3 pr-5 border-b border-gray-800"
        style={{
          WebkitAppRegion: 'drag',
          paddingLeft: '84px'
        } as React.CSSProperties}
      >
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-sm font-semibold tracking-wide text-white">{t.appName}</h1>
              <span className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-1.5 py-0.5 rounded font-medium">
                {t.appBadge}
              </span>
            </div>
            <p className="text-[11px] text-gray-400">{t.appSubtitle}</p>
          </div>
        </div>

        {/* Action Controls & Language Switcher */}
        <div className="flex items-center space-x-3" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
          {/* Language Switcher */}
          <div className="flex items-center bg-[#161c26] rounded-lg p-0.5 border border-gray-800">
            {(['en', 'ru', 'uk'] as Language[]).map((lang) => (
              <button
                key={lang}
                onClick={() => updateSetting('language', lang)}
                className={`px-2 py-1 text-[11px] font-semibold rounded transition-all cursor-pointer ${
                  (settings.language || 'en') === lang
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
                title={lang === 'en' ? 'English' : lang === 'ru' ? 'Русский' : 'Українська'}
              >
                {lang.toUpperCase()}
              </button>
            ))}
          </div>

          {isSaved && (
            <span className="flex items-center space-x-1 text-xs text-emerald-400 transition-opacity">
              <Check className="w-3.5 h-3.5" />
              <span>{t.savedToast}</span>
            </span>
          )}

          <button
            onClick={handleLaunch}
            disabled={isLaunching}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{t.launchButton}</span>
            <kbd className="ml-1 px-1.5 py-0.5 text-[10px] bg-blue-700/60 rounded border border-blue-400/30 font-mono">
              {formatHotkey(settings.hotkeyToggle)}
            </kbd>
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="flex flex-1 overflow-hidden">
        {/* Navigation Sidebar */}
        <div className="w-48 bg-[#111620] border-r border-gray-800 p-3 flex flex-col justify-between">
          <div className="space-y-1">
            <button
              onClick={() => setActiveTab('script')}
              className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                activeTab === 'script'
                  ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>{t.tabScript}</span>
            </button>

            <button
              onClick={() => setActiveTab('appearance')}
              className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                activeTab === 'appearance'
                  ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
              }`}
            >
              <Sliders className="w-4 h-4" />
              <span>{t.tabAppearance}</span>
            </button>

            <button
              onClick={() => setActiveTab('position')}
              className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                activeTab === 'position'
                  ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
              }`}
            >
              <Move className="w-4 h-4" />
              <span>{t.tabPosition}</span>
            </button>

            <button
              onClick={() => setActiveTab('hotkeys')}
              className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                activeTab === 'hotkeys'
                  ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
              }`}
            >
              <Keyboard className="w-4 h-4" />
              <span>{t.tabHotkeys}</span>
            </button>
          </div>

          {/* Stealth Status Info Box */}
          <div className="p-2.5 rounded-lg bg-gray-900/80 border border-gray-800 text-[11px] text-gray-400 space-y-1.5">
            <div className="flex items-center space-x-1.5 text-emerald-400 font-medium">
              <Shield className="w-3.5 h-3.5" />
              <span>{t.stealthNotesHeading}</span>
            </div>
            <p className="leading-tight text-gray-400">
              {t.stealthNote1Desc}
            </p>
          </div>
        </div>

        {/* Tab Content Panel */}
        <div className="flex-1 overflow-y-auto p-6 bg-[#0f141c]">
          {/* TAB 1: SCRIPT EDITOR */}
          {activeTab === 'script' && (
            <div className="space-y-4 max-w-3xl">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold text-white">{t.scriptHeading}</h2>
                  <p className="text-xs text-gray-400">{t.scriptSubheading}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => updateSetting('text', t.sampleScript)}
                    className="flex items-center space-x-1 px-2.5 py-1 text-xs text-gray-300 hover:text-white bg-gray-800 hover:bg-gray-700 rounded border border-gray-700 transition cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>{t.loadSampleButton}</span>
                  </button>
                  <button
                    onClick={() => updateSetting('text', '')}
                    className="px-2.5 py-1 text-xs text-gray-400 hover:text-rose-400 bg-gray-800 hover:bg-gray-700 rounded border border-gray-700 transition cursor-pointer"
                  >
                    {t.clearButton}
                  </button>
                </div>
              </div>

              {/* Textarea */}
              <div className="relative">
                <textarea
                  value={settings.text}
                  onChange={(e) => updateSetting('text', e.target.value)}
                  placeholder={t.scriptPlaceholder}
                  className="w-full h-80 p-4 bg-[#141a24] text-gray-100 rounded-xl border border-gray-700/80 focus:border-blue-500 focus:outline-none resize-none leading-relaxed text-sm font-sans placeholder-gray-500 transition-colors"
                />
              </div>

              {/* Stats Bar */}
              <div className="flex items-center justify-between px-4 py-2.5 bg-[#141a24] border border-gray-800 rounded-lg text-xs text-gray-400">
                <div className="flex items-center space-x-4">
                  <span>
                    {t.wordsLabel}: <strong className="text-gray-200">{stats.words}</strong>
                  </span>
                  <span>
                    {t.charsLabel}: <strong className="text-gray-200">{stats.characters}</strong>
                  </span>
                  <span>
                    {t.durationLabel}:{' '}
                    <strong className="text-blue-400">~{stats.estimatedMinutes} {t.durationMinutes}</strong>
                  </span>
                </div>
                <div className="text-[11px] text-gray-400">
                  {t.wpmCadenceHint}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SPEED & STYLE */}
          {activeTab === 'appearance' && (
            <div className="space-y-6 max-w-2xl">
              <div>
                <h2 className="text-base font-semibold text-white">{t.appearanceHeading}</h2>
                <p className="text-xs text-gray-400">{t.appearanceSubheading}</p>
              </div>

              {/* Scrolling Speed */}
              <div className="p-4 bg-[#141a24] rounded-xl border border-gray-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-medium text-gray-200">{t.scrollSpeedLabel}</label>
                    <p className="text-[11px] text-gray-400">{t.scrollSpeedUnit}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-blue-400">{settings.speed} px/s</span>
                    <p className="text-[10px] text-gray-400">
                      ≈ {Math.round(settings.speed * 2.8)} {t.wpmEquivalent}
                    </p>
                  </div>
                </div>
                <input
                  type="range"
                  min="10"
                  max="200"
                  step="5"
                  value={settings.speed}
                  onChange={(e) => updateSetting('speed', Number(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-[10px] text-gray-400">
                  <span>{t.speedSlow}</span>
                  <span>{t.speedNormal}</span>
                  <span>{t.speedFast}</span>
                </div>
              </div>

              {/* Font Controls */}
              <div className="p-4 bg-[#141a24] rounded-xl border border-gray-800 space-y-4">
                <div className="flex items-center space-x-2 text-xs font-semibold text-gray-200 border-b border-gray-800 pb-2">
                  <Type className="w-4 h-4 text-blue-400" />
                  <span>{t.typographyHeading}</span>
                </div>

                {/* Font Family */}
                <div className="space-y-1.5">
                  <label className="text-xs text-gray-300">{t.systemFontLabel}</label>
                  <select
                    value={settings.fontFamily}
                    onChange={(e) => updateSetting('fontFamily', e.target.value)}
                    className="w-full px-3 py-2 bg-[#1b2230] text-gray-200 text-xs rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none cursor-pointer"
                  >
                    {fonts.map((f) => (
                      <option key={f.value} value={f.value}>
                        {f.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Font Size */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-300">{t.fontSizeLabel}</span>
                    <span className="text-blue-400 font-semibold">{settings.fontSize} px</span>
                  </div>
                  <input
                    type="range"
                    min="18"
                    max="64"
                    step="2"
                    value={settings.fontSize}
                    onChange={(e) => updateSetting('fontSize', Number(e.target.value))}
                    className="w-full"
                  />
                </div>

                {/* Text Shadow Toggle */}
                <div className="flex items-center justify-between pt-2">
                  <div>
                    <span className="text-xs text-gray-300 block">{t.textShadowLabel}</span>
                    <span className="text-[11px] text-gray-400">{t.textShadowHint}</span>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={settings.textShadow}
                      onChange={(e) => updateSetting('textShadow', e.target.checked)}
                    />
                    <span className="toggle-slider" />
                  </label>
                </div>
              </div>

              {/* Background & Opacity */}
              <div className="p-4 bg-[#141a24] rounded-xl border border-gray-800 space-y-4">
                <div className="flex items-center space-x-2 text-xs font-semibold text-gray-200 border-b border-gray-800 pb-2">
                  <Eye className="w-4 h-4 text-blue-400" />
                  <span>{t.backgroundHeading}</span>
                </div>

                {/* Opacity with Quick Presets */}
                <div className="space-y-3">
                  <div className="flex justify-between text-xs items-center">
                    <div>
                      <span className="text-gray-300 font-medium">{t.bgOpacityLabel}</span>
                      <span className="text-[11px] text-gray-400 block">
                        {settings.bgOpacity === 0 ? '100% Glass (Only text floats on screen)' : ''}
                      </span>
                    </div>
                    <span className="text-blue-400 font-bold text-sm">
                      {Math.round(settings.bgOpacity * 100)}%
                    </span>
                  </div>

                  {/* Quick Opacity Presets for True Transparency */}
                  <div className="flex items-center gap-2">
                    {[
                      { val: 0, label: '0% (Glass)' },
                      { val: 0.15, label: '15%' },
                      { val: 0.35, label: '35%' },
                      { val: 0.65, label: '65%' },
                      { val: 0.9, label: '90%' }
                    ].map((preset) => (
                      <button
                        key={preset.val}
                        onClick={() => updateSetting('bgOpacity', preset.val)}
                        className={`flex-1 py-1.5 px-2 text-[11px] font-medium rounded-lg border transition-all cursor-pointer ${
                          Math.abs(settings.bgOpacity - preset.val) < 0.05
                            ? 'bg-blue-600/20 text-blue-400 border-blue-500/50'
                            : 'bg-[#1b2230] text-gray-400 border-gray-700/80 hover:text-gray-200 hover:border-gray-600'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>

                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={settings.bgOpacity}
                    onChange={(e) => updateSetting('bgOpacity', Number(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-[10px] text-gray-400">
                    <span>{t.bgOpacityTransparent}</span>
                    <span>{t.bgOpacityTranslucent}</span>
                    <span>{t.bgOpacityOpaque}</span>
                  </div>
                </div>

                {/* Color Pickers */}
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="flex items-center space-x-3">
                    <input
                      type="color"
                      value={settings.textColor}
                      onChange={(e) => updateSetting('textColor', e.target.value)}
                    />
                    <div>
                      <span className="text-xs text-gray-300 block">{t.textColorLabel}</span>
                      <span className="text-[10px] text-gray-400">{settings.textColor}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <input
                      type="color"
                      value={settings.bgColor}
                      onChange={(e) => updateSetting('bgColor', e.target.value)}
                    />
                    <div>
                      <span className="text-xs text-gray-300 block">{t.bgColorLabel}</span>
                      <span className="text-[10px] text-gray-400">{settings.bgColor}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Prompter Guide Lines */}
              <div className="p-4 bg-[#141a24] rounded-xl border border-gray-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs text-gray-300 block">{t.focalGuideLabel}</span>
                    <span className="text-[11px] text-gray-400">{t.focalGuideHint}</span>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={settings.showFocalGuide}
                      onChange={(e) => updateSetting('showFocalGuide', e.target.checked)}
                    />
                    <span className="toggle-slider" />
                  </label>
                </div>

                {settings.showFocalGuide && (
                  <div className="space-y-2 pt-2 border-t border-gray-800">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-300">{t.focalPositionLabel}</span>
                      <span className="text-blue-400 font-semibold">
                        {settings.focalGuidePosition}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="60"
                      step="5"
                      value={settings.focalGuidePosition}
                      onChange={(e) => updateSetting('focalGuidePosition', Number(e.target.value))}
                      className="w-full"
                    />
                  </div>
                )}

                {/* Flip Horizontal (Mirror for hardware glass) */}
                <div className="flex items-center justify-between pt-2 border-t border-gray-800">
                  <div>
                    <span className="text-xs text-gray-300 block">{t.mirrorLabel}</span>
                    <span className="text-[11px] text-gray-400">{t.mirrorHint}</span>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={settings.flipHorizontal}
                      onChange={(e) => updateSetting('flipHorizontal', e.target.checked)}
                    />
                    <span className="toggle-slider" />
                  </label>
                </div>

                {/* Auto-rewind */}
                <div className="flex items-center justify-between pt-2 border-t border-gray-800">
                  <div>
                    <span className="text-xs text-gray-300 block">Loop on Completion</span>
                    <span className="text-[11px] text-gray-400">
                      Automatically rewind to top when the script ends
                    </span>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={settings.autoRewindOnEnd}
                      onChange={(e) => updateSetting('autoRewindOnEnd', e.target.checked)}
                    />
                    <span className="toggle-slider" />
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: POSITION & SIZE */}
          {activeTab === 'position' && (
            <div className="space-y-6 max-w-2xl">
              <div>
                <h2 className="text-base font-semibold text-white">{t.positionHeading}</h2>
                <p className="text-xs text-gray-400">{t.positionSubheading}</p>
              </div>

              {/* Placement Presets */}
              <div className="p-4 bg-[#141a24] rounded-xl border border-gray-800 space-y-3">
                <label className="text-xs font-semibold text-gray-200 block">
                  {t.presetsHeading}
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    {
                      id: 'top-center',
                      label: t.presetTopCenterTitle,
                      desc: t.presetTopCenterDesc
                    },
                    {
                      id: 'top-full',
                      label: t.presetTopFullTitle,
                      desc: t.presetTopFullDesc
                    },
                    {
                      id: 'center',
                      label: t.presetCenterTitle,
                      desc: t.presetCenterDesc
                    },
                    {
                      id: 'left-sidebar',
                      label: t.presetLeftTitle,
                      desc: t.presetLeftDesc
                    },
                    {
                      id: 'right-sidebar',
                      label: t.presetRightTitle,
                      desc: t.presetRightDesc
                    },
                    {
                      id: 'custom',
                      label: t.presetCustomTitle,
                      desc: t.presetCustomDesc
                    }
                  ].map((p) => (
                    <button
                      key={p.id}
                      onClick={() => handlePresetChange(p.id as PresetPosition)}
                      className={`p-3 rounded-lg text-left transition-all cursor-pointer border ${
                        settings.presetPosition === p.id
                          ? 'bg-blue-600/15 border-blue-500 text-white shadow-md'
                          : 'bg-[#1b2230] border-gray-700 text-gray-400 hover:text-gray-200 hover:border-gray-600'
                      }`}
                    >
                      <div className="text-xs font-semibold text-gray-200">{p.label}</div>
                      <div className="text-[10px] text-gray-400 mt-1">{p.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Dimension Sliders */}
              <div className="p-4 bg-[#141a24] rounded-xl border border-gray-800 space-y-4">
                <label className="text-xs font-semibold text-gray-200 block">
                  {t.customGeometryHeading}
                </label>

                {/* Width */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-300">{t.windowWidthLabel}</span>
                    <span className="text-blue-400 font-semibold">{settings.width} px</span>
                  </div>
                  <input
                    type="range"
                    min="360"
                    max="1920"
                    step="20"
                    value={settings.width}
                    onChange={(e) => {
                      updateSetting('width', Number(e.target.value));
                      updateSetting('presetPosition', 'custom');
                    }}
                    className="w-full"
                  />
                </div>

                {/* Height */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-300">{t.windowHeightLabel}</span>
                    <span className="text-blue-400 font-semibold">{settings.height} px</span>
                  </div>
                  <input
                    type="range"
                    min="150"
                    max="1080"
                    step="10"
                    value={settings.height}
                    onChange={(e) => {
                      updateSetting('height', Number(e.target.value));
                      updateSetting('presetPosition', 'custom');
                    }}
                    className="w-full"
                  />
                </div>
              </div>

              {/* Display Information */}
              {displays.length > 0 && (
                <div className="p-4 bg-[#141a24] rounded-xl border border-gray-800 space-y-2">
                  <div className="flex items-center space-x-2 text-xs font-semibold text-gray-200">
                    <Monitor className="w-4 h-4 text-blue-400" />
                    <span>Connected Displays</span>
                  </div>
                  <div className="space-y-1.5 pt-1">
                    {displays.map((d) => (
                      <div
                        key={d.id}
                        className="flex items-center justify-between text-xs px-3 py-2 bg-[#1b2230] rounded-lg text-gray-300"
                      >
                        <div className="flex items-center space-x-2">
                          <span>{d.label}</span>
                          {d.isPrimary && (
                            <span className="text-[10px] bg-blue-500/20 text-blue-400 px-1.5 py-0.2 rounded font-medium">
                              Main Screen
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-gray-400">
                          {d.bounds.width} × {d.bounds.height}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: GLOBAL HOTKEYS */}
          {activeTab === 'hotkeys' && (
            <div className="space-y-6 max-w-2xl">
              <div>
                <h2 className="text-base font-semibold text-white">{t.hotkeysHeading}</h2>
                <p className="text-xs text-gray-400">{t.hotkeysSubheading}</p>
              </div>

              <div className="p-4 bg-[#141a24] rounded-xl border border-gray-800 divide-y divide-gray-800">
                {/* Play / Pause */}
                <div className="py-3 flex items-center justify-between first:pt-0">
                  <div>
                    <span className="text-xs font-medium text-gray-200 block">
                      {t.actionToggle}
                    </span>
                    <span className="text-[11px] text-gray-400">
                      {t.actionToggleDesc}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <kbd className="px-2.5 py-1 text-xs font-mono font-semibold bg-gray-800 text-blue-400 border border-gray-700 rounded shadow">
                      {formatHotkey(settings.hotkeyToggle)}
                    </kbd>
                  </div>
                </div>

                {/* Close Overlay */}
                <div className="py-3 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-medium text-gray-200 block">
                      {t.actionClose}
                    </span>
                    <span className="text-[11px] text-gray-400">
                      {t.actionCloseDesc}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <kbd className="px-2.5 py-1 text-xs font-mono font-semibold bg-gray-800 text-rose-400 border border-gray-700 rounded shadow">
                      {formatHotkey(settings.hotkeyClose)}
                    </kbd>
                  </div>
                </div>

                {/* Rewind */}
                <div className="py-3 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-medium text-gray-200 block">{t.actionRewind}</span>
                    <span className="text-[11px] text-gray-400">
                      {t.actionRewindDesc}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <kbd className="px-2.5 py-1 text-xs font-mono font-semibold bg-gray-800 text-gray-200 border border-gray-700 rounded shadow">
                      {formatHotkey(settings.hotkeyRewind)}
                    </kbd>
                  </div>
                </div>

                {/* Speed Adjustments */}
                <div className="py-3 flex items-center justify-between last:pb-0">
                  <div>
                    <span className="text-xs font-medium text-gray-200 block">{t.actionSpeedUp} / {t.actionSpeedDown}</span>
                    <span className="text-[11px] text-gray-400">
                      {t.actionSpeedUpDesc}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <kbd className="px-2.5 py-1 text-xs font-mono font-semibold bg-gray-800 text-gray-200 border border-gray-700 rounded shadow">
                      {formatHotkey(settings.hotkeySpeedUp)}
                    </kbd>
                    <span className="text-gray-500 text-xs">/</span>
                    <kbd className="px-2.5 py-1 text-xs font-mono font-semibold bg-gray-800 text-gray-200 border border-gray-700 rounded shadow">
                      {formatHotkey(settings.hotkeySpeedDown)}
                    </kbd>
                  </div>
                </div>
              </div>

              {/* Reset Defaults Button */}
              <div className="pt-2">
                <button
                  onClick={handleResetDefaults}
                  className="flex items-center space-x-2 px-3 py-1.5 text-xs text-gray-400 hover:text-gray-200 bg-gray-800/80 hover:bg-gray-800 border border-gray-700 rounded-lg transition cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{t.resetButton}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
