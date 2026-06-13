# 03 — Data Model

**Reference:** Ownership rules summarised in `02-architecture.md` §3. Alembic is the only mechanism for schema change.

---

## 1. Ownership

| Table | Writer | FastAPI |
|---|---|---|
| `renters` | FastAPI | Full |
| `conversations` | FastAPI | Full |
| `landlords` | FastAPI | Full |
| `agents` | FastAPI (admin) | Full |
| `properties`, `transactions` | None in Phase 1 (optional later sync/listing work) | Schema only — empty, not exposed |

---

## 2. `properties` (Scraye-sourced, sync-owned) — optional later, schema only in Phase 1

This table is created by the Phase 1 migration (`0001_initial_schema.py`) so that `transactions.listing_id` has a stable foreign key target, but it is **not populated, written, or exposed by any API in Phase 1**. The Scraye sync worker that would own this table is deferred to optional later scope pending a licensing/copyright decision — see `adr/ADR-003-scraye-sync.md` and `09-roadmap.md`. The schema below documents the preserved future design.

```sql
-- Core identifiers & status
listing_id              TEXT PRIMARY KEY,         -- from listing URL
source                  TEXT DEFAULT 'scraye',
url                     TEXT UNIQUE NOT NULL,
status                  TEXT NOT NULL CHECK (status IN ('active','missing','inactive','error')),

-- High-level details
title                   TEXT,
unit_type               TEXT,                     -- 'Room' | 'Studio' | 'Flat'
category                TEXT,
reference               TEXT,
verified                BOOLEAN,

-- Financials & per-listing fintech figures
price                   NUMERIC,
currency                TEXT DEFAULT 'GBP',
agency                  TEXT,
standard_deposit        NUMERIC,
deposit_share_upfront   NUMERIC,
rent_club_savings_per_year NUMERIC,
guarantor_standard_fee  NUMERIC,
guarantor_enhanced_fee  NUMERIC,

-- Attributes
available_text          TEXT,
bedrooms                INTEGER,
bathrooms               INTEGER,
floor_area_sq_ft        NUMERIC,
floor                   TEXT,
furnishing              TEXT,
furnished               BOOLEAN,
epc_rating              TEXT,                     -- A–G
council_tax_band        TEXT,                     -- A–H

-- Location
address                 JSONB,                    -- { street, locality, region, country }
locality                TEXT,                     -- DERIVED by sync from address->>'locality' (see §2.1)
region                  TEXT,                     -- DERIVED by sync from address->>'region'
geo                     JSONB,                    -- { latitude, longitude }
map                     JSONB,
street_view             JSONB,
nearest_tube            JSONB,

-- Media & links
images                  JSONB,
image_objects           JSONB,
links                   JSONB,                    -- { viewing, offer, photos, similar_listings }

-- Raw payloads
description             TEXT,
section_text            JSONB,                    -- GIN indexed
raw_jsonld              JSONB,
normalized              JSONB,
content_hash            TEXT,                     -- SHA-256 for diffing

-- Lifecycle
first_seen_at           TIMESTAMPTZ,
last_seen_at            TIMESTAMPTZ,              -- updated each sync while active
last_fetched_at         TIMESTAMPTZ,
missing_from_source_at  TIMESTAMPTZ,
inactive_at             TIMESTAMPTZ,
error_message           TEXT,
updated_at              TIMESTAMPTZ              -- Postgres trigger
```

**Indexes:**
- B-tree: `status`, `price`, `bedrooms`, `content_hash`, **`locality`** (new), `last_seen_at`
- GIN: `geo`, `section_text`

*(Optional later design notes, retained for if the sync worker is built:)*

### 2.1 The `locality` / `region` decision (resolves area-search gap)
The source `address` is JSONB. Filtering by area on a JSONB extraction per query is slow and imprecise. The sync worker will therefore **extract `locality` and `region` into flat, indexed text columns** at write time (`address->>'locality'`, `address->>'region'`). Area filtering will then use a B-tree match on `locality`/`region` first, falling back to `section_text` GIN search for free-text queries. This avoids the "Manchester Road in a different city" false-match problem of pure text search.

Because `properties` is sync-owned, this extraction will be the sync worker's responsibility, not FastAPI's.

### 2.2 Freshness rule
Any query that confirms availability to a renter must filter:
```sql
WHERE status = 'active' AND last_seen_at > NOW() - INTERVAL '24 hours'
```
The 24h window covers one full missed 12h sync cycle. The chatbot must never confirm availability outside it.

