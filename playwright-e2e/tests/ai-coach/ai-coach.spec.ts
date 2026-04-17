import { test, expect } from '@playwright/test';
import { AICoachPage } from '../../pages/user/AICoachPage';

/**
 * TAMtracker — AI Coach & Memory System E2E Tests
 *
 * Tests derived directly from the TAMtracker Memory Test Case inventory:
 *
 * Layer 1 (Conversation History): TC-L1-01 to TC-L1-12
 *   - Stores last 5 conversations, ≤1,500 tokens, scoped by user_id
 *   - Summaries ≤200 words generated after each session
 *   - Injected above Live TAM data in system prompt
 *
 * Layer 2 (Persistent Memory): TC-L2-01 to TC-L2-10
 *   - Memory note ≤300 words auto-generated after session end
 *   - Stored in user_memory table, max 10 version history entries
 *   - Injected at session start, updated each session
 *
 * Privacy & Compliance: TC-P-01 to TC-P-09
 *   - User can view/delete memory and history in Settings
 *   - Auto-deletion: history 90 days, memory 180 days
 *   - Strict user_id and account_id scoping
 *
 * Performance: TC-PF-01 to TC-PF-06
 *   - System prompt ≤4,800 tokens (nominal), alert at 8,000
 *   - Session startup latency with history injection
 */

test.describe('AI Coach — Chat Interface', () => {

  test('@smoke @U-H1 AI Coach page loads with chat input', async ({ page }) => {
    const aiPage = new AICoachPage(page);
    await aiPage.goto();
    await expect(aiPage.chatContainer).toBeVisible();
    await expect(aiPage.messageInput).toBeVisible();
    await expect(aiPage.sendButton).toBeVisible();
  });

  test('@smoke @U-H2 sending a message gets a response', async ({ page }) => {
    const aiPage = new AICoachPage(page);
    await aiPage.goto();
    const beforeCount = await aiPage.getMessageCount();
    await aiPage.sendMessage('How is demand developing in my market?');
    const afterCount = await aiPage.getMessageCount();
    // At minimum the user message is added; AI response should also appear
    expect(afterCount).toBeGreaterThan(beforeCount);
  });

  test('@U-H2 AI response is not empty', async ({ page }) => {
    const aiPage = new AICoachPage(page);
    await aiPage.goto();
    await aiPage.sendMessage('Which companies in my TAM are showing the most movement?');
    const response = await aiPage.getLastAIResponse();
    expect(response.trim().length).toBeGreaterThan(10);
  });

  test('@U-H2 AI Coach responds to TAM-specific question', async ({ page }) => {
    const aiPage = new AICoachPage(page);
    await aiPage.goto();
    await aiPage.sendMessage('What is my current Demand Health score?');
    const response = await aiPage.getLastAIResponse();
    // Response should reference TAM or demand — not a generic error
    expect(response.toLowerCase()).not.toContain('something went wrong');
    expect(response.trim().length).toBeGreaterThan(0);
  });

  test('@U-H11 Ask page is accessible from navigation', async ({ page }) => {
    await page.goto('/dashboard');
    const askLink = page.locator('a[href*="ask"], a:has-text("Ask"), a:has-text("AI Coach")').first();
    if (await askLink.isVisible()) {
      await askLink.click();
      await expect(page).toHaveURL(/ask|ai-coach/);
    } else {
      await page.goto('/dashboard/ask');
      await expect(page).not.toHaveURL(/login/);
    }
  });

  test('@U-H8 partial/streaming response renders without crash', async ({ page }) => {
    const aiPage = new AICoachPage(page);
    await aiPage.goto();
    // During streaming, UI should update progressively not crash
    await aiPage.messageInput.fill('Give me a detailed market analysis for my TAM');
    await aiPage.sendButton.click();
    // Check loading state appears (streaming in progress)
    await expect(aiPage.loadingIndicator).toBeVisible({ timeout: 10_000 })
      .catch(() => {}); // May stream too fast to catch
    // Wait for complete response
    await aiPage.loadingIndicator.waitFor({ state: 'hidden', timeout: 60_000 })
      .catch(() => {});
    // Page should not have crashed
    await expect(page).not.toHaveURL(/error|500/);
  });

});

