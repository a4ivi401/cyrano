import { app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import { PrompterSettings } from '../common/types';
import { DEFAULT_SETTINGS } from '../common/constants';

export class SettingsStore {
  private filePath: string;
  private settings: PrompterSettings;

  constructor() {
    const userDataPath = app.getPath('userData');
    this.filePath = path.join(userDataPath, 'prompter-settings.json');
    this.settings = this.load();
  }

  public getSettings(): PrompterSettings {
    return { ...this.settings };
  }

  public saveSettings(newSettings: Partial<PrompterSettings>): PrompterSettings {
    this.settings = {
      ...this.settings,
      ...newSettings
    };
    try {
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.filePath, JSON.stringify(this.settings, null, 2), 'utf-8');
    } catch (err) {
      console.error('[SettingsStore] Failed to save settings to disk:', err);
    }
    return this.settings;
  }

  private load(): PrompterSettings {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        const parsed = JSON.parse(raw);
        return {
          ...DEFAULT_SETTINGS,
          ...parsed
        };
      }
    } catch (err) {
      console.warn('[SettingsStore] Error reading settings file, falling back to defaults:', err);
    }
    return { ...DEFAULT_SETTINGS };
  }
}
