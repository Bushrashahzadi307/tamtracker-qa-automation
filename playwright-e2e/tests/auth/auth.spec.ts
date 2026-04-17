import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/user/LoginPage';

/**
 * TAMtracker Auth E2E Tests
 * Ticket refs: U-A1 (Login), U-A2 (Signup), U-A3 (Forgot password),
 *              U-A4 (Reset password), U-A5 (Google OAuth)
 * These tests run WITHOUT saved auth state (no storageState dependency).
 */

test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Authentication — Login', () => {

  test('@smoke @U-A1 valid login navigates to dashboard', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginAndWaitForDashboard(
      process.env.QA_USER_EMAIL!,
      process.env.QA_USER_PASSWORD!
    );
    await expect(page).toHaveURL(/dashboard|home|tam/);
    await expect(page).not.toHaveURL(/login/);
  });

  test('@U-A1 invalid email shows error message', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('notanemail', 'anypassword');
    const error = await loginPage.getErrorText();
    expect(error.length).toBeGreaterThan(0);
    await expect(page).toHaveURL(/login/);
  });

  test('@U-A1 wrong password shows error message', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(process.env.QA_USER_EMAIL!, 'WrongPassword999!');
    expect(await loginPage.isErrorVisible()).toBe(true);
    await expect(page).toHaveURL(/login/);
  });

  test('@U-A1 unregistered email shows error', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('nobody@notregistered.com', 'Password123!');
    expect(await loginPage.isErrorVisible()).toBe(true);
  });

  test('@U-A1 empty form submission shows validation', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.submitButton.click();
    // HTML5 validation or custom error
    const emailValidity = await loginPage.emailInput.evaluate(
      (el: HTMLInputElement) => el.validity.valid
    );
    expect(emailValidity).toBe(false);
  });

  test('@U-A1 network error handled gracefully', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    // Simulate network failure on login API call
    await page.route('**/api/login', route => route.abort());
    await loginPage.login(process.env.QA_USER_EMAIL!, process.env.QA_USER_PASSWORD!);
    // Should show error, not crash
    await expect(page.locator('[class*="error"], [role="alert"]').first())
      .toBeVisible({ timeout: 8_000 });
  });

  test('@U-A1 redirect parameter respected after login', async ({ page }) => {
    // Navigate to a protected page — should redirect to login then back
    await page.goto('/dashboard/tam');
    await expect(page).toHaveURL(/login/);
    const loginPage = new LoginPage(page);
    await loginPage.loginAndWaitForDashboard(
      process.env.QA_USER_EMAIL!,
      process.env.QA_USER_PASSWORD!
    );
    // Should land on TAM page after login redirect
    await expect(page).toHaveURL(/dashboard|tam/);
  });

});

test.describe('Authentication — Signup', () => {

  test('@U-A2 signup page loads with required fields', async ({ page }) => {
    await page.goto('/signup');
    await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"], input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('@U-A2 invalid email format rejected on signup', async ({ page }) => {
    await page.goto('/signup');
    await page.locator('input[type="email"]').fill('notvalid');
    await page.locator('button[type="submit"]').click();
    const emailInvalid = await page.locator('input[type="email"]').evaluate(
      (el: HTMLInputElement) => !el.validity.valid
    );
    expect(emailInvalid).toBe(true);
  });

  test('@U-A2 duplicate account email shows error', async ({ page }) => {
    await page.goto('/signup');
    await page.locator('input[type="email"]').fill(process.env.QA_USER_EMAIL!);
    await page.locator('input[type="password"]').fill('NewPassword123!');
    await page.locator('button[type="submit"]').click();
    await expect(page.locator('[class*="error"], [role="alert"]').first())
      .toBeVisible({ timeout: 8_000 });
  });

  test('@U-A2 weak password rejected on signup', async ({ page }) => {
    await page.goto('/signup');
    await page.locator('input[type="email"]').fill('newuser@example.com');
    await page.locator('input[type="password"]').fill('123');
    await page.locator('button[type="submit"]').click();
    await expect(page.locator('[class*="error"], [class*="password-strength"]').first())
      .toBeVisible({ timeout: 5_000 });
  });

});

test.describe('Authentication — Forgot & Reset Password', () => {

  test('@U-A3 forgot password link is visible on login page', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await expect(loginPage.forgotPasswordLink).toBeVisible();
  });

  test('@U-A3 forgot password page loads correctly', async ({ page }) => {
    await page.goto('/forgot-password');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('@U-A3 valid email on forgot password shows success state', async ({ page }) => {
    await page.goto('/forgot-password');
    await page.locator('input[type="email"]').fill(process.env.QA_USER_EMAIL!);
    await page.locator('button[type="submit"]').click();
    await expect(
      page.locator('[class*="success"], text=email, text=sent').first()
    ).toBeVisible({ timeout: 8_000 });
  });

  test('@U-A3 invalid email format on forgot password shows error', async ({ page }) => {
    await page.goto('/forgot-password');
    await page.locator('input[type="email"]').fill('notvalid');
    await page.locator('button[type="submit"]').click();
    const emailInvalid = await page.locator('input[type="email"]').evaluate(
      (el: HTMLInputElement) => !el.validity.valid
    );
    expect(emailInvalid).toBe(true);
  });

  test('@U-A4 reset password page validates token', async ({ page }) => {
    // Expired/invalid token should show error
    await page.goto('/reset-password?token=invalid-token-12345');
    await expect(
      page.locator('[class*="error"], text=expired, text=invalid').first()
    ).toBeVisible({ timeout: 8_000 });
  });

  test('@U-A4 reset password weak password rejected', async ({ page }) => {
    await page.goto('/reset-password?token=test-token');
    const passwordInput = page.locator('input[type="password"]').first();
    if (await passwordInput.isVisible()) {
      await passwordInput.fill('123');
      await page.locator('button[type="submit"]').click();
      await expect(page.locator('[class*="error"], [class*="strength"]').first())
        .toBeVisible({ timeout: 5_000 });
    }
  });

});

test.describe('Authentication — Google OAuth', () => {

  test('@U-A5 Google OAuth button is visible on login page', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await expect(loginPage.googleOAuthButton).toBeVisible();
  });

  test('@U-A5 Google OAuth button click initiates OAuth flow', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    // Clicking Google OAuth should redirect to Google or OAuth endpoint
    const [popup] = await Promise.all([
      page.waitForEvent('popup').catch(() => null),
      loginPage.googleOAuthButton.click(),
    ]);
    // Either popup opens or page navigates
    const currentUrl = page.url();
    expect(
      popup !== null || currentUrl.includes('google') || currentUrl.includes('oauth')
    ).toBe(true);
  });

});

test.describe('Authentication — Logout', () => {

  test('@smoke logout clears session and redirects to login', async ({ page }) => {
    // Login first
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginAndWaitForDashboard(
      process.env.QA_USER_EMAIL!,
      process.env.QA_USER_PASSWORD!
    );
    // Logout
    await page.goto('/logout');
    await expect(page).toHaveURL(/login|\/$/);
    // Try to access protected page — should redirect to login
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/login/);
  });

});
