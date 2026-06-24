export class NuggetError extends Error {
  constructor(message: string, readonly code: string) {
    super(message);
    this.name = 'NuggetError';
  }
}

export class StorageError extends NuggetError {
  constructor(message = 'Local storage failed') {
    super(message, 'storage_error');
    this.name = 'StorageError';
  }
}

export class RecorderError extends NuggetError {
  constructor(message = 'Recording failed') {
    super(message, 'recorder_error');
    this.name = 'RecorderError';
  }
}

export class ValidationError extends NuggetError {
  constructor(message = 'Validation failed') {
    super(message, 'validation_error');
    this.name = 'ValidationError';
  }
}

export class ProviderError extends NuggetError {
  constructor(message = 'Provider failed') {
    super(message, 'provider_error');
    this.name = 'ProviderError';
  }
}
