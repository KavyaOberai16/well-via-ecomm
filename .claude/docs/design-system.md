# Design System — Simple Ecommerce

Implementation-ready design guidance for the storefront frontend
(React + Vite). Every agent building UI **must** follow this document.
It is referenced by `agents/frontend-agent.md` and `orchestrator/master-orchestrator.md`.

## 1. Context and goals

**Intent:** deliver a premium, immersive ecommerce storefront that feels as
considered as Apple, as crisp as Stripe, as fluid as Framer, and as
commerce-complete as Shopify — without sacrificing performance.

Goals, in priority order:

1. Convert — the buy path is frictionless and obvious.
2. Feel premium — depth, glass, and motion are tasteful, never decorative noise.
3. Perform — fast on a mid-range phone on 4G.
4. Stay consistent — tokens and components, never one-off styling.
5. Be accessible — WCAG 2.2 AA is a floor, not a goal.

**Stack (required):** Tailwind CSS (tokens via `@theme` / config), Framer Motion
(animation), shadcn/ui (component primitives), `lucide-react` (icons).

**Non-negotiables**

- Components **must** consume semantic tokens, never raw hex or magic numbers.
- Every component **must** define all states: default, hover, focus-visible,
  active, disabled, loading, error (where applicable), and empty.
- Every component family **must** specify responsive behavior and overflow /
  long-content handling.
- Reduced-motion **must** be honored. Heavy or blocking animation is prohibited.

## 2. Design tokens and foundations

Tokens are the single source of truth. Define them once in the Tailwind theme
and reference them everywhere. Names below are semantic — use the name, not the value.

### 2.1 Color

Dark-first surface system with a calm indigo accent.

| Token | Value | Use |
|-------|-------|-----|
| `color.bg.base` | `#0B0B0F` | App background |
| `color.bg.elevated` | `#14141B` | Cards, sheets |
| `color.bg.sunken` | `#070709` | Wells, recessed areas |
| `color.surface.glass` | `rgba(20,20,27,0.55)` | Glassmorphism fill |
| `color.border.subtle` | `rgba(255,255,255,0.08)` | Default borders |
| `color.border.strong` | `rgba(255,255,255,0.16)` | Hover / focus borders |
| `color.text.primary` | `#F5F5F7` | Headings, primary copy |
| `color.text.secondary` | `#A1A1AA` | Supporting copy |
| `color.text.tertiary` | `#6B6B76` | Hints, meta |
| `color.text.inverse` | `#0B0B0F` | Text on accent fills |
| `color.accent.base` | `#6366F1` | Primary actions, links |
| `color.accent.hover` | `#7C7FF5` | Accent hover |
| `color.accent.press` | `#5457D6` | Accent active |
| `color.success` | `#22C55E` | Confirmations, in-stock |
| `color.warning` | `#F59E0B` | Low stock, caution |
| `color.danger` | `#EF4444` | Errors, destructive |
| `color.price` | `#F5F5F7` | Price text (primary weight) |

A light theme **should** be derived later by remapping these same token
names — components must not need changes.

**Contrast rule (must):** body text against its background ≥ 4.5:1;
large text (≥ 24px or 19px bold) and UI affordances ≥ 3:1. `text.tertiary`
**must not** be used for essential information.

### 2.2 Typography

- Primary family: **Inter** (variable). `font.family.primary = "Inter, system-ui, sans-serif"`.
- Display use may set `font-feature-settings` for tighter tracking on hero text.

| Token | Size / line-height | Use |
|-------|--------------------|-----|
| `font.display` | 56 / 60, weight 600, tracking -0.02em | Hero headline |
| `font.h1` | 40 / 46, weight 600 | Page title |
| `font.h2` | 30 / 38, weight 600 | Section title |
| `font.h3` | 22 / 30, weight 600 | Card / block title |
| `font.body` | 16 / 26, weight 400 | Default body |
| `font.sm` | 14 / 22, weight 400 | Secondary text |
| `font.xs` | 12 / 18, weight 500 | Meta, badges, labels |

Responsive: `font.display` and `font.h1` **should** scale down ~30% at the
`sm` breakpoint using `clamp()`. Line length **should** stay 60–80 characters.

### 2.3 Spacing

4px base scale. Use tokens — never arbitrary pixel values.

