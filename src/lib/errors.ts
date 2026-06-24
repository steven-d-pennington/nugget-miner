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
