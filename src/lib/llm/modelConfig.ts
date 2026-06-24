export interface LlmConfig {
  available: boolean;
  missing: string[];
  apiKey?: string;
  baseUrl: string;
  model: string;
  timeoutMs: number;
  maxInputChars: number;
  providerLabel: string;
}

type EnvLike = Partial<Record<string, string | undefined>>;

const DEFAULT_BASE_URL = 'https://api.openai.com/v1';
const DEFAULT_MODEL = 'gpt-4o-mini';
const DEFAULT_TIMEOUT_MS = 45_000;
const DEFAULT_MAX_INPUT_CHARS = 24_000;

function positiveInteger(value: string | undefined, fallback: number) {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, '');
}

export function resolveLlmConfig(env: EnvLike = process.env): LlmConfig {
  const key = env.NUGGET_LLM_API_KEY ?? env.OPENAI_API_KEY ?? env.NUGGET_TRANSCRIPTION_API_KEY;
  const baseUrl = trimTrailingSlash(env.NUGGET_LLM_BASE_URL ?? env.OPENAI_BASE_URL ?? DEFAULT_BASE_URL);
  const model = env.NUGGET_LLM_MODEL ?? env.OPENAI_MODEL ?? DEFAULT_MODEL;
  const timeoutMs = positiveInteger(env.NUGGET_LLM_TIMEOUT_MS, DEFAULT_TIMEOUT_MS);
  const maxInputChars = positiveInteger(env.NUGGET_LLM_MAX_INPUT_CHARS, DEFAULT_MAX_INPUT_CHARS);
  const missing = key ? [] : ['apiKey'];

  const config: LlmConfig = {
    available: missing.length === 0,
    missing,
    baseUrl,
    model,
    timeoutMs,
    maxInputChars,
    providerLabel: 'OpenAI-compatible LLM extraction',
  };

  if (key) config.apiKey = key;
  return config;
}

export function publicLlmConfig(config = resolveLlmConfig()) {
  return {
    available: config.available,
    missing: config.missing,
    model: config.model,
    maxInputChars: config.maxInputChars,
    providerLabel: config.providerLabel,
  };
}
