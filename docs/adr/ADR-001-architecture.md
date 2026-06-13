# ADR-001: Phase 1 Two-Unit Architecture with Shared Database

**Status:** Accepted
**Date:** 2025-06-01 (amended 2026-06-12)
**Deciders:** Project founder

---

## Context

Proper Rent needs a system that serves a public website, captures renter and landlord
intake, runs an AI chatbot, and provides an admin interface. Earlier drafts also placed
Scraye listing sync and public listing pages in Phase 1. That made the MVP harder to build
and introduced an unresolved copyright/licensing question around displaying Scraye listing
content on Proper Rent's own site.

Phase 1 now deliberately excludes Scraye sync, `properties` population, public listing pages,
and per-listing chatbot context. The launch architecture should therefore optimise for the
actual Phase 1 product: website content, chatbot-assisted intake, admin follow-up, and clean
extension points for later listing/sync work.

Three options were considered:

1. **Two-unit Phase 1, deferred sync worker** — Next.js frontend plus one FastAPI backend
   sharing Supabase. `properties` and `transactions` exist as schema-only tables, but remain
   empty and unused until the listing/sync decision is reopened.
2. **Build the sync worker in Phase 1 anyway** — keep the original modular backend plus
   separate worker model. This preserves the old listing roadmap but spends MVP effort on
   data freshness, scraping, and listing-display risk before proving the lead funnel.
3. **Full microservices** — separate API, chat, sync, and admin services. Maximum isolation,
   but too much operational weight for the launch product.

## Decision

**Option 1: two deployable Phase 1 runtime units sharing one managed database, with the
Scraye sync worker deferred.**

```
Next.js frontend (Vercel) -> FastAPI backend (Railway/Render) -> Supabase (Postgres)
                                      |
                                      v
                              OpenRouter (LLM gateway)
```

The Phase 1 runtime units are:

- **Next.js frontend** — presentation only, no business logic.
- **FastAPI backend** — public website API, AI orchestration, scoring, notifications, admin routes.
- **Supabase** — managed Postgres, auth, and storage used by the backend. It is a managed
  dependency, not an app runtime unit.

The shared database is governed by a **data-ownership table**:

| Table | Writer | FastAPI access |
|---|---|---|
| `renters`, `conversations`, `landlords`, `agents` | FastAPI | Full |
| `properties`, `transactions` | None in Phase 1 | Schema only; empty and not exposed |

A later optional phase may add a standalone Scraye sync worker. If that happens, the worker owns
all writes to `properties`, and FastAPI reads `properties` through public/listing/chat contexts
only. The sync strategy is preserved separately in `ADR-003-scraye-sync.md`, now marked deferred.

## Consequences

### Positive

- Phase 1 has fewer moving parts: frontend, backend, Supabase, and OpenRouter.
- The MVP avoids spending engineering time on a Scraye listing-display surface before the
  licensing/copyright position is clear.
- The backend can be run locally, on Railway, or on any host; nothing ties it to a specific
  platform.
- Schema stability is preserved because `properties` and `transactions` already exist, so a
  future listing/sync phase does not require reshaping core lead records.
- The architecture still leaves a clean process boundary for a future sync worker.

### Negative

- Phase 1 does not have owned listing search, public listing pages, or per-listing chatbot
  quotes. Agents must shortlist listings manually from Scraye.
- The `properties` and `transactions` tables are present but intentionally unused in Phase 1,
  so agents and developers must not accidentally wire them into the public surface.

### Neutral

- The frontend is stateless and deployed on Vercel; it has no knowledge of backend internals.
- Phase 2 social channels are added as new routers in the same backend, not as new services
  (see ADR-002 and ADR-004).
- If the sync worker is revived, it should remain a separate process rather than a FastAPI
  background task.
