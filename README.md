# QuickBite — Takeaway Ordering (Test Strategy Assessment)

Minimal takeaway ordering demo. The application is intentionally thin; the focus is **test strategy**, **shift-left testing**, **automation pyramid**, and **Allure reporting**.

| Layer | What it does |
| --- | --- |
| Menu | Lists 4 items (Burger 899p, Fries 299p, Shake 399p, Salad 549p) with live stock |
| Cart + discount | Optional codes: `SAVE10`, `MEALDEAL`, `FREESHIP` (case-sensitive) |
| Payment | Fake gateway — **even** last digit succeeds, **odd** declines |
| Stock | Decremented **only** after successful payment |

---

## Quick start

```bash
npm install
npx playwright install chromium

# Obtain DOTENV_KEY from the team vault (.env.keys) and export it
export DOTENV_KEY=<key>

# Terminal A — API
npm run start

# Terminal B — UI (http://127.0.0.1:5173, proxies /api → :3001)
npm run dev:web
```

Payment fields (all mandatory except discount):
- **Name on card** — at least 2 non-space characters
- **Card number** — exactly 16 digits; even last digit = success, odd = decline
- **Expiry month** — 1–12
- **Expiry year** — exactly 4 digits; must be current month/year or later

Test card numbers are stored in `.env` (values encrypted with dotenvx, committed to git). `DOTENV_KEY` is the only secret — obtain it from the team vault and export it before running tests. See `.env.example` for the full credential workflow.

---

## Approach

1. **Pure domain first** (`src/domain`) — menu, discount, payment, order placement with no HTTP/UI dependencies.
2. **Thin API** (`src/api`) — Express 5 + Zod validation over the domain; includes `/api/test/reset` for test isolation.
3. **Thin UI** (`src/web`) — vanilla JS page that calls the API (no SPA framework); Vite proxies `/api` → `:3001`.
4. **Tests mirror risk** — bulk of coverage on money/stock/discount invariants; a handful of E2E journeys for wiring confidence.

```
UI / E2E     ████         19 journeys — integration confidence
API / Int    ████         15 cases  — HTTP + persistence behaviour
Contract     ███           8 cases  — Zod shapes as shared contract
Unit         ██████████   34 cases  — domain rules (bulk of coverage)
```

---

## Test strategy

### Where the bulk of coverage sits — and why

**Bulk = Unit tests on `src/domain` (Vitest, 34 cases across 4 files).**

| Risk | Why unit (not E2E) |
| --- | --- |
| Overselling / stock races in logic | Pure function; milliseconds; deterministic |
| Discount eligibility & flooring | Money bugs are cheapest here |
| Payment decline must not reduce stock | Core invariant; no browser needed |
| Unknown items / invalid quantities | Combinatorial; E2E cannot cover all |

**API/Integration (Supertest, 15 cases)** proves Express wiring, status codes, schema validation, stock changes visible on `GET /api/menu` after `POST /api/orders`, concurrent requests cannot oversell beyond available stock, discount eligibility enforced at the HTTP boundary, and unknown item IDs surface as 422 rather than an unhandled 500.

**Contract (Zod schemas, 8 cases)** is the consumer/provider contract. UI and API both depend on shapes in `src/domain/schemas.ts`. Breaking a field fails contract tests *before* any UI work.

**UI/E2E (Playwright, 19 journeys)** covers:

1. Happy path + `SAVE10` discount applied
2. Payment decline — cart is retained, no stock change
3. Stock badge updates after a successful order
4. Cardholder name required — inline validation message
5. Two-digit expiry year rejected with clear message
6. Expired card rejected before payment attempt
7. Non-16-digit card number rejected
8. Empty cart blocked at checkout
9. `MEALDEAL` discount applied — status shows `saved £2.00`
10. `FREESHIP` discount applied when subtotal ≥ £10 — status shows `saved £1.50`
11. "Cart is empty" text visible on load; hidden once an item is added
12. Add button disabled when item stock is exhausted
13. Multiple quantities of same item — cart shows correct count and line total
14. `MEALDEAL` rejected when cart lacks burger or fries
15. `FREESHIP` rejected when subtotal is below £10
16. Burger + fries order — status shows correct total `£11.98` (pence-to-currency rendering verified in the real browser)
17. `FREESHIP` applied when subtotal is at the nearest qualifying UI threshold (salad × 2 = 1098p)
18. Add button disabled on initial page load when stock was pre-drained before page load
19. Page reload after paid order — status clears, cart shows "Cart is empty"

That scope is deliberate: E2E is for **confidence in integration**, not for **rule exhaustiveness**.

### Shift-left — what we catch earlier

| Defect class | Caught at | Why earlier is better |
| --- | --- | --- |
| Wrong discount math | Unit | Instant feedback in PR; no env/browser |
| Stock deducted on declined payment | Unit | Prevents inventory corruption before deploy |
| Response shape drift (`totalPence` renamed) | Contract | Stops UI/API mismatch before E2E |
| 422 vs 400 status mistakes | API | Contract of HTTP API for clients |
| Broken "Add → Pay → status" flow | E2E | Real browser + network; few, stable tests |

