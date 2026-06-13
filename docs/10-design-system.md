# 10 — Design System & Frontend Experience

**Reference:** Site map and pages in `05-user-flows.md` §1; admin panel scope in `01-mvp-prd.md` §5 (Admin) and `09-roadmap.md`.
**Goal:** a modern, interactive, animated, accessible website — without adding scope, dependencies, or risk that conflicts with `07-development-standards.md`.

---

## 1. Principles

- **Animation is polish, not plot.** Motion should clarify state changes (form steps, chat replies, confirmation states) and add perceived quality — it must never gate functionality or block content from rendering.
- **Public site is SEO-sensitive.** Home, For Renters, For Landlords, About are SSR'd for SEO (`02-architecture.md` §4). Animations on these pages must not delay first paint or shift layout (no animation-induced CLS).
- **Accessibility is not optional.** WCAG 2.1 AA baseline (`07-development-standards.md`). All animation respects `prefers-reduced-motion: reduce` — reduce to opacity/no-motion fallbacks.
- **One design system for both surfaces.** The public site and the admin panel share the same component library and tokens, but the admin panel favours density and clarity over marketing polish.

---

## 2. Component library & styling

- **Tailwind CSS** for styling across both the public site and admin panel.
- **shadcn/ui** (Radix primitives + Tailwind) for the admin panel's tables, forms, tabs, dialogs, and the public site's form controls and chat widget shell. Shared component primitives avoid each feature reinventing tables/forms/modals (see `09-roadmap.md` admin shell notes).
- Design tokens (colour palette, spacing scale, typography, radii) are defined once in `tailwind.config` and consumed by both surfaces. Exact brand colours/typography are a pending visual-identity decision — placeholder tokens may be used until finalised, but the token *structure* should be in place from the first frontend PR so it isn't retrofitted later.

---

## 3. Animation

- **Library:** Framer Motion (Motion for React) — integrates cleanly with Next.js, supports `prefers-reduced-motion`, and covers layout/page/element transitions without a heavy runtime cost.
- **Where animation is used in Phase 1:**
  - Page/section entrance transitions on Home, For Renters, For Landlords (subtle fade/slide on scroll into view).
  - Multi-step intake form: animated step transitions (renter and landlord forms).
  - Post-submit confirmation state (`05-user-flows.md` §2a/§4a): a distinct transition into the confirmation view, not a hard reload.
  - Chatbot widget: open/close transition, typing indicator while waiting for `/chat`, and a transition when `suggested_action: "show_intake_form"` opens the form.
  - Admin panel: minimal — list/table row transitions and tab switches only; no decorative motion that slows down operational use.
- **Performance budget:** animations must not block interaction (no animating `width`/`height` of large elements without `will-change`; prefer `transform`/`opacity`). Lighthouse performance score on public pages should not regress from adding animation.

---

## 4. Accessibility baseline (WCAG 2.1 AA)

Relevant given the renter audience explicitly includes students, international tenants, Universal Credit recipients, and people with accessibility needs (`renters.accessibility_needs` is a captured field):

- All form inputs have visible labels (not placeholder-only) and accessible error messages.
- Visible focus states on all interactive elements, including the chat widget toggle and suggested-action buttons.
- Colour contrast meets AA for text and UI controls.
- Chat widget is fully keyboard-operable (open, type, send, close) and announces new messages to screen readers (e.g. `aria-live`).
- `prefers-reduced-motion: reduce` disables non-essential transitions (entrance/scroll animations) and reduces others (e.g. typing indicator becomes static "Thinking…" text).

---

## 5. SEO & metadata checklist (public pages)

Given CPQL is a named success metric (`00-project-overview.md` §11), the SSR pages need baseline SEO hygiene from launch:

- Per-page `<title>` and meta description (Home, For Renters, For Landlords, About).
- Open Graph / Twitter card tags for social sharing.
- `sitemap.xml` and `robots.txt` (disallow nothing in Phase 1 — there are no listing pages to exclude).
- Structured data (e.g. `Organization`, `FAQPage` for the FAQ sections added to For Renters/For Landlords).
- Canonical URLs to avoid duplicate-content issues if marketing campaigns add UTM-tagged links.

---

## 6. Admin panel shell

To keep Phase 1's two admin views (Leads, Landlords) from requiring a redesign when Phase 2/3 add more (Analytics, Properties, Conversations, renter dashboard data):

- **Layout shell:** persistent sidebar nav + top bar + content area, from day one, even with only 2–3 nav items.
- **Nav config is data-driven by `agents.role`** (`agent` | `admin`), not hardcoded — so a future agent-facing view is a config change, not a rearchitecture.
- **Generic data table component** (sortable/filterable/paginated): used for the leads list and the landlords list; reused for any future properties/transactions tables.
- **Lead detail as tabbed panels** (Overview / Conversation / Notes & Status): leaves room for a future "Matched Listings" or "Transaction" tab without rearchitecting the page.

---

## 7. Open items

- Final visual identity (logo, colour palette, typography) — not a Phase 1 blocker; placeholder tokens are acceptable for initial development.
- Confirm Framer Motion vs. a lighter alternative (e.g. CSS-only transitions) once real page complexity is known — Framer Motion is the default unless bundle-size concerns arise during development.
