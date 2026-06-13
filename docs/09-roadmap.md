# 09 — Roadmap

**Status:** Revised for Phase 1 execution
**Reference:** MVP scope in `01-mvp-prd.md`; architecture in `02-architecture.md`; phase rationale in `adr/ADR-004-channel-sequencing.md`.
**Detailed Phase 1 plan:** `11-phase-1-implementation-plan.md`

This roadmap is the phase-boundary document. It explains what is built now, what is deliberately delayed, and what conditions must be true before later phases start. The task-by-task Phase 1 execution plan lives separately in `11-phase-1-implementation-plan.md`.

---

## 1. Roadmap Principles

- **Website first.** Phase 1 proves the owned website funnel before adding social channels, listing data, or heavier automation.
- **Human close, AI assist.** The chatbot answers general Proper Rent, letting-process, and fintech questions. A human agent owns follow-up, Scraye shortlisting, viewing coordination, and completion.
- **No hidden listing dependency.** Phase 1 and Phase 2 do not require Scraye sync, public listings, local property search, or per-listing fintech quoting.
- **Every website submission reaches the agent.** Intent scoring controls priority only; it is not a discard gate on the website channel.
- **Privacy is a launch blocker.** Consent capture, admin auth, PII scrubbing, no PII logging, and legal pages must be complete before the first lead is accepted.
- **Keep future options clean.** `properties` and `transactions` may exist as schema placeholders, but they stay empty and unused until optional later listing/commission work is explicitly approved.

---

## 2. Phase Summary

| Phase | Goal | Primary users | Start condition | Done condition |
|---|---|---|---|---|
| Phase 1 — Website + Chatbot MVP | Launch the owned lead funnel: public pages, chatbot, renter/landlord intake, notifications, basic admin. | Renters, landlords, human agent | Docs stable; legal consent text ready for review; env/service accounts identified | A visitor can ask questions, submit intake, score hot, and the agent receives a usable briefing within minutes. |
| Phase 2 — Social Channels + Operational Tools | Extend the proven funnel to WhatsApp/Messenger and add follow-up tooling. | Social leads, renters, agent | Phase 1 live; lead handling process proven; Meta setup approved | A social-channel visitor can move to the website with context intact, complete intake, and be routed by channel-specific scoring rules. |
| Optional Phase 3+ — Data & Intelligence Expansion | Add listing data, per-listing quoting, property matching, and commission workflows only if permission and ROI justify it. | Renters, agent, landlords | Funnel traction plus written listing-data permission/licensing decision | Approved listing data is synced and exposed legally; per-listing claims follow freshness rules. |

---

## 3. Phase 1 — Website + Chatbot MVP

### 3.1 Product outcome

Phase 1 ships a live Proper Rent website where:

- Renters and landlords understand the proposition and Scraye fintech products.
- A floating chatbot answers general Proper Rent, letting-process, and fintech questions from a default system prompt.
- Visitors submit renter or landlord intake forms with GDPR consent.
- Renter leads are scored for priority, not filtered.
- The agent receives confirmations/alerts and manages leads in a basic admin panel.

Phase 1 has **no** Scraye listing sync, public listings, per-listing quotes, social-channel webhooks, authenticated renter dashboard, nurture automation, or in-app commission tracker.

### 3.2 Build scope

| Area | Phase 1 build |
|---|---|
| Backend foundation | FastAPI app, Pydantic schemas, SQLAlchemy models, Alembic migration, config, health endpoint, Supabase-backed database access. |
| Data | `renters`, `conversations`, `landlords`, `agents`; `properties` and `transactions` created schema-only, empty, and not exposed. |
| Public API | `POST /api/v1/chat`, `POST /api/v1/leads`, `POST /api/v1/landlords`, `GET /api/v1/health`. |
| Admin API | Authenticated `/api/v1/admin/*` routes for lead list/detail updates, conversation briefing, landlord list/detail updates. |
| AI | `services/llm_client.py` for OpenRouter; channel-agnostic `services/ai_chat.py`; default fintech/process prompt; 10s timeout and fallback; allowlisted `suggested_action`. |
| Scoring | `services/lead_scoring.py` implements the rubric in `03-data-model.md`; hot lead threshold is `intent_score >= 70`. |
| Notifications | Renter confirmation, landlord confirmation, hot renter alert, unconditional landlord agent notification. |
| Public frontend | Home, For Renters, For Landlords, About / How it works, Privacy, Terms, renter registration, landlord registration, chatbot widget. |
| Admin frontend | Login-protected admin shell, leads view, lead detail tabs, landlords view, status/notes updates, small operational stat strip. |
| Design system | Tailwind, shadcn/ui-style primitives, shared tokens, restrained animation with `prefers-reduced-motion`, WCAG 2.1 AA baseline. |
| Analytics | Cookieless analytics only, such as Plausible; no cookie banner dependency. |
| Verification | Unit, integration, contract, frontend e2e, CI, secret scan, dependency scan, staging smoke test. |

