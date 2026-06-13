# ADR-005: OpenRouter as the LLM Gateway (Provider-Agnostic)

**Status:** Accepted
**Date:** 2025-06-01
**Deciders:** Project founder

---

## Context

The AI chatbot requires an LLM for generating replies, understanding renter intent, and producing agent briefing summaries. Early drafts referenced a single vendor's API (e.g. OpenAI's `openai` SDK) directly in `ai_chat.py`. This created two problems:

1. **Vendor lock-in.** Switching models (e.g. from GPT-4o to Claude Sonnet to Gemini) would require code changes wherever the SDK was imported.
2. **No A/B testing path.** Comparing model quality or cost required changing code, not just configuration.

Three options were considered:

1. **Direct vendor SDK** — import `openai` (or `anthropic`, etc.) directly in `ai_chat.py`. Simplest initial setup but hardest to change later.
2. **Custom abstraction layer** — build a `llm_client.py` that wraps multiple vendor SDKs behind a common interface. Flexible but requires maintaining adapters for each provider.
3. **OpenRouter as a gateway** — route all LLM calls through OpenRouter's unified API, which supports models from OpenAI, Anthropic, Google, Meta, Mistral, and others under a single API format. Use a thin client (`llm_client.py`) that speaks only to OpenRouter.

## Decision

**Option 3: all LLM calls go through OpenRouter via a single thin client.**

### Implementation

```
ai_chat.py  →  llm_client.py  →  OpenRouter API  →  LLM provider
                    ↑
              LLM_MODEL env var
              OPENROUTER_API_KEY env var
```

- **`services/llm_client.py`** is the only module that makes HTTP calls to an LLM API. No other module in the codebase imports an LLM SDK or makes direct LLM API calls.
- **`services/ai_chat.py`** builds prompts (system instructions + context + conversation history) and calls `llm_client.py`. It has no knowledge of the underlying provider.
- The **default model** is set by the `LLM_MODEL` environment variable (e.g. `anthropic/claude-sonnet-4-20250514`, `openai/gpt-4o`). Changing the model is a configuration decision, not a code change.
- The `/chat` endpoint has a **10-second timeout** on the LLM call. If OpenRouter or the downstream provider is unavailable or slow, the endpoint returns a graceful fallback reply ("Our team can help — please use the form and we'll be in touch"). The website and intake forms remain fully usable regardless of LLM availability.

### Why OpenRouter over a custom abstraction

- OpenRouter already normalises the request/response format across providers. Building a custom abstraction would duplicate this work.
- OpenRouter supports fallback models, rate limiting, and spend tracking at the gateway level — features that would otherwise need to be built.
- If OpenRouter itself becomes a problem (cost, latency, reliability), the only file that changes is `llm_client.py` — swap it to call a vendor API directly. The rest of the codebase (including all tests that mock `llm_client`) is unaffected.

## Consequences

### Positive
- Model choice is a config decision: change `LLM_MODEL`, redeploy, done.
- A/B testing models (e.g. comparing Claude vs GPT on reply quality) is trivial — deploy two instances with different `LLM_MODEL` values.
- `ai_chat.py` is fully testable by mocking `llm_client.py` — no real API calls in tests.
- The 10-second timeout and fallback ensure the website never goes down because of an LLM issue.

### Negative
- OpenRouter adds a small latency overhead (one extra hop) and a margin on top of provider pricing. At Phase 1 volumes this is negligible.
- OpenRouter is itself a dependency. If it goes down, the chatbot degrades to the fallback reply. Mitigated by the timeout and the fact that the intake form (the actual lead-capture mechanism) does not depend on the LLM.

### Neutral
- The `OPENROUTER_API_KEY` is stored as an environment variable, never in code (see `06-security-gdpr.md` §2).
- If a future decision pins the system to one provider's native API for cost or latency reasons, only `llm_client.py` changes. All call sites, prompts, and tests remain the same.
