import { Page, Locator, expect } from '@playwright/test';

/**
 * DashboardPage — TAMtracker main dashboard.
 * Shows: Audience, Shortlist, Signals, Industry Insights, Live Pulse, Usage Overview.
 * Ticket refs: U-D1 to U-D10
 */
export class DashboardPage {
  readonly page: Page;
  readonly dashboardContainer: Locator;
  readonly audienceSection: Locator;
  readonly shortlistSection: Locator;
  readonly signalsList: Locator;
  readonly industryInsights: Locator;
  readonly livePulse: Locator;
  readonly usageOverview: Locator;
  readonly syncStatusStrip: Locator;
  readonly demandHealthScore: Locator;
  readonly navigationMenu: Locator;

  constructor(page: Page) {
    this.page = page;
    this.dashboardContainer = page.locator('[class*="dashboard"], #dashboard').first();
    this.audienceSection = page.locator('[class*="audience"], a[href*="audience"]').first();
    this.shortlistSection = page.locator('[class*="shortlist"], a[href*="shortlist"]').first();
    this.signalsList = page.locator('[class*="signal"], [class*="signals-list"]').first();
    this.industryInsights = page.locator('[class*="industry-insight"], [class*="insights"]').first();
    this.livePulse = page.locator('[class*="live-pulse"], [class*="pulse"]').first();
    this.usageOverview = page.locator('[class*="usage-overview"], [class*="usage"]').first();
    this.syncStatusStrip = page.locator('[class*="sync-status"], [class*="sync-strip"]').first();
    this.demandHealthScore = page.locator('[class*="demand-health"], [class*="health-score"]').first();
    this.navigationMenu = page.locator('nav, [class*="sidebar"], [class*="nav-menu"]').first();
  }

  async goto() {
    await this.page.goto('/dashboard');
    await expect(this.dashboardContainer).toBeVisible({ timeout: 10_000 });
  }

  async gotoAudience() {
    await this.page.goto('/dashboard/audience');
  }

  async gotoShortlist() {
    await this.page.goto('/dashboard/shortlist');
  }

  async gotoSignals() {
    await this.page.goto('/dashboard/signals');
  }

  async gotoIndustryInsights() {
    await this.page.goto('/dashboard/insights');
  }

  async isDashboardLoaded(): Promise<boolean> {
    return this.dashboardContainer.isVisible();
  }

  async getDemandHealthScoreText(): Promise<string> {
    await expect(this.demandHealthScore).toBeVisible({ timeout: 10_000 });
    return (await this.demandHealthScore.textContent()) ?? '';
  }
}


/**
 * IntegrationsPage — TAMtracker Integrations.
 * Supported integrations: LinkedIn Ads, HubSpot, Google Ads,
 *   ActiveCampaign, Zoho CRM, MailerLite, Leadinfo, Clay, Intercom.
 * Ticket refs: U-F1 (Integrations page), U-F2 (useIntegration hook),
 *              U-F3 (Leadinfo/HubSpot), U-F4 (Webhooks), U-F5 (OrgSync)
 */
export class IntegrationsPage {
  readonly page: Page;
  readonly integrationsContainer: Locator;
  readonly hubspotCard: Locator;
  readonly linkedinCard: Locator;
  readonly googleAdsCard: Locator;
  readonly activecampaignCard: Locator;
  readonly zohoCard: Locator;
  readonly mailerliteCard: Locator;
  readonly leadinfoCard: Locator;
  readonly connectButton: Locator;
  readonly disconnectButton: Locator;
  readonly connectedBadge: Locator;
  readonly webhookSection: Locator;
  readonly webhookUrlInput: Locator;
  readonly saveWebhookButton: Locator;
  readonly syncStatusIndicator: Locator;

  constructor(page: Page) {
    this.page = page;
    this.integrationsContainer = page.locator('[class*="integrations"], #integrations').first();
    this.hubspotCard = page.locator('[class*="hubspot"], [data-integration="hubspot"]').first();
    this.linkedinCard = page.locator('[class*="linkedin"], [data-integration="linkedin"]').first();
    this.googleAdsCard = page.locator('[class*="google-ads"], [data-integration="google-ads"]').first();
    this.activecampaignCard = page.locator('[class*="activecampaign"]').first();
    this.zohoCard = page.locator('[class*="zoho"]').first();
    this.mailerliteCard = page.locator('[class*="mailerlite"]').first();
    this.leadinfoCard = page.locator('[class*="leadinfo"]').first();
    this.connectButton = page.locator('button:has-text("Connect")').first();
    this.disconnectButton = page.locator('button:has-text("Disconnect")').first();
    this.connectedBadge = page.locator('[class*="connected"], text=Connected').first();
    this.webhookSection = page.locator('[class*="webhook"]').first();
    this.webhookUrlInput = page.locator('input[name*="webhook"], input[placeholder*="webhook"]');
    this.saveWebhookButton = page.locator('button:has-text("Save")').first();
    this.syncStatusIndicator = page.locator('[class*="sync-status"]').first();
  }

  async goto() {
    await this.page.goto('/dashboard/integrations');
    await expect(this.integrationsContainer).toBeVisible();
  }

  async isIntegrationConnected(name: string): Promise<boolean> {
    const card = this.page.locator(`[class*="${name.toLowerCase()}"]`);
    return card.locator('[class*="connected"], text=Connected').isVisible();
  }

  async saveWebhookUrl(url: string) {
    await this.webhookUrlInput.fill(url);
    await this.saveWebhookButton.click();
  }
}
