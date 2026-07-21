import path from 'node:path';
import { defineConfig, devices } from '@playwright/test';

const tone = path.resolve('e2e/fixtures/tone.wav');
const port = Number(process.env.E2E_PORT ?? '3000');
const deployedBaseURL = process.env.E2E_BASE_URL?.trim();
const baseURL = deployedBaseURL || `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    permissions: ['microphone'],
    ...devices['Desktop Chrome'],
    launchOptions: {
      args: [
        '--use-fake-ui-for-media-stream',
        '--use-fake-device-for-media-stream',
        `--use-file-for-fake-audio-capture=${tone}`,
      ],
    },
  },
  webServer: deployedBaseURL ? undefined : {
    command: `npm run build && npx next start --hostname 127.0.0.1 --port ${port}`,
    url: baseURL,
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
