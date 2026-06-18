# 14 — Phase 1 Issues Tracker

**Status:** Active
**Purpose:** Track Phase 1 defects, integration gaps, launch blockers, and refactor candidates until they are resolved or explicitly deferred.

Use this file as the shared backlog for issues found during manual review, production-readiness checks, staging dry runs, and early launch monitoring.

---

## 1. How To Use This Tracker

For each issue, keep the entry short but complete enough that another engineer can reproduce and fix it.

Recommended fields:

- **Status:** `open`, `in progress`, `fixed`, `deferred`, `won't fix`
- **Severity:** `P0 blocker`, `P1 high`, `P2 medium`, `P3 low`
- **Area:** `backend`, `frontend`, `chatbot`, `admin`, `intake`, `notifications`, `deployment`, `docs`, `security/privacy`
- **Source:** where it was found, such as manual QA, test failure, production smoke, user report, code review
- **Repro:** exact steps or request payload
- **Expected:** intended behavior
- **Actual:** observed behavior
- **Fix notes:** implementation direction, linked files, tests to add
- **Resolution:** final summary once fixed

When an issue changes API shape, data model, privacy behavior, or launch scope, update the relevant source doc in the same fix.

---

## 2. Severity Guide

| Severity | Meaning |
|---|---|
| P0 blocker | Must be fixed before real lead capture or production traffic. Data loss, security exposure, broken lead capture, broken admin auth, or production outage. |
| P1 high | Should be fixed before launch or immediately after. Core workflow risk, missed notifications, privacy weakness, or confusing user-facing behavior. |
| P2 medium | Important but not launch-blocking if operational workaround exists. UX friction, missing resilience, incomplete observability, or maintainability risk. |
| P3 low | Cleanup, copy polish, minor edge case, or future refactor candidate. |

---

## 3. Open Issues

### P1-ISSUE-001 — Chat UI State Resets On Page Navigation

- **Status:** open
- **Severity:** P1 high
- **Area:** chatbot, frontend
- **Source:** user report and code review
- **Repro:** Start a chat, navigate to another public page, reopen the chat widget.
- **Expected:** The visible chat history remains available for the same visitor session.
- **Actual:** The widget can reset to the intro message because only `session_id` is persisted. Chat messages live in React state.
- **Relevant files:** `frontend/src/components/chat/chat-widget.tsx`, `frontend/src/lib/session.ts`, `frontend/src/components/layout/site-shell.tsx`, `backend/app/services/ai_chat.py`
- **Fix notes:** Move public shell/chat widget into a persistent public layout and add a public scrubbed chat-history restore endpoint keyed by `session_id`. Avoid storing raw full transcripts in browser `localStorage`.
- **Tests to add:** frontend navigation test proving chat survives route changes; backend history endpoint test proving only scrubbed transcript fields are returned.

### P1-ISSUE-002 — Notification Delivery Has No Durable Retry Or Outbox

- **Status:** open
- **Severity:** P1 high
- **Area:** notifications, backend, operations
- **Source:** production-readiness review
- **Repro:** Submit a renter or landlord lead while Resend is unavailable or returns an error.
- **Expected:** Lead is stored, notification failure is visible, and delivery can be retried.
- **Actual:** Lead is stored and notification failure is logged/returned internally, but no durable failure record or retry queue exists.
- **Relevant files:** `backend/app/routers/leads.py`, `backend/app/routers/landlords.py`, `backend/app/services/notifications.py`
- **Fix notes:** Add a durable notification outbox table or job queue. Store template, recipient kind, entity id, status, attempts, last error, and retry timestamps. Process asynchronously with retry/backoff.
- **Tests to add:** integration test for failed notification creating retryable outbox record; worker/unit test for retry success and max-attempt failure.

### P1-ISSUE-003 — Frontend Production API URL Does Not Fail Fast When Missing

- **Status:** open
- **Severity:** P2 medium
- **Area:** frontend, deployment
- **Source:** production-readiness review
- **Repro:** Build frontend without `NEXT_PUBLIC_API_BASE_URL`.
- **Expected:** Production build fails or clearly errors before deploy.
- **Actual:** Frontend defaults to `http://localhost:8000/api/v1`; smoke scripts catch embedded localhost, but config itself does not fail fast.
- **Relevant files:** `frontend/src/lib/config.ts`, `frontend/scripts/production-smoke.mjs`
- **Fix notes:** Add production build/runtime guard requiring `NEXT_PUBLIC_API_BASE_URL` when `NEXT_PUBLIC_SITE_URL` is production or when `NODE_ENV=production` in deployment.
- **Tests to add:** config unit test or script test for missing production API URL.

### P1-ISSUE-004 — Public Intake Text Fields Need Explicit Backend Length Caps

- **Status:** open
- **Severity:** P2 medium
- **Area:** intake, backend
- **Source:** production-readiness review
- **Repro:** Submit very large `notes`, `accessibility_needs`, or `property_address` values.
- **Expected:** Backend rejects oversized text with clear 422 validation errors.
- **Actual:** Some public text fields are not explicitly capped in the Pydantic schemas.
- **Relevant files:** `backend/app/schemas/renter.py`, `backend/app/schemas/landlord.py`
- **Fix notes:** Add reasonable `max_length` constraints for all public free-text fields and align frontend validation/copy.
- **Tests to add:** schema/unit or integration tests for oversized text rejection.

### P1-ISSUE-005 — Chat Sends Raw User PII To LLM Provider

