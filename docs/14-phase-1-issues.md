# 14 — Phase 1 Issues Tracker

**Status:** Active
**Last validated:** 2026-06-18
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

### P1-ISSUE-002 — Notification Delivery Has No Durable Retry Or Outbox

- **Status:** open
- **Severity:** P1 high
- **Area:** notifications, backend, operations
- **Source:** production-readiness review
- **Validation:** valid. Confirmed 2026-06-18: lead creation commits the database row, then schedules best-effort `BackgroundTasks`; `NotificationService` returns failed/skipped delivery objects and logs failures, but there is no durable delivery table or retry worker.
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
- **Validation:** valid, with partial mitigation. Confirmed 2026-06-18: `frontend/src/lib/config.ts` still defaults to localhost when `NEXT_PUBLIC_API_BASE_URL` is absent. The production smoke script catches embedded localhost after deployment/build output exists, but the config module itself does not fail at build time.
- **Repro:** Build frontend without `NEXT_PUBLIC_API_BASE_URL`.
- **Expected:** Production build fails or clearly errors before deploy.
- **Actual:** Frontend defaults to `http://localhost:8000/api/v1`; smoke scripts catch embedded localhost, but config itself does not fail fast.
- **Relevant files:** `frontend/src/lib/config.ts`, `frontend/scripts/production-smoke.mjs`
- **Fix notes:** Add a production-target guard that fails only for real production builds/deploys, not local test builds. A safe direction is a dedicated `frontend/scripts/validate-env.mjs` run in CI/Vercel before `next build`, requiring `NEXT_PUBLIC_API_BASE_URL` whenever `NEXT_PUBLIC_SITE_URL`/deployment target is `properrent.co.uk`.
- **Tests to add:** config unit test or script test for missing production API URL.

### P1-ISSUE-006 — Chatbot Only Supports Renter Intake Action

- **Status:** open
- **Severity:** P2 medium
- **Area:** chatbot, frontend, API contract
- **Source:** chatbot functionality review
- **Validation:** valid as a UX gap, not a broken Phase 1 lead-capture path. Confirmed 2026-06-18: the chatbot can answer landlord questions generally, but `suggested_action` only supports `show_intake_form`, and the widget routes that action to `/register/renter`.
- **Repro:** Ask "I am a landlord" or landlord-specific follow-up question in the chatbot.
- **Expected:** Assistant can route to the landlord intake form when appropriate.
- **Actual:** `suggested_action` only allows `show_intake_form`, and the widget links to renter registration.
- **Relevant files:** `backend/app/schemas/chat.py`, `backend/app/services/ai_chat.py`, `frontend/src/components/chat/chat-widget.tsx`, `docs/04-api-contracts.md`
- **Fix notes:** Decide whether to add `show_landlord_form` to Phase 1 or defer richer action routing to Phase 2 channel work. If fixed in Phase 1, update the contract, prompt, action allowlist, frontend routing, and tests.
- **Tests to add:** backend action allowlist test; frontend test proving landlord action links to `/register/landlord`.

### P1-ISSUE-007 — Renter Scoring Rules Need Product Calibration

- **Status:** open
- **Severity:** P2 medium
- **Area:** scoring, intake, admin, product
- **Source:** user report and code review
- **Validation:** partially valid. Confirmed 2026-06-18: renter scoring is real and hardcoded in `lead_scoring.py`; landlords are intentionally unscored by design and every landlord submission notifies the agent. The misleading landlord detail label was fixed from "Priority" to "Interest summary".
- **Repro:** Submit renter forms across different budget/timing/employment combinations, then compare admin prioritization and hot-alert thresholds.
- **Expected:** Renter scoring should match current business expectations and should be calibrated against early lead outcomes. Landlord admin UI should not imply numeric scoring unless a landlord scoring model exists.
- **Actual:** Renter scoring uses a fixed rubric and static budget baselines. This is functional, but still needs product calibration once real or rehearsal leads exist. Landlord scoring remains intentionally absent.
- **Relevant files:** `backend/app/services/lead_scoring.py`, `backend/app/routers/leads.py`, `backend/app/routers/landlords.py`, `frontend/src/app/admin/(protected)/landlords/[landlordId]/page.tsx`, `docs/03-data-model.md`, `docs/05-user-flows.md`
- **Fix notes:** Keep the current renter thresholds for launch rehearsal, but review score distribution weekly against actual conversion/contact outcomes. If thresholds change, update docs and regression tests together.
- **Tests to add:** scoring boundary/regression tests for any changed renter rubric; admin test coverage if landlord scoring is ever introduced.

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

