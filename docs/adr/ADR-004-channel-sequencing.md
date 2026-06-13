# ADR-004: Channel Sequencing — Website First, Social Deferred

**Status:** Accepted
**Date:** 2025-06-01
**Deciders:** Project founder

---

## Context

The original product concept included an AI chatbot operating on Facebook Messenger and WhatsApp to filter high-intent renters before they reached a human agent. The question was whether to build social channel integration in Phase 1 alongside the website, or defer it.

Two options were considered:

1. **Social channels in Phase 1** — build WhatsApp Cloud API and Meta Messenger API integrations alongside the website, so the chatbot operates on all three surfaces from launch.
2. **Website first, social deferred** — launch with the website and chatbot widget only. Add social channels in Phase 2 once the core funnel (content → chatbot → form → agent) is proven.

## Decision

**Option 2: website first, social channels deferred to Phase 2.**

### Rationale

1. **Controlled environment.** The website is fully owned infrastructure. The chatbot widget, intake forms, content pages, and consent flows are all under Proper Rent's control. On social channels, the experience is constrained by platform rules (Meta's 24-hour messaging window, template approval, API rate limits).

2. **Simpler consent model.** GDPR consent on the website is a form checkbox with versioned text — straightforward to implement and audit. On WhatsApp/Messenger, consent must be captured within a conversational flow, which adds UX and legal complexity.

3. **No external API dependency at launch.** The website funnel is self-contained. A Meta API outage, policy change, or account suspension does not affect the core business. Social channels introduce a dependency on Meta's platform stability and review processes.

4. **The AI service is channel-agnostic anyway.** `ai_chat.py` is designed to receive a message and context and return a reply — it has no knowledge of the delivery channel. Adding social channels in Phase 2 means introducing `routers/webhooks.py` with per-channel adapters that format inbound/outbound payloads. The AI service itself does not need listing data to support this.

5. **Qualification gating is a Phase 2 concern.** On the website, every form submission reaches the human agent directly — the intent score is used for prioritisation, not filtering. Social channels are where qualification becomes operationally necessary (higher volume of anonymous, low-intent inbound traffic). Deferring social channels means deferring the qualification-gate complexity.

6. **Faster time to first revenue.** A working website with a chatbot and intake forms can generate leads and commissions without waiting for Meta API approval, webhook verification, template review cycles, or Scraye listing-display licensing decisions.

## Consequences

### Positive
- Phase 1 scope is smaller, faster to build, and easier to test.
- The consent model is clean and auditable from day one.
- No risk of a Meta platform issue blocking launch.
- The AI service is proven in a controlled environment before being exposed to higher-volume social traffic.

### Negative
- Phase 1 does not capture leads from WhatsApp or Facebook Messenger — renters on those channels must be directed to the website.
- Facebook Marketplace listings (posted manually in Phase 1) link back to the website rather than initiating an in-platform conversation.

### Phase 2 plan
Social channels are added by:
1. Registering webhooks with Meta (WhatsApp Cloud API, Messenger API).
2. Adding `routers/webhooks.py` with signature verification (see `06-security-gdpr.md` §8).
3. Adding per-channel adapters that translate inbound messages to the `ai_chat.py` input format and outbound replies to the platform's expected format.
4. Implementing the qualification gate: on social channels, the intent score acts as a filter — only leads above the qualifying threshold are routed to the agent; lower-scoring contacts receive automated follow-up sequences.
5. Handling platform-specific constraints (24-hour messaging window, template messages, session token handoff to the website for form completion).

Scraye sync/listing data is not part of this Phase 2 social-channel decision; it remains optional later work under ADR-003.
