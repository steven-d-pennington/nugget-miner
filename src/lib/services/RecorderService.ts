import { RecorderError } from '@/lib/errors';
import type { RecordingDraft } from '@/types';

export type RecorderState = 'idle' | 'requesting-permission' | 'recording' | 'paused' | 'stopping' | 'error';

type LevelCallback = (rms: number) => void;

const WAVEFORM_BUCKETS = 48;

function selectMimeType() {
  const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'];
  return candidates.find((candidate) => MediaRecorder.isTypeSupported(candidate)) ?? '';
}

function downsample(values: number[], bucketCount: number) {
  if (values.length <= bucketCount) return values;
  const bucketSize = values.length / bucketCount;
  return Array.from({ length: bucketCount }, (_, index) => {
    const start = Math.floor(index * bucketSize);
    const end = Math.max(start + 1, Math.floor((index + 1) * bucketSize));
    const slice = values.slice(start, end);
    return slice.reduce((sum, value) => sum + value, 0) / slice.length;
  });
}

export class BrowserRecorderService {
  state: RecorderState = 'idle';

  private stream?: MediaStream;
  private recorder?: MediaRecorder;
  private chunks: BlobPart[] = [];
  private startedAt = 0;
  private levels: number[] = [];
  private callbacks = new Set<LevelCallback>();
  private audioContext?: AudioContext;
  private analyser?: AnalyserNode;
  private levelTimer?: number;

  async start(): Promise<void> {
    if (this.state === 'recording' || this.state === 'requesting-permission') return;
    if (!navigator.mediaDevices?.getUserMedia) {
      this.state = 'error';
      throw new RecorderError('This browser does not support microphone recording.');
    }

    this.state = 'requesting-permission';
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = selectMimeType();
      this.recorder = new MediaRecorder(this.stream, mimeType ? { mimeType } : undefined);
      this.chunks = [];
      this.levels = [];
      this.recorder.ondataavailable = (event) => {
        if (event.data.size > 0) this.chunks.push(event.data);
      };
      this.setupAnalyser(this.stream);
      this.startedAt = performance.now();
      this.recorder.start(250);
      this.state = 'recording';
    } catch (error) {
      this.cleanup();
      this.state = 'error';
      throw new RecorderError(error instanceof Error ? error.message : 'Microphone permission was denied.');
    }
  }

  async stop(): Promise<RecordingDraft> {
    if (!this.recorder || this.state !== 'recording') {
      throw new RecorderError('There is no active recording to stop.');
    }

    this.state = 'stopping';
    const recorder = this.recorder;
    const durationMs = Math.max(1, Math.round(performance.now() - this.startedAt));

    return new Promise<RecordingDraft>((resolve, reject) => {
      recorder.onerror = () => {
        this.cleanup();
        this.state = 'error';
        reject(new RecorderError('Recording failed while stopping.'));
      };
      recorder.onstop = () => {
        const mimeType = recorder.mimeType || 'audio/webm';
        const blob = new Blob(this.chunks, { type: mimeType });
        const waveformPreview = downsample(this.levels, WAVEFORM_BUCKETS);
        this.cleanup();
        this.state = 'idle';
        resolve({
          blob,
          mimeType,
          durationMs,
          sizeBytes: blob.size,
          waveformPreview,
        });
      };
      recorder.stop();
    });
  }

  cancel(): void {
    if (this.recorder && this.recorder.state !== 'inactive') {
      this.recorder.stop();
    }
    this.cleanup();
    this.state = 'idle';
  }

  onLevel(callback: LevelCallback): () => void {
    this.callbacks.add(callback);
    return () => this.callbacks.delete(callback);
  }

  private setupAnalyser(stream: MediaStream) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    this.audioContext = new AudioContextClass();
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 256;
    this.audioContext.createMediaStreamSource(stream).connect(this.analyser);
    const data = new Uint8Array(this.analyser.fftSize);
    this.levelTimer = window.setInterval(() => {
      if (!this.analyser) return;
      this.analyser.getByteTimeDomainData(data);
      const rms = Math.sqrt(
        data.reduce((sum, sample) => {
          const centered = (sample - 128) / 128;
          return sum + centered * centered;
        }, 0) / data.length,
      );
      const normalized = Math.min(1, Number(rms.toFixed(3)));
      this.levels.push(normalized);
      this.callbacks.forEach((callback) => callback(normalized));
    }, 120);
  }

  private cleanup() {
    if (this.levelTimer) window.clearInterval(this.levelTimer);
    this.levelTimer = undefined;
    this.callbacks.forEach((callback) => callback(0));
    this.stream?.getTracks().forEach((track) => track.stop());
    void this.audioContext?.close().catch(() => undefined);
    this.stream = undefined;
    this.recorder = undefined;
    this.audioContext = undefined;
    this.analyser = undefined;
  }
}

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}
