# 04 — API Contracts

**Base URL:** `/api/v1`
**Auth:** Supabase JWT (`Authorization: Bearer <token>`) for admin and future renter-dashboard routes. Public routes need no auth.
**Reference:** Field definitions in `03-data-model.md`; exposure rules in `06-security-gdpr.md`.

---

## Chat

### `POST /api/v1/chat` — public

**Request:**
```json
{
  "session_id": "string (required) — anonymous session UUID",
  "message": "string (required, ≤1000 chars, truncated server-side)",
  "renter_id": "uuid (optional) — only used for context if linked to the same session_id, or in a future authenticated renter session"
}
```

**Response 200:**
```json
{
  "reply": "string",
  "suggested_action": "show_intake_form | null",
  "session_id": "string"
}
```

Phase 1 has no `properties` data — the chatbot answers fintech/process questions from a default system prompt (see `03-data-model.md` §2 and `09-roadmap.md` for the optional later `show_property` / per-listing quoting design).

**Context rule:** because `/chat` is public in Phase 1, the backend must not trust an arbitrary `renter_id`. If `renter_id` is supplied, load that renter profile only when the request `session_id` is linked to that renter through `renters.session_id` or an existing `conversations` row with the same `session_id` and `renter_id`; otherwise ignore `renter_id` for prompt context and continue with session-only history. Future authenticated renter-dashboard chat may use the authenticated user context instead.

**Never returned:** `intent_score`, internal conversation id, system prompt, raw LLM response, any internal field. The running score is server-side only.

**Errors:** `422` (message too long / missing session_id). If the LLM gateway is unavailable or times out, return `200` with the normal response shape and a graceful fallback `reply`; never propagate the raw provider error.

---

## Renter intake

### `POST /api/v1/leads` — public

**Request:**
```json
{
  "source_channel": "website",
  "session_id": "string (optional)",
  "full_name": "string",
  "email": "string (valid email)",
  "phone": "string",
  "bedrooms_required": 2,
  "areas_preferred": ["Manchester City Centre", "Salford"],
  "max_rent": 1200,
  "move_in_from": "2026-08-01",
  "move_in_by": "2026-09-01",
  "employment_status": "employed_full",
  "annual_income_range": "25000-35000",
  "has_guarantor": "no",
  "deposit_availability": "partial",
  "current_housing": "renting",
  "how_heard": "facebook",
  "furnished_preference": "no_preference",
  "pets": "none",
  "accessibility_needs": "string (optional)",
  "has_rented_before": true,
  "notes": "string (optional)",
  "consent_given": true,
  "consent_version": "2026-06-13"
}
```

**Response 201:**
```json
{ "renter_id": "uuid", "message": "Thank you. Our team will be in touch within 24 hours." }
```

**Duplicate email response 200:**
```json
{ "renter_id": "existing-uuid", "message": "We already have your details. Our team will be in touch within 24 hours." }
```

**New-row side effects:** create `renters` row with `consent_at=NOW()` → compute & store `intent_score` → link `conversations` matching `session_id` → send confirmation email → if `intent_score>=70`, send agent alert.

**Duplicate-email side effects:** do not create a row; if `session_id` is supplied, link matching `conversations` to the existing renter; do not send another confirmation email or hot-lead alert.

**Errors:** `422` (validation / `consent_given!=true` / invalid email). Duplicate email is treated as an idempotent `200 OK`, not an error.

---

## Landlord intake

### `POST /api/v1/landlords` — public

**Request:**
```json
{
  "full_name": "string", "email": "string", "phone": "string",
  "property_address": "string", "bedrooms": 2, "asking_rent": 1400,
  "available_from": "2026-08-01",
  "advanced_rent_interest": true, "listing_interest": true,
  "notes": "string (optional)",
  "consent_given": true, "consent_version": "2026-06-13"
}
```
**Response 201:** `{ "landlord_id": "uuid", "message": "..." }`
**Errors:** `422` as above.

**Side effects:** create `landlords` row with `consent_at=NOW()` → send confirmation email to landlord → send agent notification email (unconditional — no scoring gate for landlords).

---

## Properties — deferred to optional later scope

`GET /api/v1/properties` and `GET /api/v1/properties/{listing_id}` are not part of the Phase 1 or Phase 2 core API surface — the `properties` table is empty (schema only, see `03-data-model.md` §2) and the router is not registered in `main.py`. The design below is retained only for optional later listing work.

### `GET /api/v1/properties` — public *(optional later)*

**Query params:** `bedrooms` · `max_rent` · `area` (matched on `locality`/`region`, then `section_text`) · `unit_type` · `furnished` · `page` (default 1) · `limit` (default 20, max 50).

**Response 200:**
```json
{
  "total": 847, "page": 1,
  "results": [{
    "listing_id": "string", "title": "string", "unit_type": "Flat",
    "price": 1200, "currency": "GBP", "bedrooms": 2, "bathrooms": 1,
    "furnished": true, "available_text": "Available now",
    "locality": "Manchester City Centre", "region": "Greater Manchester",
    "images": ["https://..."], "deposit_share_upfront": 312,
    "standard_deposit": 2080, "epc_rating": "C", "verified": true,
    "last_seen_at": "2026-06-13T10:22:00Z"
  }]
}
```

