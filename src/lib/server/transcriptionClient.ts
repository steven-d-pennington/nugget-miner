import type { TranscriptResult, TranscriptSegment } from '@/types';
import type { TranscriptionConfig } from './transcriptionConfig';

export class TranscriptionProviderError extends Error {
  constructor(message: string, readonly code = 'provider_failed') {
    super(message);
    this.name = 'TranscriptionProviderError';
  }
}

export interface TranscriptionClientInput {
  file: File;
  config: TranscriptionConfig;
  fetcher?: typeof fetch;
}

interface ProviderSegment {
  start?: unknown;
  end?: unknown;
  text?: unknown;
}

interface ProviderResponse {
  text?: unknown;
  language?: unknown;
  duration?: unknown;
  segments?: unknown;
}

function transcriptionUrl(baseUrl: string) {
  return `${baseUrl.replace(/\/+$/, '')}/audio/transcriptions`;
}

function normalizeSegments(value: unknown): TranscriptSegment[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const segments = value.flatMap((segment: ProviderSegment) => {
    if (typeof segment.start !== 'number' || typeof segment.end !== 'number' || typeof segment.text !== 'string') {
      return [];
    }
    return [{ start: segment.start, end: segment.end, text: segment.text }];
  });
  return segments.length > 0 ? segments : undefined;
}

function normalizeProviderResponse(payload: ProviderResponse, model: string): TranscriptResult {
  if (typeof payload.text !== 'string' || payload.text.trim().length === 0) {
    throw new TranscriptionProviderError('Transcription provider returned an empty transcript.', 'provider_invalid_response');
  }

  return {
    text: payload.text,
    language: typeof payload.language === 'string' ? payload.language : undefined,
    segments: normalizeSegments(payload.segments),
    provider: 'cloud',
    model,
  };
}

async function parseProviderJson(response: Response) {
  try {
    return (await response.json()) as ProviderResponse;
  } catch {
    throw new TranscriptionProviderError('Transcription provider returned invalid JSON.', 'provider_invalid_response');
  }
}

export async function transcribeWithOpenAICompatibleProvider({ file, config, fetcher = fetch }: TranscriptionClientInput): Promise<TranscriptResult> {
  if (!config.available || !config.apiKey) {
    throw new TranscriptionProviderError('Transcription provider is not configured.', 'provider_unconfigured');
  }

  const form = new FormData();
  form.set('file', file);
  form.set('model', config.model);
  form.set('response_format', 'json');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.timeoutMs);

  try {
    const response = await fetcher(transcriptionUrl(config.baseUrl), {
      method: 'POST',
      headers: {
        Authorization: ['Bearer', config.apiKey].join(' '),
      },
      body: form,
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new TranscriptionProviderError('Transcription provider request failed.', 'provider_failed');
    }

    return normalizeProviderResponse(await parseProviderJson(response), config.model);
  } catch (error) {
    if (error instanceof TranscriptionProviderError) throw error;
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new TranscriptionProviderError('Transcription provider request timed out.', 'provider_timeout');
    }
    throw new TranscriptionProviderError('Transcription provider request failed.', 'provider_failed');
  } finally {
    clearTimeout(timeout);
  }
}
