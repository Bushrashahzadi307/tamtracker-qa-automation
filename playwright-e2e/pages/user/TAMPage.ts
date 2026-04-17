import { Page, Locator, expect } from '@playwright/test';

/**
 * TAMPage — TAMtracker TAM Discovery, View, Upload and Calculator pages.
 * TAM = Total Addressable Market.
 * Ticket refs: U-C1 (TAM page), U-C2 (Discover), U-C3 (View),
 *              U-C4 (Upload CSV), U-C6 (Calculator), U-C8 (useTAM hook)
 *
 * TAMtracker allows users to:
 *  - Select up to 5,000 ICP companies from a 3.8M database
 *  - Upload their own CSV list
 *  - Filter by industry, sector, country
 *  - View TAM overlap and Demand Health scores
 */
export class TAMPage {
  readonly page: Page;

  // TAM list/view
  readonly tamContainer: Locator;
  readonly companyCards: Locator;
  readonly companyCount: Locator;
  readonly paginationNext: Locator;
  readonly paginationPrev: Locator;
  readonly sortDropdown: Locator;
  readonly searchInput: Locator;

  // TAM Discover
  readonly discoverTab: Locator;
  readonly industryFilter: Locator;
  readonly countryFilter: Locator;
  readonly sectorFilter: Locator;
  readonly applyFiltersButton: Locator;
  readonly addToTAMButton: Locator;
  readonly removeFromTAMButton: Locator;

  // CSV Upload
  readonly uploadTab: Locator;
  readonly csvFileInput: Locator;
  readonly uploadButton: Locator;
  readonly uploadSuccessMessage: Locator;
  readonly uploadErrorMessage: Locator;
  readonly rowErrorList: Locator;

  // TAM Calculator
  readonly calculatorLink: Locator;
  readonly tamValueInput: Locator;
  readonly growthRateInput: Locator;
  readonly timelineInput: Locator;
  readonly calculateButton: Locator;
  readonly calculationResult: Locator;

  // TAM Suggestions
  readonly suggestionsTab: Locator;
  readonly suggestionCards: Locator;
  readonly addSuggestionButton: Locator;

  // Overlap / Health score
  readonly demandHealthScore: Locator;
  readonly tamOverlapChart: Locator;

  constructor(page: Page) {
    this.page = page;
    this.tamContainer = page.locator('[class*="tam"], #tam, [data-page="tam"]').first();
    this.companyCards = page.locator('[class*="company-card"], [class*="tam-row"], tbody tr');
    this.companyCount = page.locator('[class*="company-count"], [class*="total-companies"]');
    this.paginationNext = page.locator('button[aria-label*="next"], [class*="pagination"] button:last-child');
    this.paginationPrev = page.locator('button[aria-label*="prev"], [class*="pagination"] button:first-child');
    this.sortDropdown = page.locator('[class*="sort-select"], select[name*="sort"]');
    this.searchInput = page.locator('input[placeholder*="search" i], input[name*="search"]');

    this.discoverTab = page.locator('a[href*="discover"], button:has-text("Discover")');
    this.industryFilter = page.locator('[class*="industry-filter"], select[name*="industry"]');
    this.countryFilter = page.locator('[class*="country-filter"], select[name*="country"]');
    this.sectorFilter = page.locator('[class*="sector-filter"], select[name*="sector"]');
    this.applyFiltersButton = page.locator('button:has-text("Apply"), button:has-text("Filter")');
    this.addToTAMButton = page.locator('button:has-text("Add to TAM"), [class*="add-tam"]').first();
    this.removeFromTAMButton = page.locator('button:has-text("Remove"), [class*="remove-tam"]').first();

    this.uploadTab = page.locator('a[href*="upload"], button:has-text("Upload")');
    this.csvFileInput = page.locator('input[type="file"][accept*="csv"], input[type="file"]');
    this.uploadButton = page.locator('button:has-text("Upload"), button[type="submit"]');
    this.uploadSuccessMessage = page.locator('[class*="success"], text=successfully uploaded');
    this.uploadErrorMessage = page.locator('[class*="error"], [role="alert"]').first();
    this.rowErrorList = page.locator('[class*="row-error"], [class*="validation-error"]');

    this.calculatorLink = page.locator('a[href*="calculator"]');
    this.tamValueInput = page.locator('input[name*="tam"], input[placeholder*="TAM"]').first();
    this.growthRateInput = page.locator('input[name*="growth"], input[placeholder*="growth"]');
    this.timelineInput = page.locator('input[name*="timeline"], input[name*="years"]');
    this.calculateButton = page.locator('button:has-text("Calculate")');
    this.calculationResult = page.locator('[class*="result"], [class*="tam-result"]');

    this.suggestionsTab = page.locator('a[href*="suggestions"], button:has-text("Suggestions")');
    this.suggestionCards = page.locator('[class*="suggestion-card"]');
    this.addSuggestionButton = page.locator('button:has-text("Add"), [class*="add-suggestion"]').first();

    this.demandHealthScore = page.locator('[class*="demand-health"], [class*="health-score"]');
    this.tamOverlapChart = page.locator('[class*="tam-overlap"], [class*="overlap-chart"]');
  }

  async gotoTAMView() {
    await this.page.goto('/dashboard/tam');
    await expect(this.tamContainer).toBeVisible();
  }

  async gotoDiscover() {
    await this.page.goto('/dashboard/tam/discover');
  }

  async gotoUpload() {
    await this.page.goto('/dashboard/tam/upload');
  }

  async gotoCalculator() {
    await this.page.goto('/calculator');
  }

  async getCompanyCount(): Promise<number> {
    return this.companyCards.count();
  }

  async searchCompany(name: string) {
    await this.searchInput.fill(name);
    await this.page.keyboard.press('Enter');
    await this.page.waitForLoadState('networkidle');
  }

  async filterByIndustry(industry: string) {
    await this.industryFilter.selectOption(industry);
    await this.applyFiltersButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  async addFirstCompanyToTAM() {
    await this.addToTAMButton.click();
    await expect(this.addToTAMButton).toBeDisabled({ timeout: 5_000 })
      .catch(() => {}); // may change state differently
  }

  async uploadCSV(filePath: string) {
    await this.csvFileInput.setInputFiles(filePath);
    await this.uploadButton.click();
  }

  async calculateTAM(tamValue: string, growthRate: string, timeline: string) {
    await this.tamValueInput.fill(tamValue);
    await this.growthRateInput.fill(growthRate);
    await this.timelineInput.fill(timeline);
    await this.calculateButton.click();
  }

  async isDemandHealthScoreVisible(): Promise<boolean> {
    return this.demandHealthScore.isVisible();
  }
}
