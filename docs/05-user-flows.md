# 05 — User Flows

**Reference:** Endpoints in `04-api-contracts.md`; scoring in `03-data-model.md` §8.

---

## 1. Site map (with phase markers)

```
properrent.co.uk/
├── Home                         [P1]  hero · how-it-works · CTAs
├── For Renters                  [P1]  how we help · fintech overview (informational) · FAQ
│   └── Eligibility Checker      [P2]  standalone interactive tool (chatbot covers this in P1)
├── For Landlords                [P1]  listing pitch · Advanced Rent explainer · FAQ · CTA
├── Listings (search/browse)     [Future/optional]  requires listing-data permission
│   └── Listing detail page      [Future/optional]  requires listing-data permission
├── About / How it works         [P1]
├── Register (Renter)            [P1]  multi-step intake form
├── Register (Landlord)          [P1]  landlord intake form
├── Renter Dashboard             [P2]  authenticated: status · submitted requirements · agent contact · next steps
└── Footer: Privacy · Terms · GDPR notice   [P1]
```

`[P1]` = Phase 1 build. `[P2]` = Phase 2 build. `[Future/optional]` = only if a later decision approves the listing-data surface. An agent building the site must not build `[P2]` or `[Future/optional]` pages in Phase 1. (Resolves the site-map vs roadmap mismatch.)

---

## 2. Renter flow (Phase 1 — website only)

```
Visitor lands (home / for-renters / for-landlords)
        │
        ▼
Opens chatbot (manual) — optional
        │
   AI answers questions about Proper Rent's services, fintech
   products (general info, no per-listing figures), and the
   letting process; guides visitor towards the intake form
        │
        ▼
Visitor completes multi-step intake form
(prefilled from chat where available)
        │
   POST /api/v1/leads → renters row + intent_score
        │
   ┌────┴──────────────────┐
   │ score ≥ 70 (hot)    │ score < 70
   ▼                    ▼
agent priority alert   prioritised admin pipeline
(contact ≤2h)          (warm ≤24h; others by queue)
        │
        ▼
Frontend shows confirmation state (§2a)
        │
        ▼
Human agent reviews briefing → first contact → shortlist from Scraye → viewing / Scraye intro
        │
        ▼
Tenancy completes on Scraye → commission recorded manually
```

> **Every website form submission reaches the agent.** The intent score determines contact urgency only — there is no discard threshold on the website channel.

Key behaviours:
- The chatbot **never** collects name/email/phone — the form does, under consent.
- The form **prefills** budget/area/move-in from the chat session where available.
- On submit, prior `conversations` for that `session_id` are linked to the new `renter_id` so the agent sees the full pre-chat context.

---

## 2a. Renter post-submit confirmation state

On any successful response from `POST /api/v1/leads` (201, or the `200 OK` duplicate-email path), the form view is replaced by a confirmation state — not a separate page navigation, so the visitor doesn't lose context. It shows:

- A short thank-you message (from the response `message` field, or a frontend default).
- What happens next: "Our team will review your requirements and be in touch within 24 hours" (sooner for hot leads, but Phase 1 does not surface the score to the visitor).
- A reminder of the confirmation email being sent.
- An optional prompt to continue chatting with the assistant for general questions while waiting.

This is a frontend-only requirement (REQ-027) — no new endpoint. The duplicate-email path returns `200 OK` and shows the same confirmation state, not an error, since the visitor's intent is still captured against their existing record.

---

## 3. Chatbot → form handoff (detail)

1. The chatbot answers the visitor's questions and, when the visitor shows interest or asks how to proceed, suggests the intake form.
2. Backend returns `suggested_action: "show_intake_form"`.
3. Frontend opens the form, prefilled from captured chat data (budget, area, move-in window), with a warm transition message.
4. Visitor confirms/edits and submits → `POST /api/v1/leads` → routed directly to the agent.

---

## 4. Landlord flow (Phase 1)

