export type ReasoningEffort = 'none' | 'low' | 'medium' | 'high' | 'xhigh' | 'max';

export interface LlmConfig {
  available: boolean;
  missing: string[];
  apiKey?: string;
  baseUrl: string;
  model: string;
  reasoningEffort: ReasoningEffort;
  timeoutMs: number;
  maxInputChars: number;
  providerLabel: string;
}

type EnvLike = Partial<Record<string, string | undefined>>;

const DEFAULT_BASE_URL = 'https://api.openai.com/v1';
const DEFAULT_MODEL = 'gpt-5.6-terra';
const DEFAULT_REASONING_EFFORT: ReasoningEffort = 'medium';
const DEFAULT_TIMEOUT_MS = 90_000;
const DEFAULT_MAX_INPUT_CHARS = 24_000;

function positiveInteger(value: string | undefined, fallback: number) {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, '');
}

function reasoningEffort(value: string | undefined): ReasoningEffort {
  return value && ['none', 'low', 'medium', 'high', 'xhigh', 'max'].includes(value)
    ? (value as ReasoningEffort)
    : DEFAULT_REASONING_EFFORT;
}

export function resolveLlmConfig(env: EnvLike = process.env): LlmConfig {
  const key = env.NUGGET_LLM_API_KEY ?? env.OPENAI_API_KEY ?? env.NUGGET_TRANSCRIPTION_API_KEY;
  const baseUrl = trimTrailingSlash(env.NUGGET_LLM_BASE_URL ?? env.OPENAI_BASE_URL ?? DEFAULT_BASE_URL);
  const model = env.NUGGET_LLM_MODEL ?? env.OPENAI_MODEL ?? DEFAULT_MODEL;
  const resolvedReasoningEffort = reasoningEffort(env.NUGGET_LLM_REASONING_EFFORT);
  const timeoutMs = positiveInteger(env.NUGGET_LLM_TIMEOUT_MS, DEFAULT_TIMEOUT_MS);
  const maxInputChars = positiveInteger(env.NUGGET_LLM_MAX_INPUT_CHARS, DEFAULT_MAX_INPUT_CHARS);
  const missing = key ? [] : ['apiKey'];

  const config: LlmConfig = {
    available: missing.length === 0,
    missing,
    baseUrl,
    model,
    reasoningEffort: resolvedReasoningEffort,
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
    reasoningEffort: config.reasoningEffort,
    maxInputChars: config.maxInputChars,
    providerLabel: config.providerLabel,
  };
}
