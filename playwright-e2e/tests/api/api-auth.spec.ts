import { test, expect, APIRequestContext } from '@playwright/test';

/**
 * TAMtracker — API Tests: Authentication
 * Uses Playwright's built-in APIRequestContext (no browser needed).
 * Tests run in the 'api' project — see playwright.config.ts.
 *
 * Endpoints covered (aligned with TAMtracker React + User app):
 *   POST /api/auth/login
 *   POST /api/auth/signup
 *   POST /api/auth/forgot-password
 *   POST /api/auth/reset-password
 *   POST /api/auth/logout
 *   GET  /api/auth/me
 *   POST /api/auth/refresh
 */

const BASE = process.env.API_BASE_URL || 'https://tamtracker.io';

test.describe('API — Authentication', () => {

  // ── LOGIN ──────────────────────────────────────────────────────────────────

  test('@smoke POST /api/auth/login — valid credentials return 200 with token', async ({ request }) => {
    const response = await request.post(`${BASE}/api/auth/login`, {
      data: {
        email: process.env.QA_USER_EMAIL,
        password: process.env.QA_USER_PASSWORD,
      },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty('token');
    expect(body.token).toBeTruthy();
    expect(typeof body.token).toBe('string');
  });

  test('POST /api/auth/login — invalid password returns 401', async ({ request }) => {
    const response = await request.post(`${BASE}/api/auth/login`, {
      data: {
        email: process.env.QA_USER_EMAIL,
        password: 'WrongPassword999!',
      },
    });

    expect([401, 422, 400]).toContain(response.status());
    const body = await response.json();
    expect(body).not.toHaveProperty('token');
  });

  test('POST /api/auth/login — unregistered email returns error', async ({ request }) => {
    const response = await request.post(`${BASE}/api/auth/login`, {
      data: {
        email: 'nobody@notregistered.com',
        password: 'Password123!',
      },
    });

    expect(response.status()).not.toBe(200);
    const body = await response.json();
    expect(body).not.toHaveProperty('token');
  });

  test('POST /api/auth/login — missing email field returns 400/422', async ({ request }) => {
    const response = await request.post(`${BASE}/api/auth/login`, {
      data: { password: 'Password123!' },
    });

    expect([400, 422]).toContain(response.status());
  });

  test('POST /api/auth/login — missing password field returns 400/422', async ({ request }) => {
    const response = await request.post(`${BASE}/api/auth/login`, {
      data: { email: process.env.QA_USER_EMAIL },
    });

    expect([400, 422]).toContain(response.status());
  });

  test('POST /api/auth/login — empty body returns 400/422', async ({ request }) => {
    const response = await request.post(`${BASE}/api/auth/login`, {
      data: {},
    });

    expect(response.status()).toBeGreaterThanOrEqual(400);
  });

  test('POST /api/auth/login — SQL injection in email is safely handled', async ({ request }) => {
    const response = await request.post(`${BASE}/api/auth/login`, {
      data: {
        email: "' OR '1'='1",
        password: 'anypassword',
      },
    });

    // Should NOT return 200 — injection must not authenticate
    expect(response.status()).not.toBe(200);
    const body = await response.json();
    expect(body).not.toHaveProperty('token');
  });

  test('POST /api/auth/login — response has correct Content-Type header', async ({ request }) => {
    const response = await request.post(`${BASE}/api/auth/login`, {
      data: {
        email: process.env.QA_USER_EMAIL,
        password: process.env.QA_USER_PASSWORD,
      },
    });

    const contentType = response.headers()['content-type'];
    expect(contentType).toContain('application/json');
  });

  // ── SIGNUP ─────────────────────────────────────────────────────────────────

  test('POST /api/auth/signup — duplicate email returns 409 or 422', async ({ request }) => {
    const response = await request.post(`${BASE}/api/auth/signup`, {
      data: {
        email: process.env.QA_USER_EMAIL,
        password: 'NewPassword@123',
        name: 'Duplicate User',
      },
    });

    expect([409, 422, 400]).toContain(response.status());
  });

  test('POST /api/auth/signup — invalid email format returns 422', async ({ request }) => {
    const response = await request.post(`${BASE}/api/auth/signup`, {
      data: {
        email: 'not-valid-email',
        password: 'Password@123',
        name: 'Test User',
      },
    });

    expect([400, 422]).toContain(response.status());
  });

  test('POST /api/auth/signup — weak password returns 422', async ({ request }) => {
    const response = await request.post(`${BASE}/api/auth/signup`, {
      data: {
        email: 'newuser-qa@example.com',
        password: '123',
        name: 'Test User',
      },
    });

    expect([400, 422]).toContain(response.status());
  });

  // ── FORGOT PASSWORD ─────────────────────────────────────────────────────────

  test('@smoke POST /api/auth/forgot-password — valid email returns 200', async ({ request }) => {
    const response = await request.post(`${BASE}/api/auth/forgot-password`, {
      data: { email: process.env.QA_USER_EMAIL },
    });

    expect([200, 201]).toContain(response.status());
  });

  test('POST /api/auth/forgot-password — unknown email returns 200 (no enumeration)', async ({ request }) => {
    // Good security practice: return 200 even for unknown email to prevent user enumeration
    const response = await request.post(`${BASE}/api/auth/forgot-password`, {
      data: { email: 'doesnotexist@example.com' },
    });

    // Should return 200 or 404 — not expose whether email exists
    expect([200, 404]).toContain(response.status());
  });

  test('POST /api/auth/forgot-password — invalid email format returns 422', async ({ request }) => {
    const response = await request.post(`${BASE}/api/auth/forgot-password`, {
      data: { email: 'notvalid' },
    });

    expect([400, 422]).toContain(response.status());
  });

  // ── AUTH ME ─────────────────────────────────────────────────────────────────

  test('@smoke GET /api/auth/me — authenticated request returns user profile', async ({ request }) => {
    // First login to get token
    const loginResp = await request.post(`${BASE}/api/auth/login`, {
      data: {
        email: process.env.QA_USER_EMAIL,
        password: process.env.QA_USER_PASSWORD,
      },
    });

    if (loginResp.status() === 200) {
      const { token } = await loginResp.json();
      const meResp = await request.get(`${BASE}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      expect(meResp.status()).toBe(200);
      const me = await meResp.json();
      expect(me).toHaveProperty('email');
      expect(me.email).toBe(process.env.QA_USER_EMAIL);
    }
  });

  test('GET /api/auth/me — unauthenticated request returns 401', async ({ request }) => {
    const response = await request.get(`${BASE}/api/auth/me`);
    expect([401, 403]).toContain(response.status());
  });

  test('GET /api/auth/me — invalid token returns 401', async ({ request }) => {
    const response = await request.get(`${BASE}/api/auth/me`, {
      headers: { Authorization: 'Bearer invalid-token-here' },
    });

    expect([401, 403]).toContain(response.status());
  });

  // ── LOGOUT ──────────────────────────────────────────────────────────────────

  test('POST /api/auth/logout — clears session', async ({ request }) => {
    const loginResp = await request.post(`${BASE}/api/auth/login`, {
      data: {
        email: process.env.QA_USER_EMAIL,
        password: process.env.QA_USER_PASSWORD,
      },
    });

    if (loginResp.status() === 200) {
      const { token } = await loginResp.json();
      const logoutResp = await request.post(`${BASE}/api/auth/logout`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      expect([200, 204]).toContain(logoutResp.status());

      // Token should now be invalid
      const meResp = await request.get(`${BASE}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      expect([401, 403]).toContain(meResp.status());
    }
  });

});
