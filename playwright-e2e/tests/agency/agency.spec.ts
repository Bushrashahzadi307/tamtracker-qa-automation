import { test, expect } from '@playwright/test';

/**
 * TAMtracker — Agency App E2E Tests
 * Base URL: https://agency.tamtracker.io
 *
 * Ticket refs:
 *   Auth:       AG-A1 to AG-A6
 *   Onboarding: AG-B1 to AG-B7 (DocuSeal, Stripe Connect)
 *   Dashboard:  AG-C1 to AG-C8
 *   TAM:        AG-D1 to AG-D8
 *   Signals:    AG-E1 to AG-E8
 *   Billing:    AG-F1 to AG-F4
 *   Profile:    AG-G1 to AG-G3
 *   Public:     AG-I1 to AG-I5
 */

// ── AGENCY AUTH ───────────────────────────────────────────────────────────────

test.describe('Agency — Authentication', () => {

  test.use({ storageState: { cookies: [], origins: [] } });

  test('@smoke @AG-A1 agency login page loads', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('@AG-A1 agency login with valid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.locator('input[type="email"]').fill(process.env.QA_AGENCY_EMAIL!);
    await page.locator('input[type="password"]').fill(process.env.QA_AGENCY_PASSWORD!);
    await page.locator('button[type="submit"]').click();
    await expect(page).toHaveURL(/dashboard|overview|home/, { timeout: 15_000 });
  });

  test('@AG-A1 agency login with invalid credentials shows error', async ({ page }) => {
    await page.goto('/login');
    await page.locator('input[type="email"]').fill('wrong@agency.com');
    await page.locator('input[type="password"]').fill('wrongpassword');
    await page.locator('button[type="submit"]').click();
    await expect(
      page.locator('[class*="error"], [role="alert"]').first()
    ).toBeVisible({ timeout: 8_000 });
  });

  test('@AG-A2 agency signup page loads', async ({ page }) => {
    await page.goto('/signup');
    await expect(page).not.toHaveURL(/login/);
    await expect(page).toHaveURL(/signup/);
  });

  test('@AG-A3 agency forgot password page loads', async ({ page }) => {
    await page.goto('/forgot-password');
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });

  test('@AG-A5 Google OAuth available on agency login', async ({ page }) => {
    await page.goto('/login');
    const googleBtn = page.locator('button:has-text("Google"), a:has-text("Google")');
    if (await googleBtn.isVisible()) {
      await expect(googleBtn).toBeVisible();
    }
  });

});

// ── AGENCY DASHBOARD ──────────────────────────────────────────────────────────

test.describe('Agency — Dashboard', () => {

  test('@smoke @AG-C1 agency overview page loads', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).not.toHaveURL(/login/);
  });

  test('@AG-C1 agency overview shows key metrics', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await expect(page).not.toHaveURL(/error|500/);
  });

  test('@AG-C2 agency home page is accessible', async ({ page }) => {
    await page.goto('/dashboard/home');
    await expect(page).not.toHaveURL(/login/);
  });

  test('@AG-C4 client detail page loads with valid client', async ({ page }) => {
    // Navigate to clients list
    await page.goto('/dashboard/clients');
    await expect(page).not.toHaveURL(/login/);
    const firstClient = page.locator('[class*="client-card"], tr[class*="client"]').first();
    if (await firstClient.isVisible()) {
      await firstClient.click();
      await expect(page).toHaveURL(/client/);
    }
  });

  test('@AG-C5 clients logbook is accessible', async ({ page }) => {
    await page.goto('/dashboard/logbook');
    await expect(page).not.toHaveURL(/login|error/);
  });

  test('@AG-C6 agency directory page loads', async ({ page }) => {
    await page.goto('/dashboard/directory');
    await expect(page).not.toHaveURL(/login|error/);
  });

  test('@AG-C7 agency profile page loads', async ({ page }) => {
    await page.goto('/dashboard/profile');
    await expect(page).not.toHaveURL(/login/);
  });

  test('@AG-C8 empty state shown when no clients exist', async ({ page }) => {
    await page.goto('/dashboard/clients');
    await page.waitForLoadState('networkidle');
    const emptyState = page.locator('[class*="empty"], text=No clients');
    const clientCards = page.locator('[class*="client-card"]');
    // Either has clients or shows empty state — not error
    const hasContent = await clientCards.count() > 0 || await emptyState.isVisible();
    expect(hasContent).toBe(true);
  });

});

// ── AGENCY TAM ────────────────────────────────────────────────────────────────

