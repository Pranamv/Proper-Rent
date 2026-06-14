# Proper Rent — Frontend Redesign Plan

Status: planning / not yet implemented. This document is the working reference for the
frontend visual + copy refresh. Update it as decisions are confirmed or changed.

---

## 0. Design read & dials

**Design read:** Redesign of an existing lettings/proptech marketing site for renters and
landlords in the UK market, audience is consumers making a trust-sensitive decision
(deposits, guarantors, agent follow-up). Vibe: warm, modern, premium-but-approachable, not
cold fintech. Leaning toward Tailwind utilities + Motion (`motion/react`), built on the
existing green brand rather than a full identity reset.

**Dials:**

| Dial | Value | Why |
|---|---|---|
| `DESIGN_VARIANCE` | 7 | Current site is very symmetric (3-up card grids everywhere). Moving toward an asymmetric hero and a non-card "how it works" breaks that without going full agency-chaos. |
| `MOTION_INTENSITY` | 6 | One scroll-linked hero element (journey path) plus consistent enter/stagger reveals. Stays in "Motion hooks, fluid" territory, not GSAP pin/scrub. |
| `VISUAL_DENSITY` | 4 | Marketing site, but covers real financial/process information (Deposit Share, guarantors), so keep some density rather than pure art-gallery airiness. |

These values gate the decisions below. If a later change pushes variance/motion higher,
note it explicitly rather than drifting.

---

## 1. Goals

- Add a hero visual with motion (currently the homepage hero has no image/illustration).
- Finalize titles/copy and layouts for deployment, removing dev/internal-facing language.
- Improve UX to increase engagement and registration completions (renter and landlord
  forms).

---

## 2. Design tokens (Phase 0)

**Status: implemented.** Palette, typography, and icon library below are live in
`globals.css` / `tailwind.config.ts` / `layout.tsx`. `surface-subtle` was retuned from its
old cool-mint value to match the new `surface-elevated` pale-sage tone (`#F1F4EC`) so hover
states stay consistent with the warm palette. `accent` / `accent-foreground` (used by admin
badges and the form step indicator) were left unchanged — out of scope for this redesign.

**Files:** `src/app/globals.css`, `tailwind.config.ts`, `src/app/layout.tsx`

### 2.1 Palette — "Sage & Linen" (clay demoted to a spark accent)

Keeps the existing green brand identity, warms the background, and adds a warm-white
"linen" tone for larger secondary surfaces (cards, badges, the CTA band). The original
terracotta/clay survives only as a small, rare "spark" — icon-circle dots, the hero path's
traveling marker, active-state indicators — not as a fill used across larger areas, which
read as light brown rather than warm.

| Token | Current | Proposed | Contrast check |
|---|---|---|---|
| `--color-background` | `246 250 248` (cool pale mint) | warm cream `#FBF7EF` | canvas, not text |
| `--color-surface` | `255 255 255` | unchanged | white cards on cream canvas |
| `--color-surface-elevated` (new) | n/a | pale sage tint `#F1F4EC` | tonal-depth step, no shadow needed |
| `--color-foreground` | `20 51 45` | warm charcoal `#2A2E29` | ~12.5:1 on `#FBF7EF`, passes |
| `--color-muted` | `82 106 99` | `#5E5A4F` | ~5.2:1 on `#FBF7EF`, passes body-text 4.5:1 (darkened from the earlier `#6E6A60`, which was a borderline ~4.8:1) |
| `--color-border` | `217 232 226` | `#E8E1D3` | structural only |
| `--color-primary` | `11 107 85` (`#0B6B55`) | unchanged | keep green identity |
| `--color-primary-foreground` | `255 255 255` (pure white) | `#FBF7EF` (off-white, matches canvas) | ~8:1 on `#0B6B55`, avoids pure-white-on-color |
| `--color-accent-linen` (new) | n/a | `#F3E6D8` | **large secondary surfaces** — cards, badges, CTA-band texture; warm-white, not a contrast pairing — verify against bordering `--color-border`/`--color-surface-elevated` for subtle definition, not text contrast |
| `--color-accent-spark` (renamed from accent-500/700) | n/a | clay `#D98B5F` | **tiny details only** — icon-circle dots, hero path marker, active-state dots. Small enough that text-contrast rules don't apply; never use as a fill for anything larger than ~12px or as body text/link color |

