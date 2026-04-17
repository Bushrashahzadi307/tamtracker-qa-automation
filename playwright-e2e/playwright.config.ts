import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.test' });

/**
 * TAMtracker Playwright Configuration
 * E2E tests for: tamtracker.io (User app) + agency.tamtracker.io (Agency app)
 * Run: npx playwright test
 * Docs: https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : 4,
  timeout: 30_000,
  expect: { timeout: 8_000 },

  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['list'],
    ...(process.env.CI ? [['github'] as any] : []),
  ],

  use: {
    baseURL: process.env.BASE_URL || 'https://tamtracker.io',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
    actionTimeout: 10_000,
  },

  projects: [
    // ── Setup: authenticate once and save session ──
    {
      name: 'setup-user',
      testMatch: /.*\.setup\.ts/,
    },

    // ── User App (tamtracker.io) ──
    {
      name: 'user-chrome',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: process.env.USER_APP_URL || 'https://tamtracker.io',
        storageState: 'fixtures/.auth/user.json',
      },
      dependencies: ['setup-user'],
      testIgnore: /agency\//,
    },
    {
      name: 'user-firefox',
      use: {
        ...devices['Desktop Firefox'],
        baseURL: process.env.USER_APP_URL || 'https://tamtracker.io',
        storageState: 'fixtures/.auth/user.json',
      },
      dependencies: ['setup-user'],
      testIgnore: /agency\//,
    },

    // ── Agency App (agency.tamtracker.io) ──
    {
      name: 'agency-chrome',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: process.env.AGENCY_APP_URL || 'https://agency.tamtracker.io',
        storageState: 'fixtures/.auth/agency.json',
      },
      dependencies: ['setup-user'],
      testMatch: /agency\//,
    },

    // ── API tests — no browser needed ──
    {
      name: 'api',
      testMatch: /api\//,
      use: { baseURL: process.env.API_BASE_URL || 'https://tamtracker.io' },
    },
  ],
});
