import { publicTranscriptionConfig, resolveTranscriptionConfig } from '@/lib/server/transcriptionConfig';
import { TranscriptionProviderError, transcribeWithOpenAICompatibleProvider } from '@/lib/server/transcriptionClient';
import { consumeRateLimit, rateLimitHeaders, rateLimitKey } from '@/lib/server/rateLimit';
import { requestIdentity } from '@/lib/server/requestIdentity';

const allowedMimeTypes = new Set(['audio/mp4', 'audio/mpeg', 'audio/wav', 'audio/x-wav']);
const webmMimeType = /^audio\/webm(?:\s*;\s*codecs\s*=\s*(?:opus|"opus"))?\s*$/i;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1_000;
const TRANSCRIPTION_RATE_LIMIT = 10;

function json(data: unknown, init?: ResponseInit) {
  return Response.json(data, init);
}

function errorResponse(status: number, code: string, message: string) {
  return json({ error: { code, message } }, { status });
}

function rateLimitedResponse(result: ReturnType<typeof consumeRateLimit>) {
  return json(
    { error: { code: 'rate_limited', message: 'Too many processing requests. Try again in a few minutes.' } },
    { status: 429, headers: rateLimitHeaders(result) },
  );
}

function isAllowedMimeType(type: string) {
  return allowedMimeTypes.has(type.toLowerCase()) || webmMimeType.test(type);
}

function isFileLike(value: FormDataEntryValue | null): value is File {
  return (
    typeof value === 'object' &&
    value !== null &&
    'arrayBuffer' in value &&
    'size' in value &&
    'type' in value
  );
}

export async function GET() {
  return json(publicTranscriptionConfig(resolveTranscriptionConfig()));
}

export async function POST(request: Request) {
  const config = resolveTranscriptionConfig();
  if (!config.available) {
    return errorResponse(503, 'provider_unconfigured', 'Cloud transcription is not configured on the server.');
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return errorResponse(400, 'invalid_form_data', 'Expected multipart form data.');
  }

  const file = form.get('file');
  if (!isFileLike(file)) {
    return errorResponse(400, 'missing_audio', 'A file field containing audio is required.');
  }

  const audioFile = file as File;

  if (!isAllowedMimeType(audioFile.type)) {
    return errorResponse(415, 'unsupported_media_type', 'This audio type is not supported.');
  }

  if (audioFile.size === 0) {
    return errorResponse(400, 'empty_audio', 'The audio file must not be empty.');
  }

  if (audioFile.size > config.maxBytes) {
    return errorResponse(413, 'payload_too_large', 'The audio recording is too large to transcribe.');
  }

  const limit = consumeRateLimit(rateLimitKey('transcription', requestIdentity(request)), TRANSCRIPTION_RATE_LIMIT, RATE_LIMIT_WINDOW_MS);
  if (!limit.allowed) return rateLimitedResponse(limit);

  try {
    return json(await transcribeWithOpenAICompatibleProvider({ file: audioFile, config }));
  } catch (error) {
    const code = error instanceof TranscriptionProviderError ? error.code : 'provider_failed';
    const status = code === 'provider_timeout' ? 504 : code === 'provider_invalid_response' ? 502 : 502;
    return errorResponse(status, code, 'Cloud transcription failed. Please try again.');
  }
}