Rules for the accent system: `accent-linen` is the default "warm" surface wherever the old
clay fill would have gone (chips, badges, CTA band, secondary card backgrounds) — it sits
close to the cream background, so define it with a hairline `--color-border` to read as a
distinct surface rather than disappearing into the canvas. `accent-spark` is rationed to
one or two small marks per view (e.g. the logo's path-end dot, the traveling marker in the
hero path) — if it starts appearing in more than a couple of places on a page, that's a
signal it's being overused. Drop the old `accent-700` text-safe clay entirely; nothing in
this revised system uses clay as text or link color.

Other palettes considered and parked: Forest & Gold (more formal/corporate), Midnight &
Amber (drops green entirely, too big a brand shift), Refined Sage (too subtle), white +
gold "Auros-lite" (cold/sterile for a consumer lettings audience, and risks the
cream-plus-brass "premium consumer" cliché if not anchored by the green).

**Tonal-depth surfaces** (adapted from the Auros reference): a 3-step surface scale,
canvas (`#FBF7EF`) → card (`#FFFFFF`) → elevated (`#F1F4EC`), so depth comes from tone
rather than `shadow-soft` everywhere. Keep `shadow-soft` only for genuinely floating
elements (the chat widget, any popover/dropdown) — not for static section cards.

### 2.2 Typography

Replace `--font-sans: Arial, Helvetica, sans-serif` with a geometric sans via
`next/font/google`. **Avoid Inter as the reflex choice** (it's the most over-used AI
default). Recommend **Geist** (Vercel's font family, available on Google Fonts, free,
geometric, pairs well with the existing UI) as the primary candidate; **General Sans** or
**Satoshi** (self-hosted via `@font-face` if not on Google Fonts) as alternates if Geist
feels too "default-Vercel" once previewed.

- One family, two weights: 400 (body/UI) and 500/600 (headings/emphasis). Do not introduce
  a second sans family.
- Display scale: H1 clamps up to **~3.5–4rem (56–64px)** at desktop, staying well under
  the 6rem/96px ceiling. Letter-spacing on H1/H2 at most `-0.02em` to `-0.03em` (the
  current Auros-inspired idea of `-0.04em`+ is too aggressive for a 2-line marketing
  headline and risks overflow on mobile — test the actual chosen headline string at
  320px width).
- `text-wrap: balance` on H1–H3, `text-wrap: pretty` on body copy ≥2 sentences.
- Body line-height 1.5–1.6 (current `leading-8`/`leading-7` are fine), headings 1.1–1.2
  (current `leading-[0.98]` is borderline too tight for 2-line headlines — loosen to
  `~1.05` once the real headline copy is set, recheck for overflow).

### 2.3 Icons

No icon library is currently installed. Add **`@phosphor-icons/react`** (priority pick
per the design system reference; outline/regular weight). Standardize `strokeWidth`/weight
across all icon usages (audience cards, how-it-works waypoints, form field icons). Do not
hand-roll SVG icon paths.

### 2.4 Spacing/radius

Keep current radius scale (6–10px) — already within the 12–16px card ceiling, no change
needed. Increase section vertical spacing modestly (current `py-10 sm:py-14` → consider
`py-14 sm:py-20` for marketing sections) for a less cramped, more "art-directed" feel
consistent with `VISUAL_DENSITY: 4`.

### 2.5 Logo / brand mark — replace the "PR" header badge