**Filter:** only `status='active'`.
**Never returned (list):** `section_text`, `raw_jsonld`, `normalized`, `content_hash`, `error_message`, `map`, `street_view`, `guarantor_standard_fee`, `guarantor_enhanced_fee`, `rent_club_savings_per_year` (single-listing only).

### `GET /api/v1/properties/{listing_id}` — public *(optional later)*

**Response 200:** list fields plus `floor_area_sq_ft`, `floor`, `furnishing`, `council_tax_band`, `nearest_tube`, `guarantor_standard_fee`, `guarantor_enhanced_fee`, `rent_club_savings_per_year`, `description`, `links` (viewing/offer URLs), `image_objects`, `geo`.
**Errors:** `404` if not found or `status!='active'`.

---

## Admin (auth required, `agents.role='admin'` → else 403)

### `GET /api/v1/admin/auth/check`
Lightweight protected route for validating Supabase JWT admin access before loading real admin data.

**Response 200:**
```json
{
  "agent_id": "uuid",
  "email": "admin@example.com",
  "role": "admin"
}
```

**Errors:** `401` missing/invalid bearer token, `403` valid Supabase user without an `agents` row or without `agents.role='admin'`.

### `GET /api/v1/admin/leads`
Paginated pipeline. Filters: `status`, `assigned_agent_id`, `page`, `limit`. Returns full renter records including internal fields and operational summary counts.

**Response 200:**
```json
{
  "total": 42,
  "page": 1,
  "limit": 20,
  "summary": {
    "new_leads_today": 3,
    "hot_leads_pending": 2,
    "pipeline_by_stage": {
      "new": 10,
      "contacted": 8,
      "qualified": 6,
      "viewing_arranged": 4,
      "offer_made": 1,
      "let_agreed": 1,
      "completed": 7,
      "lost": 5
    }
  },
  "results": [
    {
      "id": "uuid",
      "source_channel": "website",
      "full_name": "string",
      "email": "string",
      "phone": "string",
      "areas_preferred": ["string"],
      "max_rent": 1200,
      "move_in_by": "2026-09-01",
      "intent_score": 75,
      "lead_status": "new",
      "assigned_agent_id": "uuid",
      "fintech_flags": { "deposit_share": true, "guarantor": false },
      "created_at": "2026-06-13T10:22:00Z"
    }
  ]
}
```

### `GET /api/v1/admin/leads/{renter_id}`
Returns one full renter record including internal fields for the admin detail view.

**Errors:** `404` if the lead does not exist.

### `PATCH /api/v1/admin/leads/{renter_id}`
```json
{ "lead_status": "viewing_arranged", "assigned_agent_id": "uuid", "notes": "string" }
```

### `GET /api/v1/admin/leads/{renter_id}/conversation`
Returns all `conversations` rows linked to `renter_id` (each with `transcript` + `ai_summary`), ordered by `started_at`. A renter may have more than one conversation (e.g. a pre-registration session and a later one).

### `GET /api/v1/admin/landlords`
Paginated landlord pipeline. Filters: `status`, `page`, `limit`. Returns full landlord records.

**Response 200:**
```json
{
  "total": 12,
  "page": 1,
  "limit": 20,
  "results": [
    {
      "id": "uuid",
      "full_name": "string",
      "email": "string",
      "phone": "string",
      "property_address": "string",
      "bedrooms": 2,
      "asking_rent": 1400,
      "available_from": "2026-08-01",
      "advanced_rent_interest": true,
      "listing_interest": true,
      "status": "new",
      "created_at": "2026-06-13T10:22:00Z"
    }
  ]
}
```

### `GET /api/v1/admin/landlords/{landlord_id}`
Returns one full landlord record for the admin detail view.

**Errors:** `404` if the landlord lead does not exist.

### `PATCH /api/v1/admin/landlords/{landlord_id}`
```json
{ "status": "contacted", "notes": "string" }
```

---

## Transactions & commission tracker — deferred to optional later scope

`POST /api/v1/admin/transactions` and `GET /api/v1/admin/transactions` are **not part of the Phase 1 or Phase 2 API surface** — the `transactions` table is empty (schema only, see `03-data-model.md` §5) and no transactions router is registered in `main.py`, consistent with the hard constraint in `07-development-standards.md` that `transactions` is not written or read by FastAPI in Phase 1. The shapes below are retained only for optional later work.

### `POST /api/v1/admin/transactions` *(optional later)*
```json
{
  "renter_id": "uuid", "listing_id": "string",
  "scraye_introduction_id": "string", "introduction_date": "2026-06-13",
  "monthly_rent": 1200, "intro_commission_expected": 120,
  "fintech_products_used": ["deposit_share"], "fintech_commissions_expected": 91.20
}
```

### `GET /api/v1/admin/transactions` *(optional later)*
Commission tracker. Filters: `status`, date range.

---

## Health

### `GET /api/v1/health` — public

**Response 200:**
```json
{ "status": "ok", "version": "string" }
```

Used by CI smoke tests and uptime monitoring. Returns 200 if the service is running and can connect to the database. No authentication required.

---

## Conventions

- All error responses: `{ "detail": "string" }` with an appropriate status code. Never leak stack traces or raw DB errors.
- All timestamps ISO-8601 UTC.
- All money fields numeric GBP; the frontend formats currency.
- Pagination is `page`/`limit`; responses include `total`.
