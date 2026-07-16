import { expect, test, type Page } from '@playwright/test';
import {
  installFailOnceOrganizationMock,
  installSuccessfulProviderMocks,
} from './helpers/providerMocks';

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

test('retries a failed organization without duplicating ideas or accepted actions', async ({ page }) => {
  await installSuccessfulProviderMocks(page);
  await installFailOnceOrganizationMock(page);

  await page.getByRole('button', { name: 'Record' }).click();
  await expect(page.getByText('Listening…')).toBeVisible();
  await page.waitForTimeout(1_000);
  await page.getByRole('button', { name: 'Stop & save' }).click();

  await expect(page.getByRole('heading', { name: 'Recording saved' })).toBeVisible();
  await page.getByRole('button', { name: 'Process now' }).click();
  await page.getByRole('button', { name: 'Send for processing' }).click();

  await expect(page.getByRole('textbox', { name: 'Transcript text' })).toHaveValue(/Build a neighborhood tool library/);
  await expect(page.getByRole('button', { name: 'Retry', exact: true })).toBeVisible();

  await page.getByRole('button', { name: 'Retry', exact: true }).click();
  await expect(page.getByRole('heading', { name: '2 ideas found' })).toBeVisible();

  await page.getByLabel('Add to Actions when confirmed').check();
  await page.getByRole('button', { name: 'Confirm', exact: true }).click();
  await expect(page.getByText('Idea added to your library')).toBeVisible();

  await page.getByRole('link', { name: 'Ideas', exact: true }).click();
  const ideaRows = page.getByRole('list', { name: 'Ideas' }).getByRole('listitem');
  await expect(ideaRows).toHaveCount(1);
  await expect(ideaRows).toContainText(/Neighborhood tool library|Shared grocery planning checklist/);

  await page.getByRole('link', { name: 'Actions', exact: true }).click();
  const actionRows = page.getByRole('list', { name: 'Open actions' }).getByRole('listitem');
  await expect(actionRows).toHaveCount(1);
  await expect(actionRows).toContainText(/Ask neighbors which tools they can share.|Choose a shared list and add staple items./);

  await page.getByRole('link', { name: 'Ideas', exact: true }).click();
  await page.getByRole('link', { name: 'Actions', exact: true }).click();
  await expect(actionRows).toHaveCount(1);
});
