# 02 — Architecture

**Reference:** Detailed decisions live in `adr/`. This document is the consolidated picture.

---

## 1. Overview

Phase 1 is two deployable units sharing one managed database:

```
┌──────────────────┐         ┌──────────────────────────┐
│  Next.js          │  HTTP   │  FastAPI backend          │
│  frontend         │ ──────► │  (single service)         │
│  (Vercel)         │         │  routers + services       │
│  UI only          │ ◄────── │  chat · leads · admin     │
└──────────────────┘         └─────────┬────────┬─────────┘
                                        │        │
                                        │        ▼
                                        │   ┌──────────────┐
                                        │   │ OpenRouter   │
                                        │   │ (LLM gateway)│
                                        │   └──────────────┘
                                        ▼
                              ┌──────────────────────────┐
                              │  Supabase                 │
                              │  Postgres · auth · storage│
                              │  read/write: FastAPI      │
                              └──────────────────────────┘
```

The FastAPI backend serves both the website's data API and the AI chat. Supabase is the shared substrate. See `adr/ADR-001-architecture.md` and `adr/ADR-002-ai-service.md`.

A Scraye sync worker (separate process, scraping Scraye into `properties`) is a preserved design option but **deferred to optional later scope** pending a licensing/copyright decision — see `adr/ADR-003-scraye-sync.md`. Phase 1 and Phase 2 core scope ship without it.

## 2. Component responsibilities

| Component | Responsibility | Hosting |
|---|---|---|
| Next.js frontend | Presentation only. No business logic. Calls FastAPI. | Vercel |
| FastAPI backend | All API routes, intent scoring, AI orchestration, notifications. | Railway / Render (or local) |
| Supabase | Postgres database, auth (admin + future renter), file storage. | Supabase cloud |

*(Optional later work may add: Sync worker — scrape Scraye, upsert `properties`, manage listing lifecycle, Railway scheduled process.)*

## 3. Data ownership (critical)

| Table | Writer | FastAPI access |
|---|---|---|
| `renters` | FastAPI | Full |
| `conversations` | FastAPI | Full |
| `landlords` | FastAPI | Full |
| `agents` | FastAPI (admin) | Full |
| `properties`, `transactions` | None in Phase 1 (optional later sync/listing work) | Schema only — empty, not exposed |

`properties` and `transactions` exist in the schema (created by the Phase 1 migration, since `transactions.listing_id` references `properties.listing_id`) but are not written or read by anything in Phase 1. If optional later listing work is approved, the sync worker and FastAPI must never write each other's tables — this is the rule that keeps a shared database from becoming a coupling problem.

## 4. Technology stack

| Layer | Choice | Notes |
|---|---|---|
| Frontend | Next.js (TypeScript) | SSR for SEO on public pages |
| Backend | Python 3.12, FastAPI | Async; one service for API + chat |
| Schemas | Pydantic v2 | Request/response validation |
| ORM | SQLAlchemy 2.x | |
| Migrations | Alembic | Only mechanism for schema change |
| Database | Supabase (Postgres 15) | Shared substrate |
| Auth | Supabase Auth (JWT) | Admin now; renter dashboard later |
| LLM gateway | **OpenRouter** | Single API across models; default model set via `LLM_MODEL` env var. Provider-agnostic by design — swap or pin later without touching call sites. |
| Email | Resend | Confirmations, agent alerts |
| Analytics | Plausible (or equivalent cookieless tool) | No cookie banner required; see `06-security-gdpr.md` §9 |
| File storage | Supabase Storage or Cloudinary | Reserved for optional later property photos |
| Hosting | Vercel + Railway | Frontend + backend; optional later work may add a worker |

### LLM provider note
The AI layer talks to OpenRouter, not a single vendor SDK. All model calls go through one thin client in `services/llm_client.py`; `services/ai_chat.py` never imports a vendor SDK directly. The default model is configured by `LLM_MODEL` (e.g. a Claude or GPT model string as OpenRouter expects). This keeps model choice a config decision, not a code change, and makes A/B testing models trivial. If you later want to pin to one provider's native API for cost or latency, only `llm_client.py` changes.