**Shift-left loop used here:**
1. Write/adjust domain rules + unit tests first.
2. Lock Zod schema shapes in contract tests.
3. Cover HTTP with API tests.
4. Keep a thin E2E suite as a release gate — not as the place rules are discovered.

### Tooling

| Concern | Tool |
| --- | --- |
| Unit / contract / API | Vitest + Supertest |
| Schema / contract | Zod (single source of truth) |
| E2E | Playwright (Chromium) |
| Reporting | Allure (`allure-vitest` + `allure-playwright` + `allure-commandline`) |
| API | Express 5 + TypeScript (tsx) |
| UI | Vite + vanilla JS |
| CI | GitHub Actions — fast tests gate E2E |
| Type checking | TypeScript strict mode (`tsc --noEmit`) |
| Test credentials | dotenvx — values encrypted in `.env` (committed); `DOTENV_KEY` from `.env.keys` (gitignored) |

---

## How AI was used (and why)

AI is used as a **shift-left ideation partner**, not as an unsupervised test oracle.

---

## Key decisions

| Decision | Rationale |
| --- | --- |
| Domain pure + in-memory store | Fast tests; no DB tax for an assessment app |
| Zod as contract | Lighter than full Pact for one repo; still catches shape drift |
| Even/odd card rule | Deterministic fake payment — easy unit + E2E |
| Stock after payment only | Explicit money/inventory invariant under test |
| `/api/test/reset` endpoint | Enables isolated API + E2E tests without restart overhead |
| dotenvx for test credentials | `npm run env:encrypt` (`dotenvx encrypt`) encrypts values in `.env` in place; `.env.keys` holds `DOTENV_KEY` (gitignored); all test scripts run via `dotenvx run --` which decrypts at subprocess start — no credential appears in any source file or environment after the process launches |
| `tests/data/testData.ts` + `e2eTestData.ts` | Two TypeScript files: `testData.ts` exports `CARDS` (19), `CARTS` (20), `DISCOUNTS` (12), `STOCK` (5), `SCHEMA_FIXTURES` (9) — shared by unit, API and contract tests; `e2eTestData.ts` exports `UI_JOURNEYS` (17) + `UI_SPECIALS` (3) for Playwright; imported directly — no JSON parsing, no loader utility, full IDE type-inference and `satisfies`-based type checking |
| `tests/helpers/card.ts` + named constants | `validCard()` used in `payment.test.ts`; card numbers loaded from env via `requireEnv()` — intent in the name, not the digit |
| `tests/helpers/cart.ts` factory | `cartItem(id, qty?)` replaces `{ itemId, quantity }` literals — one rename to fix all usages |
| Allure reporting | `allure-vitest` and `allure-playwright` write JSON results to `allure-results/` after every run; `allure-commandline` generates an interactive HTML report; CI uploads `allure-report-unit` and `allure-report-e2e` as 30-day artifacts |
| `src/domain/errors.ts` factory | `domainError(code, message)` builds `OrderFailure` in one place; `order.ts` and `app.ts` both import it — consistent error shape guaranteed |
| Strategy Pattern for discounts | `STRATEGIES` map in `discount.ts` replaces `switch`; adding a new discount code is one map entry, nothing else changes |
| `DISCOUNT_AMOUNTS` named constants | `MEALDEAL_PENCE`, `FREESHIP_PENCE`, `FREESHIP_MIN_PENCE` exported from `discount.ts`; tests import rather than re-declare |
| `OrderPage` POM | `tests/e2e/pages/OrderPage.ts` encapsulates all locators; a `data-testid` rename touches one file, not 19 tests |
| `deductStock` / `buildOrderLines` helpers | Private helpers in `order.ts` separate stock mutation and line construction from orchestration — single level of abstraction |
| Few E2E tests (19) | Avoid inverted pyramid; keep CI green and meaningful |

---

## Gaps and potential improvements

- No load test for stock under sustained parallel traffic — the API/concurrency test (`A-11`) confirms the synchronous in-memory store cannot oversell, but does not measure throughput or latency under load (would add k6 for that).
- No visual / accessibility suite (Playwright a11y scan would be a cheap next step).
- Contract is schema-based in-repo; a multi-service world would add Pact or OpenAPI Spectral in CI.
- No mutation testing yet (`stryker`) to prove unit suite strength.
- Discount codes are case-sensitive by design — product may want normalisation (document + test either way).
- No auth, payments provider sandbox, or idempotency keys — out of scope for this minimal app.
- `OPENAI_MODEL` env var is supported but not validated; an invalid model name produces a runtime API error rather than a clear fail-fast message.
- `OrderRequest` discount code field accepts any `string` through Zod; unknown codes are caught by domain logic, not at the schema boundary — adding `z.enum(['SAVE10', 'MEALDEAL', 'FREESHIP']).optional()` would shift that check left.
- `placeOrder` still fuses validation and commitment (query + command) — a future `validateOrder` / `commitOrder` split would enable dry-run pricing without side effects.
- Allure history trend (pass/fail over time) requires persisting `allure-results/history/` between CI runs; currently each run starts fresh — wiring GitHub Pages or an S3 bucket would enable trend tracking.

