# 11 — Phase 1 Implementation Plan

**Phase:** Website + Chatbot MVP
**Roadmap reference:** `09-roadmap.md`
**Primary requirements:** `01-mvp-prd.md`
**Supporting docs:** `02-architecture.md`, `03-data-model.md`, `04-api-contracts.md`, `05-user-flows.md`, `06-security-gdpr.md`, `07-development-standards.md`, `08-test-plan.md`, `10-design-system.md`

This is the execution plan for Phase 1. It breaks the MVP into implementation slices that can become branches, PRs, or agent tasks. The plan is intentionally scoped to the website funnel only: public pages, chatbot, renter/landlord intake, notifications, and basic admin.

---

## 1. Phase 1 Target

Phase 1 is complete when a visitor can:

1. Land on the Proper Rent website.
2. Ask the chatbot general questions about Proper Rent, the letting process, or Scraye fintech products.
3. Submit a renter or landlord intake form with consent.
4. Receive a confirmation state and confirmation email.
5. Trigger an agent briefing/notification.
6. Be managed by the agent in the admin panel.

The chatbot helps and routes. It does not close deals, claim live availability, quote per-listing figures, collect full contact details, or expose internal scores.

---

## 2. Hard Boundaries

Build in Phase 1:

- Next.js public website and admin UI.
- FastAPI backend with chat, leads, landlords, admin, and health routes.
- Supabase Postgres schema and admin auth integration.
- OpenRouter-backed LLM client through `services/llm_client.py`.
- Renter/landlord confirmation emails and agent notifications through Resend.
- Cookieless analytics.
- CI, tests, and launch smoke checks.

Do not build in Phase 1:

- WhatsApp, Messenger, or Meta webhooks.
- Authenticated renter dashboard.
- Standalone eligibility checker page.
- Nurture email automation.
- Scraye sync worker, listing ingestion, public listings, listing detail pages, or property search.
- Per-listing fintech quoting or availability claims.
- In-app commission tracker or `transactions` workflow.
- RAG/vector search.

`properties` and `transactions` may be created by the initial migration for schema stability, but they must remain empty and unused.

---

## 3. Implementation Order

| Milestone | Workstreams | Why this order |
|---|---|---|
| P1.0 Build readiness | Repo/app scaffold, env, CI skeleton | Gives every later task a stable place to land. |
| P1.1 Data foundation | Migration, models, schemas, auth deps | Endpoints need stable contracts and persistence. |
| P1.2 Intake and notifications | Scoring, leads, landlords, Resend templates | Lead capture is the revenue-critical core and can be tested without AI. |
| P1.3 Chatbot | LLM client, AI service, chat route, PII scrub | Adds the assistant once persistence/scoring rules exist. |
| P1.4 Public frontend | Pages, forms, chat widget, SEO, analytics | Connects the backend to the user-facing funnel. |
| P1.5 Admin operations | Admin shell, lead/landlord views, status updates | Enables the human handoff and daily operations. |
| P1.6 Launch hardening | Security, legal pages, monitoring, staging/prod smoke | Prevents collecting real leads before compliance and reliability gates are met. |

---

## 4. Task Cards

Each task should be small enough to review. If a task starts touching unrelated files or crossing more than one workstream, split it.

### P1.0 — Build Readiness

#### P1.0.1 Repository and application scaffold

**Output**
- `backend/` FastAPI project structure matching `02-architecture.md` §5.
- `frontend/` Next.js TypeScript project structure.
- Basic local run commands documented in a README or existing setup doc.
- Backend health route placeholder and frontend shell page.

**Acceptance**
- Backend starts locally and returns `GET /api/v1/health`.
- Frontend starts locally and renders a simple shell.
- No business logic, fake lead capture, or listing features are added.

**Tests**
- Minimal backend health test.
- Frontend build/typecheck command wired, even if UI is still skeletal.

#### P1.0.2 Environment and configuration baseline

**Output**
- `backend/app/config.py` using Pydantic BaseSettings.
- `.env.example` with placeholders for all Phase 1 variables from `06-security-gdpr.md` §2.
- Separate variables for public frontend API URL and analytics domain/site ID.

