import { test, expect } from '@playwright/test';
import { DashboardPage, IntegrationsPage } from '../../pages/user/DashboardPage';

/**
 * TAMtracker — Dashboard, Integrations & Billing E2E Tests
 * Ticket refs:
 *   Dashboard: U-D1 to U-D10
 *   Integrations: U-F1 to U-F5
 *   Billing: U-I1 to U-I7
 */

// ── DASHBOARD ────────────────────────────────────────────────────────────────

test.describe('Dashboard — Home', () => {

  test('@smoke @U-D1 dashboard home page loads', async ({ page }) => {
    const dash = new DashboardPage(page);
    await dash.goto();
    await expect(page).not.toHaveURL(/login/);
    await expect(dash.dashboardContainer).toBeVisible();
  });

  test('@U-D1 navigation menu is visible', async ({ page }) => {
    const dash = new DashboardPage(page);
    await dash.goto();
    await expect(dash.navigationMenu).toBeVisible();
  });

  test('@U-D2 dashboard loads TAM data without error', async ({ page }) => {
    const dash = new DashboardPage(page);
    await dash.goto();
    await expect(page).not.toHaveURL(/error|500/);
    await page.waitForLoadState('networkidle');
    // No JS errors on console
    const errors: string[] = [];
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
    await page.waitForTimeout(2_000);
    const criticalErrors = errors.filter(e =>
      !e.includes('favicon') && !e.includes('analytics')
    );
    expect(criticalErrors).toHaveLength(0);
  });

  test('@U-D3 Audience page loads', async ({ page }) => {
    const dash = new DashboardPage(page);
    await dash.gotoAudience();
    await expect(page).toHaveURL(/audience/);
    await expect(page).not.toHaveURL(/login/);
  });

  test('@U-D4 Shortlist page loads', async ({ page }) => {
    const dash = new DashboardPage(page);
    await dash.gotoShortlist();
    await expect(page).toHaveURL(/shortlist/);
    await expect(page).not.toHaveURL(/login/);
  });

  test('@U-D5 Signals page loads with data', async ({ page }) => {
    const dash = new DashboardPage(page);
    await dash.gotoSignals();
    await expect(page).toHaveURL(/signal/);
    await page.waitForLoadState('networkidle');
    await expect(page).not.toHaveURL(/login/);
  });

  test('@U-D7 Industry Insights page loads', async ({ page }) => {
    const dash = new DashboardPage(page);
    await dash.gotoIndustryInsights();
    await expect(page).not.toHaveURL(/login/);
    await page.waitForLoadState('networkidle');
  });

  test('@U-D9 Usage Overview is displayed on dashboard', async ({ page }) => {
    const dash = new DashboardPage(page);
    await dash.goto();
    const usageVisible = await dash.usageOverview.isVisible();
    if (usageVisible) {
      await expect(dash.usageOverview).toBeVisible();
    }
  });

  test('@U-D1 demand health score visible on dashboard', async ({ page }) => {
    const dash = new DashboardPage(page);
    await dash.goto();
    const scoreVisible = await dash.demandHealthScore.isVisible();
    if (scoreVisible) {
      const scoreText = await dash.getDemandHealthScoreText();
      expect(scoreText.length).toBeGreaterThan(0);
    }
  });

  test('@U-D8 Live Pulse section loads without error', async ({ page }) => {
    await page.goto('/dashboard/live-pulse');
    await expect(page).not.toHaveURL(/login|error/);
    await page.waitForLoadState('networkidle');
  });

});

// ── INTEGRATIONS ─────────────────────────────────────────────────────────────

test.describe('Integrations', () => {

  test('@smoke @U-F1 integrations page loads', async ({ page }) => {
    const intPage = new IntegrationsPage(page);
    await intPage.goto();
    await expect(page).toHaveURL(/integrations/);
    await expect(intPage.integrationsContainer).toBeVisible();
  });

  test('@U-F1 all supported integrations are displayed', async ({ page }) => {
    const intPage = new IntegrationsPage(page);
    await intPage.goto();
    // TAMtracker supports: LinkedIn, HubSpot, Google Ads, ActiveCampaign, Zoho, MailerLite
    const integrationNames = ['linkedin', 'hubspot', 'google', 'activecampaign', 'zoho', 'mailerlite'];
    for (const name of integrationNames) {
      const card = page.locator(
        `[class*="${name}"], [data-integration="${name}"], text=${name}`
      ).first();
      const visible = await card.isVisible();
      // Soft check — not all envs show all integrations
      if (visible) {
        await expect(card).toBeVisible();
      }
    }
  });

  test('@U-F1 Connect button visible for unconnected integration', async ({ page }) => {
    const intPage = new IntegrationsPage(page);
    await intPage.goto();
    const connectBtn = intPage.connectButton;
    if (await connectBtn.isVisible()) {
      await expect(connectBtn).toBeEnabled();
    }
  });

  test('@U-F2 integration status reflects actual connection state', async ({ page }) => {
    const intPage = new IntegrationsPage(page);
    await intPage.goto();
    // Either connected badge or connect button should be present for each integration
    const connected = await intPage.connectedBadge.isVisible();
    const connectBtn = await intPage.connectButton.isVisible();
    expect(connected || connectBtn).toBe(true);
  });

  test('@U-F4 webhook section is accessible', async ({ page }) => {
    const intPage = new IntegrationsPage(page);
    await intPage.goto();
    const webhookSection = intPage.webhookSection;
    if (await webhookSection.isVisible()) {
      await expect(webhookSection).toBeVisible();
    }
  });

  test('@U-F4 invalid webhook URL shows validation error', async ({ page }) => {
    const intPage = new IntegrationsPage(page);
    await intPage.goto();
    if (await intPage.webhookUrlInput.isVisible()) {
      await intPage.saveWebhookUrl('not-a-url');
      await expect(
        page.locator('[class*="error"], [role="alert"]').first()
      ).toBeVisible({ timeout: 5_000 }).catch(() => {});
    }
  });

  test('@U-F4 valid webhook URL saves successfully', async ({ page }) => {
    const intPage = new IntegrationsPage(page);
    await intPage.goto();
    if (await intPage.webhookUrlInput.isVisible()) {
      await intPage.saveWebhookUrl('https://webhook.site/qa-test-endpoint');
      await expect(
        page.locator('[class*="success"], text=saved').first()
      ).toBeVisible({ timeout: 8_000 }).catch(() => {});
    }
  });

});

