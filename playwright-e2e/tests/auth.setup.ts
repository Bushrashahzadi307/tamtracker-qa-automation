import { test as setup, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const USER_AUTH_FILE  = 'fixtures/.auth/user.json';
const AGENCY_AUTH_FILE = 'fixtures/.auth/agency.json';

/**
 * auth.setup.ts — runs once before all tests.
 * Logs into both User and Agency apps and saves session cookies/storage.
 * All test files then reuse the saved auth state — no repeated logins.
 */

setup('authenticate: user app', async ({ page }) => {
  fs.mkdirSync(path.dirname(USER_AUTH_FILE), { recursive: true });

  await page.goto(process.env.USER_APP_URL || 'https://tamtracker.io');

  // TAMtracker login: email → password (two-step or single form)
  await page.locator('input[type="email"], input[name="email"]')
    .fill(process.env.QA_USER_EMAIL!);

  await page.locator('input[type="password"], input[name="password"]')
    .fill(process.env.QA_USER_PASSWORD!);

  await page.locator('button[type="submit"]').click();

  // Wait for dashboard to confirm login succeeded
  await expect(page).toHaveURL(/dashboard|home|tam/, { timeout: 15_000 });

  // Save auth state — reused by all user app tests
  await page.context().storageState({ path: USER_AUTH_FILE });
});

setup('authenticate: agency app', async ({ page }) => {
  fs.mkdirSync(path.dirname(AGENCY_AUTH_FILE), { recursive: true });

  await page.goto(process.env.AGENCY_APP_URL || 'https://agency.tamtracker.io');

  await page.locator('input[type="email"], input[name="email"]')
    .fill(process.env.QA_AGENCY_EMAIL!);

  await page.locator('input[type="password"], input[name="password"]')
    .fill(process.env.QA_AGENCY_PASSWORD!);

  await page.locator('button[type="submit"]').click();

  await expect(page).toHaveURL(/dashboard|overview|home/, { timeout: 15_000 });

  await page.context().storageState({ path: AGENCY_AUTH_FILE });
});
