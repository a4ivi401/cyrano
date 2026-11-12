import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { AudioSourceType, PrompterSettings } from '../../../common/types';
import captureWorkletUrl from '../audio/capture.worklet.ts?worker&url';
import { decodePcm16Le } from '../audio/pcm';

interface UseAudioCaptureOptions {
  enabled: boolean;
  settings: PrompterSettings;
  sessionId: string;
  sessionGeneration: number;
  paused?: boolean;
}

export interface AudioCaptureState {
  systemActive: boolean;
  micActive: boolean;
  systemSpeaking: boolean;
  micSpeaking: boolean;
  isTranscribing: boolean;
  audioLevel: number;
  error: string | null;
  systemError: string | null;
  micError: string | null;
  queueDepth: number;
  flushAndTranscribe: () => Promise<string>;
  resetBuffers: () => void;
  isPaused: boolean;
}

interface TimedAudioFrame {
  samples: Float32Array;
  startedAt: number;
  endedAt: number;
}

type WorkletSamplesMessage =
  | {
      type: 'samples';
      samples: Float32Array;
      startFrame: number;
      endFrame: number;
    }
  | {
      type: 'flushed';
      requestId: number;
    };

interface SubmissionResult {
  sequence: number;
  text: string;
}

type FlushHandler = () => Promise<SubmissionResult | null>;

const TARGET_SAMPLE_RATE = 16000;
const WORKLET_BATCH_SIZE = 2048;
const PRE_ROLL_SAMPLES = Math.round(TARGET_SAMPLE_RATE * 0.45);
const ENDPOINT_SILENCE_MS = 850;
const SPEECH_START_MS = 90;
const MIN_SPEECH_SAMPLES = Math.round(TARGET_SAMPLE_RATE * 0.25);
const MIN_MANUAL_SPEECH_SAMPLES = Math.round(TARGET_SAMPLE_RATE * 0.12);
const MAX_CHUNK_SAMPLES = TARGET_SAMPLE_RATE * 20;
const DIGITAL_SILENCE_RMS = 0.0000001;
const DETECTABLE_SIGNAL_RMS = 0.00001;
const MIN_VAD_THRESHOLD = 0.00035;
const VAD_NOISE_RATIO = 2.5;
const VAD_NOISE_MARGIN = 0.00025;
const NO_AUDIO_FRAME_TIMEOUT_MS = 4000;
const INITIAL_NO_SIGNAL_TIMEOUT_MS = 10000;
const HEALTH_CHECK_INTERVAL_MS = 1000;
const LEVEL_UPDATE_INTERVAL_MS = 80;
const MAX_PENDING_TRANSCRIPTIONS = 8;

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function calculateRms(samples: Float32Array): number {
  if (samples.length === 0) return 0;

  let sumSquares = 0;
  for (let i = 0; i < samples.length; i++) {
    sumSquares += samples[i] * samples[i];
  }
  return Math.sqrt(sumSquares / samples.length);
}

function downsampleTo16k(input: Float32Array, inputSampleRate: number): Float32Array {
  if (inputSampleRate === TARGET_SAMPLE_RATE) {
    return input.slice();
  }

  const ratio = inputSampleRate / TARGET_SAMPLE_RATE;
  const outputLength = Math.max(1, Math.round(input.length / ratio));
  const output = new Float32Array(outputLength);

  if (ratio < 1) {
    for (let i = 0; i < outputLength; i++) {
      const position = Math.min(input.length - 1, i * ratio);
      const left = Math.floor(position);
      const right = Math.min(input.length - 1, left + 1);
      const weight = position - left;
      output[i] = input[left] * (1 - weight) + input[right] * weight;
    }
    return output;
  }

  let inputOffset = 0;
  for (let outputOffset = 0; outputOffset < outputLength; outputOffset++) {
    const nextInputOffset = Math.min(input.length, Math.round((outputOffset + 1) * ratio));
    let sum = 0;
    let count = 0;
    for (let i = inputOffset; i < nextInputOffset; i++) {
      sum += input[i];
      count += 1;
    }
    output[outputOffset] = count > 0 ? sum / count : 0;
    inputOffset = nextInputOffset;
  }

  return output;
}

function mergeFrames(frames: TimedAudioFrame[], totalSamples: number): Float32Array {
  const merged = new Float32Array(totalSamples);
  let offset = 0;
  for (const frame of frames) {
    merged.set(frame.samples, offset);
    offset += frame.samples.length;
  }
  return merged;
}

function stopMediaStream(stream: MediaStream): () => void {
  let stopped = false;
  return () => {
    if (stopped) return;
    stopped = true;
    for (const track of stream.getTracks()) {
      try {
        track.stop();
      } catch {
        // A track may already have ended independently.
      }
    }
  };
}

function describeSystemCaptureError(error: unknown, customDevice: boolean): string {
  const name = error instanceof DOMException ? error.name : '';
  const detail = getErrorMessage(error);

  if (detail.startsWith('System audio')) return detail;
  if (
    name === 'NotAllowedError' ||
    name === 'SecurityError' ||
    (name === 'AbortError' && /invalid capture constraints/i.test(detail))
  ) {
    return 'System audio capture was denied. Allow Screen Recording/audio sharing, then start capture again.';
  }
  if (name === 'NotFoundError') {
    return customDevice
      ? 'The selected system loopback device is unavailable. Reconnect it or select another device in Settings.'
      : 'No shareable system-audio source was found. Play meeting audio and start capture again.';
  }
  if (name === 'NotReadableError') {
    return 'System audio cannot be read. Close other capture apps and start capture again.';
  }

  return customDevice
    ? `Could not open the selected system loopback device. Check it in Settings and try again. (${detail})`
    : `System audio capture failed. Allow Screen Recording and share a source with audio, then try again. (${detail})`;
}