## 5. Backend structure

```
/backend
├── app/
│   ├── main.py              # app entry, router registration
│   ├── config.py            # Pydantic BaseSettings, env vars
│   ├── database.py          # SQLAlchemy engine + session factory
│   ├── dependencies.py      # db session, auth deps
│   ├── models/              # ORM models (renter, conversation, landlord, agent; property/transaction = schema-only placeholders)
│   ├── schemas/             # Pydantic schemas (renter, chat, landlord; property/transaction = schema-only placeholders)
│   ├── routers/             # chat, leads, landlords, admin  (+ webhooks in Phase 2; properties optional later)
│   └── services/
│       ├── llm_client.py    # OpenRouter HTTP client (the ONLY place that talks to the LLM API)
│       ├── ai_chat.py       # context loading + prompt construction; calls llm_client
│       ├── lead_scoring.py  # intent score calculation
│       ├── property_search.py  # Optional later — filtered listing queries; not called in Phase 1
│       ├── scraye_sync.py   # Optional later — sync logic as a SEPARATE process; not run in Phase 1
│       └── notifications.py # email + agent alerts (Resend)
├── alembic/
├── tests/{unit,integration}/
├── requirements.txt
└── .env.example
```

## 6. Sync worker process model (optional later)

Deferred along with `properties` population — see `adr/ADR-003-scraye-sync.md`. If this work is approved later, `scraye_sync.py` will live inside the `app` package for shared models and config, but **run as its own process**, never as a FastAPI background task inside the web server:

```bash
# Web process
uvicorn app.main:app

# Sync process (separate container / scheduled job) — optional later
python -m app.services.scraye_sync
```

A Postgres advisory lock (`pg_try_advisory_lock`) will ensure only one sync instance runs at a time. The interval will be set by `SYNC_INTERVAL_HOURS` (default 12).

## 7. Request flow: a chat message

1. Frontend widget POSTs to `/api/v1/chat` with `session_id`, `message`, optional `renter_id`.
2. `routers/chat.py` validates input (Pydantic) and loads conversation history. If `renter_id` is supplied on the public Phase 1 route, it loads that renter profile only when the renter is linked to the same `session_id`; otherwise it ignores the supplied `renter_id` for context.
3. `ai_chat.py` builds the prompt (default system instructions covering Proper Rent's services, fintech products, and the letting process + context + history) and calls `llm_client.py` (OpenRouter). No `properties` data is loaded in Phase 1.
4. `lead_scoring.py` updates the running server-side score. On the website channel, this score is stored for agent prioritisation only — no in-chat alert is fired. (On social channels in Phase 2, threshold-crossing will trigger routing decisions.)
5. The reply, `suggested_action`, and `session_id` are returned. The score is **not** returned.
6. The turn is appended to the `conversations.transcript` (PII-free).

## 8. Deployment & environments

- **Local dev:** FastAPI runs on the laptop pointing at the hosted Supabase via env vars. This is the "host anywhere" property — nothing ties the backend to a specific host.
- **Production:** Frontend on Vercel; backend as a Railway service; Supabase cloud. (Optional later listing work may add the sync worker as a second Railway service.)
- All configuration is environment variables (`config.py`). No secrets in code. `.env.example` documents every variable.

## 9. Phase 2 extension point

Social channels are added by introducing `routers/webhooks.py` plus per-channel adapters that format inbound/outbound payloads. `ai_chat.py` is channel-agnostic and does not change. See `adr/ADR-004-channel-sequencing.md`.

## 10. Architecture decision records

- `ADR-001-architecture.md` — Phase 1 two-unit split, shared DB rationale, deferred sync worker.
- `ADR-002-ai-service.md` — single backend for web API and chat.
- `ADR-003-scraye-sync.md` — sync strategy, separate process, freshness buffer (deferred to optional later scope).
- `ADR-004-channel-sequencing.md` — website-first, social deferred.
- `ADR-005-llm-gateway.md` — OpenRouter as the LLM gateway (provider-agnostic).
