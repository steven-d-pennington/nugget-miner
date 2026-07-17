import { resolveLlmConfig, type LlmConfig } from '@/lib/llm';

export const OFFICIAL_OPENAI_BASE_URL = 'https://api.openai.com/v1';
export const LIVE_EVAL_MODEL = 'gpt-5.6-terra';
export const LIVE_EVAL_REASONING_EFFORT = 'medium';
export const LIVE_FIXTURE_DEADLINE_MS = 170_000;

type EnvLike = Partial<Record<string, string | undefined>>;

export type AuthorizedLiveConfig = Omit<LlmConfig, 'apiKey'> & { readonly apiKey: string };

function isNonEmpty(value: string | undefined) {
  return value !== undefined && value.length > 0;
}

/**
 * Applies stricter credential and endpoint rules around production config.
 * The authorized key remains directly readable for client construction but is
 * deliberately non-enumerable so JSON/string spread cannot serialize it.
 */
export function resolveAuthorizedLiveConfig(env: EnvLike = process.env): AuthorizedLiveConfig {
  if (isNonEmpty(env.NUGGET_LLM_API_KEY) || isNonEmpty(env.NUGGET_TRANSCRIPTION_API_KEY)) {
    throw new Error('Live evaluation rejects alternate API key sources; use only OPENAI_API_KEY.');
  }
  if (!isNonEmpty(env.OPENAI_API_KEY)) {
    throw new Error(
      'OPENAI_API_KEY is required for the live evaluation. Set it only in the current shell or local secret manager.',
    );
  }

  const config = resolveLlmConfig({
    ...env,
    NUGGET_LLM_API_KEY: undefined,
    NUGGET_TRANSCRIPTION_API_KEY: undefined,
  });
  if (config.baseUrl !== OFFICIAL_OPENAI_BASE_URL) {
    throw new Error(`Live evaluation requires the official OpenAI base URL: ${OFFICIAL_OPENAI_BASE_URL}.`);
  }
  if (config.model !== LIVE_EVAL_MODEL) {
    throw new Error(`Live evaluation requires model ${LIVE_EVAL_MODEL}.`);
  }
  if (config.reasoningEffort !== LIVE_EVAL_REASONING_EFFORT) {
    throw new Error(`Live evaluation requires ${LIVE_EVAL_REASONING_EFFORT} reasoning effort.`);
  }
  if (!config.available || !config.apiKey || config.apiKey !== env.OPENAI_API_KEY) {
    throw new Error('The production LLM configuration did not resolve the explicitly authorized API key.');
  }

  const serializableConfig = { ...config };
  delete serializableConfig.apiKey;
  const authorized = serializableConfig as AuthorizedLiveConfig;
  Object.defineProperty(authorized, 'apiKey', {
    value: config.apiKey,
    enumerable: false,
    configurable: false,
    writable: false,
  });
  return authorized;
}
