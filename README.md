# TAMtracker QA Automation Portfolio

> **Platform:** TAMtracker — B2B Market Readiness Platform for B2B Marketers.  
> Tracks demand signals across LinkedIn Ads, HubSpot, Google Ads, ActiveCampaign, Zoho CRM and MailerLite across a 3.8 million company database.  
>
> **My Role:** Senior SQA Engineer at Innovation Insight — responsible for full QA strategy, test automation framework design, unit test ticket management (145 tickets across User + Agency apps), and quality ownership across all releases.

---

## What This Repository Contains

```
tamtracker-qa/
└── playwright-e2e/            # Playwright E2E + API tests
    ├── playwright.config.ts   # Multi-project config: user app, agency app, API
    ├── package.json
    ├── .env.test.example      # Environment template (copy → .env.test)
    ├── pages/
    │   └── user/
    │       ├── LoginPage.ts        # Auth page object
    │       ├── TAMPage.ts          # TAM discovery, view, upload, calculator
    │       ├── AICoachPage.ts      # AI Coach chat + memory/privacy controls
    │       └── DashboardPage.ts    # Dashboard, Integrations pages
    ├── tests/
    │   ├── auth.setup.ts           # Auth setup — saves sessions for all tests
    │   ├── auth/
    │   │   └── auth.spec.ts        # Login, Signup, ForgotPwd, OAuth, Logout
    │   ├── tam/
    │   │   └── tam.spec.ts         # TAM View, Discover, Upload CSV, Calculator
    │   ├── ai-coach/
    │   │   └── ai-coach.spec.ts    # AI Coach + all 37 memory test cases
    │   ├── dashboard/
    │   │   └── dashboard.spec.ts   # Dashboard, Integrations, Billing, Alerts
    │   ├── agency/
    │   │   └── agency.spec.ts      # Full agency app test suite
    │   └── api/
    │       ├── api-auth.spec.ts        # Auth API: login, signup, forgot pwd, me
    │       └── api-tam-memory.spec.ts  # TAM, AI Memory, Signals, Integrations APIs
    └── utils/
        └── helpers.ts          # Shared utilities: CSV gen, word count, polling
```

---

## Test Coverage Map

### User App (tamtracker.io)

| Epic | Tickets | Test File | Coverage |
|------|---------|-----------|----------|
| U-A Authentication | U-A1 to U-A11 | `auth/auth.spec.ts` | Login ✅ Signup ✅ ForgotPwd ✅ OAuth ✅ Logout ✅ |
| U-C TAM Discovery | U-C1 to U-C8 | `tam/tam.spec.ts` | View ✅ Discover ✅ Upload ✅ Calculator ✅ Suggestions ✅ |
| U-D Dashboard | U-D1 to U-D10 | `dashboard/dashboard.spec.ts` | Home ✅ Audience ✅ Shortlist ✅ Signals ✅ Insights ✅ |
| U-F Integrations | U-F1 to U-F5 | `dashboard/dashboard.spec.ts` | Page ✅ Connect ✅ Webhook ✅ |
| U-G Alerts | U-G1 to U-G3 | `dashboard/dashboard.spec.ts` | Alerts ✅ Unsubscribe ✅ Email prefs ✅ |
| U-H AI Coach | U-H1 to U-H11 | `ai-coach/ai-coach.spec.ts` | Chat ✅ Memory ✅ Privacy ✅ Export ✅ Perf ✅ |
| U-I Billing | U-I1 to U-I7 | `dashboard/dashboard.spec.ts` | Billing ✅ Plans ✅ Trial ✅ Referral ✅ |

### Agency App (agency.tamtracker.io)

| Epic | Tickets | Test File |
|------|---------|-----------|
| AG-A Authentication | AG-A1 to AG-A6 | `agency/agency.spec.ts` |
| AG-B Onboarding (DocuSeal, Stripe) | AG-B1 to AG-B7 | `agency/agency.spec.ts` |
| AG-C Dashboard & Clients | AG-C1 to AG-C8 | `agency/agency.spec.ts` |
| AG-D TAM | AG-D1 to AG-D8 | `agency/agency.spec.ts` |
| AG-E Signals & Audience | AG-E1 to AG-E8 | `agency/agency.spec.ts` |
| AG-F Billing & Income | AG-F1 to AG-F4 | `agency/agency.spec.ts` |
| AG-I Public Pages | AG-I1 to AG-I5 | `agency/agency.spec.ts` |

### AI Memory Test Cases (37 TCs from TAMtracker Memory System)