```
Landlord visits For Landlords page
        │  (Advanced Rent explainer: "up to 12 months' rent upfront")
        ▼
Completes landlord intake form → POST /api/v1/landlords
        │
        ├─→ Confirmation email to landlord
        ├─→ Agent notification email (unconditional, no scoring gate)
        └─→ Frontend shows confirmation state (§4a)
        │
        ▼
Agent contacts landlord → lists property on Scraye (manually) and/or arranges Advanced Rent
```

Landlord side is secondary at launch but the form and Advanced Rent pitch are live in Phase 1. Unlike renter leads, landlord submissions are not scored — every landlord lead notifies the agent, since landlord leads (listing fee, Advanced Rent commission) are inherently commercially relevant (see `00-project-overview.md` §2).

---

## 4a. Landlord post-submit confirmation state

On any successful response from `POST /api/v1/landlords` (201), the form view is replaced by a confirmation state showing:

- A short thank-you message.
- What happens next: "An agent will review your property details and be in touch shortly to discuss listing it and/or Advanced Rent."
- A reminder of the confirmation email being sent.

This is a frontend-only requirement (REQ-033) — no new endpoint.

---

## 5. Human handoff protocol

When a lead reaches an agent, the agent briefing (from `GET /api/v1/admin/leads/{renter_id}` + `/conversation`) contains:
- Contact details and source channel.
- Conversation summary (`ai_summary`).
- Requirements: bedrooms, area(s), budget, move-in window.
- Employment + annual income band.
- Deposit and guarantor situation.
- Fintech products flagged (Deposit Share / Guarantor) — general eligibility only; Phase 1 has no per-listing figures.
- Intent score and recommended next action.

First contact uses the renter's preferred channel. Objective of first contact: confirm requirements, shortlist listings from Scraye directly, arrange a viewing or submit a Scraye introduction.

---

## 6. Agent daily operations

Every working day:
1. Complete the Scraye portal daily check-in (£8 × deals this month — free revenue; never miss).
2. Review new leads (sorted by intent score) via the admin "Leads" view, including the overview stat strip (new leads today, hot leads pending, pipeline by stage).
3. Follow up on `contacted` / `viewing_arranged` leads awaiting response.
4. Review new landlord leads via the admin "Landlords" view and follow up (listing on Scraye and/or Advanced Rent).
5. Check Scraye's own listings against pending renter requirements (manual in Phase 1 — Proper Rent has no synced listing data).
6. Post/refresh at least one Facebook Marketplace listing (manual in Phase 1).

---

## 7. Commission claiming (operational)

1. On tenancy start, record it in a spreadsheet (Phase 1 and Phase 2; in-app `transactions` tracking is optional later scope — see `09-roadmap.md`).
2. Confirm the Scraye dashboard attributes the introduction to Proper Rent.
3. Check which fintech products were used; register each as a separate commission line.
4. Note expected payment date; reconcile received vs expected monthly against the Scraye dashboard.

---

## 7a. Email touchpoints (Phase 1)

Four email templates are required (REQ-024, REQ-025, REQ-031, REQ-032 — sent via Resend, see `02-architecture.md` §4):

| Template | Trigger | Recipient |
|---|---|---|
| Renter confirmation | `POST /api/v1/leads` success | Renter |
| Landlord confirmation | `POST /api/v1/landlords` success | Landlord |
| Agent alert — hot renter lead | `intent_score >= 70` on `/leads` | Agent (`ADMIN_ALERT_EMAIL`) |
| Agent notification — landlord lead | Every `POST /api/v1/landlords` success | Agent (`ADMIN_ALERT_EMAIL`) |

Content is plain and informational for Phase 1 (no marketing styling required); each must reflect the consent text version (`consent_version`) where it references the Privacy Policy.

---

## 8. Failure / edge flows

- **Renter asks about a specific listing:** chatbot has no listing data in Phase 1 → it explains that a human agent will confirm current availability, and encourages the visitor to register.
- **No matches:** chatbot offers to register the renter for alerts instead of inventing listings.
- **Direct-to-form visitor (no chat):** `session_id` has no conversations; flow proceeds, agent briefing notes "no prior chat."
- **Duplicate submission:** same email returns existing `renter_id`; agent sees one record.
- **LLM gateway down:** chatbot returns a graceful fallback ("our team can help — register and we'll be in touch") and the form remains fully usable.
