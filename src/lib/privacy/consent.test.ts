import { describe, expect, it, vi } from 'vitest';
import { ConsentRequiredError, runWithConsent } from './consent';

describe('consent gate', () => {
  it('throws ConsentRequiredError when consent is denied before calling send', async () => {
    const send = vi.fn(async () => 'sent');

    await expect(
      runWithConsent({
        requestConsent: async () => false,
        send,
      }),
    ).rejects.toBeInstanceOf(ConsentRequiredError);

    expect(send).not.toHaveBeenCalled();
  });

  it('calls send exactly once after consent is granted', async () => {
    const send = vi.fn(async () => 'sent');

    await expect(runWithConsent({ requestConsent: async () => true, send })).resolves.toBe('sent');

    expect(send).toHaveBeenCalledTimes(1);
  });
});