**File:** `src/components/layout/site-shell.tsx` (current `PR` badge — `size-9 rounded-md
bg-primary text-primary-foreground` square with `PR` text).

**Chosen direction: "House + path"** — a simple house/roofline glyph with the journey-path
line (from 3.1) running into its doorway, on the existing `bg-primary` (sage) square with
`--color-primary-foreground` (cream) strokes, ending in a small `accent-spark` (clay) dot
where the path meets the door. This makes the header mark a miniature callback to the hero
animation — the same line that "draws in" on scroll in the hero is the line that leads into
the house in the logo, so the brand mark and the hero motif reinforce each other instead of
being two unrelated pieces of iconography.

- Build as a single inline SVG component (`src/components/marketing/logo-mark.tsx` or
  similar), not a raster image — keeps it crisp at the 36px header size and reusable as a
  favicon source.
- Keep the existing `size-9 rounded-md bg-primary` container; swap only the `PR` text node
  for the SVG glyph (`aria-hidden`, the visible "Proper Rent" text label next to it already
  provides the accessible name — no change needed there).
- **Test at actual size before locking in**: render the glyph at 36px and at 16px (favicon).
  If the path-into-doorway detail collapses into noise at 16px, fall back to a simpler
  monogram-style mark (a "P" with the same path-line forming part of the letterform) for
  the favicon specifically, while keeping the full house+path mark in the header.
- Reuse the same glyph (without the container square) as the `favicon.ico`/`icon.svg` and
  any OG image brand mark, so the path motif is consistent across browser tab, header, and
  social previews.

---

## 3. Hero section (Phase 1)

**Status: implemented.** `src/app/page.tsx`,
`src/components/marketing/journey-path.tsx`.

**Files:** `src/app/page.tsx`, `src/components/marketing/journey-path.tsx`,
`src/lib/motion.ts` for shared scroll helpers.

### 3.1 Concept — "Journey path"

Replace the current right-column stack of plain cards with an animated SVG path
visualizing the real product flow: **Ask → Register → Agent follow-up**. This is a real,
ordered 3-step sequence, so numbering/sequence treatment is earned here (unlike a generic
"01/02/03" eyebrow scaffold elsewhere).

- Built as inline SVG (not a hand-drawn "sketchy" illustration, not a div-based fake
  screenshot) — clean geometric line + circle waypoints in brand colors.
- **Implementation note (deviation from the original scroll-linked plan):** the hero is
  fully in view on first load, so a `useScroll`-driven progress (0→1 over the hero's own
  scroll range) was already at or near 1 before the user scrolled at all, meaning the line
  appeared fully drawn with no animation. Instead, `journey-path.tsx` uses a one-time
  mount animation (`animate()` on a `useMotionValue`, 0→1 over 1.6s, `ease: "easeInOut"`,
  0.4s delay so it follows the `Reveal` entrance). This preserves the "line draws in,
  marker travels, waypoints light up" effect described below, just triggered on mount
  rather than scroll.
- A small traveling marker (in `accent-spark`) rides the tip of the drawn line.
- Each waypoint (Phosphor icons: `ChatCircleDots` / `ClipboardText` / `UserCheck`) "lights
  up" — `var(--color-muted)` → `var(--color-primary)` fill/stroke — as the line reaches
  it. This is a **color/state change**, so use `ease` (not `ease-out`), ~200ms transition.
- `useReducedMotion`: render the fully-drawn line and all waypoints in their "lit" state
  statically, no scroll-linked transform — consistent with how `Reveal`/`Stagger` already
  degrade.

**Scope confirmed: A first, then extend to B.**
- **Phase 1 (now): Option A (self-contained)** — path lives entirely inside the hero,
  animates over the hero's own scroll range. Ships sooner and is testable in isolation.
- **Phase 3 (later): extend to Option B (spanning)** — once "How it works" is being
  reworked anyway (to remove the duplicate 3-equal-card grid), extend the same path
  component to continue from the hero into that section, turning hero→how-it-works scroll
  into one continuous narrative.

