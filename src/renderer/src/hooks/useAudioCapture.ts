import { useEffect, useRef, useState, useCallback } from 'react';
import { AudioSourceType, PrompterSettings } from '../../../common/types';

interface UseAudioCaptureOptions {
  enabled: boolean;
  settings: PrompterSettings;
  paused?: boolean;
}

export interface AudioCaptureState {
  systemActive: boolean;
  micActive: boolean;
  systemSpeaking: boolean;
  micSpeaking: boolean;
  isTranscribing: boolean;
  audioLevel: number; // 0..100 live volume meter
  error: string | null;
  flushAndTranscribe: () => Promise<string>;
  resetBuffers: () => void;
  isPaused: boolean;
}

const TARGET_SAMPLE_RATE = 16000;
const BUFFER_SIZE = 4096;
const SPEECH_RMS_THRESHOLD = 0.0015; // High sensitivity for quiet meeting interlocutors and distant speakers
const SILENCE_DURATION_MS = 700; // ~0.70s natural pause ends a spoken phrase
const MIN_SPEECH_SAMPLES = 4000; // ~0.25s at 16kHz
const MAX_SPEECH_SAMPLES = TARGET_SAMPLE_RATE * 14; // 14s max chunk before auto-flush

/**
 * Downsamples an AudioBuffer channel from native hardware sampleRate (e.g. 48000Hz or 44100Hz)
 * to 16000Hz mono Float32Array using box-filter averaging to prevent aliasing.
 */
function downsampleTo16k(input: Float32Array, inputSampleRate: number): Float32Array {
  if (inputSampleRate === TARGET_SAMPLE_RATE) {
    const copy = new Float32Array(input.length);
    copy.set(input);
    return copy;
  }
  const ratio = inputSampleRate / TARGET_SAMPLE_RATE;
  const outputLength = Math.max(1, Math.round(input.length / ratio));
  const output = new Float32Array(outputLength);

  let offsetResult = 0;
  let offsetBuffer = 0;
  while (offsetResult < outputLength) {
    const nextOffsetBuffer = Math.min(input.length, Math.round((offsetResult + 1) * ratio));
    let accum = 0;
    let count = 0;
    for (let i = offsetBuffer; i < nextOffsetBuffer; i++) {
      accum += input[i];
      count++;
    }
    output[offsetResult] = count > 0 ? accum / count : 0;
    offsetResult++;
    offsetBuffer = nextOffsetBuffer;
  }
  return output;
}

