import { Page, expect } from '@playwright/test';

/**
 * Test Utilities — shared helpers for TAMtracker E2E tests
 */

/**
 * Wait for network calls to settle after an action.
 * Useful after form submissions, filter changes, and API-heavy interactions.
 */
export async function waitForNetworkSettle(page: Page, timeout = 5_000) {
  await page.waitForLoadState('networkidle', { timeout }).catch(() => {});
}

/**
 * Dismiss any toast notification or alert banner currently visible.
 */
export async function dismissToast(page: Page) {
  const toast = page.locator('[class*="toast"], [role="alert"]').first();
  if (await toast.isVisible()) {
    const closeBtn = toast.locator('button[aria-label*="close"], button:has-text("×")').first();
    if (await closeBtn.isVisible()) {
      await closeBtn.click();
    }
  }
}

/**
 * Wait for a specific API response matching a URL pattern.
 * Returns the response body as JSON.
 */
export async function waitForApiResponse(page: Page, urlPattern: string) {
  const response = await page.waitForResponse(
    resp => resp.url().includes(urlPattern) && resp.status() < 400,
    { timeout: 15_000 }
  );
  return response.json();
}

/**
 * Check for console errors during page load.
 * Returns array of error messages (excluding known non-critical errors).
 */
export function collectConsoleErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      const text = msg.text();
      // Filter out known non-critical errors
      if (!text.includes('favicon') &&
          !text.includes('analytics') &&
          !text.includes('posthog') &&
          !text.includes('intercom')) {
        errors.push(text);
      }
    }
  });
  return errors;
}

/**
 * Verify a page has no critical JS errors after loading.
 */
export async function assertNoCriticalErrors(page: Page, errors: string[]) {
  await page.waitForTimeout(2_000);
  expect(errors, `Page has JS errors: ${errors.join(', ')}`).toHaveLength(0);
}

/**
 * Count words in a string — used to verify AI memory note word limits.
 * TC-L2-02: memory note ≤300 words
 * TC-L1-05: conversation summary ≤200 words
 */
export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * Generate test CSV content for TAM upload tests.
 */
export function generateTestCsv(rows: number): string {
  const header = 'Company Name,Domain,Industry,Country,Employees';
  const dataRows = Array.from({ length: rows }, (_, i) => {
    const companies = ['Acme Corp', 'Beta Ltd', 'Gamma BV', 'Delta Inc', 'Epsilon GmbH'];
    const domains = ['acme.com', 'beta.co', 'gamma.nl', 'delta.io', 'epsilon.de'];
    const industries = ['Technology', 'Finance', 'Healthcare', 'Retail', 'Manufacturing'];
    const countries = ['Netherlands', 'UK', 'Germany', 'Belgium', 'France'];
    const idx = i % 5;
    return `${companies[idx]} ${i},${domains[idx]},${industries[idx]},${countries[idx]},${(i + 1) * 100}`;
  });
  return [header, ...dataRows].join('\n');
}

/**
 * Poll until condition is true or timeout reached.
 * Useful for async operations like AI memory generation.
 */
export async function pollUntil(
  condition: () => Promise<boolean>,
  timeoutMs = 30_000,
  intervalMs = 1_000
): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await condition()) return true;
    await new Promise(resolve => setTimeout(resolve, intervalMs));
  }
  return false;
}