function describeMicCaptureError(error: unknown): string {
  const name = error instanceof DOMException ? error.name : '';
  const detail = getErrorMessage(error);

  if (detail.startsWith('Microphone')) return detail;
  if (name === 'NotAllowedError' || name === 'SecurityError') {
    return 'Microphone capture was denied. Allow microphone access in system settings, then start capture again.';
  }
  if (name === 'NotFoundError') {
    return 'The selected microphone is unavailable. Reconnect it or select another microphone in Settings.';
  }
  if (name === 'NotReadableError') {
    return 'The microphone cannot be read. Close other audio apps and start capture again.';
  }

  return `Microphone capture failed. Check the selected microphone and try again. (${detail})`;
}

export function useAudioCapture({
  enabled,
  settings,
  sessionId,
  sessionGeneration,
  paused
}: UseAudioCaptureOptions): AudioCaptureState {
  const [systemActive, setSystemActive] = useState(false);
  const [micActive, setMicActive] = useState(false);
  const [systemSpeaking, setSystemSpeaking] = useState(false);
  const [micSpeaking, setMicSpeaking] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [queueDepth, setQueueDepth] = useState(0);
  const [systemError, setSystemError] = useState<string | null>(null);
  const [micError, setMicError] = useState<string | null>(null);
  const [transcriptionError, setTranscriptionError] = useState<string | null>(null);

  const mountedRef = useRef(true);
  const pausedRef = useRef(Boolean(paused));
  const activeFlushHandlersRef = useRef<FlushHandler[]>([]);
  const activeResetHandlersRef = useRef<Array<() => void>>([]);
  const sourceLevelsRef = useRef<Record<AudioSourceType, number>>({ system: 0, mic: 0 });
  const sequenceRef = useRef(0);
  const pendingCountRef = useRef(0);
  const queueTailRef = useRef<Promise<void>>(Promise.resolve());
  const latestCompletedResultRef = useRef<SubmissionResult | null>(null);
  const manualFlushTailRef = useRef<Promise<void>>(Promise.resolve());
  const statusReportingDisabledRef = useRef(false);
  const sessionRef = useRef({ sessionId, sessionGeneration });

  pausedRef.current = Boolean(paused);
  sessionRef.current = { sessionId, sessionGeneration };

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const setSourceError = useCallback((source: AudioSourceType, message: string | null) => {
    if (!mountedRef.current) return;
    if (source === 'system') {
      setSystemError(message);
    } else {
      setMicError(message);
    }
  }, []);

  const enqueueTranscription = useCallback(
    (
      samples: Float32Array,
      source: AudioSourceType,
      startedAt: number,
      endedAt: number
    ): Promise<SubmissionResult> => {
      const sequence = ++sequenceRef.current;
      const submissionSession = { ...sessionRef.current };
      if (pendingCountRef.current >= MAX_PENDING_TRANSCRIPTIONS) {
        if (mountedRef.current) {
          setTranscriptionError(
            'Speech recognition is falling behind. Pause briefly or select a faster Whisper model.'
          );
        }
        return Promise.resolve({ sequence, text: '' });
      }
      pendingCountRef.current += 1;
      if (mountedRef.current) {
        setQueueDepth(pendingCountRef.current);
      }

      const submit = async (): Promise<SubmissionResult> => {
        try {
          const api = window.electronAPI;
          if (!api?.transcribeAudioChunk) {
            throw new Error('The transcription IPC bridge is unavailable');
          }

          const res = await api.transcribeAudioChunk({
            samples,
            source,
            sessionId: submissionSession.sessionId,
            sessionGeneration: submissionSession.sessionGeneration,
            sequence,
            startedAt: Math.round(startedAt),
            endedAt: Math.round(Math.max(startedAt, endedAt))
          });

          if (!res) {
            throw new Error('The transcription service returned no response');
          }
          if (res.error) {
            if (mountedRef.current) {
              setTranscriptionError(`Transcription failed for ${source} audio: ${res.error}`);
            }
            return { sequence, text: '' };
          }

          return { sequence, text: res.text?.trim() || '' };
        } catch (error) {
          if (mountedRef.current) {
            setTranscriptionError(
              `Transcription failed for ${source} audio: ${getErrorMessage(error)}`
            );
          }
          return { sequence, text: '' };
        }
      };

      const task = queueTailRef.current.then(submit, submit);
      queueTailRef.current = task.then(
        () => undefined,
        () => undefined
      );
      const finalize = (result?: SubmissionResult) => {
        if (result?.text) latestCompletedResultRef.current = result;
        pendingCountRef.current = Math.max(0, pendingCountRef.current - 1);
        if (mountedRef.current) {
          setQueueDepth(pendingCountRef.current);
        }
      };
      void task.then((result) => finalize(result), () => finalize());

      return task;
    },
    []
  );

  const resetBuffers = useCallback(() => {
    for (const reset of [...activeResetHandlersRef.current]) {
      try {
        reset();
      } catch {
        // A pipeline can disappear while settings are changing.
      }
    }

    latestCompletedResultRef.current = null;

    sourceLevelsRef.current = { system: 0, mic: 0 };
    if (mountedRef.current) {
      setSystemSpeaking(false);
      setMicSpeaking(false);
      setAudioLevel(0);
      setTranscriptionError(null);
    }
  }, []);

  const flushAndTranscribe = useCallback((): Promise<string> => {
    const flush = async (): Promise<string> => {
      const handlerPromises: Array<Promise<SubmissionResult | null>> = [];
      for (const handler of [...activeFlushHandlersRef.current]) {
        try {
          handlerPromises.push(handler());
        } catch (error) {
          if (mountedRef.current) {
            setTranscriptionError(`Could not flush captured audio: ${getErrorMessage(error)}`);
          }
        }
      }

      const handlerResults = await Promise.allSettled(handlerPromises);
      const boundary = sequenceRef.current;
      const queueBarrier = queueTailRef.current;
      await queueBarrier;
      const results = handlerResults.flatMap((result) =>
        result.status === 'fulfilled' && result.value ? [result.value] : []
      );
      const latestCompleted = latestCompletedResultRef.current;
      if (latestCompleted && latestCompleted.sequence <= boundary) {
        results.push(latestCompleted);
        latestCompletedResultRef.current = null;
      }

      const seen = new Set<string>();
      const uniqueTexts: string[] = [];
      for (const result of results.sort((left, right) => left.sequence - right.sequence)) {
        const text = result.text.replace(/\s+/g, ' ').trim();
        const key = text.toLocaleLowerCase();
        if (!text || seen.has(key)) continue;
        seen.add(key);
        uniqueTexts.push(text);
      }

      return uniqueTexts.join(' ');
    };

    const result = manualFlushTailRef.current.then(flush, flush);
    manualFlushTailRef.current = result.then(
      () => undefined,
      () => undefined
    );
    return result;
  }, []);

  const captureEnabled = enabled && settings.appMode === 'copilot';

  useEffect(() => {
    if (statusReportingDisabledRef.current) return;
    const reportStatus = window.electronAPI?.reportCopilotAudioStatus;
    if (!reportStatus) return;

    void reportStatus({
      systemEnabled: captureEnabled && settings.captureSystemAudio,
      systemActive,
      systemSpeaking,
      micEnabled: captureEnabled && settings.captureMicAudio,
      micActive,
      micSpeaking,
      audioLevel,
      queueDepth
    }).catch(() => {
      statusReportingDisabledRef.current = true;
    });
  }, [
    captureEnabled,
    settings.captureSystemAudio,
    settings.captureMicAudio,
    systemActive,
    systemSpeaking,
    micActive,
    micSpeaking,
    audioLevel,
    queueDepth
  ]);

  useLayoutEffect(() => {
    if (!captureEnabled) {
      activeFlushHandlersRef.current = [];
      activeResetHandlersRef.current = [];
      sourceLevelsRef.current = { system: 0, mic: 0 };
      if (mountedRef.current) {
        setSystemActive(false);
        setMicActive(false);
        setSystemSpeaking(false);
        setMicSpeaking(false);
        setAudioLevel(0);
        setSystemError(null);
        setMicError(null);
        setTranscriptionError(null);
      }
      return;
    }

    let disposed = false;
    let cleaned = false;
    const cleanups: Array<() => void> = [];
    activeFlushHandlersRef.current = [];
    activeResetHandlersRef.current = [];

    if (mountedRef.current) {
      setSystemActive(false);
      setMicActive(false);
      setSystemSpeaking(false);
      setMicSpeaking(false);
      setAudioLevel(0);
      setSystemError(null);
      setMicError(null);
      setTranscriptionError(null);
    }
    sourceLevelsRef.current = { system: 0, mic: 0 };

    const runCleanups = () => {
      if (cleaned) return;
      cleaned = true;
      disposed = true;
      for (const cleanup of [...cleanups].reverse()) {
        try {
          cleanup();
        } catch {
          // Cleanup must continue so no capture device remains open.
        }
      }
      cleanups.length = 0;
    };

    const handleBeforeUnload = () => runCleanups();
    window.addEventListener('beforeunload', handleBeforeUnload);
    cleanups.push(() => window.removeEventListener('beforeunload', handleBeforeUnload));

    const setSourceActive = (source: AudioSourceType, active: boolean) => {
      if (disposed || !mountedRef.current) return;
      if (source === 'system') {
        setSystemActive(active);
      } else {
        setMicActive(active);
      }
    };

    const setSourceSpeaking = (source: AudioSourceType, speaking: boolean) => {
      if (disposed || !mountedRef.current) return;
      if (source === 'system') {
        setSystemSpeaking(speaking);
      } else {
        setMicSpeaking(speaking);
      }
    };

    const setSourceLevel = (source: AudioSourceType, level: number) => {
      sourceLevelsRef.current[source] = level;
      if (!disposed && mountedRef.current) {
        setAudioLevel(Math.max(sourceLevelsRef.current.system, sourceLevelsRef.current.mic));
      }
    };

    const setupNativeSystemPipeline = (): (() => void) => {
      const api = window.electronAPI;
      if (!api?.onSystemAudioData || !api.onSystemAudioError) {
        throw new Error('Native system audio IPC is unavailable');
      }

      const pipelineStartedAt = Date.now();
      let lastFrameReceivedAt = pipelineStartedAt;
      let hasReceivedFrame = false;
      let hasDetectedSignal = false;
      let healthFailure: 'capture' | 'no-frames' | 'no-signal' | null = null;
      let noiseFloor: number | null = null;
      let isSpeaking = false;
      let speechCandidateMs = 0;
      let candidateVoicedSamples = 0;
      let silenceDurationMs = 0;
      let preRollFrames: TimedAudioFrame[] = [];
      let preRollSamples = 0;
      let collectedFrames: TimedAudioFrame[] = [];
      let totalSamples = 0;
      let voicedSamples = 0;
      let lastLevelUpdate = 0;
      let pipelineCleaned = false;

      const markHealthFailure = (
        kind: NonNullable<typeof healthFailure>,
        message: string
      ) => {
        if (disposed || pipelineCleaned || healthFailure === kind) return;
        healthFailure = kind;
        setSourceActive('system', false);
        setSourceSpeaking('system', false);
        setSourceLevel('system', 0);
        setSourceError('system', message);
      };

      const recoverHealth = () => {
        if (!healthFailure) return;
        healthFailure = null;
        setSourceActive('system', true);
        setSourceError('system', null);
      };

      const clearCaptureBuffers = () => {
        preRollFrames = [];
        preRollSamples = 0;
        collectedFrames = [];
        totalSamples = 0;
        voicedSamples = 0;
        speechCandidateMs = 0;
        candidateVoicedSamples = 0;
        silenceDurationMs = 0;
        isSpeaking = false;
        setSourceSpeaking('system', false);
        setSourceLevel('system', 0);
      };

      const retainPreRoll = (frame: TimedAudioFrame) => {
        preRollFrames.push(frame);
        preRollSamples += frame.samples.length;

        while (preRollSamples > PRE_ROLL_SAMPLES && preRollFrames.length > 0) {
          const excess = preRollSamples - PRE_ROLL_SAMPLES;
          const first = preRollFrames[0];
          if (first.samples.length <= excess) {
            preRollFrames.shift();
            preRollSamples -= first.samples.length;
            continue;
          }

          const samples = first.samples.slice(excess);
          preRollFrames[0] = {
            samples,
            startedAt: first.endedAt - (samples.length / TARGET_SAMPLE_RATE) * 1000,
            endedAt: first.endedAt
          };
          preRollSamples -= excess;
        }
      };

      const flushCollected = (
        forceShort: boolean,
        forcedSplit: boolean
      ): Promise<SubmissionResult | null> => {
        const minimum = forceShort ? MIN_MANUAL_SPEECH_SAMPLES : MIN_SPEECH_SAMPLES;
        const framesToSubmit = collectedFrames;
        const samplesToSubmit = totalSamples;
        const enoughSpeech = voicedSamples >= minimum;

        if (forcedSplit && enoughSpeech) {
          collectedFrames = [];
          totalSamples = 0;
          voicedSamples = 0;
          silenceDurationMs = 0;
        } else {
          collectedFrames = [];
          totalSamples = 0;
          voicedSamples = 0;
          silenceDurationMs = 0;
          isSpeaking = false;
          setSourceSpeaking('system', false);
        }

        if (!enoughSpeech || framesToSubmit.length === 0 || samplesToSubmit === 0) {
          if (forcedSplit) clearCaptureBuffers();
          return Promise.resolve(null);
        }

        const samples = mergeFrames(framesToSubmit, samplesToSubmit);
        if (calculateRms(samples) <= DIGITAL_SILENCE_RMS) {
          if (forcedSplit) clearCaptureBuffers();
          return Promise.resolve(null);
        }

        return enqueueTranscription(
          samples,
          'system',
          framesToSubmit[0].startedAt,
          framesToSubmit[framesToSubmit.length - 1].endedAt
        );
      };

      const flushHandler: FlushHandler = () => flushCollected(true, false);
      const resetHandler = () => clearCaptureBuffers();
      activeFlushHandlersRef.current.push(flushHandler);
      activeResetHandlersRef.current.push(resetHandler);

      const unsubscribeData = api.onSystemAudioData((chunk) => {
        if (disposed || pipelineCleaned) return;

        const decoded = decodePcm16Le(chunk.data);
        if (decoded.length === 0) return;
        const samples =
          chunk.sampleRate === TARGET_SAMPLE_RATE
            ? decoded
            : downsampleTo16k(decoded, chunk.sampleRate);
        const endedAt = Number.isFinite(chunk.capturedAt) ? chunk.capturedAt : Date.now();
        const frame: TimedAudioFrame = {
          samples,
          startedAt: endedAt - (samples.length / TARGET_SAMPLE_RATE) * 1000,
          endedAt
        };
        const now = Date.now();
        const rms = calculateRms(samples);

        lastFrameReceivedAt = now;
        hasReceivedFrame = true;
        recoverHealth();
        setSourceActive('system', true);

        if (rms > DETECTABLE_SIGNAL_RMS) hasDetectedSignal = true;

        if (pausedRef.current) {
          if (isSpeaking || collectedFrames.length > 0 || preRollFrames.length > 0) {
            clearCaptureBuffers();
          }
          return;
        }

        if (now - lastLevelUpdate >= LEVEL_UPDATE_INTERVAL_MS) {
          lastLevelUpdate = now;
          const measured = Math.min(100, Math.round(Math.sqrt(rms) * 280));
          const previous = sourceLevelsRef.current.system;
          setSourceLevel(
            'system',
            measured >= previous ? measured : Math.max(measured, Math.round(previous * 0.72))
          );
        }

        const frameDurationMs = (samples.length / TARGET_SAMPLE_RATE) * 1000;
        if (noiseFloor === null) {
          noiseFloor = Math.max(
            DIGITAL_SILENCE_RMS,
            Math.min(rms, MIN_VAD_THRESHOLD / VAD_NOISE_RATIO)
          );
          retainPreRoll(frame);
          return;
        }

        const speechThreshold = Math.max(
          MIN_VAD_THRESHOLD,
          noiseFloor * VAD_NOISE_RATIO,
          noiseFloor + VAD_NOISE_MARGIN
        );
        const releaseThreshold = Math.max(
          MIN_VAD_THRESHOLD * 0.65,
          noiseFloor * 1.5,
          noiseFloor + VAD_NOISE_MARGIN * 0.45
        );

        if (!isSpeaking) {
          retainPreRoll(frame);
          if (rms >= speechThreshold) {
            speechCandidateMs += frameDurationMs;
            candidateVoicedSamples += samples.length;
          } else {
            speechCandidateMs = 0;
            candidateVoicedSamples = 0;
            const adaptation = rms < noiseFloor ? 0.12 : 0.025;
            noiseFloor += (rms - noiseFloor) * adaptation;
            noiseFloor = Math.max(DIGITAL_SILENCE_RMS, noiseFloor);
          }

          if (speechCandidateMs < SPEECH_START_MS) return;

          isSpeaking = true;
          setSourceSpeaking('system', true);
          collectedFrames = preRollFrames;
          totalSamples = preRollSamples;
          voicedSamples = candidateVoicedSamples;
          preRollFrames = [];
          preRollSamples = 0;
          speechCandidateMs = 0;
          candidateVoicedSamples = 0;
          silenceDurationMs = 0;
          return;
        }

        collectedFrames.push(frame);
        totalSamples += samples.length;
        if (rms >= releaseThreshold) {
          voicedSamples += samples.length;
          silenceDurationMs = 0;
        } else {
          silenceDurationMs += frameDurationMs;
        }

        if (totalSamples >= MAX_CHUNK_SAMPLES) {
          void flushCollected(false, true);
        } else if (silenceDurationMs >= ENDPOINT_SILENCE_MS) {
          void flushCollected(false, false);
        }
      });
      const unsubscribeError = api.onSystemAudioError((message) => {
        markHealthFailure('capture', message);
      });

      const watchdogTimer = window.setInterval(() => {
        if (disposed || pipelineCleaned) return;
        const now = Date.now();
        if (now - lastFrameReceivedAt >= NO_AUDIO_FRAME_TIMEOUT_MS) {
          markHealthFailure(
            'no-frames',
            'No audio data is arriving from macOS system audio capture. Check System Audio Recording permission.'
          );
          return;
        }
        if (
          !pausedRef.current &&
          hasReceivedFrame &&
          !hasDetectedSignal &&
          now - pipelineStartedAt >= INITIAL_NO_SIGNAL_TIMEOUT_MS
        ) {
          markHealthFailure(
            'no-signal',
            'No system-audio signal was detected. Play meeting audio and check System Audio Recording permission.'
          );
        }
      }, HEALTH_CHECK_INTERVAL_MS);

      return () => {
        if (pipelineCleaned) return;
        pipelineCleaned = true;
        window.clearInterval(watchdogTimer);
        unsubscribeData();
        unsubscribeError();
        activeFlushHandlersRef.current = activeFlushHandlersRef.current.filter(
          (handler) => handler !== flushHandler
        );
        activeResetHandlersRef.current = activeResetHandlersRef.current.filter(
          (handler) => handler !== resetHandler
        );
      };
    };

    const setupStreamPipeline = async (
      stream: MediaStream,
      source: AudioSourceType
    ): Promise<() => void> => {
      const track = stream.getAudioTracks()[0];
      if (!track) {
        throw new Error(
          source === 'system'
            ? 'System audio was not shared. Choose a source with audio enabled, then try again.'
            : 'Microphone capture returned no audio track. Select another microphone and try again.'
        );
      }
      if (track.readyState === 'ended') {
        throw new Error(
          source === 'system'
            ? 'System audio ended before capture started. On macOS, allow System Audio Recording in Privacy & Security, then restart capture.'
            : 'Microphone audio ended before capture started. Reconnect the microphone and try again.'
        );
      }
      if (track.muted) {
        throw new Error(
          source === 'system'
            ? 'System audio is muted. Enable audio sharing and start capture again.'
            : 'Microphone audio is muted. Unmute the selected microphone and start capture again.'
        );
      }

      const audioContext = new AudioContext();
      let sourceNode: MediaStreamAudioSourceNode | null = null;
      let workletNode: AudioWorkletNode | null = null;
      let muteGain: GainNode | null = null;

      try {
        if (!audioContext.audioWorklet) {
          throw new Error('AudioWorklet is unavailable in this Electron runtime');
        }
        await audioContext.audioWorklet.addModule(captureWorkletUrl);
        if (disposed) {
          await audioContext.close();
          return () => undefined;
        }

        sourceNode = audioContext.createMediaStreamSource(stream);
        workletNode = new AudioWorkletNode(audioContext, 'cyrano-capture', {
          numberOfInputs: 1,
          numberOfOutputs: 1,
          outputChannelCount: [1],
          channelCount: 1,
          channelCountMode: 'explicit',
          processorOptions: { batchSize: WORKLET_BATCH_SIZE }
        });
        muteGain = audioContext.createGain();
        muteGain.gain.value = 0;
        sourceNode.connect(workletNode);
        workletNode.connect(muteGain);
        muteGain.connect(audioContext.destination);
      } catch (error) {
        try {
          sourceNode?.disconnect();
          workletNode?.disconnect();
          muteGain?.disconnect();
        } catch {
          // The graph may only be partially connected.
        }
        if (audioContext.state !== 'closed') {
          await audioContext.close().catch(() => undefined);
        }
        throw error;
      }

      const nativeSampleRate = audioContext.sampleRate || 48000;
      const pipelineStartedAt = Date.now();
      let lastFrameReceivedAt = pipelineStartedAt;
      let hasReceivedFrame = false;
      let hasDetectedSignal = false;
      let healthFailure: 'muted' | 'ended' | 'no-frames' | 'no-signal' | 'worklet' | 'context' | null = null;
      let audioClockOrigin: number | null = null;
      let noiseFloor: number | null = null;
      let isSpeaking = false;
      let speechCandidateMs = 0;
      let candidateVoicedSamples = 0;
      let silenceDurationMs = 0;
      let preRollFrames: TimedAudioFrame[] = [];
      let preRollSamples = 0;
      let collectedFrames: TimedAudioFrame[] = [];
      let totalSamples = 0;
      let voicedSamples = 0;
      let lastLevelUpdate = 0;
      let pipelineCleaned = false;
      let workletFlushSequence = 0;
      const pendingWorkletFlushes = new Map<number, () => void>();

      const markHealthFailure = (
        kind: NonNullable<typeof healthFailure>,
        message: string
      ) => {
        if (disposed || pipelineCleaned || healthFailure === kind) return;
        healthFailure = kind;
        setSourceActive(source, false);
        setSourceSpeaking(source, false);
        setSourceLevel(source, 0);
        setSourceError(source, message);
      };

      const recoverHealth = (...recoverable: Array<NonNullable<typeof healthFailure>>) => {
        if (!healthFailure || !recoverable.includes(healthFailure)) return;
        if (track.readyState !== 'live' || track.muted) return;
        healthFailure = null;
        setSourceActive(source, true);
        setSourceError(source, null);
      };

      const clearCaptureBuffers = () => {
        preRollFrames = [];
        preRollSamples = 0;
        collectedFrames = [];
        totalSamples = 0;
        voicedSamples = 0;
        speechCandidateMs = 0;
        candidateVoicedSamples = 0;
        silenceDurationMs = 0;
        isSpeaking = false;
        setSourceSpeaking(source, false);
        setSourceLevel(source, 0);
      };

      const retainPreRoll = (frame: TimedAudioFrame) => {
        preRollFrames.push(frame);
        preRollSamples += frame.samples.length;

        while (preRollSamples > PRE_ROLL_SAMPLES && preRollFrames.length > 0) {
          const excess = preRollSamples - PRE_ROLL_SAMPLES;
          const first = preRollFrames[0];
          if (first.samples.length <= excess) {
            preRollFrames.shift();
            preRollSamples -= first.samples.length;
            continue;
          }

          const samples = first.samples.slice(excess);
          preRollFrames[0] = {
            samples,
            startedAt: first.endedAt - (samples.length / TARGET_SAMPLE_RATE) * 1000,
            endedAt: first.endedAt
          };
          preRollSamples -= excess;
        }
      };

      const flushCollected = (
        forceShort: boolean,
        forcedSplit: boolean
      ): Promise<SubmissionResult | null> => {
        const minimum = forceShort ? MIN_MANUAL_SPEECH_SAMPLES : MIN_SPEECH_SAMPLES;
        const framesToSubmit = collectedFrames;
        const samplesToSubmit = totalSamples;
        const enoughSpeech = voicedSamples >= minimum;

        if (forcedSplit && enoughSpeech) {
          collectedFrames = [];
          totalSamples = 0;
          voicedSamples = 0;
          silenceDurationMs = 0;
        } else {
          collectedFrames = [];
          totalSamples = 0;
          voicedSamples = 0;
          silenceDurationMs = 0;
          isSpeaking = false;
          setSourceSpeaking(source, false);
        }

        if (!enoughSpeech || framesToSubmit.length === 0 || samplesToSubmit === 0) {
          if (forcedSplit) {
            clearCaptureBuffers();
          }
          return Promise.resolve(null);
        }

        const samples = mergeFrames(framesToSubmit, samplesToSubmit);
        if (calculateRms(samples) <= DIGITAL_SILENCE_RMS) {
          if (forcedSplit) {
            clearCaptureBuffers();
          }
          return Promise.resolve(null);
        }

        return enqueueTranscription(
          samples,
          source,
          framesToSubmit[0].startedAt,
          framesToSubmit[framesToSubmit.length - 1].endedAt
        );
      };

      const flushWorklet = (): Promise<void> =>
        new Promise((resolve) => {
          const requestId = ++workletFlushSequence;
          const timeout = window.setTimeout(() => {
            pendingWorkletFlushes.delete(requestId);
            resolve();
          }, 250);
          pendingWorkletFlushes.set(requestId, () => {
            window.clearTimeout(timeout);
            resolve();
          });
          workletNode.port.postMessage({ type: 'flush', requestId });
        });

      const flushHandler: FlushHandler = async () => {
        await flushWorklet();
        return flushCollected(true, false);
      };
      const resetHandler = () => {
        workletNode.port.postMessage({ type: 'reset' });
        clearCaptureBuffers();
      };
      activeFlushHandlersRef.current.push(flushHandler);
      activeResetHandlersRef.current.push(resetHandler);

      const handleSamples = (event: MessageEvent<WorkletSamplesMessage>) => {
        if (disposed || pipelineCleaned) return;
        if (event.data?.type === 'flushed') {
          const resolve = pendingWorkletFlushes.get(event.data.requestId);
          pendingWorkletFlushes.delete(event.data.requestId);
          resolve?.();
          return;
        }
        if (event.data?.type !== 'samples') return;

        const rawSamples = event.data.samples;
        if (!(rawSamples instanceof Float32Array) || rawSamples.length === 0) return;

        const now = Date.now();
        lastFrameReceivedAt = now;
        hasReceivedFrame = true;
        recoverHealth('no-frames', 'context');

        const expectedEndOffset = (event.data.endFrame / nativeSampleRate) * 1000;
        if (audioClockOrigin === null) {
          audioClockOrigin = now - expectedEndOffset;
        } else {
          const clockDrift = now - (audioClockOrigin + expectedEndOffset);
          if (Math.abs(clockDrift) > 1000) {
            audioClockOrigin += clockDrift;
          }
        }

        const frame16k = downsampleTo16k(rawSamples, nativeSampleRate);
        const frame: TimedAudioFrame = {
          samples: frame16k,
          startedAt:
            audioClockOrigin + (event.data.startFrame / nativeSampleRate) * 1000,
          endedAt: audioClockOrigin + expectedEndOffset
        };
        const rms = calculateRms(frame16k);

        if (rms > DETECTABLE_SIGNAL_RMS) {
          hasDetectedSignal = true;
          recoverHealth('no-signal');
        }

        if (pausedRef.current) {
          if (isSpeaking || collectedFrames.length > 0 || preRollFrames.length > 0) {
            clearCaptureBuffers();
          }
          return;
        }

        if (now - lastLevelUpdate >= LEVEL_UPDATE_INTERVAL_MS) {
          lastLevelUpdate = now;
          const measured = Math.min(100, Math.round(Math.sqrt(rms) * 280));
          const previous = sourceLevelsRef.current[source];
          setSourceLevel(
            source,
            measured >= previous ? measured : Math.max(measured, Math.round(previous * 0.72))
          );
        }

        const frameDurationMs = (frame16k.length / TARGET_SAMPLE_RATE) * 1000;
        if (noiseFloor === null) {
          noiseFloor = Math.max(
            DIGITAL_SILENCE_RMS,
            Math.min(rms, MIN_VAD_THRESHOLD / VAD_NOISE_RATIO)
          );
          retainPreRoll(frame);
          return;
        }

        const speechThreshold = Math.max(
          MIN_VAD_THRESHOLD,
          noiseFloor * VAD_NOISE_RATIO,
          noiseFloor + VAD_NOISE_MARGIN
        );
        const releaseThreshold = Math.max(
          MIN_VAD_THRESHOLD * 0.65,
          noiseFloor * 1.5,
          noiseFloor + VAD_NOISE_MARGIN * 0.45
        );

        if (!isSpeaking) {
          const aboveThreshold = rms >= speechThreshold;
          retainPreRoll(frame);

          if (aboveThreshold) {
            speechCandidateMs += frameDurationMs;
            candidateVoicedSamples += frame16k.length;
          } else {
            speechCandidateMs = 0;
            candidateVoicedSamples = 0;
            const adaptation = rms < noiseFloor ? 0.12 : 0.025;
            noiseFloor += (rms - noiseFloor) * adaptation;
            noiseFloor = Math.max(DIGITAL_SILENCE_RMS, noiseFloor);
          }

          if (speechCandidateMs < SPEECH_START_MS) return;

          isSpeaking = true;
          setSourceSpeaking(source, true);
          collectedFrames = preRollFrames;
          totalSamples = preRollSamples;
          voicedSamples = candidateVoicedSamples;
          preRollFrames = [];
          preRollSamples = 0;
          speechCandidateMs = 0;
          candidateVoicedSamples = 0;
          silenceDurationMs = 0;
          return;
        }

        collectedFrames.push(frame);
        totalSamples += frame16k.length;
        if (rms >= releaseThreshold) {
          voicedSamples += frame16k.length;
          silenceDurationMs = 0;
        } else {
          silenceDurationMs += frameDurationMs;
        }

        if (totalSamples >= MAX_CHUNK_SAMPLES) {
          void flushCollected(false, true);
        } else if (silenceDurationMs >= ENDPOINT_SILENCE_MS) {
          void flushCollected(false, false);
        }
      };

      const handleTrackEnded = () => {
        markHealthFailure(
          'ended',
          source === 'system'
            ? 'System audio capture ended. Share the meeting audio again to resume.'
            : 'Microphone capture ended. Reconnect or reselect the microphone to resume.'
        );
      };
      const handleTrackMuted = () => {
        markHealthFailure(
          'muted',
          source === 'system'
            ? 'System audio was muted. Re-enable audio sharing to resume.'
            : 'The microphone was muted. Unmute it to resume capture.'
        );
      };
      const handleTrackUnmuted = () => recoverHealth('muted');
      const handleProcessorError = () => {
        markHealthFailure(
          'worklet',
          `${source === 'system' ? 'System audio' : 'Microphone'} processing stopped. Restart capture to recover.`
        );
      };

      track.addEventListener('ended', handleTrackEnded);
      track.addEventListener('mute', handleTrackMuted);
      track.addEventListener('unmute', handleTrackUnmuted);
      workletNode.port.onmessage = handleSamples;
      workletNode.onprocessorerror = handleProcessorError;

      const watchdogTimer = window.setInterval(() => {
        if (disposed || pipelineCleaned) return;

        const now = Date.now();
        if (track.readyState === 'ended') {
          handleTrackEnded();
          return;
        }
        if (track.muted) {
          handleTrackMuted();
          return;
        }

        if (audioContext.state === 'suspended') {
          void audioContext.resume().catch(() => {
            markHealthFailure(
              'context',
              'Audio processing is suspended. Resume listening from the Copilot controls.'
            );
          });
        } else if (audioContext.state === 'closed') {
          markHealthFailure(
            'context',
            `${source === 'system' ? 'System audio' : 'Microphone'} processing closed unexpectedly. Restart capture.`
          );
          return;
        }

        if (now - lastFrameReceivedAt >= NO_AUDIO_FRAME_TIMEOUT_MS) {
          markHealthFailure(
            audioContext.state === 'suspended' ? 'context' : 'no-frames',
            audioContext.state === 'suspended'
              ? 'Audio processing is suspended. Resume listening from the Copilot controls.'
              : `No audio data is arriving from the ${source === 'system' ? 'system capture' : 'microphone'}. Restart capture and check the selected source.`
          );
          return;
        }

        if (
          !pausedRef.current &&
          hasReceivedFrame &&
          !hasDetectedSignal &&
          now - pipelineStartedAt >= INITIAL_NO_SIGNAL_TIMEOUT_MS
        ) {
          markHealthFailure(
            'no-signal',
            source === 'system'
              ? 'No system-audio signal was detected. Play meeting audio and confirm the shared source includes audio.'
              : 'No microphone signal was detected. Check the input level and selected microphone.'
          );
        }
      }, HEALTH_CHECK_INTERVAL_MS);

      if (audioContext.state === 'suspended') {
        void audioContext.resume().catch(() => {
          markHealthFailure(
            'context',
            'Audio processing could not start. Resume listening from the Copilot controls.'
          );
        });
      }

      return () => {
        if (pipelineCleaned) return;
        pipelineCleaned = true;
        window.clearInterval(watchdogTimer);
        track.removeEventListener('ended', handleTrackEnded);
        track.removeEventListener('mute', handleTrackMuted);
        track.removeEventListener('unmute', handleTrackUnmuted);
        activeFlushHandlersRef.current = activeFlushHandlersRef.current.filter(
          (handler) => handler !== flushHandler
        );
        activeResetHandlersRef.current = activeResetHandlersRef.current.filter(
          (handler) => handler !== resetHandler
        );
        workletNode.port.onmessage = null;
        workletNode.onprocessorerror = null;
        try {
          sourceNode.disconnect();
          workletNode.disconnect();
          muteGain.disconnect();
        } catch {
          // Nodes may have disconnected after the track ended.
        }
        for (const resolve of pendingWorkletFlushes.values()) resolve();
        pendingWorkletFlushes.clear();
        if (audioContext.state !== 'closed') {
          void audioContext.close().catch(() => undefined);
        }
      };
    };

    const startSystemCapture = async () => {
      let stopStream: (() => void) | null = null;

      try {
        if (settings.systemAudioDeviceId && settings.systemAudioDeviceId !== 'loopback') {
          throw new Error(
            'The selected input is not a verified system loopback source. Select system loopback or enable it as a microphone.'
          );
        }

        const api = window.electronAPI;
        const isMac = navigator.userAgent.toLowerCase().includes('mac');
        if (isMac && api) {
          const pipelineCleanup = setupNativeSystemPipeline();
          const result = await api.startSystemAudioCapture();
          if (!result.success && !result.unsupported) {
            pipelineCleanup();
            await api.stopSystemAudioCapture();
            throw new Error(
              `System audio capture failed: ${result.error || 'CoreAudio could not start.'}`
            );
          }
          if (result.success) {
            if (disposed) {
              pipelineCleanup();
              await api.stopSystemAudioCapture();
              return;
            }
            cleanups.push(() => void api.stopSystemAudioCapture());
            cleanups.push(pipelineCleanup);
            setSourceError('system', null);
            return;
          }
          pipelineCleanup();
        }

        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });

        stopStream = stopMediaStream(stream);
        cleanups.push(stopStream);
        if (disposed) {
          stopStream();
          return;
        }

        for (const videoTrack of stream.getVideoTracks()) {
          videoTrack.enabled = false;
        }

        const pipelineCleanup = await setupStreamPipeline(stream, 'system');
        if (disposed) {
          pipelineCleanup();
          stopStream();
          return;
        }

        cleanups.push(pipelineCleanup);
        setSystemActive(true);
        setSourceError('system', null);
      } catch (error) {
        stopStream?.();
        if (!disposed) {
          setSystemActive(false);
          setSystemSpeaking(false);
          setSourceLevel('system', 0);
          setSourceError('system', describeSystemCaptureError(error, false));
        }
      }
    };

    const startMicCapture = async () => {
      let stopStream: (() => void) | null = null;

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            deviceId:
              settings.micDeviceId && settings.micDeviceId !== 'default'
                ? { exact: settings.micDeviceId }
                : undefined,
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: true
          },
          video: false
        });

        stopStream = stopMediaStream(stream);
        cleanups.push(stopStream);
        if (disposed) {
          stopStream();
          return;
        }

        const pipelineCleanup = await setupStreamPipeline(stream, 'mic');
        if (disposed) {
          pipelineCleanup();
          stopStream();
          return;
        }

        cleanups.push(pipelineCleanup);
        setMicActive(true);
        setSourceError('mic', null);
      } catch (error) {
        stopStream?.();
        if (!disposed) {
          setMicActive(false);
          setMicSpeaking(false);
          setSourceLevel('mic', 0);
          setSourceError('mic', describeMicCaptureError(error));
        }
      }
    };

    const startCaptures = async () => {
      if (settings.captureSystemAudio) {
        await startSystemCapture();
      } else if (mountedRef.current) {
        setSystemActive(false);
        setSystemError(null);
      }

      if (disposed) return;

      if (settings.captureMicAudio) {
        await startMicCapture();
      } else if (mountedRef.current) {
        setMicActive(false);
        setMicError(null);
      }
    };

    void startCaptures();

    return () => {
      runCleanups();
      activeFlushHandlersRef.current = [];
      activeResetHandlersRef.current = [];
      sourceLevelsRef.current = { system: 0, mic: 0 };
      if (mountedRef.current) {
        setSystemActive(false);
        setMicActive(false);
        setSystemSpeaking(false);
        setMicSpeaking(false);
        setAudioLevel(0);
      }
    };
  }, [
    captureEnabled,
    settings.captureSystemAudio,
    settings.captureMicAudio,
    settings.micDeviceId,
    settings.systemAudioDeviceId,
    enqueueTranscription,
    setSourceError
  ]);

  const errorMessages = [systemError, micError, transcriptionError].filter(
    (message): message is string => Boolean(message)
  );
  const error = errorMessages.filter((message, index) => errorMessages.indexOf(message) === index).join(' ') || null;

  return {
    systemActive,
    micActive,
    systemSpeaking,
    micSpeaking,
    isTranscribing: queueDepth > 0,
    audioLevel,
    error,
    systemError,
    micError,
    queueDepth,
    flushAndTranscribe,
    resetBuffers,
    isPaused: Boolean(paused)
  };
}