- **Status:** open
- **Severity:** P1 high
- **Area:** chatbot, security/privacy
- **Source:** chatbot functionality review
- **Repro:** Send a chat message containing an email address or UK phone number.
- **Expected:** Stored transcript is scrubbed, and provider-bound content is minimized or scrubbed where possible.
- **Actual:** Stored transcript is scrubbed, but raw user message is still sent to the LLM provider.
- **Relevant files:** `backend/app/services/ai_chat.py`, `backend/tests/unit/test_ai_chat.py`, `backend/tests/integration/test_chat.py`
- **Fix notes:** Scrub or partially redact PII before LLM calls while preserving enough context for useful answers. Keep structured contact details in intake forms only.
- **Tests to add:** update existing tests so provider-bound prompt content excludes raw email/phone.

### P1-ISSUE-006 — Chatbot Only Supports Renter Intake Action

- **Status:** open
- **Severity:** P2 medium
- **Area:** chatbot, frontend, API contract
- **Source:** chatbot functionality review
- **Repro:** Ask "I am a landlord" or landlord-specific follow-up question in the chatbot.
- **Expected:** Assistant can route to the landlord intake form when appropriate.
- **Actual:** `suggested_action` only allows `show_intake_form`, and the widget links to renter registration.
- **Relevant files:** `backend/app/schemas/chat.py`, `backend/app/services/ai_chat.py`, `frontend/src/components/chat/chat-widget.tsx`, `docs/04-api-contracts.md`
- **Fix notes:** Decide whether to add `show_landlord_form` to Phase 1. If yes, update contract, prompt, action allowlist, frontend routing, and tests.
- **Tests to add:** backend action allowlist test; frontend test proving landlord action links to `/register/landlord`.

### P1-ISSUE-007 — Scoring And Prioritization Rules Need Product Review

- **Status:** open
- **Severity:** P2 medium
- **Area:** scoring, intake, admin, product
- **Source:** user report and code review
- **Repro:** Submit renter and landlord forms, then compare admin prioritization. Renters receive `intent_score`; landlords do not. Landlord detail shows a "Priority" label derived from stated product interest only.
- **Expected:** Admin prioritization should be clear, intentional, and not misleading for both renter and landlord workflows.
- **Actual:** Renter scoring is implemented through a hardcoded rubric using move-in timing, budget realism, employment, guarantor, property interest, rental history, and contact details. Landlords are explicitly not scored by design, but the admin UI still uses "Priority" wording based on `advanced_rent_interest` and `listing_interest`, which may imply a comparable scoring model.
- **Relevant files:** `backend/app/services/lead_scoring.py`, `backend/app/routers/leads.py`, `backend/app/routers/landlords.py`, `frontend/src/app/admin/(protected)/landlords/[landlordId]/page.tsx`, `docs/03-data-model.md`, `docs/05-user-flows.md`
- **Fix notes:** Review whether the renter scoring rubric and hardcoded area rent baselines match current business expectations. Decide whether landlord leads should remain unscored, get a lightweight priority label, or get an explicit landlord scoring model. If landlords remain unscored, rename UI wording from "Priority" to "Product interest" or similar.
- **Tests to add:** scoring boundary/regression tests for any changed renter rubric; frontend/admin test asserting landlord wording does not imply numeric scoring if no landlord score exists.

### P1-ISSUE-008 — Select Inputs Are Visually Inconsistent With The Design System

- **Status:** open
- **Severity:** P2 medium
- **Area:** frontend, admin, design system
- **Source:** user report and code review
- **Repro:** Open renter/landlord forms or admin lead/landlord status controls and inspect select dropdowns across browsers.
- **Expected:** Select controls should feel consistent with the rest of the Proper Rent UI, including border, background, focus, icon affordance, compact/admin variants, disabled state, and status styling.
- **Actual:** The shared `SelectInput` is a native `<select>` with basic classes and no custom affordance. The inline admin lead-status control bypasses `SelectInput` and uses its own native `<select>`. Native option menus render differently by OS/browser, which can make the UI feel simple or inconsistent.
- **Relevant files:** `frontend/src/components/ui/field.tsx`, `frontend/src/components/admin/lead-status-update-form.tsx`, `frontend/src/components/admin/lead-update-form.tsx`, `frontend/src/components/admin/landlord-update-form.tsx`, `frontend/src/components/forms/renter-intake-form.tsx`, `frontend/src/components/forms/landlord-intake-form.tsx`
- **Fix notes:** Create a consistent select primitive or variants for form selects and compact admin status selects. At minimum, add a shared wrapper/icon style and route all select usage through it. If richer option styling is required, consider a custom accessible listbox/select component rather than relying on native option menu styling.
- **Tests to add:** component tests for select variants where practical; Playwright visual/interaction smoke for renter form selects and admin status selects.

---

## 4. New Issues To Triage

Use this section for quick capture before full triage.

### P1-ISSUE-XXX — Title

- **Status:** open
- **Severity:** TBD
- **Area:** TBD
- **Source:** TBD
- **Repro:** TBD
- **Expected:** TBD
- **Actual:** TBD
- **Relevant files:** TBD
- **Fix notes:** TBD
- **Tests to add:** TBD

---

## 5. Fixed Issues

Move resolved issues here with a short resolution note and the verification that proved the fix.

### Example

- **Issue:** P1-ISSUE-000 — Example resolved issue
- **Resolution:** Fixed in commit/PR TBD.
- **Verification:** Test or smoke command TBD.

---

## 6. Deferred Issues

Move issues here only when there is an explicit decision to defer them. Include the reason and the phase/review point where they should be revisited.
