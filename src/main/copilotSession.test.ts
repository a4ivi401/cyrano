import { describe, expect, it } from 'vitest';
import { CopilotSession } from './copilotSession';

describe('CopilotSession', () => {
  it('rejects stale answer updates and keeps verified citations on completion', () => {
    const snapshots: string[] = [];
    const session = new CopilotSession((snapshot) => snapshots.push(snapshot.phase));
    session.start({ systemEnabled: true, micEnabled: false });
    session.updateAudio({ systemActive: true });
    const question = session.createQuestionCandidate({
      text: 'Where is the loop?',
      source: 'system',
      transcriptEntryIds: ['entry-1'],
      reviewDelayMs: 2000
    });

    expect(session.beginAnswer(question.id, 'request-current', question.text)).toBe(true);
    expect(session.updateAnswer('request-old', 'stale answer')).toBe(false);
    expect(session.getSnapshot().answer).toBe('');

    const citations = [
      {
        id: 'S1',
        relativePath: 'src/Loop.cs',
        startLine: 10,
        endLine: 20,
        label: 'Loop.cs(10-20)'
      }
    ];
    expect(session.finishAnswer('request-current', 'Current answer', citations)).toBe(true);

    const snapshot = session.getSnapshot();
    expect(snapshot.answer).toBe('Current answer');
    expect(snapshot.citations).toEqual(citations);
    expect(snapshot.phase).toBe('listening');
    expect(snapshots).toContain('reviewing-question');
  });

  it('advances the generation when queued audio must be invalidated', () => {
    const session = new CopilotSession(() => {});
    session.start({ systemEnabled: true, micEnabled: false });
    const startedGeneration = session.getSnapshot().generation;

    session.setPaused(true);
    const pausedGeneration = session.getSnapshot().generation;
    expect(pausedGeneration).toBeGreaterThan(startedGeneration);

    session.setPaused(false);
    session.clearConversation();
    expect(session.getSnapshot().generation).toBeGreaterThan(pausedGeneration);
  });
});
