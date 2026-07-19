import { chromium, expect } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { log } from 'node:console';
import { mkdir, readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import process from 'node:process';

const baseUrl = (process.env.NUGGET_DEMO_BASE_URL ?? 'http://127.0.0.1:3000').replace(/\/$/, '');
const outputDirectory = path.resolve('docs/hackathon/demo-video-hybrid');
const videoOutput = path.join(outputDirectory, 'browser-walkthrough.webm');
const timelineOutput = path.join(outputDirectory, 'browser-walkthrough-timeline.json');

await mkdir(outputDirectory, { recursive: true });
await rm(videoOutput, { force: true });
await rm(timelineOutput, { force: true });
for (const filename of await readdir(outputDirectory)) {
  if (/^page@.*\.webm$/.test(filename)) {
    await rm(path.join(outputDirectory, filename), { force: true });
  }
}

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 430, height: 932 },
  recordVideo: { dir: outputDirectory, size: { width: 430, height: 932 } },
  colorScheme: 'light',
  locale: 'en-US',
  timezoneId: 'America/Los_Angeles',
  reducedMotion: 'no-preference',
});
const page = await context.newPage();
const video = page.video();
const rawVideoPath = await video.path();
const captureStartedAt = performance.now();
const chapters = [];

const pause = (milliseconds) => page.waitForTimeout(milliseconds);

async function mark(name, action) {
  const startSeconds = (performance.now() - captureStartedAt) / 1000;
  await action();
  const endSeconds = (performance.now() - captureStartedAt) / 1000;
  chapters.push({
    name,
    startSeconds: Number(startSeconds.toFixed(3)),
    endSeconds: Number(endSeconds.toFixed(3)),
  });
}

async function goto(route) {
  await page.goto(`${baseUrl}${route}`, { waitUntil: 'networkidle' });
}

async function slowScrollBy(distance, duration = 900) {
  await page.evaluate(async ({ distance: totalDistance, duration: totalDuration }) => {
    const steps = 30;
    const start = globalThis.window.scrollY;
    for (let step = 1; step <= steps; step += 1) {
      const progress = step / steps;
      const eased = 1 - ((1 - progress) ** 3);
      globalThis.window.scrollTo({ top: start + (totalDistance * eased), behavior: 'instant' });
      await new Promise((resolve) => globalThis.window.setTimeout(resolve, totalDuration / steps));
    }
  }, { distance, duration });
}

