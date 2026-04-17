import { Page, Locator, expect } from '@playwright/test';

/**
 * LoginPage — TAMtracker User App login page.
 * TAMtracker uses a standard email + password form.
 * Google OAuth is also available.
 * Ticket refs: U-A1 (login flow), U-A5 (Google OAuth)
 */
export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;
  readonly googleOAuthButton: Locator;
  readonly forgotPasswordLink: Locator;
  readonly signupLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.locator('input[type="email"], input[name="email"]');
    this.passwordInput = page.locator('input[type="password"], input[name="password"]');
    this.submitButton = page.locator('button[type="submit"]');
    this.errorMessage = page.locator('[class*="error"], [role="alert"], .alert-danger').first();
    this.googleOAuthButton = page.locator('button:has-text("Google"), a:has-text("Google")');
    this.forgotPasswordLink = page.locator('a[href*="forgot"], text=Forgot password');
    this.signupLink = page.locator('a[href*="signup"], text=Sign up');
  }

  async goto() {
    await this.page.goto('/login');
    await expect(this.emailInput).toBeVisible();
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async loginAndWaitForDashboard(email: string, password: string) {
    await this.login(email, password);
    await expect(this.page).toHaveURL(/dashboard|home|tam/, { timeout: 15_000 });
  }

  async getErrorText(): Promise<string> {
    await expect(this.errorMessage).toBeVisible({ timeout: 5_000 });
    return (await this.errorMessage.textContent()) ?? '';
  }

  async isErrorVisible(): Promise<boolean> {
    return this.errorMessage.isVisible();
  }

  async clickForgotPassword() {
    await this.forgotPasswordLink.click();
  }

  async clickSignup() {
    await this.signupLink.click();
  }

  async clickGoogleOAuth() {
    await this.googleOAuthButton.click();
  }
}