`space.1=4` · `space.2=8` · `space.3=12` · `space.4=16` · `space.5=24` ·
`space.6=32` · `space.7=48` · `space.8=64` · `space.9=96` · `space.10=128`

- Component internal padding: `space.4`–`space.5`.
- Section vertical rhythm: `space.8`–`space.10`.
- One spacing system only — no one-off margins (a non-negotiable rule).

### 2.4 Radius

`radius.xs=8` · `radius.sm=12` · `radius.md=16` · `radius.lg=24` ·
`radius.xl=32` · `radius.full=9999`

Cards use `radius.lg`; buttons/inputs `radius.sm`; pills/avatars `radius.full`.

### 2.5 Elevation & shadow

Depth is built from layered shadow + a 1px light border, not heavy drop shadows.

| Token | Value | Use |
|-------|-------|-----|
| `shadow.sm` | `0 1px 2px rgba(0,0,0,0.4)` | Subtle lift |
| `shadow.md` | `0 8px 24px rgba(0,0,0,0.45)` | Cards, dropdowns |
| `shadow.lg` | `0 24px 60px rgba(0,0,0,0.55)` | Modals, hero media |
| `shadow.glow` | `0 0 0 1px rgba(99,102,241,0.4), 0 8px 32px rgba(99,102,241,0.25)` | Accent focus / featured |

### 2.6 Glassmorphism

A glass surface = translucent fill + backdrop blur + hairline border + inner highlight.

```
background: color.surface.glass;
backdrop-filter: blur(16px) saturate(140%);
border: 1px solid color.border.subtle;
box-shadow: shadow.md, inset 0 1px 0 rgba(255,255,255,0.06);
```

Rules:
- Glass **must** sit over a textured or image background — never over flat color
  (the effect is invisible and just costs GPU).
- Always provide an **opaque fallback** (`color.bg.elevated`) for browsers
  without `backdrop-filter` and for `prefers-reduced-transparency`.
- Limit to ≤ 3 glass layers in one viewport — blur is expensive.

### 2.7 3D depth

Depth is **subtle**: ≤ 8° tilt, ≤ 16px translate. Never full 3D scenes.

- Product card hover: pointer-driven `rotateX/rotateY` ≤ 6°, `perspective: 1000px`.
- Layered parallax in hero: foreground moves ~12px, background ~4px on scroll.
- Depth **must** be disabled under `prefers-reduced-motion`.

### 2.8 Breakpoints

`sm < 640` · `md 640–1023` · `lg 1024–1279` · `xl ≥ 1280`.
**Mobile-first is mandatory** — author base styles for `sm`, layer up.
Touch targets **must** be ≥ 44×44px.

## 3. Component-level rules

Every component below **must** ship all listed states and consume tokens.

### 3.1 Button

Anatomy: container · label · optional leading/trailing icon · loading spinner slot.

Variants: `primary` (accent fill), `secondary` (glass + subtle border),
`ghost` (text only), `destructive` (danger fill).

Sizes: `sm` h-36 / `md` h-44 / `lg` h-52. Radius `radius.sm`.

| State | Spec |
|-------|------|
| default | Variant fill; label `font.sm` weight 600 |
| hover | `accent.hover` / border `border.strong`; lift `translateY(-1px)`; `motion.fast` |
| focus-visible | `shadow.glow` ring, 2px offset — **must** be visible on every variant |
| active | `accent.press`; `translateY(0)` |
| disabled | 40% opacity; `cursor: not-allowed`; no hover motion; `aria-disabled` |
| loading | Spinner replaces leading icon; label stays; pointer-events off; `aria-busy="true"` |

Long label: truncate with ellipsis at one line; never wrap to 3+ lines.
Full-width on `sm` for primary buy actions.

### 3.2 Product Card

The conversion workhorse. Anatomy: media (4:5) · category eyebrow · name ·
price · optional rating · add-to-cart affordance · stock badge.

| State | Spec |
|-------|------|
| default | `bg.elevated`, `radius.lg`, `shadow.md`, 1px `border.subtle` |
| hover | ≤ 6° pointer tilt; media zooms ≤ 1.05; quick-add fades in; `shadow.lg`; `motion.fast` |
| focus-visible | `shadow.glow` ring on the whole card; tilt **not** applied via keyboard |
| active/press | Tilt resets; scale 0.99 |
| loading | Skeleton: media block + 2 text bars + price bar, shimmer ≤ 1.4s |
| out of stock | Media desaturated 60%; "Out of stock" badge; add-to-cart disabled |
| empty grid | Show empty-state block (see 3.6), never a blank region |

