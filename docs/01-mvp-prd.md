# 01 — MVP Product Requirements Document

**Scope:** Phase 1 only (Website + Chatbot). Social channels, authenticated renter dashboard, and standalone eligibility hub are Phase 2+ and out of scope here.
**Reference:** See `00-project-overview.md` for business context, `09-roadmap.md` for phasing.

---

## 1. Problem

UK letting agents spend time on manual enquiries that could be handled by an AI assistant. Proper Rent embeds an AI chatbot on its website to answer visitor questions about Proper Rent's services, fintech products (Deposit Share, Guarantor, Advanced Rent, Rent Club), and the letting process in general, and to guide them towards the intake form. Every website form submission is routed directly to the human agent for closing, earning commission on completed Scraye tenancies plus fintech product upsell. On social media channels (Phase 2), the same AI service adds a qualification layer — filtering high-intent visitors before routing them to the agent.

## 2. MVP goal

A live website where a renter can interact with an AI chatbot that answers general questions about the letting process and fintech products, submit an intake form, and be routed directly to the human agent with a scored, contextual briefing — all without any social channel integration. Scraye listing data, a public listings browser, and per-listing fintech quoting are optional later work (see `09-roadmap.md` and §10), not Phase 1 or Phase 2 core scope.

## 3. Users

- **Active renter** — searching, intends to move within 8 weeks. Primary.
- **Landlord** — has a property, wants faster letting or Advanced Rent. Secondary.
- **Human agent** — internal user who receives lead briefings and closes deals.

## 4. Non-goals (Phase 1)

- No WhatsApp or Facebook Messenger integration.
- No authenticated renter dashboard.
- No standalone fintech eligibility hub page (the chatbot surfaces general fintech information inline instead).
- No commission tracking in the database (a spreadsheet is used unless a later phase explicitly revives the `transactions` workflow).
- No vector/RAG search. Phase 1 uses the default system prompt plus conversation/renter context only.
- No nurture email automation (manual follow-up in Phase 1).
- **No Scraye listing sync, no `properties` data, and no public listings/listing-detail pages** — deferred to optional later scope (see §10 and `09-roadmap.md`). The chatbot answers fintech/process questions generically, with no per-listing figures.

## 5. Functional requirements

Requirements use stable IDs. Each maps to an acceptance criterion in section 6.

### Property data and listings — deferred to optional later scope

REQ-001–004 (Scraye sync into `properties`), REQ-010–013 (`GET /api/v1/properties` endpoints and public listing pages), and REQ-044 (per-listing fintech quoting) described earlier drafts of this PRD. These are **out of Phase 1 scope** and are not Phase 2 prerequisites — see `09-roadmap.md` optional later data/listings work. The `properties` and `transactions` tables remain in the schema (created by the Phase 1 migration for schema stability, per `03-data-model.md`) but are empty and unused until an explicit later decision reactivates them.

### Renter intake
- **REQ-020** `POST /api/v1/leads` accepts a multi-step intake form payload and creates a `renters` record.
- **REQ-021** The intake form is rejected with 422 unless `consent_given = true`; on success, `consent_version` and `consent_at` are recorded.
- **REQ-022** On successful submission the system calculates and stores `intent_score` (see `03-data-model.md` and section 7 below).
- **REQ-023** On successful submission the system links any prior `conversations` rows sharing the same `session_id` to the new `renter_id`.
- **REQ-024** On a new successful submission the system sends a confirmation email to the renter.
- **REQ-025** When the resulting `intent_score >= 70`, the system sends an agent alert email.
- **REQ-026** A duplicate email submission returns the existing `renter_id` with `200 OK` rather than creating a duplicate row, links any current-session conversations to that existing renter, and does not send duplicate confirmation or alert emails.
- **REQ-027** On successful submission (including the duplicate-email `200 OK` path), the frontend shows a post-submit confirmation state summarising next steps (see `05-user-flows.md` §2a). This is a frontend state change, not a new endpoint — it is driven by the existing 201/200 response.