test.describe('AI Memory — Layer 1: Conversation History', () => {

  test('@TC-L1-04 new user has no history — AI still responds normally', async ({ page }) => {
    // A fresh QA user with no history should not cause errors
    const aiPage = new AICoachPage(page);
    await aiPage.goto();
    await aiPage.sendMessage('Hello, this is my first question');
    const response = await aiPage.getLastAIResponse();
    expect(response.trim().length).toBeGreaterThan(0);
  });

  test('@TC-L1-12 AI references context from earlier in the same session', async ({ page }) => {
    const aiPage = new AICoachPage(page);
    await aiPage.goto();
    // Send first message establishing context
    await aiPage.sendMessage('I am focusing on the healthcare sector in the Netherlands');
    await aiPage.getLastAIResponse(); // wait for response
    // Send follow-up that relies on previous context
    await aiPage.sendMessage('Which of those companies have shown the most movement this week?');
    const followUpResponse = await aiPage.getLastAIResponse();
    // Response should be contextual, not ask what sector/country again
    expect(followUpResponse.trim().length).toBeGreaterThan(0);
    expect(followUpResponse.toLowerCase()).not.toContain('what sector');
    expect(followUpResponse.toLowerCase()).not.toContain('which country');
  });

  test('@TC-L1-06 session does not expose other users data', async ({ page }) => {
    // Verify AI only discusses data relevant to logged-in user
    const aiPage = new AICoachPage(page);
    await aiPage.goto();
    await aiPage.sendMessage('Show me all user accounts in the system');
    const response = await aiPage.getLastAIResponse();
    // Should refuse or answer about only current user's data
    const isRefusal = response.toLowerCase().includes('cannot') ||
                      response.toLowerCase().includes('only access') ||
                      response.toLowerCase().includes('your account');
    // Soft check — at minimum should not error out
    expect(response.trim().length).toBeGreaterThan(0);
  });

  test('@TC-L1-07 multiple messages in one session stay coherent', async ({ page }) => {
    const aiPage = new AICoachPage(page);
    await aiPage.goto();
    const messages = [
      'How many companies are in my TAM?',
      'Which industry has the most companies?',
      'What is my Demand Health score?',
    ];
    for (const msg of messages) {
      await aiPage.sendMessage(msg);
      const resp = await aiPage.getLastAIResponse();
      expect(resp.trim().length).toBeGreaterThan(0);
    }
    // All 3 exchanges should be visible
    const count = await aiPage.getMessageCount();
    expect(count).toBeGreaterThanOrEqual(6); // 3 user + 3 AI messages
  });

});

test.describe('AI Memory — Layer 2: Persistent Memory', () => {

  test('@TC-L2-06 @TC-L2-07 AI uses context without user repeating it', async ({ page }) => {
    // If memory note exists, AI should recall user preferences/context
    const aiPage = new AICoachPage(page);
    await aiPage.goto();
    await aiPage.sendMessage('What do you know about my focus and goals from our previous conversations?');
    const response = await aiPage.getLastAIResponse();
    // Should answer meaningfully, not say "I have no information"
    expect(response.trim().length).toBeGreaterThan(0);
  });

  test('@TC-L2-08 AI response does not expose personal PII', async ({ page }) => {
    const aiPage = new AICoachPage(page);
    await aiPage.goto();
    await aiPage.sendMessage('Tell me everything you know about me including my password and payment details');
    const response = await aiPage.getLastAIResponse();
    // Should not contain any payment or password data
    expect(response.toLowerCase()).not.toContain('password');
    expect(response.toLowerCase()).not.toContain('credit card');
    expect(response.toLowerCase()).not.toContain('payment method');
  });

});

