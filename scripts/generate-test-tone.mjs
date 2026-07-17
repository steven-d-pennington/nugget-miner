import { Buffer } from 'node:buffer';
import { log } from 'node:console';
import { mkdir, stat, writeFile } from 'node:fs/promises';
import { exit } from 'node:process';
import { URL, fileURLToPath } from 'node:url';

const sampleRate = 44_100;
const durationSeconds = 2;
const channelCount = 1;
const bytesPerSample = 2;
const sampleCount = sampleRate * durationSeconds;
const dataLength = sampleCount * channelCount * bytesPerSample;
const expectedLength = 44 + dataLength;
const fixturePath = fileURLToPath(new URL('../e2e/fixtures/tone.wav', import.meta.url));

await mkdir(fileURLToPath(new URL('../e2e/fixtures/', import.meta.url)), { recursive: true });

try {
  const existing = await stat(fixturePath);
  if (existing.size === expectedLength) {
    log(`Test tone already exists (${expectedLength} bytes).`);
    exit(0);
  }
} catch (error) {
  if (error?.code !== 'ENOENT') throw error;
}

const buffer = Buffer.alloc(expectedLength);
buffer.write('RIFF', 0, 'ascii');
buffer.writeUInt32LE(36 + dataLength, 4);
buffer.write('WAVE', 8, 'ascii');
buffer.write('fmt ', 12, 'ascii');
buffer.writeUInt32LE(16, 16);
buffer.writeUInt16LE(1, 20);
buffer.writeUInt16LE(channelCount, 22);
buffer.writeUInt32LE(sampleRate, 24);
buffer.writeUInt32LE(sampleRate * channelCount * bytesPerSample, 28);
buffer.writeUInt16LE(channelCount * bytesPerSample, 32);
buffer.writeUInt16LE(bytesPerSample * 8, 34);
buffer.write('data', 36, 'ascii');
buffer.writeUInt32LE(dataLength, 40);

for (let index = 0; index < sampleCount; index += 1) {
  const sample = Math.sin((2 * Math.PI * 440 * index) / sampleRate) * 0.2;
  buffer.writeInt16LE(Math.round(sample * 32767), 44 + index * 2);
}

await writeFile(fixturePath, buffer);
log(`Generated test tone (${expectedLength} bytes).`);