**Acceptance**
- App fails fast with clear errors for missing required backend config in non-test environments.
- Test environment can run without real OpenRouter, Supabase, or Resend secrets.
- No real secret appears in source.

**Tests**
- Config unit test for required/default values.
- Secret scan in CI.

#### P1.0.3 CI baseline

**Output**
- CI workflow with lint/type/test placeholders for backend and frontend.
- Dependency scan and secret scan configured.

**Acceptance**
- CI runs on pull request.
- Checks are allowed to be minimal at first, but every later task must strengthen them rather than bypass them.

**Tests**
- CI proves the scaffold can install dependencies and run the current verification bundle.

---

### P1.1 — Data Foundation

#### P1.1.1 Database connection and session management

**Output**
- SQLAlchemy 2.x async/sync setup, matching the chosen FastAPI pattern.
- Request-scoped DB session dependency.
- Test database configuration path.

**Acceptance**
- Routers can depend on a DB session without owning engine/session creation.
- Tests do not connect to production Supabase.

**Tests**
- Integration test can create and roll back data in an isolated test database.

#### P1.1.2 Initial Alembic migration

**Output**
- Initial reversible migration for `agents`, `renters`, `conversations`, `landlords`, `properties`, and `transactions`.
- Indexes and checks from `03-data-model.md` where applicable.
- `properties` and `transactions` included as schema placeholders only.

**Acceptance**
- Migration up/down succeeds.
- Consent fields are non-null on renter/landlord tables.
- Status fields have allowed-value checks.
- No seed or app path writes to `properties` or `transactions`.

**Tests**
- Migration smoke test.
- Optional direct schema assertions for important columns/checks.

#### P1.1.3 ORM models and Pydantic schemas

**Output**
- ORM models for Phase 1 tables.
- Pydantic request/response schemas for chat, leads, landlords, admin, and health.
- Schema-only model coverage for `properties`/`transactions` only if needed for migration/FK consistency.

**Acceptance**
- Public response schemas cannot include internal renter/admin fields.
- Chat response schema only allows `reply`, `suggested_action`, and `session_id`.
- Admin schemas can expose internal fields only behind admin auth.

**Tests**
- Contract tests for public response models.
- Dedicated assertion that chat responses cannot expose `intent_score`, `property_id`, or `properties`.

#### P1.1.4 Admin auth dependencies

**Output**
- Supabase JWT verification dependency for `/admin/*`.
- Role check through the `agents` table (`agents.role='admin'`) after Supabase JWT verification.
- Shared 401/403 behavior.

**Acceptance**
- No self-service admin registration.
- Missing token returns 401.
- A valid Supabase user without an `agents` row or without `agents.role='admin'` returns 403.
- Admin token can reach admin routes.

**Tests**
- Auth dependency unit tests with mocked/fixture JWTs.
- Integration tests on at least one admin route for 401, 403, and 200.

---

### P1.2 — Intake, Scoring, and Notifications

#### P1.2.1 Lead scoring service

**Output**
- `services/lead_scoring.py` implementing `03-data-model.md` §8.
- Product flag output for Deposit Share and Guarantor candidates.
- Threshold helper for hot/warm/standard/low priority.

**Acceptance**
- Move-in, budget, employment, guarantor, property-interest, rental-history, and contact-detail signals are all represented.
- Website scoring never filters out a submitted lead.
- Hot threshold is `>= 70`.

**Tests**
- Unit tests for every rubric branch.
- Boundary tests, especially 69 vs 70.
- Product-flag tests for no guarantor, student, self-employed, and Universal Credit cases.

#### P1.2.2 PII scrubber

**Output**
- Lightweight scrubber for email and UK phone patterns.
- Shared function used before persisting chat transcript content.

**Acceptance**
- Scrubber redacts email/phone to `[redacted]`.
- Non-PII text remains readable.
- Scrubber is not used as a substitute for consent on structured form data.

**Tests**
- Unit tests for common UK phone formats and email formats.
- Regression fixture proving transcript persistence uses scrubbed content.

#### P1.2.3 Notification service and templates

**Output**
- `services/notifications.py` wrapping Resend.
- Templates for renter confirmation, landlord confirmation, hot renter alert, and landlord agent notification.
- Test/mocked email transport path.

