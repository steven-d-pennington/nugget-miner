export interface TranscriptionConfig {
  available: boolean;
  missing: string[];
  apiKey?: string;
  baseUrl: string;
  model: string;
  timeoutMs: number;
  maxBytes: number;
  providerLabel: string;
}

type EnvLike = Partial<Record<string, string | undefined>>;

const DEFAULT_BASE_URL = 'https://api.openai.com/v1';
const DEFAULT_MODEL = 'gpt-4o-mini-transcribe';
const DEFAULT_TIMEOUT_MS = 60_000;
const DEFAULT_MAX_BYTES = 26_214_400;

function positiveInteger(value: string | undefined, fallback: number) {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, '');
}

export function resolveTranscriptionConfig(env: EnvLike = process.env): TranscriptionConfig {
  const key = env.NUGGET_TRANSCRIPTION_API_KEY ?? env.OPENAI_API_KEY;
  const baseUrl = trimTrailingSlash(env.NUGGET_TRANSCRIPTION_BASE_URL ?? env.OPENAI_BASE_URL ?? DEFAULT_BASE_URL);
  const model = env.NUGGET_TRANSCRIPTION_MODEL ?? env.OPENAI_TRANSCRIPTION_MODEL ?? DEFAULT_MODEL;
  const timeoutMs = positiveInteger(env.NUGGET_TRANSCRIPTION_TIMEOUT_MS, DEFAULT_TIMEOUT_MS);
  const maxBytes = positiveInteger(env.NUGGET_TRANSCRIPTION_MAX_BYTES, DEFAULT_MAX_BYTES);
  const missing = key ? [] : ['apiKey'];

  const config: TranscriptionConfig = {
    available: missing.length === 0,
    missing,
    baseUrl,
    model,
    timeoutMs,
    maxBytes,
    providerLabel: 'OpenAI-compatible transcription',
  };

  if (key) {
    config.apiKey = key;
  }

  return config;
}

export function publicTranscriptionConfig(config = resolveTranscriptionConfig()) {
  return {
    available: config.available,
    missing: config.missing,
    model: config.model,
    maxBytes: config.maxBytes,
    providerLabel: config.providerLabel,
  };
}
