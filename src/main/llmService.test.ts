import { afterEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_SETTINGS } from '../common/constants';
import { CopilotAnswerEvent, PrompterSettings } from '../common/types';
import { ContextIndexer } from './contextIndexer';
import { LLMService } from './llmService';

const temporaryDirectories: string[] = [];

afterEach(() => {
  vi.unstubAllGlobals();
  for (const directory of temporaryDirectories.splice(0)) {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

function openAiSettings(): PrompterSettings {
  return {
    ...DEFAULT_SETTINGS,
    llmProvider: 'openai-compatible',
    llmBaseUrl: 'http://localhost:11434/v1',
    llmModel: 'test-model'
  };
}

describe('LLMService streaming', () => {
  it('parses a multiline SSE event and the final done marker', async () => {
    const encoder = new TextEncoder();
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(
          encoder.encode(
            'data: {"choices":[{"delta":\n' +
              'data: {"content":"Hello"}}]}\n\n' +
              'data: [DONE]\n\n'
          )
        );
        controller.close();
      }
    });
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(body, {
          status: 200,
          headers: { 'content-type': 'text/event-stream' }
        })
      )
    );

    const events: CopilotAnswerEvent[] = [];
    await new LLMService().streamCopilotAnswer({
      requestId: 'request-1',
      sessionId: 'session-1',
      questionId: 'question-1',
      settings: openAiSettings(),
      transcript: [],
      contextIndexer: new ContextIndexer(),
      customQuestion: 'Say hello',
      onEvent: (event) => events.push(event)
    });

    expect(events.at(-1)).toMatchObject({
      status: 'done',
      fullText: 'Hello'
    });
  });

  it('does not call a provider for an empty confirmed question', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const events: CopilotAnswerEvent[] = [];

    await new LLMService().streamCopilotAnswer({
      requestId: 'request-2',
      settings: openAiSettings(),
      transcript: [],
      contextIndexer: new ContextIndexer(),
      customQuestion: '   ',
      onEvent: (event) => events.push(event)
    });

    expect(fetchMock).not.toHaveBeenCalled();
    expect(events.at(-1)?.status).toBe('error');
  });

  it('keeps only source references resolved from current retrieval candidates', async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'cyrano-llm-'));
    temporaryDirectories.push(root);
    fs.writeFileSync(
      path.join(root, 'Student.cs'),
      'public class Student { private int grade; public int Grade => grade; }',
      'utf8'
    );
    const indexer = new ContextIndexer();
    indexer.indexFolder(root);
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(
          JSON.stringify({
            choices: [
              {
                message: {
                  content: 'API https://api.example.com:443. Encapsulation is shown in Fake.cs(1-99), Поддельный файл.cs(2-5), and [[S1]].'
                }
              }
            ]
          }),
          { status: 200, headers: { 'content-type': 'application/json' } }
        )
      )
    );

    const events: CopilotAnswerEvent[] = [];
    await new LLMService().streamCopilotAnswer({
      requestId: 'request-3',
      settings: openAiSettings(),
      transcript: [],
      contextIndexer: indexer,
      customQuestion: 'Where is encapsulation implemented?',
      onEvent: (event) => events.push(event)
    });

    const completed = events.at(-1);
    expect(completed?.status).toBe('done');
    expect(completed?.fullText).not.toContain('Fake.cs');
    expect(completed?.fullText).not.toContain('Поддельный файл.cs');
    expect(completed?.fullText).toContain('https://api.example.com:443');
    expect(completed?.citations).toHaveLength(1);
    expect(completed?.fullText).toContain(completed?.citations?.[0].label);
  });
});
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