**Acceptance**
- No endpoint imports Resend directly.
- `ADMIN_ALERT_EMAIL` controls agent notifications.
- Email templates avoid sensitive over-sharing and include appropriate next-step copy.
- Email send failures are handled explicitly and logged without PII.

**Tests**
- Unit tests for template selection and recipient routing.
- Integration tests mock Resend and assert exactly one expected email per trigger.

#### P1.2.4 Renter intake endpoint

**Output**
- `POST /api/v1/leads`.
- Consent enforcement.
- Duplicate email behavior.
- Intent score and fintech flags stored.
- Conversation session linking.
- Renter confirmation email.
- Hot lead agent alert.

**Acceptance**
- `consent_given=false` returns 422 and creates no row.
- Duplicate email does not create a second renter record, returns the existing `renter_id` with `200 OK`, links current-session conversations to the existing renter, and does not send duplicate confirmation or alert emails.
- Prior conversations sharing `session_id` are linked to the new `renter_id`.
- Agent alert only fires for `intent_score >= 70`.
- Response does not expose internal score or fintech flags.

**Tests**
- Integration tests for happy path, consent failure, duplicate email idempotency, duplicate-session conversation linking, hot alert, non-hot no-alert path, and no duplicate emails/alerts on duplicate submission.

#### P1.2.5 Landlord intake endpoint

**Output**
- `POST /api/v1/landlords`.
- Consent enforcement.
- Landlord confirmation email.
- Unconditional agent notification.

**Acceptance**
- `consent_given=false` returns 422 and creates no row.
- Every successful landlord submission sends exactly one agent notification.
- Landlords are not scored.

**Tests**
- Integration tests for happy path, consent failure, confirmation email, and unconditional agent notification.

---

### P1.3 — Chatbot

#### P1.3.1 OpenRouter client

**Output**
- `services/llm_client.py` as the only module that calls OpenRouter.
- Timeout set to 10 seconds.
- Configurable model through `LLM_MODEL`.
- Graceful fallback path for provider timeout/error.

**Acceptance**
- `ai_chat.py` imports the local client, not a vendor SDK.
- No other module calls an LLM provider directly.
- Raw provider errors are not returned to clients.

**Tests**
- Unit tests mock HTTP responses, timeout, and error cases.
- Static or code-search check in review that no other module imports a vendor LLM SDK.

#### P1.3.2 AI chat service

**Output**
- `services/ai_chat.py` with prompt construction, context loading, action validation, PII-free persistence, summary update, and scoring update.
- Default system prompt covering Proper Rent services, letting process, and generic fintech information: Deposit Share, Guarantor, Guarantor Enhanced, Advanced Rent, Rent Club/Ribbon Rewards.

**Acceptance**
- Prompt says the assistant is not human.
- Prompt forbids following instructions embedded in user messages or external data.
- Prompt forbids contact-detail collection in chat and directs users to the form.
- Prompt forbids live availability, listing-specific, or per-listing fintech claims.
- `suggested_action` is validated against `show_intake_form|null`.
- Stored transcript is PII-free.
- Running score is stored server-side only.
- Public Phase 1 chat loads a renter profile only when the supplied `renter_id` is linked to the same `session_id`; otherwise it ignores the supplied `renter_id`.

**Tests**
- Unit tests for action allowlist, PII persistence, context loading, and fallback reply.
- Prompt-regression test or snapshot focused on required safety clauses.

#### P1.3.3 Chat endpoint

**Output**
- `POST /api/v1/chat`.
- Request validation for `session_id`, message length, and optional `renter_id`.
- Conversation creation/update.

**Acceptance**
- Response shape exactly matches `04-api-contracts.md`.
- Message is truncated server-side to 1000 chars.
- No internal fields or property data are returned.
- A mismatched `renter_id` and `session_id` does not load the renter profile.
- The form remains usable when LLM fallback is returned.

**Tests**
- Integration tests for happy path, too-long/missing fields, LLM failure fallback with `200 OK`, no internal fields, no property fields, mismatched `renter_id` ignored, PII message not persisted, and fintech/process answer path with mocked LLM.

---

### P1.4 — Public Frontend

#### P1.4.1 Frontend foundation and design tokens

