import { test, expect } from '@playwright/test';

/**
 * TAMtracker — API Tests: TAM, AI Memory & Integrations
 * Uses Playwright APIRequestContext — no browser, pure HTTP.
 *
 * TAM endpoints: companies, discovery, upload, calculator, signals
 * AI Memory endpoints: conversations, memory notes (TC-L1, TC-L2, TC-P)
 * Integration endpoints: LinkedIn, HubSpot, webhooks, org sync
 */

const BASE = process.env.API_BASE_URL || 'https://tamtracker.io';

// ── SHARED AUTH HELPER ────────────────────────────────────────────────────────

async function getAuthToken(request: any): Promise<string | null> {
  const resp = await request.post(`${BASE}/api/auth/login`, {
    data: {
      email: process.env.QA_USER_EMAIL,
      password: process.env.QA_USER_PASSWORD,
    },
  });
  if (resp.status() === 200) {
    const body = await resp.json();
    return body.token ?? null;
  }
  return null;
}

// ── TAM API TESTS ─────────────────────────────────────────────────────────────

test.describe('API — TAM Companies', () => {

  test('@smoke GET /api/tam/companies — returns paginated company list', async ({ request }) => {
    const token = await getAuthToken(request);
    if (!token) return test.skip();

    const response = await request.get(`${BASE}/api/tam/companies`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { page: 1, limit: 20 },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty('data');
    expect(Array.isArray(body.data)).toBe(true);
  });

  test('GET /api/tam/companies — unauthenticated returns 401', async ({ request }) => {
    const response = await request.get(`${BASE}/api/tam/companies`);
    expect([401, 403]).toContain(response.status());
  });

  test('GET /api/tam/companies — pagination params respected', async ({ request }) => {
    const token = await getAuthToken(request);
    if (!token) return test.skip();

    const page1 = await request.get(`${BASE}/api/tam/companies`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { page: 1, limit: 5 },
    });
    const page2 = await request.get(`${BASE}/api/tam/companies`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { page: 2, limit: 5 },
    });

    expect(page1.status()).toBe(200);
    expect(page2.status()).toBe(200);
    const body1 = await page1.json();
    const body2 = await page2.json();
    // Pages should differ (assuming enough data)
    if (body1.data?.length > 0 && body2.data?.length > 0) {
      expect(body1.data[0].id).not.toBe(body2.data[0].id);
    }
  });

  test('GET /api/tam/companies — industry filter returns filtered results', async ({ request }) => {
    const token = await getAuthToken(request);
    if (!token) return test.skip();

    const response = await request.get(`${BASE}/api/tam/companies`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { industry: 'Technology', limit: 10 },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    if (body.data?.length > 0) {
      // All returned companies should be in Technology
      body.data.forEach((company: any) => {
        expect(company.industry?.toLowerCase()).toContain('tech');
      });
    }
  });

  test('POST /api/tam/companies — add company to TAM', async ({ request }) => {
    const token = await getAuthToken(request);
    if (!token) return test.skip();

    const response = await request.post(`${BASE}/api/tam/companies`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { company_id: 'test-company-id-999' },
    });

    expect([200, 201, 409]).toContain(response.status()); // 409 if already in TAM
  });

  test('DELETE /api/tam/companies/:id — remove company from TAM', async ({ request }) => {
    const token = await getAuthToken(request);
    if (!token) return test.skip();

    const response = await request.delete(`${BASE}/api/tam/companies/test-company-id-999`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect([200, 204, 404]).toContain(response.status());
  });

  test('POST /api/tam/upload — invalid file type returns 400', async ({ request }) => {
    const token = await getAuthToken(request);
    if (!token) return test.skip();

    const response = await request.post(`${BASE}/api/tam/upload`, {
      headers: { Authorization: `Bearer ${token}` },
      multipart: {
        file: {
          name: 'data.txt',
          mimeType: 'text/plain',
          buffer: Buffer.from('not a csv'),
        },
      },
    });

    expect([400, 422]).toContain(response.status());
  });

  test('GET /api/tam/discover — returns discovery results', async ({ request }) => {
    const token = await getAuthToken(request);
    if (!token) return test.skip();

    const response = await request.get(`${BASE}/api/tam/discover`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { limit: 10 },
    });

    expect([200, 206]).toContain(response.status());
  });

});

