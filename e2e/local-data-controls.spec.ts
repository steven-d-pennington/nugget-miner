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

test('deletes processed audio and supports archive, restore, and permanent idea deletion', async ({ page }) => {
  await installSuccessfulProviderMocks(page);

  await page.getByRole('button', { name: 'Record' }).click();
  await page.waitForTimeout(1_000);
  await page.getByRole('button', { name: 'Stop & save' }).click();
  await expect(page.getByRole('heading', { name: 'Recording saved' })).toBeVisible();
  const capturePath = new URL(page.url()).pathname;

  await page.getByRole('button', { name: 'Process now' }).click();
  await page.getByRole('button', { name: 'Send for processing' }).click();
  await expect(page.getByRole('heading', { name: '2 ideas found' })).toBeVisible();
  await page.getByRole('button', { name: 'Confirm all ready ideas (2)' }).click();

  await page.goto(`${capturePath}?stay=1`);
  await expect(page.getByRole('button', { name: 'Delete recording audio' })).toBeVisible();
  page.once('dialog', async (dialog) => {
    expect(dialog.message()).toContain('transcript and extracted ideas will remain');
    await dialog.accept();
  });
  await page.getByRole('button', { name: 'Delete recording audio' }).click();
  await expect(page.getByText(/Recording audio deleted from this device/).first()).toBeVisible();
  await expect(page.getByLabel('Transcript text')).toContainText('neighborhood tool library');

  await page.getByRole('link', { name: 'Ideas', exact: true }).click();
  await page.getByRole('link', { name: 'Neighborhood tool library' }).click();
  await page.getByRole('button', { name: 'Archive idea' }).click();
  await expect(page.getByRole('status')).toContainText('Idea archived');
  await expect(page.getByRole('button', { name: 'Undo' })).toBeVisible();

  await page.getByRole('link', { name: 'Ideas', exact: true }).click();
  await page.getByRole('button', { name: 'Archived' }).click();
  await expect(page.getByRole('link', { name: 'Neighborhood tool library' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Shared grocery planning checklist' })).toHaveCount(0);

  await page.getByRole('link', { name: 'Neighborhood tool library' }).click();
  await page.getByRole('button', { name: 'Restore idea' }).click();
  await expect(page.getByRole('status')).toContainText('Idea restored to Active ideas');

  page.once('dialog', async (dialog) => {
    expect(dialog.message()).toContain('linked actions and AI-ready briefs');
    await dialog.accept();
  });
  await page.getByRole('button', { name: 'Delete idea' }).click();
  await expect(page).toHaveURL(/\/ideas$/);
  await expect(page.getByRole('link', { name: 'Neighborhood tool library' })).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Shared grocery planning checklist' })).toBeVisible();
});
