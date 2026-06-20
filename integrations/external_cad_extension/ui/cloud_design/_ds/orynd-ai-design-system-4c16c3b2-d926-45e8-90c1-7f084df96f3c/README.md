# ORYND — Design System

**Version:** 2.0 · June 2026
**Source of truth:** https://github.com/Sfnbinib/orynd_cl_site_profe *(production site)*
**Brand line:** "warm minimal industrial — a designer's lab notebook."

> ⚠️ A first pass of this system was built from an older draft repo (`orynd_site_web_2`, Manrope + blue). That has been **replaced** — this version reflects the real, current ORYND brand: warm cream paper, burnt-orange accent, Inter / Instrument Serif / JetBrains Mono.

---

## Company Overview

**ORYND** is a **history-first AI CAD desktop app for "new engineers."** It turns sketches, photos, and short text notes into editable **parametric CAD parts** — from input to a manufacturable **STEP file in under a minute**.

- **Form factor:** Desktop app (macOS · Apple Silicon, Windows 64-bit, Linux) + web. Notarized, ~184 MB, ~20–30s install.
- **Inputs:** Photo → CAD · Sketch → CAD · Text → CAD · "Vibe Engineering" (iterate by feel).
- **Output:** STEP / STL / DXF. Editable parametric geometry with a full **history tree** — "like git for CAD" (rollback, diff, branch).
- **Pricing:** Free ($0 forever, 3 demo builds/day, watermarked exports) · **Pro** (14-day free trial, then **$20/mo**) · Enterprise (teams of 5+).
- **Company:** Orynd Inc. · **Dubai, UAE** · © 2026.
- **Site:** [oryndai.com](https://oryndai.com) · Stack: Next.js 15, TypeScript, plain CSS + CSS vars (no Tailwind), Supabase auth, Vercel.

**Taglines & hero copy**
- "Build the way *you* think." *(hero — "you" set in serif italic)*
- "History-first AI CAD for new engineers."
- "Stop modeling. *Start shipping.*" *(final CTA)*
- "Vibe Engineering" · "From input to STEP file in under a minute."

---

## Products / Surfaces

| Surface | File | Notes |
|---|---|---|
| **Marketing landing** | `Orynd Landing v3.html` | Hero, journey (3 steps), how-it-works (4 inputs), proof videos, pricing, manifesto, FAQ, footer |
| **Skills Registry** | `_new_designs/skills/Orynd Skills.html` | Installable community skills/agents/parts, category-hue tags, search, trending |
| **Community** | `_new_designs/community/Orynd Community.html` | Community page |
| **News / Changelog** | `_new_designs/news/Orynd News.html` | Release notes / changelog |
| **Login / Auth** | `Orynd Login.html` | Split layout, Supabase Google/Apple/GitHub OAuth + email |
| **Checkout** | `ui_kits/checkout/index.html` | Pro subscription — card + crypto, recreated as a tweakable UI kit |
| **Brand Kit (live)** | `_new_designs/other/Orynd Brand Kit.html` | The product's own brand system: 01 Logo → 10 Voice |

---

## Sources

- **Production repo:** https://github.com/Sfnbinib/orynd_cl_site_profe
  - `_new_designs/other/Colors and Type.css` — official design tokens
  - `app/landing.css` — Landing v3 styles + 10 animations
  - `app/content/landing.ts` — all landing copy, plans, FAQ, footer
  - `_new_designs/other/Orynd Brand Kit.html` — the brand system
- **Desktop releases:** https://github.com/Sfnbinib/orynd_app_dw_data
- Explore the production repo to build higher-fidelity ORYND designs.

---

## CONTENT FUNDAMENTALS

### Voice
Confident, technical, concise — an engineer talking to engineers, no marketing fluff. Trust the product; lead with specifics and real numbers (`v0.9.4`, `184 MB`, `notarized`, `58s median first export`, `SHA256`). Never "revolutionize" / "disrupt."

### Person & tone
- **Second person** ("you"), imperative CTAs ("Download free", "Start 14-day trial", "Talk to sales →").
- Emotional beats land on **one serif-italic word** inside an otherwise plain sans line: "Build the way *you* think." · "Stop modeling. *Start shipping.*"
- Friction-killing reassurance is explicit: "no card", "no signup to install", "your files stay local", "cancel anytime".

### Casing
- **Brand:** `ORYND` all-caps as the wordmark; "Orynd Inc." / "Orynd Pro" in running text.
- **Eyebrows / labels / stats:** UPPERCASE mono, wide tracking (`.18em`) — "STEP 01", "SKILLS REGISTRY", "WEEK 22 · 2026".
- **Headlines:** sentence case. **Body:** sentence case.
- **Technical tokens** stay literal: `STEP · STL · DXF`, `M3 enclosure, 80×60×24`.

### Copy patterns
- Section eyebrow (mono, uppercase) → big sans headline w/ one italic word → short lede.
- Specs as mono pills/notes. Times as `⏱ 30s build`, durations as `00:42`.

### Emoji
- Essentially none in UI. A rare `⏱`/`▲` used as a tiny functional glyph in spec lines; not decorative.

---

## VISUAL FOUNDATIONS

### Color
- **Warm, low-saturation, near-monochrome.** Page is **cream paper** `--bg #f3f3f0`; raised surfaces `--paper #fafaf7`; sunken `--bg-2 #e9e9e4`. Text is warm near-black `--ink #111110` → `--ink-2 #45453f` → `--ink-3 #86857e`.
- **One signature accent: ORYND orange `#e2531a`** (hover/pressed `#c8430f`, soft peach `#ffd7b5`, wash `#fbeee6`). Used for CTAs, highlights, the serif-italic accent word, live pulses.
- **Success green `#2f6f3e`** only for verified/live/checks.
- **10 category hues** (shared chroma) tag CAD part types in the Skills registry — orange/green/blue/purple/teal/amber/etc.
- Dark sections (`--ink` bg) use `#cfc7b6` / `#a39d8e` for text and orange/peach accents.

### Typography
- **Three families, strict roles:**
  - **Inter** — all UI, headings (600), body (400). Tight tracking on display (−.025 to −.035em).
  - **Instrument Serif** — *italic only, weight 400.* Reserved for **one emotional word/phrase** inside a sans headline. Never full lines, never body.
  - **JetBrains Mono** — eyebrows, labels, stats, version strings, addresses, durations. Uppercase + `.18em` tracking for eyebrows.
- Headline sizes go big: `t-h1` clamp(44–92px), `.96` line-height.

### Backgrounds & texture
- Mostly flat cream. **No photography** as background. **Faint blueprint grids** on dark device/canvas/final-CTA sections (1px lines, `multiply` / low-alpha). Subtle radial **accent glow** behind hero device, manifesto, final CTA (blurred orange, ~14–32% mix). Dashed "demo" placeholders use a 135° hatch.

### Shadows
Warm, soft, low — `rgba(22,20,15,·)` with large negative spread:
- `--sh-card 0 14px 30px -20px /.22` · `--sh-pop … /.26` · `--sh-deep 0 30px 60px -30px /.5` · `--sh-accent 0 8px 22px -10px rgba(226,83,26,.55)`.

### Radii
`--r-xs 6` (chips) · `--r-sm 8` (buttons/inputs) · `--r-md 11` (nested) · `--r-lg 14` (cards) · `--r-xl 18` (panels) · `--r-pill 999`.

### Motion
- **Signature easing:** `cubic-bezier(.2,.7,.2,1)` everywhere.
- **Entrance:** `rv` — `opacity 0→1 + translateY(10px→0)`, ~.55s, staggered by delay.
- **Hover:** buttons/cards `translateY(-1 to -3px)` + shadow deepen; accent buttons deepen orange glow.
- **Live/build:** orange ring `livepulse` (2s), `spinner` border-rotation, `scan` line over canvas, `exportPulse` on the export chip, line-draw animations on the SVG part, marquee scroll. Respects `prefers-reduced-motion`.

### Borders & cards
- Hairlines `--line #d8d8d2` / stronger `--line-2 #c3c3bc`. **No colored left-accent cards.**
- Cards: `--paper` fill, `--line-2` border, `--r-lg/xl`, `--sh-card`, hover lift. Featured plan card inverts to **ink bg** with peach label + orange ticks.

### Layout
- Container `1280px`, gutter `32px`. Sticky frosted-cream nav (`blur(12px)`). Section rhythm `96px` desktop. Footer 5-col grid on `--paper`.

---

## ICONOGRAPHY

- **System:** hand-set **inline SVG line icons** (Lucide/Feather lineage) — `viewBox="0 0 24 24"`, `fill="none"`, `stroke="currentColor"`, **stroke-width ~1.5–1.6**, square caps. Color inherits from text. **No icon font, no emoji-as-icon.**
- **Success ticks** are inline data-URI SVGs on green/orange circles.
- **Platform glyphs** (Apple / Windows / Linux) use brand-correct filled marks in download buttons.
- **Social** icons (LinkedIn, Instagram, X, YouTube) are inline SVG in footer pills; hover fills ink.
- **Logos** (`assets/`): `orynd-mark-black.svg` / `orynd-mark-white.svg` (mark), `orynd-logo-black.png` / `orynd-logo-white.png` (wordmark), plus `*_flat_clean_cropped` variants. Mark sits at 26–28px in nav, 22px footer.

---

## File Index

```
/
├── README.md                     ← this file
├── SKILL.md                      ← agent skill definition
├── colors_and_type.css           ← official tokens (colors, type, radii, shadows, spacing, motion)
│
├── assets/                       ← logos & marks (svg + png, black/white)
│
├── preview/                      ← Design System tab cards
│   ├── colors-primary.html       ·  colors-category.html
│   ├── type-scale.html           ·  type-specimens.html (families)
│   ├── spacing-tokens.html       ·  radius-tokens.html
│   ├── shadow-tokens.html        ·  motion-tokens.html
│   ├── buttons.html  · inputs.html · cards.html · badges-chips.html
│   ├── nav.html      · icons.html · logo-brand.html
│
├── ui_kits/
│   └── checkout/                 ← Pro checkout (card + crypto), tweakable
│       ├── index.html · tweaks-panel.jsx · README.md
│
├── Orynd Landing v3.html         ← real landing (registered)
├── Orynd Login.html              ← real auth (registered)
└── _new_designs/                 ← real product pages (registered)
    ├── other/Orynd Brand Kit.html        ·  other/Colors and Type.css
    ├── skills/Orynd Skills.html
    ├── community/Orynd Community.html
    └── news/Orynd News.html
```

The **Design System tab** shows every registered card. The real product pages (Landing, Login, Skills, Community, News, Brand Kit) are registered as live references — explore them for full-fidelity patterns.