### 3.3 Phase 1 milestones

| Milestone | Outcome | Gate |
|---|---|---|
| P1.0 Build readiness | Repos/apps scaffolded, env variables documented, CI baseline running. | Local backend health check and frontend shell work. |
| P1.1 Data foundation | Migration, models, schemas, DB session, admin auth dependencies in place. | Migration up/down succeeds; schema includes placeholders but no Phase 1 route reads/writes `properties` or `transactions`. |
| P1.2 Intake and notifications | Renter and landlord endpoints enforce consent, persist records, send mocked/tested emails, and link conversations. | Integration tests pass for consent rejection, duplicate renter email, hot alert, landlord notification. |
| P1.3 Chatbot | Chat endpoint returns safe replies, stores PII-free transcript, updates server-side score, and degrades on LLM failure. | Tests prove no internal fields, no properties data, PII scrubbing, timeout fallback, and action allowlist. |
| P1.4 Public website | SSR public pages, forms, confirmation states, chatbot widget, SEO metadata, accessibility baseline. | Playwright golden paths pass against mocked backend. |
| P1.5 Admin operations | Admin can review lead and landlord pipelines, read conversation briefings, and update status/notes. | AuthN/AuthZ tests pass; admin e2e smoke path passes. |
| P1.6 Launch hardening | Privacy/Terms live, rate limiting, monitoring, staging smoke, production envs, operational runbook. | Production smoke test passes and first-lead checklist is complete. |

### 3.4 Phase 1 definition of done

Phase 1 is done when all of the following are true:

- A renter can land on the site, ask the chatbot a general fintech/process question, open the intake form, submit it, and see the confirmation state.
- A hot renter submission (`intent_score >= 70`) sends a priority agent alert within minutes.
- A landlord can submit the landlord form, receive confirmation, and trigger an unconditional agent notification.
- The admin can authenticate, review renter and landlord leads, read conversation context, and update status/notes.
- `conversations.transcript` contains no raw email or UK phone PII in the audit fixture.
- Public chat responses never expose `intent_score`, internal IDs, `properties` data, system prompts, or raw LLM payloads.
- Privacy Policy, Terms, and consent copy are live and versioned before lead capture.
- CI passes the required lint, type, unit, integration, contract, frontend build, and e2e smoke checks.
- `properties` and `transactions` remain empty and unused.

### 3.5 Explicit Phase 1 non-goals

- WhatsApp Cloud API, Messenger API, or Meta webhooks.
- Authenticated renter dashboard.
- Standalone eligibility checker page.
- Nurture email sequences or campaign automation.
- Public property listings, listing detail pages, listing search, or Scraye sync worker.
- Per-listing Deposit Share, Guarantor, Rent Club, or availability claims.
- In-app commission tracker or `transactions` workflow.
- RAG/vector search.
- Automated property match notifications.

---

## 4. Phase 2 — Social Channels + Operational Tools

Phase 2 extends the proven Phase 1 AI service and lead funnel into social channels. It does not depend on local listing data.

### 4.1 Start conditions

- Phase 1 has handled real leads end-to-end.
- The agent process for first contact, Scraye shortlisting, and commission reconciliation is documented.
- The default chatbot prompt and scoring threshold have been tuned from initial lead outcomes.
- Meta app/business setup, webhook URLs, template requirements, and privacy wording are ready.

### 4.2 Build scope

- WhatsApp Cloud API webhook and outbound template support.
- Messenger webhook with 24-hour-window handling and website/WhatsApp handoff.
- Channel adapters that call the existing `ai_chat.py` service without changing its core interface.
- Social-channel qualification gate: score routes high-intent contacts to the agent; lower-intent contacts receive compliant automated follow-up.
- URL session token handoff so a visitor can move from social chat to website form with context intact.
- Standalone generic Fintech Eligibility Hub page.
- Lead nurture email sequences for warm/cold leads.
- Authenticated renter dashboard for status, submitted requirements, agent contact, and next steps.
- Admin analytics for leads by source, conversion by channel, and average score at conversion.
- Scraye daily check-in reminder automation.