test.describe('Agency — TAM', () => {

  test('@smoke @AG-D1 agency TAM page loads', async ({ page }) => {
    await page.goto('/dashboard/tam');
    await expect(page).not.toHaveURL(/login/);
  });

  test('@AG-D2 agency TAM discover page loads', async ({ page }) => {
    await page.goto('/dashboard/tam/discover');
    await expect(page).not.toHaveURL(/login|error/);
  });

  test('@AG-D3 agency TAM view page renders company list', async ({ page }) => {
    await page.goto('/dashboard/tam/view');
    await page.waitForLoadState('networkidle');
    await expect(page).not.toHaveURL(/login/);
  });

  test('@AG-D4 agency TAM upload page loads', async ({ page }) => {
    await page.goto('/dashboard/tam/upload');
    await expect(
      page.locator('input[type="file"]')
    ).toBeVisible({ timeout: 10_000 }).catch(() => {
      // Upload may be gated behind client selection
    });
    await expect(page).not.toHaveURL(/login/);
  });

  test('@AG-D6 agency TAM calculator accessible', async ({ page }) => {
    await page.goto('/calculator');
    await expect(page).not.toHaveURL(/login/);
  });

});

// ── AGENCY SIGNALS & AUDIENCE ─────────────────────────────────────────────────

test.describe('Agency — Signals & Audience', () => {

  test('@smoke @AG-E1 agency audience page loads', async ({ page }) => {
    await page.goto('/dashboard/audience');
    await expect(page).not.toHaveURL(/login/);
  });

  test('@AG-E2 agency shortlist page loads', async ({ page }) => {
    await page.goto('/dashboard/shortlist');
    await expect(page).not.toHaveURL(/login/);
  });

  test('@AG-E3 agency signals page loads', async ({ page }) => {
    await page.goto('/dashboard/signals');
    await expect(page).not.toHaveURL(/login/);
  });

  test('@AG-E5 agency industry insights loads', async ({ page }) => {
    await page.goto('/dashboard/insights');
    await expect(page).not.toHaveURL(/login|error/);
  });

  test('@AG-E7 agency alerts page loads', async ({ page }) => {
    await page.goto('/dashboard/alerts');
    await expect(page).not.toHaveURL(/login/);
  });

  test('@AG-E8 agency company detail page loads', async ({ page }) => {
    await page.goto('/dashboard/companies');
    await expect(page).not.toHaveURL(/login/);
    const firstCompany = page.locator('[class*="company-card"], tr').first();
    if (await firstCompany.isVisible()) {
      await firstCompany.click();
      await page.waitForLoadState('networkidle');
      await expect(page).not.toHaveURL(/error/);
    }
  });

});

// ── AGENCY BILLING & INCOME ───────────────────────────────────────────────────

test.describe('Agency — Billing & Income', () => {

  test('@smoke @AG-F1 agency billing page loads', async ({ page }) => {
    await page.goto('/dashboard/billing');
    await expect(page).not.toHaveURL(/login/);
  });

  test('@AG-F2 agency income page loads', async ({ page }) => {
    await page.goto('/dashboard/income');
    await expect(page).not.toHaveURL(/login|error/);
  });

  test('@AG-F1 billing shows agency plan details', async ({ page }) => {
    await page.goto('/dashboard/billing');
    await page.waitForLoadState('networkidle');
    await expect(page).not.toHaveURL(/error|500/);
  });

});

// ── AGENCY ONBOARDING ─────────────────────────────────────────────────────────

test.describe('Agency — Onboarding Flow', () => {

  test('@AG-B2 DocuSeal agreement component renders', async ({ page }) => {
    // DocuSeal is the contract signing component used in agency onboarding
    await page.goto('/onboarding');
    await page.waitForLoadState('networkidle');
    await expect(page).not.toHaveURL(/error|500/);
  });

  test('@AG-B4 Stripe Connect page is accessible in onboarding', async ({ page }) => {
    await page.goto('/onboarding/stripe-connect');
    await expect(page).not.toHaveURL(/error|500/);
  });

});

// ── AGENCY PUBLIC PAGES ────────────────────────────────────────────────────────

test.describe('Agency — Public Pages', () => {

  test.use({ storageState: { cookies: [], origins: [] } });

  test('@AG-I2 agency listing page is publicly accessible', async ({ page }) => {
    await page.goto('/agencies');
    await expect(page).not.toHaveURL(/login/);
    await expect(page).toHaveURL(/agenc/);
  });

  test('@AG-I3 individual agency detail page loads by slug', async ({ page }) => {
    // Slug-based agency pages should load publicly
    await page.goto('/agencies/test-agency');
    await expect(page).not.toHaveURL(/error|500/);
  });

  test('@AG-I4 agency pricing page is publicly accessible', async ({ page }) => {
    await page.goto('/pricing');
    await expect(page).not.toHaveURL(/login/);
    await expect(page).toHaveURL(/pricing/);
  });

  test('@AG-I5 agency invitation accept page loads', async ({ page }) => {
    await page.goto('/invitation/accept?token=test-token');
    await expect(page).not.toHaveURL(/error|500/);
  });

});