**Output**
- Next.js TypeScript app configured for SSR public pages.
- Tailwind token structure.
- shadcn/ui-style primitives or equivalent component base.
- Motion setup with reduced-motion support.

**Acceptance**
- Shared tokens used by public and admin surfaces.
- No page relies on animation to render content.
- No decorative component introduces layout shift.

**Tests**
- Frontend typecheck and build pass.
- Basic accessibility smoke check can run in Playwright.

#### P1.4.2 Public pages

**Output**
- Home.
- For Renters with fintech overview and FAQ.
- For Landlords with Advanced Rent explainer and FAQ.
- About / How it works.
- Privacy Policy.
- Terms.

**Acceptance**
- No listings page or listing-detail route is built.
- Copy is consistent with Phase 1: generic fintech/process education only.
- Public pages include per-page title and meta description.
- FAQ structured data is added where applicable.
- CTAs route to renter/landlord registration forms.

**Tests**
- Frontend route smoke tests.
- SEO metadata smoke check for core pages.
- Accessibility checks for heading order, focus states, and contrast where automated tooling can cover it.

#### P1.4.3 Renter multi-step intake form

**Output**
- Renter registration form matching `04-api-contracts.md`.
- Client-side validation aligned with backend constraints.
- GDPR consent checkbox with versioned text.
- Confirmation state after 201 or the duplicate-email `200 OK` path.

**Acceptance**
- Form is keyboard-operable.
- Inputs have labels and accessible errors.
- Consent is required before submit.
- Submission success replaces the form with the confirmation state, not a confusing error path.
- The score is never shown to the visitor.

**Tests**
- Playwright golden path with mocked backend.
- Consent-missing client behavior.
- Confirmation state on success and duplicate response.

#### P1.4.4 Landlord intake form

**Output**
- Landlord registration form matching `04-api-contracts.md`.
- Consent checkbox with versioned text.
- Confirmation state after success.

**Acceptance**
- Landlord form does not display or calculate a score.
- Advanced Rent and listing-interest fields are captured.
- Confirmation copy reflects agent follow-up.

**Tests**
- Playwright golden path with mocked backend.
- Consent-missing client behavior.
- Confirmation state on success.

#### P1.4.5 Chatbot widget

**Output**
- Floating chat widget on all public pages.
- Session ID management.
- Message list, typing/waiting state, fallback display, and suggested-action handling.
- Option to open renter intake form when `suggested_action="show_intake_form"`.

**Acceptance**
- Widget is keyboard-operable.
- New messages are announced with `aria-live` or equivalent.
- It does not ask for or store full contact details in the UI.
- It works when the backend returns fallback copy.
- It respects `prefers-reduced-motion`.

**Tests**
- Playwright test opens widget, sends message, renders reply, handles suggested action, and covers reduced-motion mode.

#### P1.4.6 Cookieless analytics

**Output**
- Plausible or equivalent cookieless analytics integration.
- UTM-safe canonical URLs on public pages.

**Acceptance**
- No identifying analytics cookies or fingerprinting.
- No cookie banner is introduced.
- Analytics setup does not block page rendering.

**Tests**
- Build-time/env guard so analytics can be disabled in test/local.

---

### P1.5 — Admin Operations

#### P1.5.1 Admin shell and auth flow

**Output**
- Admin route group in frontend.
- Login/auth guard using Supabase Auth.
- Persistent sidebar and top bar.
- Data-driven nav by agent/admin role.

**Acceptance**
- Unauthenticated users are redirected or blocked.
- Non-admin users cannot see admin data.
- Shell includes Leads and Landlords from day one.

**Tests**
- Playwright admin auth smoke with mocked auth/backend.
- Backend integration tests remain the authority for 401/403.

#### P1.5.2 Leads list and operational stat strip

**Output**
- Leads view with list/table or board.
- Filters for status and assigned agent where supported.
- Operational stat strip: new leads today, hot leads pending, pipeline by stage.

**Acceptance**
- The UI clearly prioritises hot leads.
- Counts are operational, not a Phase 2 analytics dashboard.
- Uses the `GET /admin/leads` `summary` object defined in `04-api-contracts.md`.

**Tests**
- Component tests or Playwright smoke for rendering empty, loading, and populated states.

#### P1.5.3 Lead detail

