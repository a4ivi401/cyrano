import Anthropic from '@anthropic-ai/sdk';
import {
  CopilotAnswerEvent,
  PrompterSettings,
  TranscriptEntry
} from '../common/types';
import { DEFAULT_SYSTEM_PROMPT } from '../common/constants';
import { ContextIndexer } from './contextIndexer';

const QUESTION_PATTERNS = [
  /\?/,
  // Russian question words, exam prompts, commands & technical interview triggers
  /(?:^|\s)(как|почему|зачем|какой|какая|какие|каким|каком|какому|каких|когда|где|откуда|куда|сколько|что\s+такое|в\s+чем|чем\s+отличается|расскажи|расскажите|объясни|объясните|подскажи|подскажите|опиши|опишите|назови|назовите|можешь\s+ли|можете\s+ли|работал\s+ли|работали\s+ли|использовал\s+ли|покажи|покажите|давай\s+посмотрим|а\s+что\s+если|в\s+каком\s+файле|что\s+делает|что\s+значит|для\s+чего|смысл|разница|отличие|поясни|поясните|уточни|уточните|сравни|сравните|почему\s+именно|какова\s+роль|как\s+ты|как\s+вы|ты\s+знаешь|вы\s+знаете|напомни|поделись|реализован|реализовано|реализованы|реализовал|архитектур|паттерн|деструктор|конструктор|наследован|перегрузк)(?:\s|$|[,.!?])/i,
  // English question words, interview prompts & commands
  /(?:^|\s)(what|why|how|when|where|which|who|whose|can\s+you|could\s+you|would\s+you|do\s+you|did\s+you|have\s+you|is\s+there|are\s+there|tell\s+me|explain|walk\s+me\s+through|describe|what's|how's|show\s+me|let's\s+look|what\s+about|what\s+does|which\s+file|difference\s+between|why\s+did\s+you|clarify|compare|give\s+an\s+example|what\s+if)(?:\s|$|[,.!?])/i,
  // Ukrainian question words, exam prompts & commands
  /(?:^|\s)(як|чому|навіщо|який|яка|які|яким|якому|яких|коли|де|звідки|куди|скільки|що\s+таке|у\s+чому|в\s+чому|чим\s+відрізняється|розкажи|розкажіть|поясни|поясніть|підкажи|підкажіть|опиши|опишіть|чи\s+можеш|чи\s+можете|покажи|покажіть|давай\s+подивимось|а\s+що\s+якщо|в\s+якому\s+файлі|що\s+робить|для\s+чого|різниця|відмінність|уточни|порівняй|чому\s+саме|яка\s+роль|як\s+ти|як\s+ви|чи\s+знаєш|нагадай)(?:\s|$|[,.!?])/i
];

interface CopilotQAPair {
  question: string;
  answer: string;
  timestamp: number;
}

export class LLMService {
  private activeAbortController: AbortController | null = null;
  private lastAutoTriggerAt: number = 0;
  private recentQAPairs: CopilotQAPair[] = [];

  public clearHistory(): void {
    this.recentQAPairs = [];
  }

  public recordQAPair(question: string, answer: string): void {
    const q = question.trim();
    const a = answer.trim();
    if (!q || !a) return;
    this.recentQAPairs.push({
      question: q,
      answer: a,
      timestamp: Date.now()
    });
    if (this.recentQAPairs.length > 5) {
      this.recentQAPairs = this.recentQAPairs.slice(-5);
    }
  }

  public isLikelyQuestion(text: string): boolean {
    const cleaned = text.trim();
    if (cleaned.length < 5) return false;
    if (cleaned.includes('?')) return true;
    return QUESTION_PATTERNS.some((pattern) => pattern.test(cleaned));
  }

  public canAutoTrigger(): boolean {
    const now = Date.now();
    // Avoid re-triggering within 4 seconds of the last auto-trigger
    if (now - this.lastAutoTriggerAt < 4000) {
      return false;
    }
    this.lastAutoTriggerAt = now;
    return true;
  }

  public cancelActiveAnswer(): void {
    if (this.activeAbortController) {
      this.activeAbortController.abort();
      this.activeAbortController = null;
    }
  }

  public async testConnection(
    settings: PrompterSettings
  ): Promise<{ success: boolean; message: string }> {
    const apiKey = (settings.llmApiKey || '').trim();
    const model = (settings.llmModel || 'claude-opus-5').trim();
    const provider = settings.llmProvider || 'anthropic';

    if (!apiKey && !this.isLocalEndpoint(settings.llmBaseUrl)) {
      return {
        success: false,
        message: 'API Key is empty.'
      };
    }

    try {
      if (provider === 'anthropic') {
        const client = this.createAnthropicClient(settings);
        const response = await client.messages.create({
          model,
          max_tokens: 24,
          messages: [{ role: 'user', content: 'Reply with OK.' }]
        });
        const textBlock = response.content.find((b) => b.type === 'text');
        const sample = textBlock && 'text' in textBlock ? textBlock.text.trim() : 'OK';
        return {
          success: true,
          message: `Anthropic OK (${response.model}): "${sample.slice(0, 40)}"`
        };
      } else {
        const endpoint = this.resolveOpenAIChatUrl(settings.llmBaseUrl);
        const headers: Record<string, string> = {
          'Content-Type': 'application/json'
        };
        if (apiKey) {
          headers['Authorization'] = `Bearer ${apiKey}`;
        }

        const res = await fetch(endpoint, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            model,
            max_tokens: 24,
            stream: false,
            messages: [{ role: 'user', content: 'Reply with OK.' }]
          })
        });

        if (!res.ok) {
          const errText = await res.text().catch(() => '');
          return {
            success: false,
            message: `HTTP ${res.status}: ${errText.slice(0, 160)}`
          };
        }

        const data = (await res.json()) as any;
        const reply = data?.choices?.[0]?.message?.content?.trim() || 'OK';
        const usedModel = data?.model || model;
        return {
          success: true,
          message: `Connected (${usedModel}): "${reply.slice(0, 40)}"`
        };
      }
    } catch (err: any) {
      if (err instanceof Anthropic.APIError) {
        return {
          success: false,
          message: `Anthropic API Error (${err.status}): ${err.message}`
        };
      }
      return {
        success: false,
        message: err?.message || 'Connection failed'
      };
    }
  }

  /**
   * Analyzes the selected project folder using the connected LLM and generates
   * structured study/defense notes so the model can rapidly answer a teacher's or examiner's questions.
   */
  public async analyzeProjectForNotes(
    settings: PrompterSettings,
    contextIndexer: ContextIndexer
  ): Promise<{ success: boolean; notes?: string; error?: string }> {
    const apiKey = (settings.llmApiKey || '').trim();
    const model = (settings.llmModel || 'claude-opus-5').trim();
    const provider = settings.llmProvider || 'anthropic';
    const lang = settings.language || 'ru';

    if (!settings.contextFolderPath) {
      return {
        success: false,
        error:
          lang === 'en'
            ? 'Please select a project folder first.'
            : lang === 'uk'
              ? 'Спочатку виберіть папку з проектом.'
              : 'Сначала выберите папку с проектом.'
      };
    }

    if (!apiKey && !this.isLocalEndpoint(settings.llmBaseUrl)) {
      return {
        success: false,
        error:
          lang === 'en'
            ? 'API Key is missing. Configure your LLM API key first.'
            : lang === 'uk'
              ? 'Вкажіть API-ключ моделі перед аналізом.'
              : 'Укажите API-ключ модели перед анализом проекта.'
      };
    }

    // Ensure folder is indexed
    let stats = contextIndexer.getStats();
    if (!stats || stats.folderPath !== settings.contextFolderPath || stats.fileCount === 0) {
      stats = contextIndexer.indexFolder(settings.contextFolderPath);
    }

    const snapshot = contextIndexer.getDeepProjectSnapshotForAnalysis(56000);
    if (!snapshot) {
      return {
        success: false,
        error:
          lang === 'en'
            ? 'No readable source files found in the selected folder.'
            : lang === 'uk'
              ? 'У вибраній папці не знайдено файлів коду.'
              : 'В выбранной папке не найдено текстовых файлов с кодом.'
      };
    }

    const targetLangName =
      lang === 'en' ? 'English' : lang === 'uk' ? 'Ukrainian (Українська)' : 'Russian (Русский)';

    const systemInstruction = `You are a senior software architect and academic defense coach.
Analyze the provided project source code and generate a high-density, structured technical cheat-sheet in ${targetLangName} so the student/developer and the real-time AI Copilot can instantaneously answer any question from a professor, teacher, or technical examiner.

Structure your output clearly with these 4 sections:
1. СУТЬ ПРОЕКТА И СТЕК (Project Purpose & Tech Stack): What the project does, languages, frameworks, libraries, and why they were chosen.
2. АРХИТЕКТУРА И ГЛАВНЫЕ ФАЙЛЫ (Architecture & Key Files): Entry points, folder structure, main modules/classes/functions, and what each file is responsible for.
3. КЛЮЧЕВАЯ ЛОГИКА И АЛГОРИТМЫ (Core Logic & Data Flow): Step-by-step explanation of how the main features work under the hood, state management, database/storage, APIs, or algorithms used.
4. ВОПРОСЫ ПРЕПОДАВАТЕЛЯ И ОТВЕТЫ (Likely Teacher Questions & Answers): 5–7 specific technical questions a teacher/examiner is likely to ask about this exact code, with concise, accurate answers referencing exact file and function names.

Keep it factual, specific to the actual code (mention real file names, classes, and functions), and concise (around 400–700 words).`;

    const userPrompt = `Here is the indexed codebase of the project:\n\n${snapshot}\n\nGenerate the structured project defense cheat-sheet in ${targetLangName}:`;

    try {
      if (provider === 'anthropic') {
        const client = this.createAnthropicClient(settings);
        const stream = client.messages.stream({
          model,
          max_tokens: 2500,
          system: systemInstruction,
          messages: [{ role: 'user', content: userPrompt }]
        });
        const finalMsg = await stream.finalMessage();
        const textBlocks = finalMsg.content
          .filter((b) => b.type === 'text')
          .map((b) => ('text' in b ? b.text : ''))
          .join('\n')
          .trim();

        return {
          success: true,
          notes: textBlocks
        };
      } else {
        const endpoint = this.resolveOpenAIChatUrl(settings.llmBaseUrl);
        const headers: Record<string, string> = {
          'Content-Type': 'application/json'
        };
        if (apiKey) {
          headers['Authorization'] = `Bearer ${apiKey}`;
        }

        const res = await fetch(endpoint, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            model,
            max_tokens: 2500,
            temperature: 0.2,
            stream: false,
            messages: [
              { role: 'system', content: systemInstruction },
              { role: 'user', content: userPrompt }
            ]
          })
        });

        if (!res.ok) {
          const errText = await res.text().catch(() => '');
          return {
            success: false,
            error: `HTTP ${res.status}: ${errText.slice(0, 180)}`
          };
        }

        const data = (await res.json()) as any;
        const notes = data?.choices?.[0]?.message?.content?.trim() || '';
        if (!notes) {
          return {
            success: false,
            error: 'Empty response from LLM.'
          };
        }

        return {
          success: true,
          notes
        };
      }
    } catch (err: any) {
      if (err instanceof Anthropic.APIError) {
        return {
          success: false,
          error: `Anthropic API Error (${err.status}): ${err.message}`
        };
      }
      return {
        success: false,
        error: err?.message || 'Failed to analyze project'
      };
    }
  }

  public async streamCopilotAnswer(params: {
    requestId: string;
    settings: PrompterSettings;
    transcript: TranscriptEntry[];
    contextIndexer: ContextIndexer;
    customQuestion?: string;
    onEvent: (event: CopilotAnswerEvent) => void;
  }): Promise<void> {
    const { requestId, settings, transcript, contextIndexer, customQuestion, onEvent } = params;

    // Cancel any in-flight stream
    if (this.activeAbortController) {
      this.activeAbortController.abort();
      this.activeAbortController = null;
    }

    const abortController = new AbortController();
    this.activeAbortController = abortController;

    // Determine the primary question/topic from the transcript or custom prompt
    let latestInterlocutorQuestion = (customQuestion || '').trim();

    if (!latestInterlocutorQuestion && transcript.length > 0) {
      const lastEntry = transcript[transcript.length - 1];
      // Only combine if the immediately preceding turn was part of the same continuous phrase (within 7s)
      const continuousUtterance = transcript
        .slice(-2)
        .filter((e) => lastEntry.timestamp - e.timestamp <= 7000)
        .map((e) => e.text.trim())
        .filter(Boolean);

      latestInterlocutorQuestion = continuousUtterance.join(' ').trim();
    }

    if (!latestInterlocutorQuestion) {
      // If project context notes exist, provide an instant defense cheat sheet rather than an empty error
      if (settings.contextCustomNotes || settings.contextFolderPath) {
        const lang = settings.language || 'ru';
        latestInterlocutorQuestion =
          lang === 'en'
            ? 'Key project defense highlights and architectural summary'
            : lang === 'uk'
              ? 'Ключові тези захисту проекту та архітектурний огляд'
              : 'Ключевые тезисы защиты проекта и архитектурный обзор';
      } else {
        const lang = settings.language || 'ru';
        const noSpeechMsg =
          lang === 'en'
            ? 'Listening to live meeting audio & mic. Speak a question or let the interlocutor speak.'
            : lang === 'uk'
              ? 'Слухаю аудіо зустрічі та мікрофон. Скажіть питання або зачекайте репліки співрозмовника.'
              : 'Слушаю аудио встречи и микрофон. Задайте вопрос вслух или дождитесь реплики собеседника.';

        onEvent({
          requestId,
          status: 'error',
          question: '',
          fullText: '',
          error: noSpeechMsg
        });
        return;
      }
    }

    onEvent({
      requestId,
      status: 'thinking',
      question: latestInterlocutorQuestion,
      fullText: ''
    });

    try {
      const baseSystemPrompt = (settings.llmSystemPrompt || DEFAULT_SYSTEM_PROMPT).trim();
      const staticProjectSummary = contextIndexer.getStaticProjectSummary(
        settings.contextCustomNotes
      );

      // Build query keywords specifically for the current question
      const recentQueryText = (
        latestInterlocutorQuestion ||
        customQuestion ||
        transcript.map((t) => t.text).join(' ')
      ).trim();

      // Expand query keywords with concepts from previous Q&A turns so follow-up questions
      // (like "де написана колекція?", "покажи цей файл", "як це працює?") find the right files
      let expandedQueryText = recentQueryText;
      if (this.recentQAPairs.length > 0) {
        const lastTurn = this.recentQAPairs[this.recentQAPairs.length - 1];
        expandedQueryText = `${recentQueryText} ${lastTurn.question} ${lastTurn.answer.slice(0, 400)}`;
      }

      const relevantSourceCode = contextIndexer.getRelevantFilesForQuery(expandedQueryText, 5, 24000);

      // Format previous Copilot Q&A history if available (for follow-up questions and conversational continuity)
      let formattedPreviousQAs = '';
      if (this.recentQAPairs.length > 0) {
        const turns = this.recentQAPairs
          .slice(-3)
          .map((item, idx) => {
            const shortAns = item.answer.length > 800 ? `${item.answer.slice(0, 800)}...` : item.answer;
            return `[Previous Turn #${idx + 1}]\nQuestion: "${item.question}"\nYour Answer:\n${shortAns}`;
          })
          .join('\n\n');
        formattedPreviousQAs = `=== PREVIOUS COPILOT Q&A HISTORY (Use this to resolve referential follow-ups like "де це", "де написана колекція", etc.) ===\n${turns}`;
      }

      // Format recent live meeting transcript (up to last 14 turns)
      const recentTurns = transcript.slice(-14);
      const formattedTranscript =
        recentTurns.length > 0
          ? recentTurns
              .map((entry) => {
                const roleLabel = entry.source === 'system' ? '[Interlocutor / Meeting]' : '[Me / User]';
                return `${roleLabel}: ${entry.text}`;
              })
              .join('\n')
          : '(No live audio transcript captured yet)';

      const userPromptParts: string[] = [];
      if (relevantSourceCode) {
        userPromptParts.push(`=== RELEVANT PROJECT SOURCE CODE (with line numbers) ===\n${relevantSourceCode}`);
      }
      if (formattedPreviousQAs) {
        userPromptParts.push(formattedPreviousQAs);
      }
      userPromptParts.push(`=== LIVE MEETING TRANSCRIPT ===\n${formattedTranscript}`);
      userPromptParts.push(
        `=== TARGET QUESTION / FOCUS ===\n${latestInterlocutorQuestion}\n\nProvide a direct, well-structured answer with exact file and line references if asked about code (in the same language as the question).`
      );

      const userMessageContent = userPromptParts.join('\n\n');

      if (settings.llmProvider === 'anthropic') {
        await this.streamAnthropic({
          requestId,
          settings,
          baseSystemPrompt,
          staticProjectSummary,
          userMessageContent,
          question: latestInterlocutorQuestion,
          abortSignal: abortController.signal,
          onEvent
        });
      } else {
        await this.streamOpenAICompatible({
          requestId,
          settings,
          baseSystemPrompt,
          staticProjectSummary,
          userMessageContent,
          question: latestInterlocutorQuestion,
          abortSignal: abortController.signal,
          onEvent
        });
      }
    } catch (err: any) {
      if (abortController.signal.aborted || err?.name === 'AbortError') {
        return;
      }
      const errorMsg =
        err instanceof Anthropic.APIError
          ? `Anthropic Error (${err.status}): ${err.message}`
          : err?.message || 'LLM request failed';

      onEvent({
        requestId,
        status: 'error',
        question: latestInterlocutorQuestion,
        fullText: '',
        error: errorMsg
      });
    } finally {
      if (this.activeAbortController === abortController) {
        this.activeAbortController = null;
      }
    }
  }

  private async streamAnthropic(params: {
    requestId: string;
    settings: PrompterSettings;
    baseSystemPrompt: string;
    staticProjectSummary: string;
    userMessageContent: string;
    question: string;
    abortSignal: AbortSignal;
    onEvent: (event: CopilotAnswerEvent) => void;
  }): Promise<void> {
    const {
      requestId,
      settings,
      baseSystemPrompt,
      staticProjectSummary,
      userMessageContent,
      question,
      abortSignal,
      onEvent
    } = params;

    const client = this.createAnthropicClient(settings);
    const model = (settings.llmModel || 'claude-opus-5').trim();

    const systemBlocks: Anthropic.TextBlockParam[] = [
      {
        type: 'text',
        text: baseSystemPrompt
      }
    ];

    if (staticProjectSummary) {
      systemBlocks.push({
        type: 'text',
        text: staticProjectSummary,
        cache_control: { type: 'ephemeral' }
      });
    }

    let fullText = '';

    const stream = client.messages.stream(
      {
        model,
        max_tokens: 2048,
        system: systemBlocks,
        messages: [
          {
            role: 'user',
            content: userMessageContent
          }
        ]
      },
      { signal: abortSignal }
    );

    stream.on('text', (delta) => {
      if (abortSignal.aborted) return;
      fullText += delta;
      onEvent({
        requestId,
        status: 'streaming',
        question,
        delta,
        fullText
      });
    });

    await stream.finalMessage();

    if (!abortSignal.aborted) {
      this.recordQAPair(question, fullText);
      onEvent({
        requestId,
        status: 'done',
        question,
        fullText
      });
    }
  }

  private async streamOpenAICompatible(params: {
    requestId: string;
    settings: PrompterSettings;
    baseSystemPrompt: string;
    staticProjectSummary: string;
    userMessageContent: string;
    question: string;
    abortSignal: AbortSignal;
    onEvent: (event: CopilotAnswerEvent) => void;
  }): Promise<void> {
    const {
      requestId,
      settings,
      baseSystemPrompt,
      staticProjectSummary,
      userMessageContent,
      question,
      abortSignal,
      onEvent
    } = params;

    const endpoint = this.resolveOpenAIChatUrl(settings.llmBaseUrl);
    const apiKey = (settings.llmApiKey || '').trim();
    const model = (settings.llmModel || 'claude-opus-5').trim();

    const systemContent = staticProjectSummary
      ? `${baseSystemPrompt}\n\n${staticProjectSummary}`
      : baseSystemPrompt;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream'
    };
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      signal: abortSignal,
      body: JSON.stringify({
        model,
        stream: true,
        max_tokens: 2048,
        temperature: 0.3,
        messages: [
          { role: 'system', content: systemContent },
          { role: 'user', content: userMessageContent }
        ]
      })
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      throw new Error(`HTTP ${response.status}: ${errText.slice(0, 240)}`);
    }

    const contentType = response.headers.get('content-type') || '';
    let fullText = '';

    // Fallback if endpoint returned a non-streaming JSON body
    if (contentType.includes('application/json') && !contentType.includes('event-stream')) {
      const data = (await response.json()) as any;
      const content = data?.choices?.[0]?.message?.content || '';
      fullText = content;
      onEvent({
        requestId,
        status: 'streaming',
        question,
        delta: content,
        fullText
      });
      this.recordQAPair(question, fullText);
      onEvent({
        requestId,
        status: 'done',
        question,
        fullText
      });
      return;
    }

    if (!response.body) {
      throw new Error('Response body is empty');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (abortSignal.aborted) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split(/\r?\n/);
      buffer = lines.pop() || '';

      for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line || !line.startsWith('data:')) continue;

        const dataPayload = line.slice(5).trim();
        if (dataPayload === '[DONE]') {
          continue;
        }

        try {
          const parsed = JSON.parse(dataPayload);
          const delta = parsed?.choices?.[0]?.delta?.content;
          if (typeof delta === 'string' && delta.length > 0) {
            fullText += delta;
            onEvent({
              requestId,
              status: 'streaming',
              question,
              delta,
              fullText
            });
          }
        } catch {
          // Ignore partial or keep-alive SSE comments
        }
      }
    }

    if (!abortSignal.aborted) {
      this.recordQAPair(question, fullText);
      onEvent({
        requestId,
        status: 'done',
        question,
        fullText
      });
    }
  }

  private createAnthropicClient(settings: PrompterSettings): Anthropic {
    const apiKey = (settings.llmApiKey || '').trim() || 'sk-ant-placeholder';
    let baseURL = (settings.llmBaseUrl || 'https://api.anthropic.com').trim().replace(/\/+$/, '');
    // @anthropic-ai/sdk automatically appends /v1/messages, so strip trailing /v1 if user included it
    if (baseURL.endsWith('/v1')) {
      baseURL = baseURL.slice(0, -3);
    }
    return new Anthropic({
      apiKey,
      baseURL: baseURL || undefined
    });
  }

  private resolveOpenAIChatUrl(rawBaseUrl?: string): string {
    const cleaned = (rawBaseUrl || 'https://api.openai.com/v1').trim().replace(/\/+$/, '');
    if (cleaned.endsWith('/chat/completions')) {
      return cleaned;
    }
    // If URL is just origin (e.g. https://my-omnirouter.com), append /v1/chat/completions
    try {
      const parsed = new URL(cleaned);
      if (parsed.pathname === '' || parsed.pathname === '/') {
        return `${cleaned}/v1/chat/completions`;
      }
    } catch {
      // Fallback
    }
    return `${cleaned}/chat/completions`;
  }

  private isLocalEndpoint(url?: string): boolean {
    if (!url) return false;
    return url.includes('localhost') || url.includes('127.0.0.1') || url.includes('0.0.0.0');
  }
}
