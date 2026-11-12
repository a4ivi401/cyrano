import { describe, expect, it } from 'vitest';
import {
  supportsNativeSystemAudio,
  supportsSystemAudioLoopback
} from './platformCapabilities';

describe('supportsSystemAudioLoopback', () => {
  it.each([
    ['darwin', true],
    ['win32', true],
    ['linux', false]
  ] as const)('returns %s support as %s', (platform, supported) => {
    expect(supportsSystemAudioLoopback(platform)).toBe(supported);
  });
});

describe('supportsNativeSystemAudio', () => {
  it.each([
    ['darwin', '14.1', false],
    ['darwin', '14.2', true],
    ['darwin', '27.0.1', true],
    ['win32', '14.2', false]
  ] as const)('returns %s %s support as %s', (platform, version, supported) => {
    expect(supportsNativeSystemAudio(platform, version)).toBe(supported);
  });
});