**Output**
- Lead detail view with tabs: Overview, Conversation, Notes & Status.
- Lead detail API route: `GET /api/v1/admin/leads/{renter_id}`.
- Conversation briefing using `GET /admin/leads/{renter_id}/conversation`.
- Status/assigned-agent/notes update flow.

**Acceptance**
- Agent can see contact details, requirements, fintech flags, intent score, and conversation summary.
- Agent can update status/notes without losing current context.
- Conversation transcript displayed is the PII-scrubbed stored transcript.

**Tests**
- Admin UI smoke for detail load and status update.
- Backend integration tests for lead detail, 404 on missing lead, and conversation ordering when multiple sessions exist.

#### P1.5.4 Landlords list and detail

**Output**
- Landlords admin view using the shared table/detail pattern.
- Landlord detail API route: `GET /api/v1/admin/landlords/{landlord_id}`.
- Status/notes update flow.

**Acceptance**
- Landlord leads are not scored.
- New landlord submissions are visible and actionable.
- Advanced Rent/listing interest are visible in detail.

**Tests**
- Admin UI smoke for landlord list/detail/status update.
- Backend integration test for `GET /admin/landlords`, `GET /admin/landlords/{landlord_id}`, 404 on missing landlord, and `PATCH /admin/landlords/{landlord_id}`.

---

### P1.6 — Launch Hardening

#### P1.6.1 Security and GDPR readiness

**Output**
- Final consent text version.
- Privacy Policy and Terms pages.
- Retention/erasure runbook for non-converting leads and deletion requests.
- No-PII logging review.
- Rate limiting for public endpoints.

**Acceptance**
- Legal reviewer confirms consent wording before first lead.
- `consent_version` in frontend and backend defaults match.
- Public endpoints target 30 req/min/IP.
- `/chat` session abuse rule is implemented or documented as a launch blocker if deferred.

**Tests**
- Consent integration tests already passing.
- PII audit fixture passing.
- Manual log review in staging with test PII confirms no raw PII in logs/transcripts.

#### P1.6.2 Test coverage completion

**Output**
- Backend unit and integration suites.
- Contract tests for public response shapes.
- Frontend e2e golden paths.
- CI running the full verification bundle.

**Acceptance**
- No test calls real OpenRouter, Supabase production, or Resend.
- Every endpoint has happy-path and primary-error tests.
- Every security-sensitive rule from `06-security-gdpr.md` has at least one executable check or documented manual gate.

**Required commands**
```bash
ruff check app tests
ruff format --check app tests
mypy app
pytest tests/unit
pytest tests/integration
```

Frontend commands depend on the selected package manager, but must include:

```bash
typecheck
build
e2e smoke
```

#### P1.6.3 Deployment setup

**Output**
- Supabase project and schema migrated.
- Backend deployed to Railway/Render or chosen host.
- Frontend deployed to Vercel.
- Production environment variables set.
- Domain/DNS configured.
- Health check and uptime monitor configured.

**Acceptance**
- Production `GET /api/v1/health` returns 200 and can connect to the database.
- Frontend calls the production API successfully.
- Admin user is provisioned through Supabase dashboard or seed script.
- No production service uses test keys.

**Tests**
- Staging smoke test before production.
- Production smoke test after deployment using non-real/test data.

#### P1.6.4 Agent operations runbook

**Output**
- Short operational runbook for daily agent workflow.
- First-contact SLA by score band.
- Scraye daily check-in reminder process.
- Manual commission spreadsheet handoff.
- Lead attribution notes process for Scraye introduction IDs.

**Acceptance**
- Agent can run the Phase 1 process without asking engineering how to handle a new lead.
- The runbook matches `05-user-flows.md` §6 and §7.

**Tests**
- Dry run with one renter test lead and one landlord test lead in staging.

---

## 5. Cross-Cutting Acceptance Matrix