**Hero illustration confirmed: "skyline + path".** A loose row of outlined rooftop
silhouettes (the search/options) with the journey-path line running across them to a single
highlighted destination house (in `accent-spark`/clay) — this *is* the journey-path concept
above, just framed as a scene rather than a bare diagram. No separate illustration to build;
the path component from 3.1 is the hero visual. This is also the same glyph language as the
header logo mark (2.5), so logo, hero, and the how-it-works continuation (if Option B) all
read as one consistent path/home motif across the page.

### 3.2 Hero copy

See Phase 2. New headline/subhead replace "Website + Chatbot MVP" / "Website leads routed
to a human letting agent." **Drop the eyebrow entirely** — "Website + Chatbot MVP" is both
dev-facing and an instance of the over-used small-caps-eyebrow pattern. A bare
headline + subhead + CTAs is enough; do not replace it with a different eyebrow string.

### 3.3 Motion details

- Entrance: both hero halves (text + path illustration) animate in via `Reveal`/`Stagger`
  using the existing curve `cubic-bezier(0.23, 1, 0.32, 1)` at the existing ~280ms
  (already a "strong ease-out", matches the recommended UI entrance curve — no change
  needed to `fadeUpVariants`).
- Add a short reassurance microcopy line under the CTAs, e.g. "Takes 2 minutes. A real
  agent follows up." (period, not em dash, per copy rules in Phase 2).
- Hero must fit the viewport on first load per the design rules: headline ≤2 lines,
  subhead ≤20 words, both CTAs visible without scrolling at common laptop heights. Test
  the final headline string at this constraint before locking it in.

---

## 4. Copy & content pass (Phase 2)

**Status: homepage hero/header/footer done.** Remaining: `src/app/renters/page.tsx`,
`src/app/landlords/page.tsx`, `src/app/how-it-works/page.tsx`, CTA band copy rework.

**Files:** `src/app/page.tsx`, `src/app/renters/page.tsx`, `src/app/landlords/page.tsx`,
`src/app/how-it-works/page.tsx`, `src/components/marketing/page-hero.tsx`,
`src/components/marketing/cta-band.tsx`

**Hard copy rules (apply everywhere, not just new copy):**
- No em dash (`—`) or en dash used as a separator (`–`), anywhere — headlines, body,
  buttons, captions. Use a period, comma, colon, or regular hyphen.
- No filler verbs ("elevate", "seamless", "empower", "streamline").
- No "X theater" / "not just X, it's Y" constructions.
- Button labels are verb + object ("Register as renter", "Talk to an agent"), not "OK"/
  "Submit"/"Learn more" alone.
- At most one eyebrow-style label site-wide, used deliberately (not on every section). If
  in doubt, skip it.

**Content changes:**
- [x] Draft 2–3 headline/subhead options for the homepage hero, benefit-led and warm.
  Presented for selection; "A friendly start to renting or letting." / "Ask our chatbot
  about the process, register your details, and a Proper Rent agent will follow up
  personally." selected and shipped.
- [x] Remove internal/dev-facing language sitewide:
  - "Website + Chatbot MVP" eyebrow (homepage hero) — removed per 3.2, not replaced.
  - "Phase 1 foundation" status pill (site shell header) — removed, `status` prop dropped
    from `SiteShellProps` (and its two callers in `register/renter`, `register/landlord`).
  - "Phase 1 website, chatbot, intake..." footer copy — replaced with "Renter and landlord
    enquiries are reviewed by a human agent. No live listings or per-listing fintech quotes
    are shown on this site."
- [x] **Remove the "Runtime configuration" section** from the homepage entirely — confirmed
  delete, not relocate (the `metaItems` block exposing backend URL, frontend URL, analytics
  domain is internal debug info with mild info-disclosure risk on a public page; no
  relocation target is needed).
