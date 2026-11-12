import { describe, expect, it } from 'vitest';
import { TranscriptEntry } from '../common/types';
import { detectSystemQuestion } from './questionDetector';

const isLikelyQuestion = (text: string) => /\?|покажите|как\s/i.test(text);

function entry(
  id: string,
  source: TranscriptEntry['source'],
  text: string,
  timestamp: number
): TranscriptEntry {
  return { id, source, text, timestamp };
}

describe('detectSystemQuestion', () => {
  it('never auto-detects a microphone question', () => {
    const latest = entry('mic-1', 'mic', 'Как это работает?', 1000);
    expect(detectSystemQuestion([latest], latest, isLikelyQuestion)).toBeNull();
  });

  it('combines only adjacent system fragments inside the join window', () => {
    const first = entry('system-1', 'system', 'Покажите, где в проекте', 1000);
    const latest = entry('system-2', 'system', 'реализована инкапсуляция', 4000);

    expect(detectSystemQuestion([first, latest], latest, isLikelyQuestion)).toEqual({
      text: 'Покажите, где в проекте реализована инкапсуляция',
      transcriptEntryIds: ['system-1', 'system-2']
    });
  });

  it('does not combine a user turn into the teacher question', () => {
    const user = entry('mic-1', 'mic', 'Покажите, где в проекте', 1000);
    const latest = entry('system-1', 'system', 'реализована инкапсуляция', 3000);
    expect(detectSystemQuestion([user, latest], latest, isLikelyQuestion)).toBeNull();
  });

  it('keeps the prefix when the final fragment alone looks like a question', () => {
    const first = entry('system-1', 'system', 'Покажите, где в проекте', 1000);
    const latest = entry('system-2', 'system', 'реализована инкапсуляция?', 3000);
    expect(detectSystemQuestion([first, latest], latest, isLikelyQuestion)?.text).toBe(
      'Покажите, где в проекте реализована инкапсуляция?'
    );
  });
});
