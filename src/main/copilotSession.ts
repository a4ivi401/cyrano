import {
  CopilotAudioStatus,
  CopilotCitation,
  CopilotErrorCode,
  CopilotQuestionCandidate,
  CopilotSessionPhase,
  CopilotSessionSnapshot,
  TranscriptEntry
} from '../common/types';

const EMPTY_AUDIO_STATUS: CopilotAudioStatus = {
  systemEnabled: false,
  systemActive: false,
  systemSpeaking: false,
  micEnabled: false,
  micActive: false,
  micSpeaking: false,
  audioLevel: 0,
  queueDepth: 0
};

function createId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export class CopilotSession {
  private snapshot: CopilotSessionSnapshot = {
    sessionId: 'session_idle',
    generation: 0,
    phase: 'idle',
    transcript: [],
    answer: '',
    citations: [],
    audio: { ...EMPTY_AUDIO_STATUS },
    updatedAt: Date.now()
  };
  private generationCounter = 0;

  constructor(private readonly onChange: (snapshot: CopilotSessionSnapshot) => void) {}

  public start(audio: Pick<CopilotAudioStatus, 'systemEnabled' | 'micEnabled'>): string {
    this.snapshot = {
      sessionId: createId('session'),
      generation: ++this.generationCounter,
      phase: 'awaiting-audio-permission',
      transcript: [],
      answer: '',
      citations: [],
      audio: {
        ...EMPTY_AUDIO_STATUS,
        ...audio
      },
      updatedAt: Date.now()
    };
    this.emit();
    return this.snapshot.sessionId;
  }

  public stop(): void {
    this.snapshot = {
      sessionId: 'session_idle',
      generation: ++this.generationCounter,
      phase: 'idle',
      transcript: [],
      answer: '',
      citations: [],
      audio: { ...EMPTY_AUDIO_STATUS },
      updatedAt: Date.now()
    };
    this.emit();
  }

  public getSnapshot(): CopilotSessionSnapshot {
    return this.cloneSnapshot();
  }

  public isActive(): boolean {
    return this.snapshot.phase !== 'idle';
  }

  public setPhase(phase: CopilotSessionPhase): void {
    this.snapshot.phase = phase;
    if (phase !== 'error') {
      delete this.snapshot.error;
    }
    this.touch();
  }

  public setPaused(paused: boolean): void {
    if (paused) {
      this.snapshot.generation = ++this.generationCounter;
      delete this.snapshot.pendingQuestion;
      this.snapshot.phase = 'paused';
    } else {
      this.snapshot.phase = this.snapshot.audio.systemActive || this.snapshot.audio.micActive
        ? 'listening'
        : 'awaiting-audio-permission';
    }
    delete this.snapshot.error;
    this.touch();
  }

  public updateAudio(audio: Partial<CopilotAudioStatus>): void {
    this.snapshot.audio = {
      ...this.snapshot.audio,
      ...audio,
      audioLevel: Math.max(0, Math.min(100, audio.audioLevel ?? this.snapshot.audio.audioLevel)),
      queueDepth: Math.max(0, audio.queueDepth ?? this.snapshot.audio.queueDepth)
    };
    this.touch();
  }

  public appendTranscript(entry: TranscriptEntry): void {
    this.snapshot.transcript = [...this.snapshot.transcript, entry].slice(-60);
    this.touch();
  }

  public createQuestionCandidate(params: {
    text: string;
    source: CopilotQuestionCandidate['source'];
    transcriptEntryIds: string[];
    reviewDelayMs: number;
  }): CopilotQuestionCandidate {
    const createdAt = Date.now();
    const candidate: CopilotQuestionCandidate = {
      id: createId('question'),
      text: params.text.trim(),
      source: params.source,
      createdAt,
      reviewEndsAt: createdAt + Math.max(0, params.reviewDelayMs),
      transcriptEntryIds: [...params.transcriptEntryIds]
    };

    this.snapshot.pendingQuestion = candidate;
    this.snapshot.phase = 'reviewing-question';
    this.snapshot.answer = '';
    this.snapshot.citations = [];
    delete this.snapshot.error;
    this.touch();
    return { ...candidate, transcriptEntryIds: [...candidate.transcriptEntryIds] };
  }

  public editQuestion(questionId: string, text: string, reviewDelayMs: number): boolean {
    const pending = this.snapshot.pendingQuestion;
    const trimmed = text.trim();
    if (!pending || pending.id !== questionId || !trimmed) return false;

    const now = Date.now();
    this.snapshot.pendingQuestion = {
      ...pending,
      text: trimmed,
      createdAt: now,
      reviewEndsAt: now + Math.max(0, reviewDelayMs)
    };
    this.touch();
    return true;
  }

  public cancelQuestion(questionId?: string): boolean {
    if (!this.snapshot.pendingQuestion) return false;
    if (questionId && this.snapshot.pendingQuestion.id !== questionId) return false;

    delete this.snapshot.pendingQuestion;
    this.snapshot.phase = this.snapshot.audio.systemActive || this.snapshot.audio.micActive
      ? 'listening'
      : 'awaiting-audio-permission';
    this.touch();
    return true;
  }

  public beginAnswer(questionId: string, requestId: string, question: string): boolean {
    const pending = this.snapshot.pendingQuestion;
    if (pending && pending.id !== questionId) return false;

    delete this.snapshot.pendingQuestion;
    this.snapshot.activeRequestId = requestId;
    this.snapshot.activeQuestion = question.trim();
    this.snapshot.answer = '';
    this.snapshot.citations = [];
    this.snapshot.phase = 'answering';
    delete this.snapshot.error;
    this.touch();
    return true;
  }

  public updateAnswer(
    requestId: string,
    fullText: string,
    citations: CopilotCitation[] = []
  ): boolean {
    if (this.snapshot.activeRequestId !== requestId) return false;
    this.snapshot.answer = fullText;
    this.snapshot.citations = citations.map((citation) => ({ ...citation }));
    this.touch();
    return true;
  }

  public finishAnswer(requestId: string, fullText: string, citations: CopilotCitation[] = []): boolean {
    if (!this.updateAnswer(requestId, fullText, citations)) return false;
    delete this.snapshot.activeRequestId;
    this.snapshot.phase = this.snapshot.audio.systemActive || this.snapshot.audio.micActive
      ? 'listening'
      : 'awaiting-audio-permission';
    this.touch();
    return true;
  }

  public fail(code: CopilotErrorCode, message: string, recoverable = true): void {
    this.snapshot.phase = 'error';
    this.snapshot.error = { code, message, recoverable };
    delete this.snapshot.pendingQuestion;
    delete this.snapshot.activeRequestId;
    this.touch();
  }

  public recover(): void {
    this.snapshot.generation = ++this.generationCounter;
    delete this.snapshot.error;
    this.snapshot.phase = this.snapshot.audio.systemActive || this.snapshot.audio.micActive
      ? 'listening'
      : 'awaiting-audio-permission';
    this.touch();
  }

  public clearConversation(): void {
    this.snapshot.generation = ++this.generationCounter;
    this.snapshot.transcript = [];
    this.snapshot.answer = '';
    this.snapshot.citations = [];
    delete this.snapshot.pendingQuestion;
    delete this.snapshot.activeRequestId;
    delete this.snapshot.activeQuestion;
    delete this.snapshot.error;
    this.snapshot.phase = this.snapshot.audio.systemActive || this.snapshot.audio.micActive
      ? 'listening'
      : this.isActive()
        ? 'awaiting-audio-permission'
        : 'idle';
    this.touch();
  }

  private touch(): void {
    this.snapshot.updatedAt = Date.now();
    this.emit();
  }

  private emit(): void {
    this.onChange(this.cloneSnapshot());
  }

  private cloneSnapshot(): CopilotSessionSnapshot {
    return {
      ...this.snapshot,
      transcript: this.snapshot.transcript.map((entry) => ({ ...entry })),
      pendingQuestion: this.snapshot.pendingQuestion
        ? {
            ...this.snapshot.pendingQuestion,
            transcriptEntryIds: [...this.snapshot.pendingQuestion.transcriptEntryIds]
          }
        : undefined,
      citations: this.snapshot.citations.map((citation) => ({ ...citation })),
      audio: { ...this.snapshot.audio },
      error: this.snapshot.error ? { ...this.snapshot.error } : undefined
    };
  }
}