Rules:
- The whole card is one link to the PDP; the quick-add button is a nested
  control with its own accessible name (`Add <product> to cart`).
- Name truncates at 2 lines (`line-clamp-2`); price never truncates or wraps.
- Media **must** use a fixed aspect ratio to reserve space (CLS = 0).
- Grid: 2 cols `sm`, 3 cols `md`, 4 cols `lg+`, gap `space.5`.

### 3.3 Cinematic Hero

Anatomy: background media (image/video poster) · gradient scrim · glass content
panel · display headline · subcopy · primary + secondary CTA.

- Headline `font.display`; constrained to ≤ 12 words.
- A scrim gradient **must** sit between media and text so contrast holds
  regardless of the image.
- Height: `min(92vh, 880px)` on `lg`; `auto` with `space.9` padding on `sm`.
- Entrance: headline, subcopy, CTA stagger in (see 4.2). Parallax on scroll is
  subtle (2.7) and **must** stop under reduced-motion.
- Video backgrounds: muted, `playsinline`, lazy, with a poster image; never
  autoplay clips longer than ~6s; pause when offscreen.
- Mobile: single column, media behind a stronger scrim, CTA full-width.

### 3.4 Navigation Bar

Anatomy: brand · primary links · search · cart (with count) · account.

- Sticky; transparent over the hero, transitioning to a glass bar (2.6) once
  scrolled > 64px.
- `sm`: collapse links into a slide-in sheet (shadcn `Sheet`); cart + brand stay
  visible.
- Cart count badge uses `color.accent.base`; `aria-label` includes the count.
- Active link uses `text.primary` + 2px accent underline; others `text.secondary`.

### 3.5 Input / Form Field

Anatomy: label · field · helper text · error text · optional icon.

| State | Spec |
|-------|------|
| default | `bg.sunken`, 1px `border.subtle`, `radius.sm`, h-44 |
| hover | border `border.strong` |
| focus-visible | accent border + `shadow.glow`; label stays visible |
| disabled | 40% opacity; not focusable |
| error | `danger` border; error text below; `aria-invalid="true"` + `aria-describedby` |

Labels **must** be persistent and programmatically associated — placeholder
text **must not** be the only label. Helper/error text reserves height to
avoid layout shift.

### 3.6 Empty, loading, and error states

- **Loading:** skeletons that match final layout dimensions — never a spinner
  alone for content regions.
- **Empty:** icon + one-line explanation + a clear next action
  (e.g. empty cart → "Browse products").
- **Error:** human message + retry affordance; never a raw status code or stack.

### 3.7 Modal / Sheet (shadcn primitives)

- Use `Dialog` on `lg+`, `Sheet` (bottom) on `sm`.
- **Must** trap focus, restore focus to the trigger on close, close on `Esc`,
  and have an `aria-labelledby` title.
- Backdrop is a dimmed scrim with light blur; content is `bg.elevated` (not glass —
  glass over a scrim is muddy).

## 4. Motion guidance (Framer Motion)

Motion communicates hierarchy and continuity. It is never the main event.

### 4.1 Duration & easing tokens

| Token | Value | Use |
|-------|-------|-----|
| `motion.instant` | 120ms | Token feedback (press) |
| `motion.fast` | 200ms | Hover, small UI |
| `motion.base` | 320ms | Cards, reveals, page sections |
| `motion.slow` | 500ms | Hero, route transitions |
| `ease.standard` | `[0.22, 1, 0.36, 1]` | Default ease-out |
| `ease.entrance` | `[0.16, 1, 0.3, 1]` | Reveal / enter |

### 4.2 Patterns

- **Reveal on scroll:** fade + `translateY(16px)` → 0, `motion.base`, trigger
  once at ~15% in view.
- **Stagger:** lists/grids reveal children at 60–80ms steps; cap total stagger
  at ~400ms so nothing feels slow.
- **Route transition:** outgoing fade/scale to 0.98, incoming reverse,
  `motion.slow`.