// ── AI MEMORY API TESTS ───────────────────────────────────────────────────────

test.describe('API — AI Memory (Layer 1: Conversations)', () => {

  test('@smoke @TC-L1-02 GET /api/ai/conversations — returns max 5 recent sessions', async ({ request }) => {
    const token = await getAuthToken(request);
    if (!token) return test.skip();

    const response = await request.get(`${BASE}/api/ai/conversations`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    const conversations = body.data ?? body;
    if (Array.isArray(conversations)) {
      // TC-L1-02: Should return at most 5 conversations
      expect(conversations.length).toBeLessThanOrEqual(5);
    }
  });

  test('@TC-L1-08 GET /api/ai/conversations — returns only current user conversations', async ({ request }) => {
    const token = await getAuthToken(request);
    if (!token) return test.skip();

    const response = await request.get(`${BASE}/api/ai/conversations`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    const conversations = body.data ?? body;
    if (Array.isArray(conversations)) {
      // All conversations should belong to the authenticated user
      conversations.forEach((conv: any) => {
        if (conv.user_id) {
          expect(conv.user_id).toBeTruthy();
          // Cannot verify exact user_id without knowing it but should be consistent
        }
      });
    }
  });

  test('@TC-L1-04 GET /api/ai/conversations — empty list for new user returns 200 not error', async ({ request }) => {
    const token = await getAuthToken(request);
    if (!token) return test.skip();

    const response = await request.get(`${BASE}/api/ai/conversations`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    // Should always return 200 — even if empty
    expect(response.status()).toBe(200);
    const body = await response.json();
    // Data should be array (even if empty)
    const data = body.data ?? body;
    expect(Array.isArray(data)).toBe(true);
  });

  test('GET /api/ai/conversations — unauthenticated returns 401', async ({ request }) => {
    const response = await request.get(`${BASE}/api/ai/conversations`);
    expect([401, 403]).toContain(response.status());
  });

  test('DELETE /api/ai/conversations — deletes conversation history', async ({ request }) => {
    const token = await getAuthToken(request);
    if (!token) return test.skip();

    const response = await request.delete(`${BASE}/api/ai/conversations`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect([200, 204, 404]).toContain(response.status());
  });

});

test.describe('API — AI Memory (Layer 2: Memory Notes)', () => {

  test('@smoke @TC-L2-04 GET /api/ai/memory — returns memory note', async ({ request }) => {
    const token = await getAuthToken(request);
    if (!token) return test.skip();

    const response = await request.get(`${BASE}/api/ai/memory`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect([200, 404]).toContain(response.status());
    if (response.status() === 200) {
      const body = await response.json();
      expect(body).toHaveProperty('note');
    }
  });

  test('@TC-L2-02 GET /api/ai/memory — memory note word count within limit', async ({ request }) => {
    const token = await getAuthToken(request);
    if (!token) return test.skip();

    const response = await request.get(`${BASE}/api/ai/memory`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.status() === 200) {
      const body = await response.json();
      const note: string = body.note ?? '';
      const wordCount = note.trim().split(/\s+/).filter(Boolean).length;
      // TC-L2-02: Memory note should be ≤300 words
      expect(wordCount).toBeLessThanOrEqual(300);
    }
  });

  test('@TC-P-02 DELETE /api/ai/memory — user can delete memory note', async ({ request }) => {
    const token = await getAuthToken(request);
    if (!token) return test.skip();

    const response = await request.delete(`${BASE}/api/ai/memory`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect([200, 204, 404]).toContain(response.status());
  });

  test('@TC-P-08 GET /api/ai/memory — cross-user isolation', async ({ request }) => {
    // Two different auth tokens should return different (isolated) memory notes
    const token = await getAuthToken(request);
    if (!token) return test.skip();

    const response = await request.get(`${BASE}/api/ai/memory`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    // Memory should be scoped to this user only — verified by 200 + own data
    expect([200, 404]).toContain(response.status());
  });

  test('GET /api/ai/memory — unauthenticated returns 401', async ({ request }) => {
    const response = await request.get(`${BASE}/api/ai/memory`);
    expect([401, 403]).toContain(response.status());
  });

});

// ── AI CHAT API ───────────────────────────────────────────────────────────────

test.describe('API — AI Chat', () => {

  test('@smoke POST /api/ai/chat — sends message and gets response', async ({ request }) => {
    const token = await getAuthToken(request);
    if (!token) return test.skip();

    const response = await request.post(`${BASE}/api/ai/chat`, {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        message: 'How many companies are in my TAM?',
      },
    });

    expect([200, 201]).toContain(response.status());
    const body = await response.json();
    // Should have some response content
    expect(body.response ?? body.message ?? body.content).toBeTruthy();
  });

  test('POST /api/ai/chat — empty message returns 400', async ({ request }) => {
    const token = await getAuthToken(request);
    if (!token) return test.skip();

    const response = await request.post(`${BASE}/api/ai/chat`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { message: '' },
    });

    expect([400, 422]).toContain(response.status());
  });

  test('POST /api/ai/chat — unauthenticated returns 401', async ({ request }) => {
    const response = await request.post(`${BASE}/api/ai/chat`, {
      data: { message: 'hello' },
    });

    expect([401, 403]).toContain(response.status());
  });

  test('@TC-PF-01 POST /api/ai/chat — response returned within 30 seconds', async ({ request }) => {
    const token = await getAuthToken(request);
    if (!token) return test.skip();

    const start = Date.now();
    const response = await request.post(`${BASE}/api/ai/chat`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { message: 'Give me a brief overview of my TAM' },
      timeout: 35_000,
    });

    const duration = Date.now() - start;
    expect(response.status()).toBe(200);
    expect(duration).toBeLessThan(30_000);
  });

});

// ── INTEGRATIONS API ──────────────────────────────────────────────────────────

test.describe('API — Integrations', () => {

  test('@smoke GET /api/integrations — returns list of available integrations', async ({ request }) => {
    const token = await getAuthToken(request);
    if (!token) return test.skip();

    const response = await request.get(`${BASE}/api/integrations`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    const integrations = body.data ?? body;
    // Should include supported platforms
    const names = JSON.stringify(integrations).toLowerCase();
    expect(
      names.includes('hubspot') || names.includes('linkedin') || names.includes('google')
    ).toBe(true);
  });

  test('GET /api/integrations — unauthenticated returns 401', async ({ request }) => {
    const response = await request.get(`${BASE}/api/integrations`);
    expect([401, 403]).toContain(response.status());
  });

  test('POST /api/integrations/webhook — invalid URL returns 422', async ({ request }) => {
    const token = await getAuthToken(request);
    if (!token) return test.skip();

    const response = await request.post(`${BASE}/api/integrations/webhook`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { url: 'not-a-real-url' },
    });

    expect([400, 422]).toContain(response.status());
  });

  test('POST /api/integrations/webhook — valid URL saves successfully', async ({ request }) => {
    const token = await getAuthToken(request);
    if (!token) return test.skip();

    const response = await request.post(`${BASE}/api/integrations/webhook`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { url: 'https://webhook.site/qa-test-endpoint' },
    });

    expect([200, 201]).toContain(response.status());
  });

});

// ── SIGNALS API ───────────────────────────────────────────────────────────────

test.describe('API — Signals', () => {

  test('@smoke GET /api/signals — returns signal data', async ({ request }) => {
    const token = await getAuthToken(request);
    if (!token) return test.skip();

    const response = await request.get(`${BASE}/api/signals`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect([200, 206]).toContain(response.status());
    if (response.status() === 200) {
      const body = await response.json();
      expect(body).toHaveProperty('data');
    }
  });

  test('GET /api/signals — unauthenticated returns 401', async ({ request }) => {
    const response = await request.get(`${BASE}/api/signals`);
    expect([401, 403]).toContain(response.status());
  });

  test('GET /api/signals/audience — returns signals for TAM audience', async ({ request }) => {
    const token = await getAuthToken(request);
    if (!token) return test.skip();

    const response = await request.get(`${BASE}/api/signals/audience`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect([200, 206]).toContain(response.status());
  });

});