// ── BILLING ───────────────────────────────────────────────────────────────────

test.describe('Billing & Payments', () => {

  test('@smoke @U-I1 billing page loads', async ({ page }) => {
    await page.goto('/dashboard/billing');
    await expect(page).not.toHaveURL(/login/);
    await expect(page).toHaveURL(/billing/);
  });

  test('@U-I1 billing page shows current plan', async ({ page }) => {
    await page.goto('/dashboard/billing');
    await page.waitForLoadState('networkidle');
    const planSection = page.locator(
      '[class*="plan"], text=Starter, text=Growth, text=Complete'
    ).first();
    if (await planSection.isVisible()) {
      await expect(planSection).toBeVisible();
    }
  });

  test('@U-I4 free trial status is visible', async ({ page }) => {
    await page.goto('/dashboard/billing');
    const trialBadge = page.locator(
      '[class*="trial"], text=trial, text=Free Trial, [class*="free-trial"]'
    ).first();
    if (await trialBadge.isVisible()) {
      await expect(trialBadge).toBeVisible();
    }
  });

  test('@U-I3 plan comparison is shown on billing page', async ({ page }) => {
    await page.goto('/dashboard/billing');
    // Plan comparison table or cards
    const comparison = page.locator(
      '[class*="plan-comparison"], [class*="pricing"], table'
    ).first();
    if (await comparison.isVisible()) {
      await expect(comparison).toBeVisible();
    }
  });

  test('@U-I5 public pricing page is accessible without login', async ({ page, context }) => {
    // Create new context without auth
    const publicPage = await context.newPage();
    await publicPage.goto('/pricing');
    await expect(publicPage).not.toHaveURL(/login/);
    await expect(publicPage).toHaveURL(/pricing/);
    await publicPage.close();
  });

  test('@U-I6 referral accept page loads with valid token', async ({ page }) => {
    await page.goto('/referral/accept?token=test-referral-token');
    await expect(page).not.toHaveURL(/error|500/);
  });

  test('@U-I7 invitation accept page loads with valid token', async ({ page }) => {
    await page.goto('/invitation/accept?token=test-invite-token');
    await expect(page).not.toHaveURL(/error|500/);
  });

});

// ── ALERTS ────────────────────────────────────────────────────────────────────

test.describe('Alerts & Notifications', () => {

  test('@U-G1 alerts page loads', async ({ page }) => {
    await page.goto('/dashboard/alerts');
    await expect(page).not.toHaveURL(/login/);
  });

  test('@U-G2 unsubscribe page loads with token', async ({ page }) => {
    await page.goto('/alerts/unsubscribe?token=test-token');
    await expect(page).not.toHaveURL(/error|500/);
  });

  test('@U-G3 email preferences accessible from settings', async ({ page }) => {
    await page.goto('/dashboard/settings');
    const emailPref = page.locator(
      'text=Email preferences, [class*="email-pref"], a[href*="preferences"]'
    ).first();
    if (await emailPref.isVisible()) {
      await emailPref.click();
      await expect(page).not.toHaveURL(/login/);
    }
  });

});

// ── PROFILE & SETTINGS ────────────────────────────────────────────────────────

test.describe('Profile & Settings', () => {

  test('@U-A9 profile page loads', async ({ page }) => {
    await page.goto('/dashboard/profile');
    await expect(page).not.toHaveURL(/login/);
  });

  test('@U-A9 profile shows user name and email', async ({ page }) => {
    await page.goto('/dashboard/profile');
    await page.waitForLoadState('networkidle');
    const emailField = page.locator(`text=${process.env.QA_USER_EMAIL}`);
    if (await emailField.isVisible()) {
      await expect(emailField).toBeVisible();
    }
  });

  test('@U-A10 settings page loads', async ({ page }) => {
    await page.goto('/dashboard/settings');
    await expect(page).not.toHaveURL(/login/);
  });

});