---

## Scripts

```bash
# Development
npm run dev:api           # API with file-watch (tsx watch)
npm run dev:web           # Vite dev server (http://127.0.0.1:5173)
npm run start             # API without watch (used by Playwright webServer)
npm run build             # TypeScript type-check only (no emit)
npm run typecheck         # alias for build

# Tests  (all run via dotenvx run — DOTENV_KEY must be exported)
npm test                  # unit + contract + api (Vitest, no coverage)
npm run test:coverage     # same, with coverage thresholds enforced (used in CI)
npm run test:unit
npm run test:contract
npm run test:api
npm run test:e2e          # Playwright — starts API + Vite automatically
npm run test:e2e:headed   # same, with browser visible
npm run test:e2e:ui       # Playwright interactive UI mode
npm run test:all          # Vitest + Playwright

# Reporting
npm run report:generate   # allure generate allure-results → allure-report/
npm run report:open       # open the Allure HTML report in a browser

# Credentials
npm run env:encrypt       # dotenvx encrypt — encrypts .env values in place, writes .env.keys
```

Case catalogue (IDs U/C/A/E): [`docs/TEST_CASES.md`](docs/TEST_CASES.md).

---

## CI pipeline

Two jobs in `.github/workflows/ci.yml` (ubuntu-latest, Node 22, Java 17 Temurin):

1. **`unit-contract-api`** — `typecheck` → `test:coverage` (Vitest: unit + contract + api, coverage thresholds enforced) → Allure report generated → uploads `allure-report-unit` and `coverage-report` artifacts (30 days each).
2. **`e2e`** — runs only if `unit-contract-api` passes; installs Playwright Chromium; runs `test:e2e` → Allure report generated → uploads `allure-report-e2e` and `playwright-report` artifacts (30 days each).

Fast tests gate slow tests — a broken domain or API never reaches the browser. An AI coverage drift also blocks the E2E job. Coverage thresholds (90% lines/functions/statements, 80% branches) are enforced in CI via `@vitest/coverage-v8`.

**Credentials in CI:** `DOTENV_KEY` is stored as a GitHub Actions repository secret (`Settings → Secrets and variables → Actions`). It is injected into the two test steps; `dotenvx run --` (embedded in every test npm script) reads the encrypted `.env` and decrypts values into the subprocess environment before Vitest or Playwright starts.

---

## Project layout

```
src/domain/               pure business rules + Zod schemas + errors.ts   ← bulk unit tests
src/api/                  Express app (app.ts, server.ts, store.ts)
src/web/                  minimal UI (index.html, main.js, styles.css)
tests/unit/               domain cases (4 files, 34 cases)
tests/contract/           Zod schema contract (8 cases)
tests/api/                Supertest HTTP integration (15 cases)
tests/e2e/                Playwright journeys (19 cases) + fixtures.ts + helpers.ts
tests/e2e/pages/          OrderPage.ts — Page Object Model for the ordering UI
tests/helpers/            card.ts (validCard, CARD_* from env) + cart.ts (cartItem factory)
tests/data/               typed test data — imported directly, no JSON parsing, no loader utility
tests/data/testData.ts    CARDS, CARTS, DISCOUNTS, STOCK, SCHEMA_FIXTURES — shared by unit, API and contract tests
tests/data/e2eTestData.ts UI_JOURNEYS + UI_SPECIALS — all Playwright browser input data
docs/                     TEST_CASES.md — test case catalogue;
.env                      dotenvx-encrypted credential values (committed — safe to share)
.env.keys                 DOTENV_KEY (gitignored — keep in team vault only)
.env.example              credential workflow docs — variable names only, no values
.github/workflows/        ci.yml — two-job GitHub Actions pipeline
allure-results/           raw JSON results written by allure-vitest / allure-playwright (gitignored)
allure-report/            generated HTML report (gitignored; uploaded as CI artifact)
```

---

## Written summary (for submission reviewers)

**Test Strategy**

The suite follows a deliberate pyramid: 34 unit cases on pure domain functions, 8 Zod contract cases, 15 Supertest API cases, and 19 Playwright E2E journeys. The bulk of coverage sits at the unit layer because the highest-risk rules — stock atomicity, discount eligibility, payment validation — are pure functions with no HTTP or browser dependency. Testing them there means a millisecond feedback loop and deterministic failures. Contract tests lock the shared request/response shape in `src/domain/schemas.ts` so a field rename fails before any UI code is touched. API tests prove the Express wiring, status codes, and that concurrent requests cannot oversell (6 simultaneous orders for 5-unit stock; exactly 5 must succeed). E2E tests exist only for integration confidence — confirming that adding an item, applying a discount, and paying produces the right browser-visible outcome — not for re-testing rules already covered below.

**Use of AI**

AI was used as a shift-left ideation partner at the earliest stage of test design, 

The rationale is straightforward: LLMs are effective at attacking a rule set and surfacing combinations a human writing happy-path tests would skip. They are unreliable as pass/fail arbiters. So the model proposes; the engineer decides; the CI check keeps the two in sync.