try {
  // Prepare a fresh browser profile with the built-in, visibly disclosed sample data.
  await goto('/settings');
  const loadSampleButton = page.getByRole('button', { name: 'Load sample library' });
  await expect(loadSampleButton).toBeEnabled();
  await loadSampleButton.click();
  await expect(
    page.getByText(/Sample ideas (?:added|are already loaded)/),
  ).toBeVisible();

  await goto('/ideas');
  await expect(page.getByRole('heading', { name: 'Ideas', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: /Create a neighborhood tool-sharing library/ })).toBeVisible();

  await mark('ideas-cards', async () => {
    await expect(page.getByRole('button', { name: 'Cards' })).toHaveAttribute('aria-pressed', 'true');
    await pause(5_000);
  });

  await mark('ideas-compact', async () => {
    const compactButton = page.getByRole('button', { name: 'Compact' });
    await compactButton.click();
    await expect(compactButton).toHaveAttribute('aria-pressed', 'true');
    await pause(5_000);
  });

  await mark('ideas-cards-return', async () => {
    const cardsButton = page.getByRole('button', { name: 'Cards' });
    await cardsButton.click();
    await expect(cardsButton).toHaveAttribute('aria-pressed', 'true');
    await pause(3_000);
  });

  await mark('idea-detail', async () => {
    await Promise.all([
      page.waitForURL(/\/ideas\/demo-idea-tool-sharing$/),
      page.getByRole('link', { name: /Create a neighborhood tool-sharing library/ }).click(),
    ]);
    await expect(page.getByRole('heading', { name: 'Create a neighborhood tool-sharing library' })).toBeVisible();
    await expect(page.locator('article').getByText('Sample', { exact: true })).toBeVisible();
    await pause(3_000);
    await slowScrollBy(360);
    await expect(page.getByRole('heading', { name: 'Why it matters' })).toBeVisible();
    await pause(2_500);
    await slowScrollBy(360);
    await expect(page.getByRole('heading', { name: "What's in the way" })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Next actions' })).toBeVisible();
    await pause(4_000);
  });

  await mark('activation-intents', async () => {
    await goto('/ideas/demo-idea-tool-sharing');
    const activationRegion = page.getByRole('region', { name: 'Work with this idea' });
    await activationRegion.scrollIntoViewIfNeeded();
    await expect(activationRegion).toBeVisible();
    await pause(2_000);
    await activationRegion.getByRole('button', { name: 'Choose what to do' }).click();
    await expect(page.getByRole('dialog', { name: 'What do you want to make?' })).toBeVisible();
    await pause(4_000);
  });

  await mark('activation-setup', async () => {
    await page.getByRole('button', { name: /Prepare for an AI agent/ }).click();
    await expect(page.getByRole('dialog', { name: 'Prepare for an AI agent' })).toBeVisible();
    await expect(page.getByRole('checkbox', { name: /Include source transcript/ })).not.toBeChecked();
    await pause(4_000);
  });

  await mark('activation-consent', async () => {
    await page.getByRole('button', { name: 'Enhance with GPT-5.6' }).click();
    const consentDialog = page.getByRole('dialog', { name: 'Send for cloud processing?' });
    await expect(consentDialog).toBeVisible();
    await expect(consentDialog.getByText(/organized idea/)).toBeVisible();
    await pause(4_000);
  });

  await mark('activation-processing', async () => {
    await page.getByRole('button', { name: 'Send for processing' }).click();
    await expect(page.getByText(/Enhanced with gpt-5\.6-terra/i)).toBeVisible({ timeout: 90_000 });
  });

  await mark('activation-brief', async () => {
    await expect(page.getByText(/Enhanced with gpt-5\.6-terra/i)).toBeVisible();
    await pause(3_000);
    await slowScrollBy(420, 1_200);
    await pause(3_000);
    const prompt = page.getByRole('textbox', { name: /AI-ready prompt/ });
    await prompt.scrollIntoViewIfNeeded();
    await expect(prompt).toBeVisible();
    await pause(5_000);
  });

  await mark('actions', async () => {
    await goto('/actions');
    await expect(page.getByRole('heading', { name: 'Actions', exact: true })).toBeVisible();
    const actionToggle = page.getByRole('checkbox', { name: 'Mark Draft a one-page interest survey. completed' });
    await expect(actionToggle).toBeVisible();
    await pause(3_000);
    await actionToggle.click();
    await expect(page.getByRole('checkbox', { name: 'Mark Draft a one-page interest survey. open' })).toBeChecked();
    await pause(5_000);
  });

  await mark('settings', async () => {
    await goto('/settings');
    const aboutHeading = page.getByRole('heading', { name: 'About' });
    await aboutHeading.scrollIntoViewIfNeeded();
    await expect(aboutHeading).toBeVisible();
    await expect(page.getByText(/^Transcription:/)).toBeVisible();
    await expect(page.getByText(/^Organization:/)).toBeVisible();
    await pause(5_000);
  });

  await mark('close', async () => {
    await goto('/');
    await expect(page.getByRole('heading', { name: "What's on your mind?" })).toBeVisible();
    await pause(6_000);
  });
} finally {
  await context.close();
  await video.saveAs(videoOutput);
  if (path.resolve(rawVideoPath) !== path.resolve(videoOutput)) {
    await rm(rawVideoPath, { force: true });
  }
  await browser.close();
}

const probe = JSON.parse(execFileSync(
  'ffprobe',
  ['-v', 'error', '-show_entries', 'format=duration', '-of', 'json', videoOutput],
  { encoding: 'utf8' },
));
const sourceDurationSeconds = Number(probe.format.duration);
const finalMarkerEnd = chapters.at(-1)?.endSeconds ?? sourceDurationSeconds;
const captureOffsetSeconds = Math.max(0, finalMarkerEnd - sourceDurationSeconds);
const normalizedChapters = chapters.map((chapter) => ({
  ...chapter,
  startSeconds: Number(Math.max(0, chapter.startSeconds - captureOffsetSeconds).toFixed(3)),
  endSeconds: Number(Math.max(0, chapter.endSeconds - captureOffsetSeconds).toFixed(3)),
}));

await writeFile(
  timelineOutput,
  `${JSON.stringify({
    source: baseUrl,
    viewport: { width: 430, height: 932 },
    sourceDurationSeconds,
    captureOffsetSeconds: Number(captureOffsetSeconds.toFixed(3)),
    chapters: normalizedChapters,
  }, null, 2)}\n`,
  'utf8',
);

log(`Saved browser capture: ${videoOutput}`);
log(`Saved chapter timeline: ${timelineOutput}`);