- [x] Relocate the 3-item "audience" cards (For renters / For landlords / Human follow-up)
  out of the hero into their own "Who Proper Rent helps" section below, dropping the
  nested-card wrapper. Full rewrite of this content still pending (see Phase 3).
- [ ] Rework the CTA band copy ("Ready to speak to Proper Rent?") to be more inviting and
  action-oriented.
- [ ] Pass over `renters`, `landlords`, `how-it-works` pages for consistent tone, same
  draft-options approach.

---

## 5. Audience cards & "How it works" flow (Phase 3)

**Status: implemented.** `src/app/page.tsx`,
`src/components/marketing/testimonials.tsx`.

**Files:** `src/app/page.tsx`, `src/components/ui/card.tsx`,
`src/components/marketing/testimonials.tsx`

### 5.1 Audience section — break the identical-card-grid pattern

Current: 3 equal cards (For renters / For landlords / Human follow-up) — a banned default
("identical card grids", "NO 3-column equal feature cards"). Replace with an asymmetric
layout matching `DESIGN_VARIANCE: 7`:

- A 2-column split where "For renters" and "For landlords" sit as two distinct,
  differently-sized panels (e.g. `grid-cols-[1.3fr_1fr]` or stacked with one visually
  larger), each with a Phosphor icon.
- "Human follow-up" becomes a separate, visually distinct strip below (e.g.
  `surface-elevated` background, full width) rather than a third equal card — it's framed
  as reassurance/trust messaging, not a third "option," which also matches its actual
  content better.

### 5.2 How it works — journey path continuation (if Option B) or standalone path (if A)

- Either way, retire the 3-card grid for "How it works." The 3 steps (Ask / Register /
  Follow-up) become waypoints on the journey path defined in Phase 1, with the actual step
  content as the label (not "Step 1 / Step 2 / Step 3" — the verb phrase itself is the
  label, per copy rules).
- Icons (Phosphor, same set as the hero waypoints) + short supporting text per step,
  positioned along/beside the path.
- Stagger reveal: each waypoint's "lit" transition triggers via the shared scroll
  progress, not a separate `whileInView` stagger, so the path feels like one continuous
  mechanism rather than two different animation systems stitched together.

### 5.3 Testimonials section — layout only, pending real content

**File:** new `src/components/marketing/testimonials.tsx`

Lay out the structure now; do **not** populate with placeholder/fake reviews. Ship the
component hidden or with an explicit `TESTIMONIALS: [] // TODO: add real quotes once
available` until real renter/landlord feedback exists (see prior discussion — fabricated
reviews/numbers are an ASA risk and an anti-slop tell).

- **Placement:** between the audience panels (5.1) and the CTA band (Phase 4).
- **Layout:** horizontal scroll-snap row, not a 3-equal-card grid (avoids repeating the
  banned pattern a third time on one page). 1 full card + partial peek of the next on
  mobile, ~2.5 cards visible on desktop. `scroll-snap-type: x mandatory` on the
  container, `scroll-snap-align: start` on each card.
- **Card content (per testimonial):**
  - Quote text (1-2 sentences, real, unedited beyond trimming).
  - Avatar: initials circle (e.g. "JM"), background `--color-primary`, text
    `--color-primary-foreground` — **no generic person-icon avatars, no stock photos of
    strangers**.
  - Name: first name + last initial (e.g. "Jamie M."), plus role tag ("Renter" /
    "Landlord") so it's clear which audience the quote speaks to.
  - Optional: star rating, only if ratings are actually collected (don't add 5-star
    icons as decoration if no rating data exists).
- **Section heading:** plain functional label, e.g. "What renters and landlords say" — no
  eyebrow, no fabricated aggregate stat ("X million...") unless it's a real number you can
  stand behind.
- **Card surface:** `surface` (white) on `surface-elevated` section background, to use
  the tonal-depth system from Phase 0 rather than adding new shadows.
