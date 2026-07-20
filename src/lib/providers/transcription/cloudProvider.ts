import type { TranscriptResult } from '@/types';
import type { TranscriptionInput, TranscriptionProvider } from './types';

export interface PublicTranscriptionConfig {
  available: boolean;
  missing?: string[];
  model?: string;
  maxBytes?: number;
  providerLabel?: string;
}

export interface CloudTranscriptionProviderOptions {
  fetcher?: typeof fetch;
  endpoint?: string;
  configEndpoint?: string;
}

export class CloudTranscriptionError extends Error {
  constructor(message: string, readonly code = 'cloud_transcription_failed') {
    super(message);
    this.name = 'CloudTranscriptionError';
  }
}

async function parseJsonResponse(response: Response) {
  try {
    return (await response.json()) as unknown;
  } catch {
    return undefined;
  }
}

export function createCloudTranscriptionProvider(options: CloudTranscriptionProviderOptions = {}): TranscriptionProvider & {
  getConfig(): Promise<PublicTranscriptionConfig>;
} {
  const fetcher = options.fetcher ?? fetch;
  const endpoint = options.endpoint ?? '/api/transcribe';
  const configEndpoint = options.configEndpoint ?? endpoint;

  return {
    id: 'cloud',
    label: 'Cloud transcription',
    mode: 'cloud',

    async getConfig() {
      try {
        const response = await fetcher(configEndpoint, { method: 'GET' });
        if (!response.ok) return { available: false, missing: ['apiKey'] };
        return ((await parseJsonResponse(response)) ?? { available: false, missing: ['apiKey'] }) as PublicTranscriptionConfig;
      } catch {
        return { available: false, missing: ['apiKey'] };
      }
    },

    async isAvailable() {
      const config = await this.getConfig();
      return config.available === true;
    },

    async transcribe(input: TranscriptionInput): Promise<TranscriptResult> {
      const form = new FormData();
      const extension = input.audioBlob.type.includes('mp4') ? 'm4a' : 'webm';
      const file = new File([input.audioBlob], `${input.recordingId}.${extension}`, {
        type: input.audioBlob.type || 'audio/webm',
      });
      form.set('file', file);
      form.set('captureSessionId', input.captureSessionId);
      form.set('recordingId', input.recordingId);
      if (input.safetyIdentifier) form.set('safetyIdentifier', input.safetyIdentifier);

      const response = await fetcher(endpoint, {
        method: 'POST',
        body: form,
        signal: input.signal,
      });

      const payload = await parseJsonResponse(response);
      if (!response.ok) {
        const code =
          typeof payload === 'object' && payload && 'error' in payload && typeof payload.error === 'object' && payload.error && 'code' in payload.error
            ? String(payload.error.code)
            : 'cloud_transcription_failed';
        throw new CloudTranscriptionError('Cloud transcription failed. Please try again.', code);
      }

      return payload as TranscriptResult;
    },
  };
}

export const cloudTranscriptionProvider = createCloudTranscriptionProvider();