| Requirement area | Must be proven before launch |
|---|---|
| Consent | Renter and landlord inserts reject `consent_given=false`; consent version is stored. |
| Privacy | Chat transcripts scrub email/UK phone PII; app logs use IDs, not PII. |
| Public API safety | Chat response does not expose score, internal IDs, prompt, raw LLM output, or property data. |
| Lead routing | Every website form submission reaches the agent pipeline; hot renter leads trigger priority alert. |
| Landlords | Every landlord submission triggers an agent notification; no landlord scoring gate exists. |
| Admin auth | Admin routes return 401 without token and 403 for non-admin. |
| Listing boundary | No public listing routes, no properties router, no sync worker, no `transactions` workflow. |
| LLM resilience | LLM timeout/error returns fallback reply and does not break forms. |
| Accessibility | Public forms and chat widget are keyboard-operable and labelled; reduced motion respected. |
| CI | Lint, format check, typecheck, tests, scans, frontend build, and e2e smoke pass. |

---

## 6. Suggested PR Sequence

1. `chore/scaffold-phase-1-apps` — backend/frontend scaffold, env example, CI baseline.
2. `feat/schema-core-tables` — DB setup, Alembic migration, ORM models, schemas.
3. `feat/admin-auth-foundation` — Supabase JWT dependency and protected admin route skeleton.
4. `feat/lead-scoring-pii-scrub` — scoring and scrubber unit-tested.
5. `feat/notifications-service` — Resend wrapper and email templates with mocks.
6. `feat/renter-intake-api` — `/leads` endpoint and integration tests.
7. `feat/landlord-intake-api` — `/landlords` endpoint and integration tests.
8. `feat/chat-api` — OpenRouter client, AI chat service, `/chat`, contract tests.
9. `feat/public-site-foundation` — design tokens, public layouts, SEO base, legal pages.
10. `feat/renter-landlord-forms` — multi-step forms and confirmation states.
11. `feat/chat-widget` — floating widget and form handoff.
12. `feat/admin-leads` — admin shell, leads list/detail, status updates.
13. `feat/admin-landlords` — landlords list/detail/status updates.
14. `chore/phase-1-hardening` — rate limiting, audits, e2e, staging smoke, deployment docs/runbook.

Some adjacent PRs can be combined if the diff stays small and tests stay clear. Security-sensitive work, migrations, and AI prompt changes should stay isolated for review.

---

## 7. Launch Checklist

Before first real lead capture:

- [ ] Consent text legally reviewed and version string set.
- [ ] Privacy Policy and Terms live.
- [ ] `.env.example` complete and production env vars set.
- [ ] Admin user provisioned.
- [ ] Renter confirmation email tested.
- [ ] Landlord confirmation email tested.
- [ ] Hot renter alert tested.
- [ ] Landlord agent notification tested.
- [ ] Chat fallback tested by forcing LLM failure.
- [ ] PII transcript audit passed.
- [ ] Admin 401/403 checks passed.
- [ ] `properties` and `transactions` verified empty.
- [ ] No listing route visible in frontend or backend.
- [ ] Staging smoke test passed.
- [ ] Production smoke test passed with test data.
- [ ] Agent runbook dry run completed.
- [ ] Scraye daily check-in reminder process active.

---

## 8. Open Decisions Before Relevant Milestones

These should be resolved before the milestone listed, but they do not block starting P1.0 implementation and they do not expand Phase 1 scope:

| Decision | Owner | Needed by | Notes |
|---|---|---|---|
| Final consent wording and privacy/terms text | Founder/legal reviewer | P1.4/P1.6 | Use placeholder copy only in non-production until reviewed. |
| Exact visual identity tokens | Founder/design | P1.4 | Placeholder token structure is acceptable; avoid blocking backend work. |
| Hosting choice for backend | Founder/engineering | P1.6 | Railway or Render both fit the docs; pick before deployment work. |
| Analytics provider | Founder/engineering | P1.4/P1.6 | Must be cookieless. Plausible is the default assumption. |

---

## 9. Phase 1 Exit Review

At the end of Phase 1, review:

- Lead volume and CPQL trend.
- Hot/warm/standard score distribution.
- Lead-to-first-contact time.
- Lead-to-viewing conversion.
- Fintech product interest flags and agent follow-up outcomes.
- Transcript PII audit results.
- Chatbot fallback/error rate and cost per conversation.
- Agent admin workflow friction.
- Whether Phase 2 social channels are now worth starting.

Do not approve optional listing-data work from this review alone. Scraye listing sync still requires a separate written permission/licensing decision and an ADR update.
