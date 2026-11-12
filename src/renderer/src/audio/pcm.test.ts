import { describe, expect, it } from 'vitest';
import { decodePcm16Le } from './pcm';

describe('decodePcm16Le', () => {
  it('decodes signed little-endian PCM and ignores an incomplete byte', () => {
    const decoded = decodePcm16Le(
      new Uint8Array([0x00, 0x80, 0x00, 0x00, 0xff, 0x7f, 0xff])
    );

    expect(Array.from(decoded)).toEqual([-1, 0, 32767 / 32768]);
  });
});
