import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS, DEFAULT_SYSTEM_PROMPT } from './constants';

describe('Copilot defaults', () => {
  it('starts new installs in Copilot without the legacy fictional references', () => {
    expect(DEFAULT_SETTINGS.appMode).toBe('copilot');
    expect(DEFAULT_SETTINGS.captureMicAudio).toBe(false);
    expect(DEFAULT_SYSTEM_PROMPT).not.toContain('Collection.ts');
    expect(DEFAULT_SYSTEM_PROMPT).not.toContain('CustomCollection');
    expect(DEFAULT_SYSTEM_PROMPT).toContain('[[S1]]');
  });
});
