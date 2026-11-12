import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('electron', () => ({
  app: {
    getPath: () => os.tmpdir(),
    getAppPath: () => process.cwd()
  },
  net: {
    fetch: globalThis.fetch
  }
}));

import {
  validateWhisperModelDirectory,
  WHISPER_MODEL_REQUIRED_FILES
} from './whisperModelManager';

const temporaryDirectories: string[] = [];

function createModelDirectory(): string {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'cyrano-model-'));
  temporaryDirectories.push(directory);

  for (const relativePath of WHISPER_MODEL_REQUIRED_FILES) {
    const filePath = path.join(directory, ...relativePath.split('/'));
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    if (relativePath.endsWith('.onnx')) {
      fs.writeFileSync(filePath, Buffer.alloc(1024 * 1024));
    } else {
      fs.writeFileSync(
        filePath,
        JSON.stringify(relativePath === 'config.json' ? { model_type: 'whisper' } : {}),
        'utf8'
      );
    }
  }
  return directory;
}

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

describe('validateWhisperModelDirectory', () => {
  it('requires the complete local model manifest', () => {
    const directory = createModelDirectory();
    expect(validateWhisperModelDirectory(directory).valid).toBe(true);

    fs.rmSync(path.join(directory, 'onnx', 'decoder_model_merged_quantized.onnx'));
    const incomplete = validateWhisperModelDirectory(directory);
    expect(incomplete.valid).toBe(false);
    expect(incomplete.missingFiles).toContain('onnx/decoder_model_merged_quantized.onnx');
  });
});
