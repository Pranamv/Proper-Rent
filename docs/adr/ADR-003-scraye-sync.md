# ADR-003: Optional Scraye Sync Strategy — Separate Process, Freshness Buffer

**Status:** Deferred to optional Phase 3+ work
**Date:** 2025-06-01 (deferred 2026-06-12)
**Deciders:** Project founder

---

## Phase 1 deferral note (2026-06-12)

The Scraye sync worker, the `properties` table population, and any public listings pages are
**out of Phase 1 and Phase 2 core scope**. Reasons:

- Scope/complexity reduction for the Phase 1 MVP — see `01-mvp-prd.md` §10.
- The copyright/licensing terms for displaying Scraye listing content on Proper Rent's own
  site are unresolved.

In Phase 1, the `properties` and `transactions` tables exist in the schema (for FK stability,
see `03-data-model.md` §2 and §5) but are empty, and the chatbot answers fintech/letting-process
questions from a default system prompt with no per-listing data. Phase 2 also does not depend on
this worker. The design below is preserved for an optional later phase, pending the licensing
decision, ROI check, and re-confirmation of Scraye's sync permission.

---

## Context

Proper Rent sources all property listings from Scraye. The data must be kept reasonably fresh so the chatbot and listing pages don't mislead renters about availability. At the same time, the sync process involves network I/O (scraping Scraye's pages with their explicit permission), HTML parsing, and database upserts — operations that are long-running and failure-prone.

Three questions needed answers:

1. **Where does the sync run?** Inside the FastAPI web server (as a background task) or as a separate process?
2. **How often?** Continuous polling, hourly, or less frequent?
3. **How does the system handle stale data?** Silently, or with an explicit freshness rule?

## Decision

### Separate process
The sync worker runs as a **standalone Python process** (`python -m app.services.scraye_sync`), never as a FastAPI background task inside the web server.

Rationale:
- A long-running sync (potentially minutes, depending on listing count) would tie up a web server worker and risk interfering with API request handling.
- A separate process can be killed, restarted, or rescheduled without affecting the live website.
- Railway (the hosting platform) supports scheduled jobs natively — the sync worker maps directly to this.

The sync worker lives inside the `app` package (it shares ORM models and `config.py`) but is invoked as its own entry point. A **Postgres advisory lock** (`pg_try_advisory_lock`) ensures only one sync instance runs at a time, even if the scheduler fires twice.

### 12-hour default interval
The sync runs every 12 hours by default (`SYNC_INTERVAL_HOURS=12`). This balances freshness against Scraye server load and is configurable without a code change.

### 24-hour freshness rule
Any query that asserts availability to a renter must filter:

```sql
WHERE status = 'active' AND last_seen_at > NOW() - INTERVAL '24 hours'
```

The 24-hour window covers **one full missed sync cycle**. If a sync fails at hour 0 and the next succeeds at hour 12, all listings remain within the window. If two consecutive syncs fail (24h gap), listings fall outside the window and the system stops confirming their availability — the chatbot defers to a human, and listing pages show a staleness indicator.

### Graceful degradation
If the sync process fails or Scraye becomes unreachable:
- The `properties` table retains its last-known-good state (no data is deleted on failure).
- Listings that fall outside the freshness window are not shown as "available" — the chatbot says "a human will confirm" and listing pages can display a staleness banner.
- If the error rate for a sync run exceeds 5%, an alert is raised (email to `ADMIN_ALERT_EMAIL`).
- The website and intake forms remain fully functional regardless of sync status.

### Content-hash diffing
Each listing's scraped content is hashed (`SHA-256 → content_hash`). On subsequent syncs, only listings whose hash has changed are re-processed. This reduces database writes and makes sync runs faster as the listing set grows.

### Lifecycle transitions

| Condition | Status set | Timestamp set |
|---|---|---|
| Listing found in Scraye, new | `active` | `first_seen_at`, `last_seen_at` |
| Listing found in Scraye, existing | `active` | `last_seen_at` updated |
| Listing not found in Scraye | `missing` | `missing_from_source_at` |
| Missing for >7 days | `inactive` | `inactive_at` |
| Scrape error for a specific listing | `error` | `error_message` set |

### Data extraction
The sync worker extracts `locality` and `region` into flat, indexed text columns from the source `address` JSONB (`address->>'locality'`, `address->>'region'`). This is the sync worker's responsibility, not FastAPI's, because only the sync worker writes to `properties`.

## Consequences

### Positive
- The web server is never blocked by sync I/O.
- Stale data is handled explicitly — no silent misinformation.
- The sync can be run on demand during development (`python -m app.services.scraye_sync`).
- Content-hash diffing keeps sync runs efficient.

### Negative
- The sync must be permission-based. If permission is not granted, licensing terms are not viable, or permission is later withdrawn, the sync does not run and the product continues with manual Scraye shortlisting.
- HTML scraping is brittle — a Scraye page structure change breaks the parser. Mitigated by error-rate alerting and freezing the table at the last good state.

### Neutral
- The 12h interval and 24h freshness window are conservative. They can be tightened (e.g. 6h sync, 12h window) if Scraye's server load permits.
- If optional data expansion proceeds, a multi-platform sync abstraction can make a second supply partner a new adapter, not a rebuild of this sync logic.