### 2.3 Exposure rules
Never return to any public API: `section_text`, `raw_jsonld`, `normalized`, `content_hash`, `error_message`, `map`, `street_view`. The guarantor/rent-club fields are returned only on the single-listing endpoint, not the list endpoint.

---

## 3. `renters`

```sql
id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
source_channel      TEXT NOT NULL,               -- 'website' | 'whatsapp' | 'facebook' | 'referral'
session_id          TEXT,                        -- links to pre-registration conversations
full_name           TEXT,                        -- PII
email               TEXT,                        -- PII
phone               TEXT,                        -- PII
bedrooms_required   INTEGER,
areas_preferred     TEXT[],
max_rent            NUMERIC,
move_in_from        DATE,
move_in_by          DATE,
employment_status   TEXT,                        -- 'employed_full'|'employed_part'|'self_employed'|'student'|'universal_credit'|'other'
annual_income_range TEXT,                        -- standardised to ANNUAL (see note)
has_guarantor       TEXT,                        -- 'yes'|'no'|'unsure'
deposit_availability TEXT,                       -- 'full'|'partial'|'limited'
current_housing     TEXT,                        -- 'renting'|'family'|'owning'
how_heard           TEXT,
furnished_preference TEXT,                       -- 'furnished'|'unfurnished'|'no_preference'
pets                TEXT,                        -- free text (e.g. 'cat', 'dog', 'none')
accessibility_needs TEXT,
has_rented_before   BOOLEAN,
notes               TEXT,                        -- may contain PII; treat accordingly

-- Internal (never exposed to renter-facing API)
intent_score        INTEGER DEFAULT 0,
lead_status         TEXT NOT NULL DEFAULT 'new'
                    CHECK (lead_status IN ('new','contacted','qualified','viewing_arranged',
                                           'offer_made','let_agreed','completed','lost')),
assigned_agent_id   UUID REFERENCES agents(id),
scraye_introduction_id TEXT,
fintech_flags       JSONB DEFAULT '{}',          -- { deposit_share:true, guarantor:false, ... }

-- GDPR
consent_given       BOOLEAN NOT NULL,
consent_version     TEXT NOT NULL,
consent_at          TIMESTAMPTZ NOT NULL,

created_at          TIMESTAMPTZ DEFAULT NOW(),
updated_at          TIMESTAMPTZ
```

**Income field note (resolves the "annual or monthly" ambiguity):** income is stored as a standardised **annual** range string. The intake form may collect monthly take-home, but the frontend converts to an annual band before submission. The Guarantor eligibility heuristic (income < 2.5× annual rent) and the scoring rubric both assume annual.

---

## 4. `conversations`

```sql
id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
renter_id           UUID REFERENCES renters(id),  -- NULL until registration
session_id          TEXT NOT NULL,
channel             TEXT NOT NULL,                 -- 'website'|'whatsapp'|'facebook'
external_id         TEXT,                          -- Meta conversation id (Phase 2)
transcript          JSONB NOT NULL DEFAULT '[]',   -- array of { role, content, ts } — PII-FREE
ai_summary          TEXT,                          -- agent briefing
intent_score_output INTEGER,                        -- final server-side score (internal)
started_at          TIMESTAMPTZ DEFAULT NOW(),
ended_at            TIMESTAMPTZ,
created_at          TIMESTAMPTZ DEFAULT NOW()
```

### 4.1 Transcript PII rule (resolves the PII-in-transcript contradiction)
The `transcript` stores message content for agent briefing and AI tuning, but **must not contain renter PII**. Two enforcement layers:
1. The chatbot is instructed never to request name/email/phone in chat (those go to the form).
2. Before persisting each turn, `ai_chat.py` runs a lightweight PII scrub (regex for email, UK phone patterns; redact to `[redacted]`) on the stored `content`. The unredacted message is used for the live LLM call but not persisted.

Structured personal data lives only in `renters`. If a transcript is ever found to contain PII despite scrubbing, it is treated as PII-bearing for retention and erasure purposes (see `06-security-gdpr.md`).

---

## 5. `transactions`