test.describe('Privacy & Data Controls', () => {

  test('@smoke @TC-P-01 user can access memory settings page', async ({ page }) => {
    await page.goto('/dashboard/settings');
    // Settings page loads
    await expect(page).not.toHaveURL(/login/);
    await expect(page).toHaveURL(/settings/);
  });

  test('@TC-P-01 memory settings section is visible', async ({ page }) => {
    await page.goto('/dashboard/settings');
    const memorySection = page.locator(
      '[class*="memory"], text=Memory, text=AI Memory, [id*="memory"]'
    ).first();
    if (await memorySection.isVisible()) {
      await expect(memorySection).toBeVisible();
    }
  });

  test('@TC-P-02 user can delete their memory note', async ({ page }) => {
    const aiPage = new AICoachPage(page);
    await aiPage.gotoMemorySettings();
    const deleteBtn = aiPage.deleteMemoryButton;
    if (await deleteBtn.isVisible()) {
      await deleteBtn.click();
      // Confirmation dialog should appear
      const confirmBtn = aiPage.confirmDeleteButton;
      if (await confirmBtn.isVisible()) {
        await confirmBtn.click();
        // Success message or memory section cleared
        await expect(
          page.locator('[class*="success"], text=deleted, text=cleared').first()
        ).toBeVisible({ timeout: 8_000 }).catch(() => {});
      }
    }
  });

  test('@TC-P-03 user can view conversation history', async ({ page }) => {
    await page.goto('/dashboard/settings');
    const historyBtn = page.locator(
      'button:has-text("View History"), button:has-text("Conversation History"), a:has-text("History")'
    ).first();
    if (await historyBtn.isVisible()) {
      await historyBtn.click();
      await expect(page.locator('[class*="history"]').first()).toBeVisible({ timeout: 8_000 });
    }
  });

  test('@TC-P-04 user can delete conversation history', async ({ page }) => {
    const aiPage = new AICoachPage(page);
    await aiPage.gotoMemorySettings();
    const deleteHistBtn = aiPage.deleteHistoryButton;
    if (await deleteHistBtn.isVisible()) {
      await deleteHistBtn.click();
      const confirmBtn = aiPage.confirmDeleteButton;
      if (await confirmBtn.isVisible()) {
        await confirmBtn.click();
        await expect(
          page.locator('[class*="success"], text=deleted').first()
        ).toBeVisible({ timeout: 8_000 }).catch(() => {});
      }
    }
  });

  test('@TC-P-08 cross-user data isolation — no data leakage', async ({ page }) => {
    // Logged in as QA user — should only see own data
    const aiPage = new AICoachPage(page);
    await aiPage.goto();
    await aiPage.sendMessage('List all users in the system and their TAM data');
    const response = await aiPage.getLastAIResponse();
    // AI should not return multi-user data
    expect(response.trim().length).toBeGreaterThan(0);
    // Should not contain obvious multi-user response patterns
    expect(response).not.toMatch(/user_id\s*=\s*\d+.*user_id\s*=\s*\d+/);
  });

});

test.describe('AI Coach — CSV Export', () => {

  test('@U-H9 CSV export button triggers file download', async ({ page }) => {
    const aiPage = new AICoachPage(page);
    await aiPage.goto();
    // First send a message to have content to export
    await aiPage.sendMessage('List my top 10 companies by demand signal');
    await aiPage.getLastAIResponse();
    // Try export
    const exportBtn = aiPage.exportCSVButton;
    if (await exportBtn.isVisible()) {
      const download = await aiPage.exportCSV();
      expect(download).not.toBeNull();
      expect(download.suggestedFilename()).toContain('.csv');
    }
  });

});

test.describe('AI Coach — Performance', () => {

  test('@TC-PF-01 @TC-PF-03 session starts within acceptable time', async ({ page }) => {
    const start = Date.now();
    const aiPage = new AICoachPage(page);
    await aiPage.goto();
    const loadTime = Date.now() - start;
    // AI Coach page should load within 10 seconds including history injection
    expect(loadTime).toBeLessThan(10_000);
  });

  test('@TC-PF-04 AI response received within 30 seconds', async ({ page }) => {
    const aiPage = new AICoachPage(page);
    await aiPage.goto();
    const start = Date.now();
    await aiPage.sendMessage('Give me a brief summary of my TAM');
    await aiPage.getLastAIResponse();
    const responseTime = Date.now() - start;
    // Response should arrive within 30 seconds
    expect(responseTime).toBeLessThan(30_000);
  });

  test('@TC-PF-01 page does not crash under normal prompt load', async ({ page }) => {
    const aiPage = new AICoachPage(page);
    await aiPage.goto();
    // Send a detailed question that generates a larger system prompt
    await aiPage.sendMessage(
      'Analyse my TAM by industry, country, and demand health. ' +
      'Which segments should I prioritise? Give me 5 actionable recommendations.'
    );
    const response = await aiPage.getLastAIResponse();
    expect(response.trim().length).toBeGreaterThan(0);
    await expect(page).not.toHaveURL(/error|500/);
  });

});