### P1-ISSUE-001 — Chat UI State Resets On Page Navigation

- **Status:** fixed
- **Severity:** P1 high
- **Area:** chatbot, frontend, backend
- **Resolution:** Added a scrubbed public `GET /api/v1/chat/history` endpoint keyed by the existing anonymous `session_id`, stores assistant `suggested_action` values in transcript entries, and restores the visible widget transcript when the chat component remounts. The browser still stores only the session id, not the full transcript.
- **Relevant files:** `backend/app/routers/chat.py`, `backend/app/schemas/chat.py`, `backend/app/services/ai_chat.py`, `frontend/src/lib/api/client.ts`, `frontend/src/components/chat/chat-widget.tsx`, `docs/04-api-contracts.md`
- **Verification:** Backend history endpoint tests assert scrubbed transcript exposure and empty-history behavior. Frontend widget tests assert restored user/assistant messages and restored intake CTA.

### P1-ISSUE-004 — Public Intake Text Fields Need Explicit Backend Length Caps

- **Status:** fixed
- **Severity:** P2 medium
- **Area:** intake, backend, frontend
- **Resolution:** Added backend length caps for public renter and landlord text fields, aligned frontend `maxLength` attributes, and regenerated OpenAPI/client contract types.
- **Relevant files:** `backend/app/schemas/renter.py`, `backend/app/schemas/landlord.py`, `frontend/src/components/forms/renter-intake-form.tsx`, `frontend/src/components/forms/landlord-intake-form.tsx`, `docs/04-api-contracts.md`
- **Verification:** Schema tests cover oversized text rejection; contract generation/checks cover the public API shape.

### P1-ISSUE-005 — Chat Sends Raw User PII To LLM Provider

- **Status:** fixed
- **Severity:** P1 high
- **Area:** chatbot, security/privacy
- **Resolution:** Scrubbed email addresses and common UK phone patterns before building provider-bound LLM messages, while keeping the stored transcript scrubbed as before. Structured contact collection remains in the intake forms.
- **Relevant files:** `backend/app/services/ai_chat.py`, `backend/tests/unit/test_ai_chat.py`, `backend/tests/integration/test_chat.py`, `docs/04-api-contracts.md`
- **Verification:** Chat service tests assert provider-bound content excludes raw email/phone values.

### P1-ISSUE-008 — Select Inputs Are Visually Inconsistent With The Design System

- **Status:** fixed
- **Severity:** P2 medium
- **Area:** frontend, admin, design system
- **Resolution:** Updated the shared select control styling and routed compact admin status selects through the same visual treatment, including consistent border/background/focus affordances and a dropdown icon.
- **Relevant files:** `frontend/src/components/ui/field.tsx`, `frontend/src/components/admin/lead-status-update-form.tsx`, `frontend/src/components/admin/lead-update-form.tsx`, `frontend/src/components/admin/landlord-update-form.tsx`
- **Verification:** Frontend lint/type checks cover the component changes; manual browser visual smoke is still recommended before launch because native option menus remain OS/browser-rendered.

---

## 6. Deferred Issues

Move issues here only when there is an explicit decision to defer them. Include the reason and the phase/review point where they should be revisited.