```sql
id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
renter_id                   UUID NOT NULL REFERENCES renters(id),
listing_id                  TEXT NOT NULL REFERENCES properties(listing_id),
scraye_introduction_id      TEXT,
scraye_tenancy_id           TEXT,
introduction_date           DATE,
tenancy_start_date          DATE,
monthly_rent                NUMERIC,
annual_rent                 NUMERIC GENERATED ALWAYS AS (monthly_rent * 12) STORED,
intro_commission_expected   NUMERIC,
intro_commission_received   NUMERIC,
intro_commission_paid_at    DATE,
fintech_products_used        TEXT[] DEFAULT '{}',
fintech_commissions_expected NUMERIC DEFAULT 0,
fintech_commissions_received NUMERIC DEFAULT 0,
viewing_fee_earned          NUMERIC DEFAULT 0,
checkin_bonus_earned        NUMERIC DEFAULT 0,
status                      TEXT NOT NULL DEFAULT 'introduced'
                            CHECK (status IN ('introduced','progressing','let_agreed','completed','cancelled')),
notes                       TEXT,
created_at                  TIMESTAMPTZ DEFAULT NOW(),
updated_at                  TIMESTAMPTZ
```

*Phase 1 note:* the table exists in the schema (for FK stability against `properties.listing_id`, see §2) but is empty in Phase 1 — no `properties` rows exist to reference, and the commission tracker UI/workflow is optional later work. Phase 1 reconciles commissions via spreadsheet.

---

## 6. `landlords`

```sql
id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
full_name               TEXT,                     -- PII
email                   TEXT,                     -- PII
phone                   TEXT,                     -- PII
property_address        TEXT,
bedrooms                INTEGER,
asking_rent             NUMERIC,
available_from          DATE,
advanced_rent_interest  BOOLEAN DEFAULT false,
listing_interest        BOOLEAN DEFAULT false,
status                  TEXT NOT NULL DEFAULT 'new'
                        CHECK (status IN ('new','contacted','listed','inactive')),
consent_given           BOOLEAN NOT NULL,
consent_version         TEXT NOT NULL,
consent_at              TIMESTAMPTZ NOT NULL,
notes                   TEXT,
created_at              TIMESTAMPTZ DEFAULT NOW(),
updated_at              TIMESTAMPTZ
```

---

## 7. `agents`

```sql
id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
name        TEXT NOT NULL,
email       TEXT UNIQUE NOT NULL,
role        TEXT NOT NULL DEFAULT 'agent' CHECK (role IN ('agent','admin')),
created_at  TIMESTAMPTZ DEFAULT NOW()
```

---

## 8. Intent scoring rubric

Computed by `lead_scoring.py`. The same rubric runs on form submission and incrementally during chat.

| Signal | Score |
|---|---|
| Move-in within 4 weeks | +30 |
| Move-in 5–8 weeks | +15 |
| Move-in 9–12 weeks | +5 |
| Move-in 12+ weeks / unknown | 0 |
| Budget confirmed & realistic for area | +20 |
| Budget vague / below area minimum | 0 |
| Employment confirmed (full/part) | +15 |
| Self-employed / Universal Credit | +10 (flag Guarantor) |
| Student | +10 (flag Guarantor) |
| No employment info | 0 |
| Has UK guarantor | +10 |
| No guarantor (Deposit Share candidate) | +5 (flag product) |
| Specific property interest | +10 |
| Browsing only | 0 |
| Has rented in UK before | +5 |
| Contact details complete | +5 |

**Phase 1 budget realism check:** do not query `properties` or any listing data. The implementation should use a small static/configured baseline for requested bedrooms and known priority areas; if no area baseline exists, treat a positive `max_rent` plus requested bedrooms as "confirmed" rather than blocking or penalising the lead. Below-baseline budgets score 0 for this signal, never negative, and still reach the agent.

**Thresholds (website — prioritisation only):** 70+ hot (contact ≤2h) · 45–69 warm (≤24h) · 25–44 standard queue · <25 low-priority. All website form submissions reach the agent; the score determines contact urgency only. **Social channels (Phase 2 — qualification gate):** the same rubric acts as a filter; only leads above the qualifying bar are routed to the agent. Review thresholds monthly against conversion data.

---

## 9. Invariants

- `consent_given = true` on every `renters` and `landlords` row (enforced in the application layer before insert).
- `conversations.transcript` contains no raw PII.
- `properties` and `transactions` have zero rows in Phase 1 (see §2 and §5).

Optional later transaction invariants, active only if the in-app `transactions` workflow is approved:
- A `transactions` row is created only after `renters.scraye_introduction_id` is set.
- `annual_rent` is always derived; never set directly.
- A renter in `lead_status='completed'` has a matching `transactions` row with `status='completed'`.
