import { Page, Locator, expect } from '@playwright/test';

/**
 * AICoachPage — TAMtracker AI Coach chat interface.
 *
 * TAMtracker AI Coach features (from real project):
 *  - Ask questions about your TAM, signals, demand health
 *  - Layer 1: Conversation history (last 5 sessions, ≤1,500 tokens)
 *  - Layer 2: Persistent memory note (≤300 words, auto-generated after each session)
 *  - Memory and history manageable via Settings → Privacy
 *  - Weekly briefings, campaign recommendations, CSV exports
 *
 * Ticket refs: U-H1 (AI Coach page), U-H2 (useAIChat), U-H3 (useAIContext),
 *              U-H4 (useAIHistory), U-H8 (partial JSON parser), U-H11 (Ask page)
 * Memory TCs:  TC-L1-01 to TC-L2-10, TC-P-01 to TC-P-09
 */
export class AICoachPage {
  readonly page: Page;

  // Chat interface
  readonly chatContainer: Locator;
  readonly messageInput: Locator;
  readonly sendButton: Locator;
  readonly messages: Locator;
  readonly loadingIndicator: Locator;
  readonly aiResponse: Locator;

  // Memory / History controls (Settings)
  readonly memorySettingsLink: Locator;
  readonly viewMemoryButton: Locator;
  readonly deleteMemoryButton: Locator;
  readonly viewHistoryButton: Locator;
  readonly deleteHistoryButton: Locator;
  readonly memoryNoteContent: Locator;
  readonly historyList: Locator;
  readonly confirmDeleteButton: Locator;

  // Export
  readonly exportCSVButton: Locator;

  // Weekly briefing
  readonly weeklyBriefingSection: Locator;

  constructor(page: Page) {
    this.page = page;

    this.chatContainer = page.locator('[class*="ai-coach"], [class*="chat-container"], #ai-coach').first();
    this.messageInput = page.locator('textarea[placeholder*="Ask"], input[placeholder*="Ask"], textarea[name*="message"]');
    this.sendButton = page.locator('button[type="submit"]:has-text("Send"), button[aria-label*="send"]');
    this.messages = page.locator('[class*="message"], [class*="chat-message"]');
    this.loadingIndicator = page.locator('[class*="loading"], [class*="typing"], [aria-label*="loading"]');
    this.aiResponse = page.locator('[class*="assistant-message"], [data-role="assistant"]').last();

    this.memorySettingsLink = page.locator('a[href*="memory"], a[href*="privacy"], text=Memory');
    this.viewMemoryButton = page.locator('button:has-text("View Memory"), button:has-text("View memory note")');
    this.deleteMemoryButton = page.locator('button:has-text("Delete Memory"), button:has-text("Delete memory")');
    this.viewHistoryButton = page.locator('button:has-text("View History"), button:has-text("Conversation history")');
    this.deleteHistoryButton = page.locator('button:has-text("Delete History"), button:has-text("Delete history")');
    this.memoryNoteContent = page.locator('[class*="memory-note"], [class*="memory-content"]');
    this.historyList = page.locator('[class*="history-list"], [class*="conversation-list"]');
    this.confirmDeleteButton = page.locator('button:has-text("Confirm"), button:has-text("Yes, delete")');
    this.exportCSVButton = page.locator('button:has-text("Export"), button:has-text("Download CSV")');
    this.weeklyBriefingSection = page.locator('[class*="weekly-briefing"], [class*="briefing"]');
  }

  async goto() {
    await this.page.goto('/dashboard/ask');
    await expect(this.chatContainer).toBeVisible({ timeout: 10_000 });
  }

  async gotoMemorySettings() {
    await this.page.goto('/dashboard/settings?tab=memory');
  }

  async sendMessage(message: string) {
    await this.messageInput.fill(message);
    await this.sendButton.click();
    // Wait for AI to stop loading
    await this.loadingIndicator.waitFor({ state: 'hidden', timeout: 30_000 })
      .catch(() => {});
    await this.page.waitForTimeout(1_000);
  }

  async getLastAIResponse(): Promise<string> {
    await expect(this.aiResponse).toBeVisible({ timeout: 30_000 });
    return (await this.aiResponse.textContent()) ?? '';
  }

  async getMessageCount(): Promise<number> {
    return this.messages.count();
  }

  async deleteMemoryNote() {
    await this.viewMemoryButton.click();
    await this.deleteMemoryButton.click();
    await this.confirmDeleteButton.click();
  }

  async deleteConversationHistory() {
    await this.viewHistoryButton.click();
    await this.deleteHistoryButton.click();
    await this.confirmDeleteButton.click();
  }

  async isMemoryNoteVisible(): Promise<boolean> {
    return this.memoryNoteContent.isVisible();
  }

  async getMemoryNoteText(): Promise<string> {
    await expect(this.memoryNoteContent).toBeVisible();
    return (await this.memoryNoteContent.textContent()) ?? '';
  }

  async exportCSV() {
    const [download] = await Promise.all([
      this.page.waitForEvent('download'),
      this.exportCSVButton.click(),
    ]);
    return download;
  }
}
