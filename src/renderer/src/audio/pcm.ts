export function decodePcm16Le(data: Uint8Array): Float32Array {
  const sampleCount = Math.floor(data.byteLength / 2);
  const samples = new Float32Array(sampleCount);
  const view = new DataView(data.buffer, data.byteOffset, sampleCount * 2);

  for (let index = 0; index < sampleCount; index += 1) {
    samples[index] = view.getInt16(index * 2, true) / 32768;
  }

  return samples;
}
