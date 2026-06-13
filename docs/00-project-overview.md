# 00 — Project Overview

**Project:** Proper Rent
**Version:** 1.0
**Status:** Pre-development
**Partner platform:** Scraye.com
**Business type:** UK lettings lead generation & tenant fintech facilitation

This document is the orientation layer for Proper Rent: what the business is, what Phase 1 is building, and what is deliberately out of scope. Detailed requirements, API contracts, data models, tests, and phase boundaries live in the referenced docs at the end.

---

## 1. Executive Summary

Proper Rent is a UK lettings lead-generation and tenant-fintech facilitation business. The product goal is simple: capture renter and landlord intent, help visitors understand the process and Scraye's fintech products, and move opportunities to a human agent who can close through Scraye.

Phase 1 is intentionally narrow:

- A public website with renter and landlord intake forms.
- A chatbot that answers general Proper Rent, letting-process, and fintech questions from a default system prompt.
- Admin lead routing, hot-lead alerts, intent scoring for prioritisation, and a basic admin panel.
- No Scraye listing sync, no public listings, no per-listing quoting, and no RAG.

Scraye is the operational partner at launch, but Phase 1 does not copy or display Scraye listing data. Listing-data work is optional later scope and depends on permission, licensing, and business value.

---

## 2. Business Model

| Stream | Source | Trigger | Value at £2,000/month rent (£24,000/yr) |
|---|---|---|---|
| Introduction commission | Agent introduces tenant | Tenancy completes | Up to 10% of one month's rent (≤£200) |
| Listing fee | Proper Rent lists a landlord property | Completion | 2.5% + VAT |
| Guarantor commission | Tenant uses Guarantor | Product completes | £288 (1.20% × £24,000) |
| Guarantor Enhanced commission | Tenant uses Enhanced Guarantor | Product completes | £360 (1.50% × £24,000) |
| Deposit Share commission | Tenant uses Deposit Share | Product completes | £91.20 (0.38% × £24,000) |
| Advanced Rent — 3 months | Landlord uses product | Product completes | £24 |
| Advanced Rent — 6 months | Landlord uses product | Product completes | £120 |
| Advanced Rent — 12 months | Landlord uses product | Product completes | £360 |
| Check-in bonus | Daily Scraye portal check-in + deal closed | Monthly | £8 × deals closed that month |

At £2,000/month rent, a tenancy that combines introduction commission, Guarantor Enhanced, and Deposit Share can return roughly **£749.20** before viewing fees and check-in bonus. That is why fintech education is core to the funnel, even though Phase 1 keeps the AI generic rather than per-listing.

---

## 3. Users

- **Active renter:** wants to move soon, has basic requirements, and may need help with deposits, guarantors, or affordability questions.
- **Landlord:** wants to list a property, fill a vacancy, or understand Advanced Rent.
- **Human agent:** receives every Phase 1 website submission, reviews the intake data and any chat summary, then handles follow-up, Scraye introduction, viewing coordination, and completion.

The important Phase 1 rule: the website does not filter people out. Every submitted renter or landlord form reaches the agent. Intent scoring only controls priority.

---

## 4. System Architecture

Phase 1 has two deployable runtime units sharing one managed database:

```
Next.js frontend (Vercel, UI only)
        │  HTTP
        ▼
FastAPI backend (single service — website API + AI chat)
        │                    │
        │ reads/writes       │ LLM calls
        ▼                    ▼
   Supabase            OpenRouter (LLM gateway)
   (Postgres, auth,    default model via LLM_MODEL
   storage)
```

The frontend is presentation-only. FastAPI owns the website API, chatbot endpoint, intent scoring, notifications, and admin routes. Supabase provides Postgres, auth, and file storage.

The optional Scraye sync worker is not part of Phase 1 or Phase 2. If it is ever approved, it becomes a later add-on rather than a dependency of the MVP. Full architecture details are in `02-architecture.md`; decision rationale is in `adr/ADR-001-architecture.md` and `adr/ADR-002-ai-service.md`.

---

## 5. Website & Portal

The website is the whole Phase 1 product surface. Full flows are in `05-user-flows.md`; endpoint specs are in `04-api-contracts.md`.

### 5.1 Site map

```
properrent.co.uk/
├── Home                         [P1]
├── For Renters                  [P1]  (fintech overview — informational, with FAQ)
│   └── Eligibility Checker      [P2]  (chatbot covers this inline in P1)
├── For Landlords                [P1]  (Advanced Rent pitch, with FAQ)
├── Listings (search/browse)     [Future/optional]  (requires listing-data permission)
│   └── Listing detail page      [Future/optional]
├── About / How it works         [P1]
├── Register (Renter)            [P1]  multi-step intake
├── Register (Landlord)          [P1]
├── Renter Dashboard             [P2]  (authenticated)
└── Footer: Privacy / Terms / GDPR notice  [P1]
```

### 5.2 Intake and chatbot

The renter form captures requirements, contact details, affordability signals, deposit/guarantor situation, preferences, and consent. The landlord form captures property basics, availability, Advanced Rent interest, contact details, and consent.

The chatbot is a lightweight assistant on all pages. It answers general questions and can suggest opening the intake form. It does not collect full contact details, expose intent scores, claim live availability, or answer from listing data.

Property listing pages are optional later work only. Phase 1 and Phase 2 should not assume they exist.

---

## 6. Data Foundation

Full schema, indexes, and invariants are in `03-data-model.md`.

Phase 1 writes the operational tables needed for the website funnel: `renters`, `conversations`, `landlords`, and `agents`. The backend stores consent, lead status, intent score, fintech flags, and chat summaries for agent follow-up.