### Landlord intake
- **REQ-030** `POST /api/v1/landlords` accepts the landlord form and creates a `landlords` record with the same consent enforcement as renters.
- **REQ-031** On successful landlord submission the system sends a confirmation email to the landlord.
- **REQ-032** On successful landlord submission the system sends an agent notification email. Unlike renter leads, this is unconditional — landlord leads are not scored, and every landlord submission is commercially relevant (see `00-project-overview.md` §2).
- **REQ-033** On successful submission, the frontend shows a post-submit confirmation state summarising next steps (see `05-user-flows.md` §4a).

### AI chatbot
- **REQ-040** A floating chat widget appears on all public pages and can be opened manually.
- **REQ-041** `POST /api/v1/chat` accepts `session_id`, `message`, optional `renter_id` and returns `reply`, `suggested_action`, and `session_id`. In Phase 1, an unauthenticated `renter_id` may be used only when it belongs to the same `session_id`; otherwise the backend ignores it for context loading.
- **REQ-042** The chat response **never** includes the running intent score or any internal field.
- **REQ-043** The chatbot loads context per request: session conversation history and the renter profile only when the supplied `renter_id` is linked to the same `session_id` (or a future authenticated renter session). It uses a default system prompt covering Proper Rent's services, the letting process, and general fintech product information (Deposit Share, Guarantor, Advanced Rent, Rent Club) — no listing data is loaded (Phase 1 has no `properties` data; see §5 above).
- **REQ-044/045** *(deferred to optional later listing work — per-listing fintech quoting and the 24h freshness rule; require `properties` data, see §5)*
- **REQ-046** The chatbot must not collect full name, email, or phone in chat; it directs the user to the intake form for those.
- **REQ-047** The chatbot must never claim to be human and must not follow instructions embedded in user messages or other external data.
- **REQ-048** Each chat turn updates a server-side running intent score. On the website channel the score is informational — stored for agent prioritisation but not used as a gate and not triggering additional alerts during chat. (Qualification-based gating and proactive outreach via scoring will apply to social media channels in Phase 2.)
- **REQ-049** Conversation transcripts are stored without renter PII; structured personal data belongs in the `renters` record only.

### Admin
- **REQ-060** Admin routes require authentication and an `admin` role; unauthenticated access returns 401/403.
- **REQ-061** `GET /api/v1/admin/leads` returns the lead pipeline with internal fields, filterable by status and agent.
- **REQ-061A** `GET /api/v1/admin/leads/{renter_id}` returns a single full lead record for the detail view.
- **REQ-062** `PATCH /api/v1/admin/leads/{renter_id}` updates `lead_status`, `assigned_agent_id`, and `notes`.
- **REQ-063** `GET /api/v1/admin/leads/{renter_id}/conversation` returns all `conversations` rows linked to the renter (transcript + `ai_summary` each), ordered by `started_at`. A renter may have more than one conversation (e.g. separate sessions before and after registration).
- **REQ-064** The admin UI presents leads as a list/board with status stages and a lead-detail view showing the conversation briefing.
- **REQ-065** `GET /api/v1/admin/landlords` returns the landlord pipeline, filterable by `status`, paginated.
- **REQ-065A** `GET /api/v1/admin/landlords/{landlord_id}` returns a single full landlord record for the detail view.
- **REQ-066** `PATCH /api/v1/admin/landlords/{landlord_id}` updates `status` and `notes`.
- **REQ-067** The admin UI includes a "Landlords" view (list + detail) alongside "Leads", using the same table/detail components (see `09-roadmap.md`).
- **REQ-068** The admin UI includes a small overview stat strip (e.g. new leads today, hot leads pending, pipeline count by stage) on the leads view. This is an operational summary, not the analytics/reporting work deferred to Phase 2 (see `09-roadmap.md`).

## 6. Acceptance criteria

