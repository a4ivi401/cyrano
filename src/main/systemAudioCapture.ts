import { ChildProcess, spawn } from 'node:child_process';
import { constants as fsConstants } from 'node:fs';
import { access } from 'node:fs/promises';
import * as path from 'node:path';
import { app, WebContents } from 'electron';
import { SystemAudioCaptureResult, SystemAudioPcmChunk } from '../common/types';
import { supportsNativeSystemAudio } from './platformCapabilities';

const SAMPLE_RATE = 16000;
const CHUNK_DURATION_SECONDS = '0.04';

export class SystemAudioCapture {
  private child: ChildProcess | null = null;
  private ownerId: number | null = null;
  private stopping = false;

  async start(
    target: WebContents,
    retryAfterPermission = true
  ): Promise<SystemAudioCaptureResult> {
    await this.stop();

    const electronProcess = process as NodeJS.Process & { getSystemVersion?: () => string };
    const systemVersion = electronProcess.getSystemVersion?.() || '';
    if (!supportsNativeSystemAudio(process.platform, systemVersion)) {
      return {
        success: false,
        unsupported: true,
        error: 'Native system audio capture requires macOS 14.2 or newer.'
      };
    }

    const binaryPath = app.isPackaged
      ? path.join(process.resourcesPath, 'audiotee')
      : path.join(app.getAppPath(), 'node_modules', 'audiotee', 'bin', 'audiotee');

    try {
      await access(binaryPath, fsConstants.X_OK);
    } catch {
      return { success: false, error: `System audio helper is unavailable: ${binaryPath}` };
    }

    const child = spawn(
      binaryPath,
      ['--sample-rate', String(SAMPLE_RATE), '--chunk-duration', CHUNK_DURATION_SECONDS],
      { stdio: ['ignore', 'pipe', 'pipe'] }
    );
    this.child = child;
    this.ownerId = target.id;
    this.stopping = false;

    let trailingByte = Buffer.alloc(0);
    let stderrBuffer = '';
    let receivedData = false;
    let restartTimer: NodeJS.Timeout | null = null;

    const sendError = (message: string) => {
      if (!target.isDestroyed()) {
        try {
          target.send('prompter:system-audio-error', message);
        } catch {
          // The renderer may have crashed between the destroyed check and send.
        }
      }
    };

    child.stdout?.on('data', (chunk: Buffer) => {
      if (this.child !== child || target.isDestroyed()) return;
      receivedData = true;
      if (restartTimer) {
        clearTimeout(restartTimer);
        restartTimer = null;
      }

      const bytes = trailingByte.length > 0 ? Buffer.concat([trailingByte, chunk]) : chunk;
      const completeLength = bytes.length - (bytes.length % 2);
      if (completeLength === 0) {
        trailingByte = Buffer.from(bytes);
        return;
      }

      trailingByte = Buffer.from(bytes.subarray(completeLength));
      const payload: SystemAudioPcmChunk = {
        data: Uint8Array.from(bytes.subarray(0, completeLength)),
        sampleRate: SAMPLE_RATE,
        capturedAt: Date.now()
      };
      try {
        target.send('prompter:system-audio-data', payload);
      } catch {
        void this.stop(target.id);
      }
    });

    child.stderr?.setEncoding('utf8');
    child.stderr?.on('data', (chunk: string) => {
      stderrBuffer += chunk;
      const lines = stderrBuffer.split('\n');
      stderrBuffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const event = JSON.parse(line) as {
            message_type?: string;
            data?: { message?: string };
          };
          if (event.message_type === 'error' && event.data?.message) {
            sendError(event.data.message);
          } else if (
            event.message_type === 'stream_start' &&
            retryAfterPermission &&
            !restartTimer
          ) {
            restartTimer = setTimeout(() => {
              restartTimer = null;
              if (this.child !== child || receivedData || target.isDestroyed()) return;
              void this.stop(target.id).then(async () => {
                const result = await this.start(target, false);
                if (!result.success && result.error) sendError(result.error);
              });
            }, 1500);
          }
        } catch {
          // The helper may write non-JSON diagnostics on startup.
        }
      }
    });

    child.on('error', (error) => {
      if (this.child === child && !this.stopping) sendError(error.message);
    });
    child.on('exit', (code, signal) => {
      if (restartTimer) {
        clearTimeout(restartTimer);
        restartTimer = null;
      }
      if (this.child !== child) return;
      this.child = null;
      this.ownerId = null;
      if (!this.stopping) {
        sendError(
          code === 0
            ? 'System audio capture stopped unexpectedly.'
            : `System audio helper exited (${code ?? signal ?? 'unknown'}).`
        );
      }
    });

    target.once('destroyed', () => {
      if (this.ownerId === target.id) void this.stop(target.id);
    });

    try {
      await new Promise<void>((resolve, reject) => {
        const handleSpawn = () => {
          child.off('error', handleStartError);
          resolve();
        };
        const handleStartError = (error: Error) => {
          child.off('spawn', handleSpawn);
          reject(error);
        };
        child.once('spawn', handleSpawn);
        child.once('error', handleStartError);
      });
      return { success: true };
    } catch (error) {
      await this.stop(target.id);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'System audio helper failed to start.'
      };
    }
  }

  async stop(ownerId?: number): Promise<void> {
    if (ownerId !== undefined && this.ownerId !== ownerId) return;

    const child = this.child;
    this.child = null;
    this.ownerId = null;
    if (!child || child.exitCode !== null || child.signalCode !== null) return;

    this.stopping = true;
    await new Promise<void>((resolve) => {
      const timeout = setTimeout(() => {
        child.kill('SIGKILL');
        resolve();
      }, 2000);
      child.once('exit', () => {
        clearTimeout(timeout);
        resolve();
      });
      child.kill('SIGTERM');
    });
    this.stopping = false;
  }
}