| Category | Test IDs | File |
|----------|----------|------|
| Layer 1 — Conversation History | TC-L1-01 to TC-L1-12 | `ai-coach/ai-coach.spec.ts` + `api/api-tam-memory.spec.ts` |
| Layer 2 — Persistent Memory | TC-L2-01 to TC-L2-10 | `ai-coach/ai-coach.spec.ts` + `api/api-tam-memory.spec.ts` |
| Privacy & Compliance | TC-P-01 to TC-P-09 | `ai-coach/ai-coach.spec.ts` |
| Performance | TC-PF-01 to TC-PF-06 | `ai-coach/ai-coach.spec.ts` + `api/api-tam-memory.spec.ts` |

### API Tests

| Module | Tests | File |
|--------|-------|------|
| Auth (login, signup, logout, /me) | 14 tests | `api/api-auth.spec.ts` |
| TAM Companies (CRUD, pagination, filter, upload) | 7 tests | `api/api-tam-memory.spec.ts` |
| AI Conversations (list, delete, user isolation) | 5 tests | `api/api-tam-memory.spec.ts` |
| AI Memory Notes (get, word count, delete, isolation) | 5 tests | `api/api-tam-memory.spec.ts` |
| AI Chat (send, empty, unauth, latency) | 4 tests | `api/api-tam-memory.spec.ts` |
| Integrations (list, webhook) | 4 tests | `api/api-tam-memory.spec.ts` |
| Signals (audience, list) | 3 tests | `api/api-tam-memory.spec.ts` |

---

## Tech Stack

| Tool | Purpose |
|------|---------|
| **Playwright 1.44** | E2E browser automation + API testing |
| **TypeScript** | Full type safety across all test files |
| **Page Object Model** | All pages extend typed POM classes |
| **Playwright APIRequestContext** | API tests — no browser, pure HTTP |
| **Multi-project config** | User app, Agency app, API in one config |
| **Auth state reuse** | Login once per run, sessions shared across tests |
| **dotenv** | Externalised config — no hardcoded credentials |

---

## How to Run

### Prerequisites
- Node.js 18+
- `npm install` or `pnpm install`
- Copy `.env.test.example` to `.env.test` and fill in QA credentials

### Install Playwright browsers
```bash
npx playwright install chromium firefox
```

### Run everything
```bash
npm test
```

### Run specific suites
```bash
npm run test:auth          # Auth E2E tests only
npm run test:tam           # TAM Discovery & Calculator
npm run test:ai-coach      # AI Coach + all memory TCs
npm run test:dashboard     # Dashboard, Integrations, Billing
npm run test:agency        # Full agency app suite
npm run test:api           # All API tests (no browser)
```

### Run by tag
```bash
npx playwright test --grep @smoke         # Smoke suite only
npx playwright test --grep @TC-L1        # All Layer 1 memory tests
npx playwright test --grep @U-C4         # TAM Upload ticket only
```

### View HTML report
```bash
npm run report
```

---

## Setup — .env.test

```env
BASE_URL=https://tamtracker.io
USER_APP_URL=https://tamtracker.io
AGENCY_APP_URL=https://agency.tamtracker.io
API_BASE_URL=https://tamtracker.io

QA_USER_EMAIL=your-qa-user@example.com
QA_USER_PASSWORD=YourTestPassword@123
QA_AGENCY_EMAIL=your-qa-agency@example.com
QA_AGENCY_PASSWORD=YourTestPassword@123
```

> Use **dedicated QA test accounts** only. Never commit `.env.test` with real credentials.

---

## Key Design Decisions

**Why Playwright over Selenium for TAMtracker?**  
TAMtracker is a React/TypeScript SPA. Playwright's auto-waiting, network interception, and built-in API testing (`request` fixture) make it the right tool for a modern frontend. The `APIRequestContext` means we test both UI and API in the same framework without an extra tool.

**Why auth state reuse?**  
`auth.setup.ts` logs in once and saves the session state. Every test then loads the saved cookies — login is never repeated. This cuts test suite time significantly.

**Why typed Page Objects?**  
TypeScript + POM means locators are defined once. When TAMtracker's selectors change (as any SaaS does), we update one file, not 50 tests.

**Why externalised config?**  
All environment-specific values live in `.env.test`. The CI pipeline injects secrets via environment variables. Nothing is hardcoded.

---

## About

**Bushra Shahzadi** — Senior SQA Engineer & Team Lead at Innovation Insight  
📍 Wolverhampton, UK | Immediately available  
🔗 [LinkedIn](https://linkedin.com/in/bushra-shahzadi-5bb899214)

> TAMtracker is a product of TAMtracker B.V., Amsterdam. This repository contains only independently written test automation code. No proprietary source code, internal APIs, credentials, or confidential data is included.