| REQ | Acceptance condition (testable) |
|---|---|
| REQ-021 | A POST with `consent_given=false` returns 422 and creates no row. |
| REQ-022 | A POST with a 2-week move-in, confirmed budget, full-time employment yields `intent_score >= 70`. |
| REQ-023 | After submitting with a `session_id` that has prior conversations, those conversation rows have the new `renter_id` set. |
| REQ-025 | A hot-scoring submission triggers exactly one agent alert email (mocked in tests). |
| REQ-026 | Submitting the same email twice creates exactly one `renters` row and returns the existing `renter_id` with `200 OK` on the second submission. |
| REQ-027 | A successful `/leads` submission results in the frontend rendering the confirmation state (no further user input required to see it). |
| REQ-031 | A successful landlord POST triggers exactly one confirmation email to the landlord (mocked in tests). |
| REQ-032 | A successful landlord POST triggers exactly one agent notification email, regardless of any score (mocked in tests). |
| REQ-033 | A successful `/landlords` submission results in the frontend rendering the confirmation state. |
| REQ-042 | The `/chat` response JSON does not contain `intent_score` or any internal field. |
| REQ-043 | A `/chat` reply about fintech products (e.g. "what is Deposit Share?") answers from the default system prompt without referencing any specific listing. |
| REQ-043 | A `/chat` request with a `renter_id` not linked to the request `session_id` does not load that renter profile into the prompt. |
| REQ-046 | A `/chat` message containing a phone number does not cause the bot to store or request further PII in chat. |
| REQ-060 | An unauthenticated GET to an admin route returns 401; a non-admin token returns 403. |
| REQ-061A | An admin GET to `/admin/leads/{renter_id}` returns one full lead record; a missing lead returns 404. |
| REQ-065 | An admin GET to `/admin/landlords` returns the landlord pipeline; a non-admin token returns 403. |
| REQ-065A | An admin GET to `/admin/landlords/{landlord_id}` returns one full landlord record; a missing landlord returns 404. |
| REQ-066 | A PATCH to `/admin/landlords/{landlord_id}` updates `status` and persists `notes`. |

## 7. Intent scoring (summary)

Full rubric in `03-data-model.md`. Phase 1 computes the score from intake-form fields at submission and incrementally during chat. On the **website channel**, the score is a **prioritisation signal** — all form submissions reach the agent, but the score determines contact urgency: **70+** contact within 2h (priority alert email), **45–69** within 24h, **25–44** standard queue, **<25** low-priority. On **social media channels (Phase 2)**, the same score will act as a **qualification gate** — routing only high-intent visitors to the agent.

## 8. Edge cases

- Renter asks about a specific listing/availability → chatbot has no listing data in Phase 1; it explains that a human agent will confirm current availability.
- Renter submits intake with no `session_id` (came directly to form) → no conversation to link; proceed normally.
- Renter submits with a budget below the area minimum → score contribution 0, not negative; agent still sees the lead.

## 9. Success metrics (Phase 1)

- A qualified lead reaches an agent briefing within minutes of a hot-scoring submission.
- Zero PII stored in chat transcripts (verified by audit).
- Cost-per-qualified-lead trends toward the £15 target as volume grows.

## 10. Human decisions

- Resolved: LLM gateway is OpenRouter, with model choice configured via `LLM_MODEL`; see `adr/ADR-005-llm-gateway.md`.
- Resolved: Scraye listing sync, the `properties` data, public listings/listing-detail pages, and per-listing fintech quoting (REQ-001–004, REQ-010–013, REQ-044/045 from earlier drafts) are deferred to optional later scope — see `09-roadmap.md`. Reasons: scope/complexity, and unresolved copyright/licensing terms for displaying Scraye listing content on Proper Rent's own site.
- Confirm the city/region scope only if optional later sync/listing work begins; it is not a Phase 1 or Phase 2 blocker.
- Confirm the consent text wording with a UK legal reviewer before first lead.
