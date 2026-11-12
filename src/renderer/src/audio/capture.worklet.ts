interface CaptureProcessorOptions {
  processorOptions?: {
    batchSize?: number;
  };
}

interface WorkletProcessor {
  readonly port: MessagePort;
}

declare const AudioWorkletProcessor: {
  new (options?: CaptureProcessorOptions): WorkletProcessor;
};

declare const currentFrame: number;

declare function registerProcessor(
  name: string,
  processor: new (options?: CaptureProcessorOptions) => WorkletProcessor
): void;

const DEFAULT_BATCH_SIZE = 2048;

class CaptureProcessor extends AudioWorkletProcessor {
  private readonly batchSize: number;
  private buffer: Float32Array;
  private writeOffset = 0;
  private batchStartFrame = 0;

  constructor(options?: CaptureProcessorOptions) {
    super(options);
    this.batchSize = Math.max(128, options?.processorOptions?.batchSize || DEFAULT_BATCH_SIZE);
    this.buffer = new Float32Array(this.batchSize);
    this.port.onmessage = (event: MessageEvent<{ type?: string; requestId?: number }>) => {
      if (event.data?.type === 'flush') {
        this.flush(this.batchStartFrame + this.writeOffset);
        this.port.postMessage({ type: 'flushed', requestId: event.data.requestId });
      } else if (event.data?.type === 'reset') {
        this.buffer = new Float32Array(this.batchSize);
        this.writeOffset = 0;
      }
    };
  }

  process(inputs: Float32Array[][], outputs: Float32Array[][]): boolean {
    const input = inputs[0];
    const output = outputs[0];
    for (const channel of output || []) {
      channel.fill(0);
    }

    const frameLength = input?.[0]?.length || 0;
    if (frameLength === 0) return true;

    for (let frameOffset = 0; frameOffset < frameLength; frameOffset++) {
      if (this.writeOffset === 0) {
        this.batchStartFrame = currentFrame + frameOffset;
      }

      let monoSample = 0;
      for (let channel = 0; channel < input.length; channel++) {
        monoSample += input[channel][frameOffset] || 0;
      }
      this.buffer[this.writeOffset] = monoSample / Math.max(1, input.length);
      this.writeOffset += 1;

      if (this.writeOffset === this.batchSize) {
        this.flush(currentFrame + frameOffset + 1);
      }
    }

    return true;
  }

  private flush(endFrame: number): void {
    if (this.writeOffset === 0) return;

    const samples =
      this.writeOffset === this.buffer.length
        ? this.buffer
        : this.buffer.slice(0, this.writeOffset);
    this.port.postMessage(
      {
        type: 'samples',
        samples,
        startFrame: this.batchStartFrame,
        endFrame
      },
      [samples.buffer]
    );
    this.buffer = new Float32Array(this.batchSize);
    this.writeOffset = 0;
  }
}

registerProcessor('cyrano-capture', CaptureProcessor);

export {};