- **Hover tilt:** spring (`stiffness 150, damping 18`); resets on leave.

### 4.3 Motion rules (must)

- Animate only `transform` and `opacity`. Never animate `width`, `height`,
  `top`/`left`, or `box-shadow` on a per-frame basis.
- `prefers-reduced-motion: reduce` **must** disable parallax, tilt, stagger,
  and large transitions — replace with an instant or simple opacity change.
- No animation may block input or delay content paint. Total entrance motion
  for a viewport **must not** exceed ~600ms perceived.
- Looping/infinite animation is prohibited except for ≤ 1.4s loading shimmers.

## 5. Performance budgets

Performance is a feature. Budgets are enforced, not aspirational.

| Metric | Budget |
|--------|--------|
| LCP (mid-range mobile, 4G) | ≤ 2.5s |
| CLS | ≤ 0.05 |
| INP | ≤ 200ms |
| Initial JS (gzipped, home route) | ≤ 180KB |
| Any single route chunk (gzipped) | ≤ 120KB |
| Largest image delivered | ≤ 200KB, responsive `srcset` |

Rules (must):

- **Route-based code splitting** — every page is a `React.lazy` import behind
  `Suspense` with a skeleton fallback.
- **Lazy-load** below-the-fold media and offscreen sections; the hero image is
  eager + `fetchpriority="high"`.
- **Image optimization** — serve AVIF/WebP with fallback, set correct
  `width`/`height` (or an aspect-ratio box) to guarantee CLS = 0,
  `loading="lazy"` for non-hero media.
- Framer Motion **should** be imported per-component; avoid pulling the full
  library into the initial chunk.
- Fonts: `Inter` variable, `font-display: swap`, preload the one weight axis used.
- Glass/blur layers limited per viewport (2.6); test on a real mid-range device.
- No layout-shifting late content — reserve space for images, badges, async UI.

## 6. Content and tone standards

Voice: concise, confident, helpful. Sound like a premium store, not a SaaS dashboard.

| Context | Do | Don't |
|---------|----|----|
| Primary CTA | "Add to cart", "Checkout", "Buy now" | "Submit", "OK", "Click here" |
| Empty cart | "Your cart is empty — browse products" | "No data" |
| Error | "We couldn't load products. Retry." | "Error 500" / stack trace |
| Price | "$129.00" — consistent currency + 2 decimals | "129", "$129.0" |
| Stock | "In stock", "Only 3 left", "Out of stock" | "Qty: 3" |

Rules: labels **must** describe the action or outcome; use sentence case for UI
text; never expose internal codes, IDs, or technical jargon to shoppers.

## 7. Anti-patterns — prohibited

- Generic admin/dashboard layouts; Bootstrap-style cards, grids, or buttons.
- Cluttered pages — competing CTAs, dense walls of text, no whitespace rhythm.
- Raw hex values or one-off spacing/type sizes in components.
- Heavy or constant animation; parallax/tilt with no reduced-motion fallback.
- Glass over flat color; more than 3 blur layers per viewport.
- Spinners standing in for content that has a known layout (use skeletons).
- Placeholder-only form labels; hidden or removed focus outlines.
- Images without dimensions (causes CLS); render-blocking non-critical JS.
- Low-contrast text (`text.tertiary` for essential content).

## 8. QA checklist

Before any UI work is considered done:

- [ ] Only semantic tokens used — no raw hex, no magic numbers
- [ ] All states present: default, hover, focus-visible, active, disabled,
      loading, error, empty
- [ ] Responsive verified at `sm`, `md`, `lg`, `xl`; touch targets ≥ 44px
- [ ] Keyboard: every interactive element reachable, operable, visibly focused
- [ ] `prefers-reduced-motion` disables tilt, parallax, stagger, large motion
- [ ] Contrast ≥ 4.5:1 body / ≥ 3:1 large text & UI — measured
- [ ] Glass layers have an opaque fallback; ≤ 3 per viewport
- [ ] Images have dimensions / aspect ratio; CLS ≤ 0.05
- [ ] Route is lazy-loaded; chunk within budget (§5)
- [ ] LCP ≤ 2.5s on a throttled mid-range mobile profile
- [ ] Long content, overflow, and empty states handled
- [ ] Copy follows tone standards; no technical codes shown to users
