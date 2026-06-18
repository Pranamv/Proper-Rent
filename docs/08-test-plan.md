# 08 — Test Plan

**Reference:** Requirements in `01-mvp-prd.md`; constraints in `07-development-standards.md`.

---

## 1. Principles

- Test business invariants, not implementation details.
- No test calls a real external service (OpenRouter, Supabase, Resend) — all are mocked or use a local test database.
- Every bug fix adds a regression test. Every endpoint has happy-path + primary-error tests.
- Tests are order-independent. A failing test is fixed, never disabled.

---

## 2. Layers

### 2.1 Unit tests (`tests/unit/`)
Fast, no I/O. Cover pure logic:
- `lead_scoring.py` — every rubric branch and threshold boundary (69 vs 70, etc.).
- PII scrubber — emails and UK phone formats redacted; non-PII left intact.
- `suggested_action` allowlist validation (`show_intake_form|null` in Phase 1).

### 2.2 Integration tests (`tests/integration/`)
Run against a local/test Postgres with a seeded schema. Cover endpoints end-to-end with external services mocked:
- `POST /leads` — happy path creates a row + correct score; `consent_given=false` → 422; duplicate email → `200 OK` with existing `renter_id`, no duplicate row, current-session conversations linked, and no duplicate emails/alerts; session linking attaches conversations.
- `POST /chat` — returns reply + valid `suggested_action`; response contains **no** internal fields and no `properties` data; fintech/process questions answered from the default system prompt; PII in a message is not persisted to transcript; mismatched `renter_id`/`session_id` does not load the renter profile; LLM timeout/error returns `200 OK` with fallback reply.
- `POST /landlords` — consent enforcement; confirmation + agent notification emails sent (mocked).
- Admin routes — 401 unauthenticated, 403 non-admin, 200 admin; detail routes return one lead/landlord; PATCH updates status (leads and landlords).
- `GET /admin/leads/{id}/conversation` — returns all linked conversations when more than one exists.

### 2.3 Frontend unit/component and e2e tests
Vitest tests live next to frontend code under `frontend/src/**/*.test.ts(x)`. Playwright tests live under `frontend/e2e/` and cover the critical golden paths against a mocked backend:
- Renter intake: multi-step form completes → confirmation state shown (REQ-027).
- Landlord intake: form completes → confirmation state shown (REQ-033).
- Chatbot widget: opens, sends a message, shows reply and (when present) the "open intake form" suggestion; respects `prefers-reduced-motion`.
- Admin: login redirect for unauthenticated users; leads list renders; landlords list renders.

### 2.4 Contract tests
- Pydantic response models match `04-api-contracts.md`. A schema drift (e.g. `intent_score` leaking into the chat response) fails a test.
- A dedicated test asserts the chat response model has no internal field names and no `property_id`/`properties` fields.

### 2.5 Optional later — Sync/listing tests (not in Phase 1 or Phase 2 core scope)
- `property_search.py` — query construction (filters applied correctly; area maps to locality + section_text).
- `content_hash` diffing: unchanged listing is not re-fetched; changed listing updates.
- Lifecycle transitions: present → `active`; absent → `missing` + `missing_from_source_at`; missing >7d → `inactive`.
- `locality`/`region` extraction from `address` JSONB populates the flat columns.
- Advisory lock prevents concurrent runs (simulated).
- Failure handling: partial failure retains prior data; error rate >5% raises an alert (mocked).
- `GET /properties` and `GET /properties/{id}` — filters work; exposure rules; 404 for inactive/missing; freshness predicate (active + within 24h).

---

## 3. What each component must prove

| Component | Must prove |
|---|---|
| Intent scoring | Correct score for representative renter profiles; threshold boundaries; product flags set. |
| Chatbot | No PII stored; no internal fields or `properties` data returned; generic fintech/process answers; injection instructions ignored; graceful fallback on gateway error. |
| Intake | Consent enforced; score computed; conversations linked; confirmation + hot-lead alert sent (mocked). |
| Admin | AuthN/AuthZ boundaries; pipeline updates. |
| GDPR | Erasure nulls PII but retains row + financial fields. |

*(Optional later listing work adds: Properties API filtering/exposure; sync diffing, lifecycle, locality extraction, single-instance lock.)*

---

## 4. Verification command bundle

Run before every PR; CI runs the same:
```bash
cd backend
ruff check app tests
ruff format --check app tests
mypy app
pytest
python scripts/export_openapi.py --check ../contracts/openapi.json
pip-audit -r requirements.txt

cd ../frontend
npm run lint
npm run typecheck
npm run test
npm run contract:check
npm run test:e2e
npm run build
npm run smoke:public
npm audit --audit-level=high
```

Optional later sync worker checks (not run in Phase 1 CI):
```bash
pytest tests/integration/test_scraye_sync.py
```

---

## 5. CI pipeline (minimum)

On every PR:
1. `ruff` lint + format check
2. `mypy` type check
3. `pytest` with the configured backend coverage gate
4. OpenAPI contract drift check
5. dependency vulnerability scan
6. secret scan
7. frontend lint, typecheck, unit/component tests, OpenAPI type drift check, build, and public smoke
8. frontend e2e smoke tests (Playwright, golden paths from §2.3) against a mocked backend

Before production:
- migration up/down test (Alembic reversible)
- contract tests
- smoke test against a staging deploy
- health-check endpoint responds

Agents are not trusted more than CI is strong — keep CI as the authority.

---

## 6. Test data

- Renter profile fixtures spanning each score band (hot/warm/nurture/cold) and each product-flag case (Deposit Share candidate, Guarantor candidate).
- Conversation fixtures with and without a linked `renter_id`, and one containing PII to prove scrubbing.

---

## 7. Out of scope for Phase 1 testing
- Scraye sync worker and `properties`/`transactions` data (optional later — see §2.4).
- WhatsApp/Messenger webhook tests (Phase 2).
- RAG/vector relevance tests (Phase 3).
- Load testing (revisit when volume justifies it).
