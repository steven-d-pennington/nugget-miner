export class ConsentRequiredError extends Error {
  readonly code = 'consent_required';

  constructor(message = 'Consent is required before sending audio for cloud processing.') {
    super(message);
    this.name = 'ConsentRequiredError';
  }
}

export interface ConsentContext {
  dataLabel: string;
  providerLabel: string;
  purpose: string;
}

export interface RunWithConsentOptions<T> {
  requestConsent: () => Promise<boolean>;
  send: () => Promise<T>;
}

export async function runWithConsent<T>({ requestConsent, send }: RunWithConsentOptions<T>) {
  const allowed = await requestConsent();
  if (!allowed) {
    throw new ConsentRequiredError();
  }
  return send();
}