export function useAudioCapture({ enabled, settings, paused }: UseAudioCaptureOptions): AudioCaptureState {
  const [systemActive, setSystemActive] = useState(false);
  const [micActive, setMicActive] = useState(false);
  const [systemSpeaking, setSystemSpeaking] = useState(false);
  const [micSpeaking, setMicSpeaking] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const pausedRef = useRef(Boolean(paused));
  pausedRef.current = Boolean(paused);

  const pendingTranscriptionsRef = useRef(0);
  const activeFlushHandlersRef = useRef<Array<() => Promise<string>>>([]);
  const activeResetHandlersRef = useRef<Array<() => void>>([]);
  const inFlightPromisesRef = useRef<Set<Promise<string>>>(new Set());

  const resetBuffers = useCallback(() => {
    activeResetHandlersRef.current.forEach((fn) => {
      try {
        fn();
      } catch {
        // Ignore
      }
    });
    setSystemSpeaking(false);
    setMicSpeaking(false);
    setAudioLevel(0);
  }, []);

  const flushAndTranscribe = useCallback(async (): Promise<string> => {
    if (pausedRef.current) {
      return '';
    }
    const handlers = [...activeFlushHandlersRef.current];
    const flushedTexts: string[] = [];

    if (handlers.length > 0) {
      const results = await Promise.all(handlers.map((fn) => fn().catch(() => '')));
      for (const t of results) {
        if (t && t.trim()) flushedTexts.push(t.trim());
      }
    }

    // Also wait for any already-in-flight transcription promises to settle
    if (inFlightPromisesRef.current.size > 0) {
      const pending = Array.from(inFlightPromisesRef.current);
      const pendingResults = await Promise.all(pending.map((p) => p.catch(() => '')));
      for (const t of pendingResults) {
        if (t && t.trim() && !flushedTexts.includes(t.trim())) {
          flushedTexts.push(t.trim());
        }
      }
    }

    return flushedTexts.join(' ').trim();
  }, []);

  useEffect(() => {
    if (!enabled || settings.appMode !== 'copilot') {
      setSystemActive(false);
      setMicActive(false);
      setSystemSpeaking(false);
      setMicSpeaking(false);
      setAudioLevel(0);
      activeFlushHandlersRef.current = [];
      return;
    }

    let disposed = false;
    const cleanups: Array<() => void> = [];
    activeFlushHandlersRef.current = [];

    const sendChunkToMain = async (samples: Float32Array, source: AudioSourceType): Promise<string> => {
      const api = window.electronAPI;
      if (disposed || !api) return '';
      pendingTranscriptionsRef.current += 1;
      setIsTranscribing(true);

      const taskPromise = (async () => {
        try {
          const res = await api.transcribeAudioChunk({
            samples: Array.from(samples),
            source
          });
          return res?.text || '';
        } catch (err) {
          console.error(`[useAudioCapture] Failed to transcribe ${source} chunk:`, err);
          return '';
        } finally {
          pendingTranscriptionsRef.current = Math.max(0, pendingTranscriptionsRef.current - 1);
          if (!disposed) {
            setIsTranscribing(pendingTranscriptionsRef.current > 0);
          }
        }
      })();

      inFlightPromisesRef.current.add(taskPromise);
      try {
        return await taskPromise;
      } finally {
        inFlightPromisesRef.current.delete(taskPromise);
      }
    };

    const setupStreamPipeline = (
      stream: MediaStream,
      source: AudioSourceType,
      setSpeaking: (speaking: boolean) => void
    ) => {
      const audioTracks = stream.getAudioTracks();
      if (audioTracks.length === 0) {
        return;
      }

      // Use native hardware sample rate so macOS CoreAudio / Chromium never silences the stream
      const audioCtx = new AudioContext();
      if (audioCtx.state === 'suspended') {
        void audioCtx.resume().catch(() => {});
      }

      const nativeRate = audioCtx.sampleRate || 48000;
      const frameDurationMs = (BUFFER_SIZE / nativeRate) * 1000;
      const silenceFramesToFlush = Math.max(2, Math.ceil(SILENCE_DURATION_MS / frameDurationMs));

      const sourceNode = audioCtx.createMediaStreamSource(stream);
      const processor = audioCtx.createScriptProcessor(BUFFER_SIZE, 1, 1);
      const muteGain = audioCtx.createGain();
      muteGain.gain.value = 0;

      // Retain hard references on audioCtx to prevent V8 GC from killing ScriptProcessorNode
      (audioCtx as any).__cyranoNodes = { sourceNode, processor, muteGain };

      // Keep audio context continuously active even if OS or browser tries to suspend
      const watchdogTimer = setInterval(() => {
        if (!disposed && audioCtx.state === 'suspended') {
          void audioCtx.resume().catch(() => {});
        }
      }, 1000);

      let isSpeakingNow = false;
      let silenceFrames = 0;
      // Rolling pre-roll ring buffer (~250ms of audio) so the initial consonant/word is never clipped
      const preRollBuffer: Float32Array[] = [];
      const MAX_PRE_ROLL_CHUNKS = 3;
      let collectedChunks: Float32Array[] = [];
      let totalSamples = 0;
      let lastLevelUpdate = 0;

      const flushCollected = async (forceShort = false): Promise<string> => {
        const minRequired = forceShort ? 3200 : MIN_SPEECH_SAMPLES;
        let promiseResult = Promise.resolve('');

        if (totalSamples >= minRequired && collectedChunks.length > 0) {
          const merged = new Float32Array(totalSamples);
          let offset = 0;
          for (const chunk of collectedChunks) {
            merged.set(chunk, offset);
            offset += chunk.length;
          }
          collectedChunks = [];
          totalSamples = 0;
          isSpeakingNow = false;
          silenceFrames = 0;
          if (!disposed) {
            setSpeaking(false);
          }
          promiseResult = sendChunkToMain(merged, source);
        } else {
          collectedChunks = [];
          totalSamples = 0;
          isSpeakingNow = false;
          silenceFrames = 0;
          if (!disposed) {
            setSpeaking(false);
          }
        }

        return promiseResult;
      };

      const resetPipeline = () => {
        collectedChunks = [];
        totalSamples = 0;
        preRollBuffer.length = 0;
        isSpeakingNow = false;
        silenceFrames = 0;
        if (!disposed) {
          setSpeaking(false);
        }
      };
      activeResetHandlersRef.current.push(resetPipeline);

      activeFlushHandlersRef.current.push(() => flushCollected(true));

      processor.onaudioprocess = (event: AudioProcessingEvent) => {
        if (disposed || pausedRef.current) {
          if (isSpeakingNow) {
            collectedChunks = [];
            totalSamples = 0;
            isSpeakingNow = false;
            silenceFrames = 0;
            if (!disposed) {
              setSpeaking(false);
            }
          }
          return;
        }
        if (audioCtx.state === 'suspended') {
          void audioCtx.resume().catch(() => {});
        }

        const rawInput = event.inputBuffer.getChannelData(0);
        const frame16k = downsampleTo16k(rawInput, nativeRate);

        let sumSq = 0;
        for (let i = 0; i < frame16k.length; i++) {
          sumSq += frame16k[i] * frame16k[i];
        }
        const rms = Math.sqrt(sumSq / frame16k.length);

        const now = performance.now();
        if (now - lastLevelUpdate > 60) {
          lastLevelUpdate = now;
          const scaledLevel = Math.min(100, Math.round(Math.sqrt(rms) * 280));
          setAudioLevel((prev) => (scaledLevel >= prev ? scaledLevel : Math.max(scaledLevel, Math.round(prev * 0.7))));
        }

        if (rms >= SPEECH_RMS_THRESHOLD) {
          if (!isSpeakingNow) {
            isSpeakingNow = true;
            setSpeaking(true);
            // Append all pre-roll frames to capture the start of speech without clipping
            for (const pre of preRollBuffer) {
              collectedChunks.push(pre);
              totalSamples += pre.length;
            }
            preRollBuffer.length = 0;
          }
          silenceFrames = 0;
          collectedChunks.push(frame16k);
          totalSamples += frame16k.length;

          if (totalSamples >= MAX_SPEECH_SAMPLES) {
            void flushCollected(false);
          }
        } else {
          if (isSpeakingNow) {
            collectedChunks.push(frame16k);
            totalSamples += frame16k.length;
            silenceFrames += 1;

            if (silenceFrames >= silenceFramesToFlush) {
              void flushCollected(false);
            }
          } else {
            // Keep rolling pre-roll buffer when quiet
            preRollBuffer.push(frame16k);
            if (preRollBuffer.length > MAX_PRE_ROLL_CHUNKS) {
              preRollBuffer.shift();
            }
          }
        }
      };

      sourceNode.connect(processor);
      processor.connect(muteGain);
      muteGain.connect(audioCtx.destination);

      cleanups.push(() => {
        clearInterval(watchdogTimer);
        activeResetHandlersRef.current = activeResetHandlersRef.current.filter((fn) => fn !== resetPipeline);
        try {
          processor.onaudioprocess = null;
          sourceNode.disconnect();
          processor.disconnect();
          muteGain.disconnect();
          delete (audioCtx as any).__cyranoNodes;
          if (audioCtx.state !== 'closed') {
            void audioCtx.close();
          }
        } catch {
          // Ignore cleanup errors
        }
        stream.getTracks().forEach((t) => t.stop());
      });
    };

    const startCaptures = async () => {
      setError(null);
      let usedMicAsSystemFallback = false;

      // 1. System Audio Capture (Interlocutors / Teacher in Meeting)
      if (settings.captureSystemAudio) {
        let sysStream: MediaStream | null = null;

        try {
          if (settings.systemAudioDeviceId && settings.systemAudioDeviceId !== 'loopback') {
            sysStream = await navigator.mediaDevices.getUserMedia({
              audio: {
                deviceId: { exact: settings.systemAudioDeviceId },
                echoCancellation: false,
                noiseSuppression: false,
                autoGainControl: false
              },
              video: false
            });
          } else {
            // Try getDisplayMedia with audio loopback
            // On macOS this triggers ScreenCaptureKit which requires Screen Recording permission
            try {
              sysStream = await navigator.mediaDevices.getDisplayMedia({
                video: true,
                audio: true
              });
              // Keep video track alive but disabled — stopping it kills the loopback audio session
              sysStream.getVideoTracks().forEach((vt) => {
                vt.enabled = false;
              });
            } catch (displayErr: any) {
              console.warn('[useAudioCapture] getDisplayMedia failed (screen permission may be missing):', displayErr?.message || displayErr);
              sysStream = null;
            }
          }
        } catch (err: any) {
          console.warn('[useAudioCapture] System audio capture failed:', err?.message || err);
          sysStream = null;
        }

        if (disposed) {
          sysStream?.getTracks().forEach((t) => t.stop());
          return;
        }

        if (sysStream && sysStream.getAudioTracks().length > 0) {
          console.log('[useAudioCapture] System audio loopback captured successfully:', sysStream.getAudioTracks()[0].label);
          setupStreamPipeline(sysStream, 'system', setSystemSpeaking);
          setSystemActive(true);
        } else {
          sysStream?.getTracks().forEach((t) => t.stop());
          console.log('[useAudioCapture] No system audio tracks available, activating ambient mic fallback...');
          // Automatic Fallback: open microphone without echoCancellation so it hears speakers (teacher) + room!
          try {
            const fallbackStream = await navigator.mediaDevices.getUserMedia({
              audio: {
                deviceId:
                  settings.micDeviceId && settings.micDeviceId !== 'default'
                    ? { ideal: settings.micDeviceId }
                    : undefined,
                echoCancellation: false,
                noiseSuppression: false,
                autoGainControl: true
              },
              video: false
            });

            if (disposed) {
              fallbackStream.getTracks().forEach((t) => t.stop());
              return;
            }

            setupStreamPipeline(fallbackStream, 'system', (speaking) => {
              setSystemSpeaking(speaking);
              setMicSpeaking(speaking);
            });
            setSystemActive(true);
            setMicActive(true);
            usedMicAsSystemFallback = true;
          } catch (fallbackErr: any) {
            console.warn('[useAudioCapture] Fallback audio capture failed:', fallbackErr);
            setSystemActive(false);
            setError(fallbackErr?.message || 'Нет доступа к аудио / микрофону');
          }
        }
      } else {
        setSystemActive(false);
      }

      // 2. Dedicated Microphone Capture (if not already using ambient fallback)
      // Always enable mic capture in Copilot mode if captureMicAudio is true OR if system audio was disabled
      const shouldCaptureMic =
        !usedMicAsSystemFallback && (settings.captureMicAudio || !settings.captureSystemAudio);

      if (shouldCaptureMic) {
        try {
          const micStream = await navigator.mediaDevices.getUserMedia({
            audio: {
              deviceId:
                settings.micDeviceId && settings.micDeviceId !== 'default'
                  ? { ideal: settings.micDeviceId }
                  : undefined,
              echoCancellation: false,
              noiseSuppression: false,
              autoGainControl: true
            },
            video: false
          });

          if (disposed) {
            micStream.getTracks().forEach((t) => t.stop());
            return;
          }

          setupStreamPipeline(micStream, 'mic', setMicSpeaking);
          setMicActive(true);
        } catch (err: any) {
          console.warn('[useAudioCapture] Microphone capture unavailable:', err);
          if (!disposed) {
            setMicActive(false);
            setError((prev) => prev || err?.message || 'Микрофон недоступен');
          }
        }
      } else if (!usedMicAsSystemFallback) {
        setMicActive(false);
      }
    };

    void startCaptures();

    return () => {
      disposed = true;
      activeFlushHandlersRef.current = [];
      cleanups.forEach((fn) => fn());
      setSystemActive(false);
      setMicActive(false);
      setSystemSpeaking(false);
      setMicSpeaking(false);
      setAudioLevel(0);
    };
  }, [
    enabled,
    settings.appMode,
    settings.captureSystemAudio,
    settings.captureMicAudio,
    settings.micDeviceId,
    settings.systemAudioDeviceId
  ]);

  return {
    systemActive,
    micActive,
    systemSpeaking,
    micSpeaking,
    isTranscribing,
    audioLevel,
    error,
    flushAndTranscribe,
    resetBuffers,
    isPaused: Boolean(paused)
  };
}
