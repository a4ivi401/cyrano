import { TranscriptEntry } from '../common/types';

export interface DetectedQuestion {
  text: string;
  transcriptEntryIds: string[];
}

export function detectSystemQuestion(
  transcript: readonly TranscriptEntry[],
  latestEntry: TranscriptEntry,
  isLikelyQuestion: (text: string) => boolean,
  joinWindowMs = 7000,
  excludedEntryIds: ReadonlySet<string> = new Set()
): DetectedQuestion | null {
  const latestText = latestEntry.text.trim();
  if (
    latestEntry.source !== 'system' ||
    !latestText ||
    excludedEntryIds.has(latestEntry.id)
  ) {
    return null;
  }

  let latestIndex = -1;
  for (let index = transcript.length - 1; index >= 0; index -= 1) {
    if (transcript[index].id === latestEntry.id) {
      latestIndex = index;
      break;
    }
  }
  if (latestIndex > 0) {
    const previous = transcript[latestIndex - 1];
    const gap = latestEntry.timestamp - previous.timestamp;
    const previousText = previous.text.trim();
    if (
      previous.source === 'system' &&
      previousText &&
      !excludedEntryIds.has(previous.id) &&
      gap >= 0 &&
      gap <= joinWindowMs &&
      !/[.!?]\s*$/.test(previousText)
    ) {
      const combined = `${previousText} ${latestText}`;
      if (isLikelyQuestion(combined)) {
        return {
          text: combined,
          transcriptEntryIds: [previous.id, latestEntry.id]
        };
      }
    }
  }

  if (!isLikelyQuestion(latestText)) return null;

  return {
    text: latestText,
    transcriptEntryIds: [latestEntry.id]
  };
}
