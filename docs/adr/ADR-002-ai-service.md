# ADR-002: Single Backend for Web API and AI Chat

**Status:** Accepted
**Date:** 2025-06-01 (amended 2026-06-12)
**Deciders:** Project founder

---

## Context

The Proper Rent backend has two runtime concerns:

1. **Website data API** — lead intake, landlord intake, admin operations, health checks, and
   later property/listing endpoints if the Scraye sync work is revived.
2. **AI chat service** — prompt construction, LLM calls, transcript storage, PII scrubbing,
   suggested-action extraction, and server-side intent scoring.

The question is whether the website API and chat API should be separate services or combined.

Two options were considered:

1. **Separate services** — a "website API" and a "chat API", each independently deployed.
   The chat service would need its own database access or would call the website API for
   renter/conversation context.
2. **Single service** — one FastAPI application with separate routers (`routers/chat.py`,
   `routers/leads.py`, `routers/landlords.py`, `routers/admin.py`) and a shared service
   layer (`services/ai_chat.py`, `services/lead_scoring.py`, `services/llm_client.py`).
   `routers/properties.py` and `services/property_search.py` remain optional later extension points.

## Decision

**Option 2: single FastAPI backend serving both the website API and the AI chat.**

The AI chat logic is implemented in `services/ai_chat.py`, which is **channel-agnostic by
design**. On the website in Phase 1, it serves as a helpful assistant: answering general
questions about Proper Rent, the letting process, and Scraye fintech products from a default
system prompt, then guiding visitors to the intake form. It does **not** load listing data or
quote per-listing figures in Phase 1.

The chat endpoint (`POST /api/v1/chat`) and the website endpoints (`/leads`, `/landlords`,
`/admin`) share the same database session, Pydantic models, and service layer. This lets chat
load conversation history, optionally load a non-PII renter profile summary, update the
conversation transcript, and update the server-side score without cross-service calls.

Phase 2 can extend the same backend with social webhooks. Optional later listing work can add
`/properties`. The service boundary does not need to change: new routers/adapters call the same
chat and scoring services with richer context.

## Consequences

### Positive

- Intent scoring (`lead_scoring.py`) is shared between chat (incremental updates) and intake
  (final computation) without duplication.
- One deployment, one set of env vars, one health check.
- The chatbot can use renter/conversation context without API-to-API calls.
- Phase 2 social channels are added by introducing `routers/webhooks.py` with per-channel
  adapters that call the unchanged `ai_chat.py` interface.
- Optional later listing context can be added by wiring `property_search.py` into the same
  service layer once `properties` is populated and legally usable.

### Negative

- A slow LLM response on `/chat` could, in theory, exhaust the async worker pool and degrade
  `/leads` or `/landlords`. Mitigated by a 10-second timeout on the LLM call and a graceful
  fallback reply.
- If chat traffic grows significantly, the backend may need to be split. This is a Phase 3
  concern; monitor `/chat` p95 latency.

### Neutral

- `ai_chat.py` never imports an LLM SDK directly; it calls `llm_client.py` (see ADR-005).
  This keeps the AI logic testable and the provider swappable regardless of whether the
  service is split later.