`properties` and `transactions` may exist as schema placeholders, but they are not populated, exposed, or required for Phase 1. Commission reconciliation stays manual in Phase 1. Listing sync, listing freshness rules, and in-app commission tracking are optional later work.

---

## 7. AI Service

The AI service is channel-agnostic by design. In Phase 1 it powers the website chatbot; in Phase 2 the same service can support WhatsApp and Messenger with different routing rules.

All model calls go through OpenRouter via a thin client, and the model is configured with `LLM_MODEL`. The chatbot has a timeout and fallback reply so the website remains usable if the LLM is unavailable.

Phase 1 AI boundaries are simple: no live listing claims, no per-listing pricing, no contact-detail collection in chat, no human impersonation, and no internal score exposure.

---

## 8. Human Operations

The human agent owns the closing stage. Phase 1 gives the agent a basic admin panel with new leads, lead detail, conversation summaries, fintech flags, intent score, and status updates — plus a landlord pipeline view, since every landlord submission also reaches the agent (unconditionally, with no scoring gate).

Daily work remains manual: review new leads, follow up quickly, check Scraye directly for matching listings, complete the Scraye portal check-in, and reconcile commissions outside the app.

---

## 9. Lead Scoring

Lead scoring helps the agent decide who to contact first. It is not a website gate in Phase 1: every submitted form reaches the agent.

The full scoring rubric and thresholds live in `03-data-model.md`. Phase 2 social channels may use the same score as a qualification gate if inbound volume makes that necessary.

---

## 10. Fintech Product Integration

Phase 1 explains Scraye fintech products in general terms through website copy, the chatbot, and agent follow-up:

- **Deposit Share:** helps reduce upfront deposit pressure.
- **Guarantor / Guarantor Enhanced:** useful for students, international tenants, self-employed renters, Universal Credit tenants, and renters with thin credit history.
- **Advanced Rent:** landlord-side proposition for receiving rent upfront while tenants continue paying monthly.
- **Rent Club / Ribbon Rewards:** renter-facing rewards benefit used as a conversion support.

Exact per-listing fintech figures are optional later work because they require approved listing data.

---

## 11. Success Metrics

- **Cost-per-qualified-lead (CPQL):** target under £15 within 6 months.
- **Lead-to-viewing conversion:** ≥30% of qualified leads reach a viewing.
- **Viewing-to-let conversion:** ≥20% of viewings result in a completed tenancy.
- **Revenue per completed tenancy:** ≥£400 average (introduction + at least one fintech product).
- **Scraye daily check-in:** 100% — never missed.
- **Transcript PII audit:** zero raw PII found in `conversations.transcript`.

Listing-data freshness is not a Phase 1 metric because no sync worker exists.

---

## 12. Non-Goals

- Not a full property search portal or listing marketplace in Phase 1.
- No tenancy management, rent collection, or ongoing property management — Scraye's responsibility post-introduction.
- No proprietary fintech products — Proper Rent facilitates Scraye's Guarantor, Deposit Share, Advanced Rent, and Rent Club, and does not build competitors.
- No proprietary referencing tools.
- UK-only, in line with GDPR scope and Scraye's market.
- No full AI automation at the closing stage — high-value tenancy decisions remain with human agents.
- No scraping or data use from any source without explicit permission (the Scraye sync is deferred to optional later scope pending a permission/licensing decision; see §13 and `adr/ADR-003-scraye-sync.md`).

---

## 13. Risks

The full risk register is in `09-roadmap.md`; the highest-leverage Phase 1 risks are summarised here.

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| GDPR enforcement | Low | High | Consent enforced at insert; PII scrubbing in transcripts; erasure process; Privacy Policy live before first lead |
| Scoring misranks a high-intent lead as low-priority (website) or cold (Phase 2 social channels) | Medium | Medium | Weekly human review of low-scoring leads; monthly threshold tuning against conversion data |
| LLM provider cost/latency drift | Low–Medium | Medium | OpenRouter gateway makes model swap a config change; `/chat` has a 10s timeout and fallback |
| Meta restricts WhatsApp/Messenger API | Low | Medium | Phase 2 concern only; website funnel is self-contained and not blocked by this |

Optional listing-data risks are deferred with the sync worker.

---

## 14. Development Roadmap

`09-roadmap.md` is the source of truth for phase boundaries, definitions of done, and risk sequencing. The task-by-task Phase 1 execution plan lives in `11-phase-1-implementation-plan.md`. In short:

- **Phase 1:** website, generic fintech/process chatbot, intake forms, agent alerts, and basic admin. No Scraye sync or listings.
- **Phase 2:** social channels and operational tools.
- **Optional Phase 3+:** listing-data sync, public listings, per-listing quoting, and deeper intelligence only if licensing and ROI justify them.

---

## 15. How To Use The Docs

For now, use these docs to refine scope, phases, and product decisions. Use `11-phase-1-implementation-plan.md` when turning the Phase 1 roadmap into implementation branches, PRs, or agent tasks.

Use the deeper docs only when the task touches that area:

- `01-mvp-prd.md` for Phase 1 requirements and acceptance criteria.
- `04-api-contracts.md`, `03-data-model.md`, and `05-user-flows.md` for endpoint, schema, and UX details.
- `02-architecture.md` and ADRs for architectural decisions.
- `06-security-gdpr.md`, `07-development-standards.md`, and `08-test-plan.md` for guardrails and verification.
- `09-roadmap.md` for phase boundaries and deferred scope.
- `10-design-system.md` for the frontend visual identity, component library, animation, and accessibility approach.
- `11-phase-1-implementation-plan.md` for the detailed Phase 1 task sequence, acceptance gates, and launch checklist.