### 4.3 Definition of done

Phase 2 is done when a renter can start on WhatsApp or Messenger, move to the website with context intact, submit the form, and be routed according to channel-specific scoring rules. Agents can see source/channel performance and manage follow-up without a local listing database.

---

## 5. Optional Phase 3+ — Data & Intelligence Expansion

Optional later listing/data work should start only if it has written permission, operational value, and a clear ROI case. It is valid to skip this phase entirely and keep shortlisting manual inside Scraye.

### 5.1 Start conditions

- Written approval/licensing terms permit Proper Rent to store and display Scraye listing data.
- Phase 1/2 lead volume shows that listing automation would materially reduce agent workload or increase conversion.
- A data-freshness and takedown process is approved.
- A separate implementation plan and ADR update are accepted before coding begins.

### 5.2 Possible build

- Scraye sync worker as a standalone process (`python -m app.services.scraye_sync`) with advisory lock and 12h interval.
- `properties` population, lifecycle handling, `locality`/`region` extraction, content hashing, and monitoring.
- `GET /api/v1/properties` and `/api/v1/properties/{listing_id}` plus public listing grid/detail pages.
- Chatbot context extended with fresh listing data and per-listing fintech quoting.
- 24h freshness rule for availability and quoting claims.
- Automated property-match notifications for registered renters.
- In-app commission tracking through `transactions` and an admin reconciliation view.
- RAG/vector property matching, if simple SQL filtering is no longer enough.
- Landlord portal and multi-platform sync abstraction, if the business adds more listing partners.

### 5.3 Definition of done

If approved, this phase is done only when listing data is synced and exposed legally, stale data cannot mislead renters, per-listing chatbot claims are freshness-gated, and commission data can be reconciled per tenancy.

---

## 6. Risk Register

| Risk | Phase | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| GDPR consent, retention, or erasure gaps | Phase 1 | Low | High | Consent enforced on insert; Privacy/Terms live before capture; PII scrubber tested; erasure process documented before launch. |
| Raw PII stored in chat transcript | Phase 1 | Medium | High | Bot directs PII to forms; scrub email/UK phone before persistence; audit fixture in tests; never log PII. |
| Chatbot gives listing-specific or availability claims without data | Phase 1 | Medium | Medium | Prompt explicitly forbids listing claims; tests assert no `properties` context/fields; edge-copy defers to human agent. |
| Scoring misranks a high-intent lead | Phase 1/2 | Medium | Medium | Website never filters submissions; weekly review of low-scoring leads; monthly threshold tuning. |
| LLM provider cost/latency drift | Phase 1/2 | Low-Medium | Medium | OpenRouter gateway; `LLM_MODEL` config; 10s timeout; graceful fallback; monitor latency/cost. |
| Agent overwhelmed by unqualified website leads | Phase 1 | Medium | Medium | Prioritised admin queue, hot alerts, clear lead-status workflow; Phase 2 adds social qualification after website baseline. |
| Meta API policy/review blocks channels | Phase 2 | Low-Medium | Medium | Phase 1 website funnel stays independent; implement official APIs and approved templates only. |
| Lead attribution lost on Scraye | Phase 1/2 | Low-Medium | High | Capture Scraye introduction IDs manually in admin notes/status process; reconcile monthly until optional commission tracker exists. |
| Listing-display permission is not viable | Optional Phase 3+ | Medium | High | Keep listing work optional; do not build public listings without written approval; manual Scraye shortlisting remains default. |
| Stale synced listing data misleads renters | Optional Phase 3+ | Medium | High | 24h freshness rule; status lifecycle; staleness banner; chatbot defers outside freshness window. |

---

## 7. Sequencing Rules

- Build Phase 1 in the milestone order in `11-phase-1-implementation-plan.md`.
- Do not start Phase 2 work until Phase 1 is live or explicitly accepted as launch-ready.
- Do not start optional Phase 3+ listing/data work without a written permission/licensing decision and an ADR update.
- For auth, migrations, AI prompts, and PII-handling changes, require stricter review and verification than ordinary UI work.
- If a task requires changing API shape, schema, or user flow, update the relevant doc in the same PR.
