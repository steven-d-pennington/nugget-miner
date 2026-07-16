import { expect, test, type Page } from '@playwright/test';
import { installSuccessfulProviderMocks } from './helpers/providerMocks';

async function resetNuggetDatabase(page: Page) {
  await page.goto('/sw.js');
  await page.evaluate(async () => {
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.deleteDatabase('nugget');
      request.addEventListener('success', () => resolve(), { once: true });
      request.addEventListener('error', () => reject(request.error), { once: true });
      request.addEventListener('blocked', () => reject(new Error('Nugget IndexedDB deletion was blocked.')), { once: true });
    });
  });
  await page.goto('/');
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
}

async function nuggetStoreCounts(page: Page) {
  return page.evaluate(async () => {
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('nugget');
      request.addEventListener('success', () => resolve(request.result), { once: true });
      request.addEventListener('error', () => reject(request.error), { once: true });
    });
    try {
      return await new Promise<{ captures: number; recordings: number }>((resolve, reject) => {
        const transaction = database.transaction(['captureSessions', 'recordings'], 'readonly');
        const captures = transaction.objectStore('captureSessions').count();
        const recordings = transaction.objectStore('recordings').count();
        transaction.addEventListener('complete', () => {
          resolve({ captures: captures.result, recordings: recordings.result });
        }, { once: true });
        transaction.addEventListener('error', () => reject(transaction.error), { once: true });
      });
    } finally {
      database.close();
    }
  });
}

test.beforeEach(async ({ page }) => {
  await resetNuggetDatabase(page);
});

test('keeps an offline recording queued locally until the app reconnects, then resumes and confirms it', async ({ page }) => {
  let onlineRestored = false;
  let providerRequestsBeforeReconnect = 0;

  page.on('request', (request) => {
    if (!onlineRestored && new URL(request.url()).pathname.startsWith('/api/')) {
      providerRequestsBeforeReconnect += 1;
    }
  });
  await installSuccessfulProviderMocks(page);

  await page.getByRole('button', { name: 'Enable automatic organization' }).click();
  await page.context().setOffline(true);
  await page.getByRole('button', { name: 'Record' }).click();
  await expect(page.getByText('Listening…')).toBeVisible();
  await page.waitForTimeout(1_000);
  await page.getByRole('button', { name: 'Stop & save' }).click();

  await expect(page.getByText('Recording saved locally. Reconnect to continue processing.')).toBeVisible();
  await expect(page.getByRole('link', { name: /Audio capture.*Processing/ })).toBeVisible();
  expect(await nuggetStoreCounts(page)).toEqual({ captures: 1, recordings: 1 });
  expect(providerRequestsBeforeReconnect).toBe(0);

  await page.reload();
  await expect(page.getByRole('link', { name: /Audio capture.*Processing/ })).toBeVisible();
  expect(providerRequestsBeforeReconnect).toBe(0);

  onlineRestored = true;
  await page.context().setOffline(false);
  await page.evaluate(() => window.dispatchEvent(new Event('online')));

  await page.getByRole('link', { name: /Audio capture.*Processing/ }).click();
  await expect(page.getByRole('heading', { name: '2 ideas found' })).toBeVisible();
  await page.getByRole('button', { name: 'Confirm', exact: true }).click();
  await expect(page.getByText('Idea added to your library')).toBeVisible();
});
