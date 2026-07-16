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

test.beforeEach(async ({ page }) => {
  await resetNuggetDatabase(page);
});

test('records, organizes two ideas, confirms them, and finds them in the library', async ({ page }) => {
  await installSuccessfulProviderMocks(page);

  await page.getByRole('button', { name: 'Record' }).click();
  await expect(page.getByText('Listening…')).toBeVisible();
  await page.waitForTimeout(1_000);
  await page.getByRole('button', { name: 'Stop & save' }).click();

  await expect(page.getByRole('heading', { name: 'Recording saved' })).toBeVisible();
  await page.getByRole('button', { name: 'Process now' }).click();
  await page.getByRole('button', { name: 'Send for processing' }).click();

  await expect(page.getByRole('heading', { name: '2 ideas found' })).toBeVisible();
  await page.getByRole('button', { name: 'Confirm all ready ideas (2)' }).click();
  await page.getByRole('link', { name: 'Ideas', exact: true }).click();

  await expect(page.getByRole('link', { name: 'Neighborhood tool library' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Shared grocery planning checklist' })).toBeVisible();
});