- **Reduced motion:** the scroll-snap row is user-scroll-driven already (no autoplay
  carousel — autoplaying testimonial carousels are also an engagement-pattern to avoid),
  so no extra reduced-motion handling needed beyond the section's entrance `Reveal`.

---

## 6. CTA band refresh (Phase 4)

**Status: implemented.** `src/components/marketing/cta-band.tsx`.

**File:** `src/components/marketing/cta-band.tsx`

- Add a subtle background texture to the solid green band: a **dot-grid** pattern (small
  dots via `radial-gradient` repeated as a `background-image`, low opacity, single color)
  — not `repeating-linear-gradient` stripes (banned), not full gradient washes. Flat,
  rationed, barely-there.
- Once the hero path illustration exists, consider reusing a cropped/simplified version of
  it as a right-side visual split instead of, or in addition to, the dot texture — keeps
  the visual language consistent across the page rather than introducing a second motif.

---

## 7. Motion polish & interaction states (Phase 5)

**Status: implemented** for 7.1 (scroll reveals) and 7.2 (button active/press state).
7.3 (card hover) not applicable: no homepage cards are click-targets, per the "no motion
without purpose" rule.

**Files:** marketing pages, `src/components/motion/reveal.tsx`,
`src/components/motion/stagger.tsx`, `src/components/ui/button.tsx`,
`src/components/ui/card.tsx`

### 7.1 Scroll reveals
- Wrap currently-static sections (audience panels, CTA band) in `Reveal`/`Stagger` for
  consistent scroll-in motion. Keep `staggerChildren: 0.06` (60ms) — already within the
  recommended 30–80ms band, no change needed.

### 7.2 Buttons — all states
Current `buttonClasses` likely covers default/hover only. Add:

| State | Treatment |
|---|---|
| Hover | existing background shift, gated by `@media (hover: hover) and (pointer: fine)` |
| Focus-visible | visible ring (`--shadow-focus` token already exists, ensure it's applied via `:focus-visible`, not `:focus`) |
| Active/press | `transform: scale(0.97)`, `transition: transform 160ms ease-out` |
| Disabled | reduced opacity (~0.5), `cursor: not-allowed`, no hover/active transform |
| Loading (form submit) | spinner or label swap, button stays same size (no layout shift) |

### 7.3 Cards
If any cards become hover-interactive (e.g. clickable audience panels), add
`transform: translateY(-2px)` + border-color shift, 160ms ease-out, gated by the same
hover media query. Static informational cards get no hover treatment, do not add motion
"because it looks nice" to elements seen on every page load.

---

## 8. Form/registration UX pass (Phase 6)

**Status: implemented.** 8.0 done for both the renter form (3 steps, consent
folded into "Readiness") and the landlord form (now also a 3-step wizard:
Contact details / Property details / Consent, with the same progress sidebar,
step validation, "Check your answers" disclosure, and "Send to an agent"
footer as the renter form). 8.1 audited: labels sit above inputs, focus-visible
rings and disabled/active states come from `field.tsx`/`button.tsx`, validation
runs on step transition (not per keystroke) and clears per-field as the user
edits, and `FieldError` uses `role="alert"` so errors are announced. Not done:
red error-border styling and explicit `aria-describedby` wiring between
`FieldError` and its input across all fields — flagged as a follow-up, not
attempted here to avoid a half-applied pattern across ~30 fields.

**Files:** `src/components/forms/renter-intake-form.tsx`,
`src/components/forms/landlord-intake-form.tsx`, `src/app/register/renter/page.tsx`,
`src/app/register/landlord/page.tsx`, `src/components/ui/field.tsx`, `src/lib/consent.ts`

### 8.0 Collapse "Review and consent" into step 3 — drop to 3 steps total

**The problem with a dedicated review/consent step:** every extra step is a fresh
decision point where someone can stall. "Review and consent" *sounds* like a
legal checkpoint — a second gate after the user already felt done answering
questions. That framing works against the **goal-gradient effect** (people
speed up and push through as the finish line gets closer — so the step right
before submit should feel like *less* friction, not a new chapter).

**Change:** renter form goes from 4 steps to 3. Step 3 ("Readiness") absorbs the
consent checkbox and becomes the final step — its description becomes something
like *"Last step — a couple of readiness questions, then send this to an agent."*
The step indicator now reads **Step 3 of 3**, not 4 of 4, from the moment the user
starts — this matters because the *perceived* size of the task is set on step 1,
before any sunk-cost effect kicks in.

**Why this is more than "remove a step":**

- **No mandatory full-page review.** A dedicated review screen invites people to
  re-read their own answers right before committing — which is exactly when
  second-guessing and abandonment spike ("did I get the rent figure right? let
  me go back and check..."). Instead, add a small, *optional*, collapsed
  `<details>`/disclosure inside step 3 — **"Check your answers"** — that expands
  into the existing `SummaryItem` grid. Collapsed by default. Most users won't
  open it; the ones who want reassurance can.
- **Shorten the visible consent text.** The current consent paragraph
  (`consentCopy.renter`) is a full sentence of legal-sounding clauses sitting
  directly above the submit button — a wall of text at the highest-anxiety
  moment increases hesitation. Show one short line by default:
  *"I agree to be contacted about my enquiry and for it to be shared with the
  Proper Rent agent."* with a **"Read full details"** toggle that reveals the
  existing full clause + Privacy Policy / Terms links + consent version. Same
  legal coverage, less visual weight at the point of commitment.
- **Add a one-line trust note next to consent**, e.g. *"Your details go to one
  human agent — never sold or shared with third parties."* This directly
  addresses the unspoken objection ("what happens to my data?") right where it's
  strongest, instead of leaving it to the Privacy Policy link.
- **Reframe the submit button copy.** "Submit" is transactional and a little
  cold for a service whose whole pitch is "a human will help you." Use
  **"Send to an agent"** or **"Send my details"** — names the actual next event
  (a person looks at this), which reduces the "submitting into a void" feeling.
  Pair with the existing reassurance line ("An agent reviews within 24 hours")
  directly under the button, not buried earlier in the step.
- **Validation stays scoped to step 3** — `consentGiven` is now validated as part
  of the final step's field set, so `firstStepWithError` naturally lands users on
  step 3 (last step) if consent is missing, which is already where they are.

**Applied to the landlord form too** (post-Phase 6): the landlord form was a
single-page form with three `<section>`s (contact, property, consent) shown all
at once, inconsistent with the renter form's stepper. It now uses the same
`steps`/`activeStep` wizard pattern as the renter form — Step 1 "Contact
details", Step 2 "Property details" (address, bedrooms, asking rent, available
from, listing/Advanced Rent interest checkboxes, notes), Step 3 "Consent" (with
a collapsed "Check your answers" summary plus the shortened consent clause).
Validation, `firstStepWithError`, and the progress sidebar all mirror
`renter-intake-form.tsx`.

**Sequencing note:** unlike the rest of Phase 6, this change is copy/structure
only and has no dependency on Phase 0 tokens — it can be pulled forward and done
early/independently if the team wants the conversion-rate benefit sooner.

### 8.1 General form polish

- Add reassurance copy near submit ("An agent reviews within 24 hours.", privacy note).
- Audit form fields against the full 8-state model: default, hover, focus (visible ring,
  not just browser default), active, disabled, loading (submit in progress), error
  (message below the field, wired with `aria-describedby`, red border using existing
  `--color-danger`), success (if any inline validation).
- Labels stay above inputs (confirm `field.tsx` doesn't rely on placeholder-as-label).
- Validate on blur, not on every keystroke, to avoid error messages flashing while typing.
- Review spacing/typography against the new tokens from Phase 0 once those land.
- Lowest priority, last in sequence, but closest to the actual conversion event.

---

## 8.5 Fintech repositioning (post-Phase 6)

**Status: implemented.** `src/app/page.tsx`, `src/app/renters/page.tsx`,
`src/app/landlords/page.tsx`, `src/lib/public-content.ts`.

The site previously led with "ask a chatbot, register, an agent follows up in 24h" and
mentioned the fintech products (Deposit Share, Guarantor Solutions, Advanced Rent) only
in passing. These products, plus the renter audience segments (students, young
professionals, self-employed/freelancers, Universal Credit recipients, international
relocators, hard-to-reference renters), are the core value proposition and now get a
gist on the homepage with full detail on `/renters` and `/landlords`.

- **Homepage**: new "Fintech for renters" section between "Who Proper Rent helps" and
  "How it works" — Deposit Share (with the **"Up to 85%"** stat — a real product fact,
  not a per-listing quote) and Guarantor Solutions as flagship cards, an Advanced Rent
  callout strip for landlords, and one line naming the audience segments with a link to
  `/renters`.
- **`/renters`**: the "Fintech overview" section was reframed from apologetic
  ("General product education only... Phase 1 keeps the information generic") to
  confident, benefit-led copy (one factual disclaimer sentence retained: an agent
  confirms figures for your situation). New "Who it's for" section renders all 6
  audience segments as cards.
- **`/landlords`**: new "Advanced Rent" section with 3 benefit highlights (lump sum
  upfront, tenants pay as normal, agent-confirmed eligibility) — built only from the
  confirmed mechanic (rent upfront, tenants keep paying monthly), no invented figures.
- No renter-count/"X helped" style stat was added — none exists, and design.md's
  no-fabricated-stats rule applies to fintech copy too.

---

## 9. Sequencing

1. **Phase 0** — tokens (palette, font, icon library). Everything else depends on this.
2. **Phase 1 + 2 together** — hero visual + hero copy. Most visible change, ship together.
3. **Phase 3 + 4** — audience panels, how-it-works/journey path continuation, CTA band.
4. **Phase 5** — motion + interaction-state pass, layered on top once structure is settled.
5. **Phase 6** — forms, last.

---

## 10. Open decisions before implementation

- [x] Palette confirmed: Sage & Linen — background `#FBF7EF`, primary `#0B6B55` unchanged,
      `accent-linen` `#F3E6D8` for large warm surfaces, `accent-spark` `#D98B5F` (old clay)
      rationed to small details only.
- [x] Font confirmed: **Plus Jakarta Sans** via `next/font/google`, weights 400/500/600/700,
      exposed as `--font-sans` on `<html>` (was Geist primary candidate; Plus Jakarta Sans
      chosen for its warmer rounded forms, matching Sage & Linen).
- [x] Hero journey-path scope confirmed: **A now, extend to B in Phase 3** (self-contained
      hero path first, extended into "How it works" when that section is reworked).
- [x] "Runtime configuration" section: **delete outright**, no relocation.
- [x] Icon library confirmed: `@phosphor-icons/react` installed (no prior icon library in
      the project).
- [x] Testimonials (5.3): layout built (`src/components/marketing/testimonials.tsx`),
      `TESTIMONIALS: []` so the component renders nothing. Revisit once real
      renter/landlord quotes are collected.

---

## 11. Pre-flight checklist (run before declaring any phase done)

- [ ] Zero em dashes / en-dash-as-separator anywhere in shipped copy.
- [ ] No section has more than one eyebrow-style label; most have none.
- [ ] No two sections both use an identical 3-equal-card grid.
- [ ] All animations are `transform`/`opacity` only; reduced-motion fallback present.
- [ ] Contrast checked for any new text/background pairing (≥4.5:1 body, ≥3:1 large/bold).
- [ ] Headline tested at 320px width for overflow.
- [ ] Buttons have hover, focus-visible, active, disabled, and (where relevant) loading
      states.
