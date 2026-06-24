export class LlmProviderError extends Error {
  readonly code = 'llm_provider_error';

  constructor(message = 'LLM provider request failed.') {
    super(message);
    this.name = 'LlmProviderError';
  }
}

export class LlmValidationError extends Error {
  readonly code = 'llm_validation_error';

  constructor(message = 'LLM output failed validation.') {
    super(message);
    this.name = 'LlmValidationError';
  }
}

export class LlmConfigurationError extends Error {
  readonly code = 'llm_configuration_error';

  constructor(message = 'LLM provider is not configured.') {
    super(message);
    this.name = 'LlmConfigurationError';
  }
}
