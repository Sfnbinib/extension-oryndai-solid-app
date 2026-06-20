/* @ds-bundle: {"format":3,"namespace":"ORYNDAIDesignSystem_4c16c3","components":[{"name":"HERO","sourcePath":"app/content/landing.ts"},{"name":"FRICTION","sourcePath":"app/content/landing.ts"},{"name":"NAV_LINKS","sourcePath":"app/content/landing.ts"},{"name":"JOURNEY_STEPS","sourcePath":"app/content/landing.ts"},{"name":"HOW_CARDS","sourcePath":"app/content/landing.ts"},{"name":"PROOF_CASES","sourcePath":"app/content/landing.ts"},{"name":"MANIFESTO","sourcePath":"app/content/landing.ts"},{"name":"PILLARS","sourcePath":"app/content/landing.ts"},{"name":"MARQUEE_ITEMS","sourcePath":"app/content/landing.ts"},{"name":"PLANS","sourcePath":"app/content/landing.ts"},{"name":"ENTERPRISE","sourcePath":"app/content/landing.ts"},{"name":"FAQ_ITEMS","sourcePath":"app/content/landing.ts"},{"name":"FINAL_CTA","sourcePath":"app/content/landing.ts"},{"name":"FOOTER_COLS","sourcePath":"app/content/landing.ts"},{"name":"SOCIALS","sourcePath":"app/content/landing.ts"},{"name":"FOOTER_TAGLINE","sourcePath":"app/content/landing.ts"},{"name":"FOOTER_COPYRIGHT","sourcePath":"app/content/landing.ts"}],"sourceHashes":{"app/content/landing.ts":"ef2603b9b346","ui_kits/checkout/tweaks-panel.jsx":"6591467622ed"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.ORYNDAIDesignSystem_4c16c3 = window.ORYNDAIDesignSystem_4c16c3 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// app/content/landing.ts
try { (() => {
/**
 * ORYND Landing Page Content
 * ==========================
 * Все тексты, ссылки, видео-пути и картинки для главной страницы.
 *
 * Чтобы поменять контент — редактируй только этот файл.
 * Чтобы поменять видео/картинку — положи файл в public/landing/ и обнови путь здесь.
 *
 * Структура public/landing/:
 *   /hero/        — медиа для hero-секции (опц., сейчас используется анимированный SVG)
 *   /cases/       — видео и постеры для proof-секции (3 кейса)
 *   /logos/       — логотипы партнёров (опц.)
 */

// ─── HERO ──────────────────────────────────────────────────────
const HERO = {
  eyebrowVersion: "v0.9.4",
  eyebrowTrial: "14 days",
  eyebrowTrialNote: "free",
  eyebrowNoCard: "no card",
  // Заголовок с тегами: \n даст <br/>, *слово* — italic (serif), {accent} — оранжевая точка
  titleParts: [{
    type: "text",
    value: "Build the way "
  }, {
    type: "italic",
    value: "you"
  }, {
    type: "br"
  }, {
    type: "text",
    value: "think. "
  }, {
    type: "accent",
    value: "."
  }],
  lede: "ORYND AI turns sketches, photos and short notes into editable parametric CAD parts. From input to STEP file in under a minute.",
  primaryCtaTarget: "/signup",
  altLinks: {
    mac: "macOS · Apple Silicon",
    win: "Windows · 64-bit",
    web: "Web (no install)"
  }
};

// ─── FRICTION STRIP (под hero CTA) ─────────────────────────────
const FRICTION = ["14 days free · no card", "No signup to install", "Notarized · 184 MB · 30s install", "Your files stay local"];

// ─── NAV ───────────────────────────────────────────────────────
const NAV_LINKS = [{
  label: "How it works",
  href: "#how"
}, {
  label: "Skills",
  href: "/skills"
}, {
  label: "Community",
  href: "/community"
}, {
  label: "News",
  href: "/news"
}, {
  label: "Pricing",
  href: "#pricing"
}];

// ─── JOURNEY (3 шага) ──────────────────────────────────────────
const JOURNEY_STEPS = [{
  num: "STEP 01",
  title: "Download & open",
  time: "⏱ 20s install",
  text: "Click the download button, drag into Applications, open. No signup, no email, no credit card.",
  demoLine1: "[ install drag animation ]",
  demoLine2: "184 MB · notarized"
}, {
  num: "STEP 02",
  title: "Drop a photo or sketch",
  time: "⏱ 30s build",
  text: "Drag in any image of a part — even a napkin sketch. ORYND extracts dimensions and generates editable geometry.",
  demoLine1: "[ drop-zone → parametric model ]",
  demoLine2: "STEP · STL · DXF"
}, {
  num: "STEP 03",
  title: "Love it? Upgrade.",
  time: "⏱ 14-day free trial",
  text: "Test Pro for 14 days, no charge. After the trial, $20/mo with Apple Pay, Google Pay or card. Cancel from inside the app, anytime.",
  demoLine1: "[ 1-tap checkout · apple pay ]",
  demoLine2: "14 days free · $20/mo after · cancel anytime"
}];

// ─── HOW IT WORKS (4 карточки) ─────────────────────────────────
const HOW_CARDS = [{
  badge: "01",
  title: "Photo → CAD",
  text: "Snap a bracket, gasket or part. We extract dimensions and generate a parametric STEP file.",
  tag: "Most popular",
  accent: true,
  // оранжевая иконка
  icon: "camera"
}, {
  badge: "02",
  title: "Sketch → CAD",
  text: "Napkin scribble or whiteboard photo. ORYND rebuilds the intent as clean parametric geometry.",
  tag: "Best for ideation",
  icon: "pencil"
}, {
  badge: "03",
  title: "Text → CAD",
  text: '"M3 enclosure, 80×60×24, mount tabs on the long side." That\'s enough. We do the rest.',
  tag: "Fastest path",
  icon: "text"
}, {
  badge: "04",
  title: "Vibe Engineering",
  text: "Iterate by feel — drag, prompt, rollback. History tree keeps every step traceable and editable.",
  tag: "New paradigm",
  icon: "globe"
}];

// ─── PROOF VIDEOS (3 кейса) ────────────────────────────────────
// Чтобы добавить видео:
//   1. Положи файл в public/landing/cases/ (mp4 рекомендуется, .webm опц)
//   2. Положи постер в public/landing/cases/ (jpg или png)
//   3. Обнови videoSrc и posterSrc ниже
const PROOF_CASES = [{
  tag: "Case 01",
  title: "Sheet metal bracket",
  description: "From napkin sketch to bent part, ready for laser.",
  duration: "00:42",
  videoSrc: null,
  // → "/landing/cases/case-01.mp4"
  posterSrc: null // → "/landing/cases/case-01-poster.jpg"
}, {
  tag: "Case 02",
  title: "Gear assembly",
  description: "Generating involute profiles from a text prompt.",
  duration: "01:08",
  videoSrc: null,
  posterSrc: null
}, {
  tag: "Case 03",
  title: "3D print fixture",
  description: "Phone scan → manifold STL in one step.",
  duration: "00:55",
  videoSrc: null,
  posterSrc: null
}];

// ─── MANIFESTO ─────────────────────────────────────────────────
const MANIFESTO = {
  eyebrow: "Why ORYND exists",
  // Поддержка тегов: *italic* и [strike]text[/strike]
  titleParts: [{
    type: "text",
    value: "CAD was built for the "
  }, {
    type: "italic",
    value: "last"
  }, {
    type: "text",
    value: " generation of engineers. "
  }, {
    type: "strike",
    value: "Not"
  }, {
    type: "text",
    value: " for the next."
  }],
  lead1: "For 40 years, CAD asked you to think like the software: extrude this, fillet that, manage a thousand constraints. We think you should describe what you want — by photo, by sketch, by feel — and get back something real and editable.",
  lead2: "ORYND is for engineers who think faster than they can click. Snap a part. Drop a sketch. Type one line. We turn it into clean parametric geometry with full history. Edit it. Rollback. Branch. Ship.",
  signature: {
    avatar: "O",
    name: "The ORYND team",
    location: "Dubai · 2026"
  }
};
const PILLARS = [{
  num: "01 · MISSION",
  title: "Give engineers their time back.",
  text: "Cut the hours spent rebuilding the same brackets, gaskets and enclosures. Spend them on decisions instead.",
  icon: "clock"
}, {
  num: "02 · METHOD",
  title: "History-first, always editable.",
  text: "Every build is parametric and traceable. Roll back any step. Branch wild ideas. No black boxes, no destructive edits.",
  icon: "tree"
}, {
  num: "03 · PRINCIPLE",
  title: "Your files stay yours.",
  text: "Local-first. Files live on your machine. Only the build inputs you submit reach the model. Enterprise plan adds private compute.",
  icon: "shield"
}];

// ─── TRIAL MARQUEE ─────────────────────────────────────────────
const MARQUEE_ITEMS = [{
  big: "14 days",
  lbl: "free trial"
}, {
  big: "no card",
  lbl: "required"
}, {
  big: "cancel",
  lbl: "anytime"
}];

// ─── PRICING ───────────────────────────────────────────────────
const PLANS = [{
  name: "Free",
  price: "$0",
  priceSuffix: " / forever",
  description: "Everything you need to fully test ORYND.",
  features: ["3 demo builds / day", "Full editor & history tree", "Preview STEP / STL / DXF", "Watermarked exports"],
  ctaLabel: "Download free",
  ctaHref: "#download",
  paymethodsNote: "No card required"
}, {
  name: "Pro",
  price: "",
  description: "Try everything for 14 days. No charge until day 15. Cancel from inside the app, anytime.",
  features: ["Unlimited builds", "Full STEP / STL / DXF export", "Priority queue (no waiting)", "Version history rollback & diff", "Priority support"],
  ctaLabel: "Start 14-day trial",
  ctaHref: "#download",
  featured: true,
  ribbon: "Most popular",
  paymethods: ["Apple Pay", "Google Pay", "Card", "SEPA"],
  trialBadge: {
    count: 14,
    labelBig: "days free",
    labelSmall: "then $20 / month"
  },
  subPrice: "Try everything for 14 days. No charge until day 15. Cancel from inside the app, anytime."
}];
const ENTERPRISE = {
  title: "Enterprise · Teams of 5+",
  description: "Pooled usage · SCIM · invoice billing · audit logs · priority support · custom MSA.",
  ctaLabel: "Talk to sales →",
  ctaHref: "/enterprise"
};

// ─── FAQ ───────────────────────────────────────────────────────
const FAQ_ITEMS = [{
  question: "Do I need to create an account to download?",
  answer: "No. Download, install, and start building — no email, no signup. Account is only needed if you upgrade to Pro for export."
}, {
  question: "What inputs are supported?",
  answer: "Drawings, sketches, photos, and text prompts. Mix and match — start with a photo and refine via prompt."
}, {
  question: "What outputs are supported?",
  answer: "STEP, STL and DXF on Pro. Free plan exports are watermarked previews so you can verify quality before upgrading."
}, {
  question: "How fast is the first model?",
  answer: "Median first-export time from app launch is 58 seconds. Built around speed — the longer you wait, the more friction."
}, {
  question: "Is my data private?",
  answer: "Files stay local. Only the build inputs you submit go to our model. Enterprise plan offers private compute."
}, {
  question: "Can I cancel anytime?",
  answer: "Yes, from inside the app — one click. 14-day full refund, no questions asked."
}, {
  question: "Does it work offline?",
  answer: "Editing and viewing past builds works offline. New builds need connection."
}, {
  question: "Is ORYND a black box?",
  answer: "No. Outputs are editable parametric models with full history. Roll back, diff, branch — like git for CAD."
}];

// ─── FINAL CTA ─────────────────────────────────────────────────
const FINAL_CTA = {
  eyebrow: "Ready when you are",
  titleParts: [{
    type: "text",
    value: "Stop modeling. "
  }, {
    type: "italic",
    value: "Start shipping."
  }],
  description: "Download ORYND and have your first parametric part exported in under a minute.",
  meta: ["v0.9.4 · 184 MB", "SHA256 →", "Release notes →", "System requirements"]
};

// ─── FOOTER ────────────────────────────────────────────────────
const FOOTER_COLS = [{
  heading: "Platform",
  links: [{
    label: "Download",
    href: "#download"
  }, {
    label: "Pricing",
    href: "#pricing"
  }, {
    label: "Changelog",
    href: "/news"
  }, {
    label: "Status",
    href: "/status"
  }]
}, {
  heading: "Product",
  links: [{
    label: "Photo to CAD",
    href: "/photo-to-cad"
  }, {
    label: "Sketch to CAD",
    href: "/ai-cad-from-sketch"
  }, {
    label: "History tree",
    href: "/parametric-history-tree"
  }, {
    label: "STEP export",
    href: "/engineering-grade-step-export"
  }]
}, {
  heading: "Company",
  links: [{
    label: "About",
    href: "/about"
  }, {
    label: "Careers",
    href: "/careers"
  }, {
    label: "Press",
    href: "/press"
  }, {
    label: "Contact",
    href: "/contact"
  }]
}, {
  heading: "Legal",
  links: [{
    label: "Privacy",
    href: "/privacy"
  }, {
    label: "Terms",
    href: "/terms"
  }, {
    label: "Security",
    href: "/security"
  }, {
    label: "Refunds",
    href: "/refunds"
  }]
}];
const SOCIALS = {
  orynd: [{
    label: "LinkedIn",
    href: "https://www.linkedin.com/company/orynd-ai/",
    icon: "linkedin"
  }, {
    label: "Instagram",
    href: "https://www.instagram.com/orynd.ai",
    icon: "instagram"
  }, {
    label: "X (Twitter)",
    href: "https://x.com/oryndai",
    icon: "x"
  }],
  newEngineers: [{
    label: "Instagram New Engineers",
    href: "https://www.instagram.com/new.engineers",
    icon: "instagram"
  }, {
    label: "YouTube New Engineers",
    href: "#",
    icon: "youtube"
  }]
};
const FOOTER_TAGLINE = "History-first AI CAD for new engineers. Dubai, UAE.\n© 2026 Orynd Inc.";
const FOOTER_COPYRIGHT = "© 2026 ORYND INC · DUBAI, UAE";
Object.assign(__ds_scope, { HERO, FRICTION, NAV_LINKS, JOURNEY_STEPS, HOW_CARDS, PROOF_CASES, MANIFESTO, PILLARS, MARQUEE_ITEMS, PLANS, ENTERPRISE, FAQ_ITEMS, FINAL_CTA, FOOTER_COLS, SOCIALS, FOOTER_TAGLINE, FOOTER_COPYRIGHT });
})(); } catch (e) { __ds_ns.__errors.push({ path: "app/content/landing.ts", error: String((e && e.message) || e) }); }

// ui_kits/checkout/tweaks-panel.jsx
try { (() => {
// @ds-adherence-ignore -- omelette starter scaffold (raw elements/hex/px by design)

/* BEGIN USAGE */
// tweaks-panel.jsx
// Reusable Tweaks shell + form-control helpers.
// Exports (to window): useTweaks, TweaksPanel, TweakSection, TweakRow, TweakSlider,
//   TweakToggle, TweakRadio, TweakSelect, TweakText, TweakNumber, TweakColor, TweakButton.
//
// Owns the host protocol (listens for __activate_edit_mode / __deactivate_edit_mode,
// posts __edit_mode_available / __edit_mode_set_keys / __edit_mode_dismissed) so
// individual prototypes don't re-roll it. Ships a consistent set of controls so you
// don't hand-draw <input type="range">, segmented radios, steppers, etc.
//
// Usage (in an HTML file that loads React + Babel):
//
//   const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
//     "primaryColor": "#D97757",
//     "palette": ["#D97757", "#29261b", "#f6f4ef"],
//     "fontSize": 16,
//     "density": "regular",
//     "dark": false
//   }/*EDITMODE-END*/;
//
//   function App() {
//     const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
//     return (
//       <div style={{ fontSize: t.fontSize, color: t.primaryColor }}>
//         Hello
//         <TweaksPanel>
//           <TweakSection label="Typography" />
//           <TweakSlider label="Font size" value={t.fontSize} min={10} max={32} unit="px"
//                        onChange={(v) => setTweak('fontSize', v)} />
//           <TweakRadio  label="Density" value={t.density}
//                        options={['compact', 'regular', 'comfy']}
//                        onChange={(v) => setTweak('density', v)} />
//           <TweakSection label="Theme" />
//           <TweakColor  label="Primary" value={t.primaryColor}
//                        options={['#D97757', '#2A6FDB', '#1F8A5B', '#7A5AE0']}
//                        onChange={(v) => setTweak('primaryColor', v)} />
//           <TweakColor  label="Palette" value={t.palette}
//                        options={[['#D97757', '#29261b', '#f6f4ef'],
//                                  ['#475569', '#0f172a', '#f1f5f9']]}
//                        onChange={(v) => setTweak('palette', v)} />
//           <TweakToggle label="Dark mode" value={t.dark}
//                        onChange={(v) => setTweak('dark', v)} />
//         </TweaksPanel>
//       </div>
//     );
//   }
//
// TweakRadio is the segmented control for 2–3 short options (auto-falls-back to
// TweakSelect past ~16/~10 chars per label); reach for TweakSelect directly when
// options are many or long. For color tweaks always curate 3-4 options rather than
// a free picker; an option can also be a whole 2–5 color palette (the stored value
// is the array). The Tweak* controls are a floor, not a ceiling — build custom
// controls inside the panel if a tweak calls for UI they don't cover.
/* END USAGE */
// ─────────────────────────────────────────────────────────────────────────────

const __TWEAKS_STYLE = `
  .twk-panel{position:fixed;right:16px;bottom:16px;z-index:2147483646;width:280px;
    max-height:calc(100vh - 32px);display:flex;flex-direction:column;
    transform:scale(var(--dc-inv-zoom,1));transform-origin:bottom right;
    background:rgba(250,249,247,.78);color:#29261b;
    -webkit-backdrop-filter:blur(24px) saturate(160%);backdrop-filter:blur(24px) saturate(160%);
    border:.5px solid rgba(255,255,255,.6);border-radius:14px;
    box-shadow:0 1px 0 rgba(255,255,255,.5) inset,0 12px 40px rgba(0,0,0,.18);
    font:11.5px/1.4 ui-sans-serif,system-ui,-apple-system,sans-serif;overflow:hidden}
  .twk-hd{display:flex;align-items:center;justify-content:space-between;
    padding:10px 8px 10px 14px;cursor:move;user-select:none}
  .twk-hd b{font-size:12px;font-weight:600;letter-spacing:.01em}
  .twk-x{appearance:none;border:0;background:transparent;color:rgba(41,38,27,.55);
    width:22px;height:22px;border-radius:6px;cursor:default;font-size:13px;line-height:1}
  .twk-x:hover{background:rgba(0,0,0,.06);color:#29261b}
  .twk-body{padding:2px 14px 14px;display:flex;flex-direction:column;gap:10px;
    overflow-y:auto;overflow-x:hidden;min-height:0;
    scrollbar-width:thin;scrollbar-color:rgba(0,0,0,.15) transparent}
  .twk-body::-webkit-scrollbar{width:8px}
  .twk-body::-webkit-scrollbar-track{background:transparent;margin:2px}
  .twk-body::-webkit-scrollbar-thumb{background:rgba(0,0,0,.15);border-radius:4px;
    border:2px solid transparent;background-clip:content-box}
  .twk-body::-webkit-scrollbar-thumb:hover{background:rgba(0,0,0,.25);
    border:2px solid transparent;background-clip:content-box}
  .twk-row{display:flex;flex-direction:column;gap:5px}
  .twk-row-h{flex-direction:row;align-items:center;justify-content:space-between;gap:10px}
  .twk-lbl{display:flex;justify-content:space-between;align-items:baseline;
    color:rgba(41,38,27,.72)}
  .twk-lbl>span:first-child{font-weight:500}
  .twk-val{color:rgba(41,38,27,.5);font-variant-numeric:tabular-nums}

  .twk-sect{font-size:10px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;
    color:rgba(41,38,27,.45);padding:10px 0 0}
  .twk-sect:first-child{padding-top:0}

  .twk-field{appearance:none;box-sizing:border-box;width:100%;min-width:0;height:26px;padding:0 8px;
    border:.5px solid rgba(0,0,0,.1);border-radius:7px;
    background:rgba(255,255,255,.6);color:inherit;font:inherit;outline:none}
  .twk-field:focus{border-color:rgba(0,0,0,.25);background:rgba(255,255,255,.85)}
  select.twk-field{padding-right:22px;
    background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'><path fill='rgba(0,0,0,.5)' d='M0 0h10L5 6z'/></svg>");
    background-repeat:no-repeat;background-position:right 8px center}

  .twk-slider{appearance:none;-webkit-appearance:none;width:100%;height:4px;margin:6px 0;
    border-radius:999px;background:rgba(0,0,0,.12);outline:none}
  .twk-slider::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;
    width:14px;height:14px;border-radius:50%;background:#fff;
    border:.5px solid rgba(0,0,0,.12);box-shadow:0 1px 3px rgba(0,0,0,.2);cursor:default}
  .twk-slider::-moz-range-thumb{width:14px;height:14px;border-radius:50%;
    background:#fff;border:.5px solid rgba(0,0,0,.12);box-shadow:0 1px 3px rgba(0,0,0,.2);cursor:default}

  .twk-seg{position:relative;display:flex;padding:2px;border-radius:8px;
    background:rgba(0,0,0,.06);user-select:none}
  .twk-seg-thumb{position:absolute;top:2px;bottom:2px;border-radius:6px;
    background:rgba(255,255,255,.9);box-shadow:0 1px 2px rgba(0,0,0,.12);
    transition:left .15s cubic-bezier(.3,.7,.4,1),width .15s}
  .twk-seg.dragging .twk-seg-thumb{transition:none}
  .twk-seg button{appearance:none;position:relative;z-index:1;flex:1;border:0;
    background:transparent;color:inherit;font:inherit;font-weight:500;min-height:22px;
    border-radius:6px;cursor:default;padding:4px 6px;line-height:1.2;
    overflow-wrap:anywhere}

  .twk-toggle{position:relative;width:32px;height:18px;border:0;border-radius:999px;
    background:rgba(0,0,0,.15);transition:background .15s;cursor:default;padding:0}
  .twk-toggle[data-on="1"]{background:#34c759}
  .twk-toggle i{position:absolute;top:2px;left:2px;width:14px;height:14px;border-radius:50%;
    background:#fff;box-shadow:0 1px 2px rgba(0,0,0,.25);transition:transform .15s}
  .twk-toggle[data-on="1"] i{transform:translateX(14px)}

  .twk-num{display:flex;align-items:center;box-sizing:border-box;min-width:0;height:26px;padding:0 0 0 8px;
    border:.5px solid rgba(0,0,0,.1);border-radius:7px;background:rgba(255,255,255,.6)}
  .twk-num-lbl{font-weight:500;color:rgba(41,38,27,.6);cursor:ew-resize;
    user-select:none;padding-right:8px}
  .twk-num input{flex:1;min-width:0;height:100%;border:0;background:transparent;
    font:inherit;font-variant-numeric:tabular-nums;text-align:right;padding:0 8px 0 0;
    outline:none;color:inherit;-moz-appearance:textfield}
  .twk-num input::-webkit-inner-spin-button,.twk-num input::-webkit-outer-spin-button{
    -webkit-appearance:none;margin:0}
  .twk-num-unit{padding-right:8px;color:rgba(41,38,27,.45)}

  .twk-btn{appearance:none;height:26px;padding:0 12px;border:0;border-radius:7px;
    background:rgba(0,0,0,.78);color:#fff;font:inherit;font-weight:500;cursor:default}
  .twk-btn:hover{background:rgba(0,0,0,.88)}
  .twk-btn.secondary{background:rgba(0,0,0,.06);color:inherit}
  .twk-btn.secondary:hover{background:rgba(0,0,0,.1)}

  .twk-swatch{appearance:none;-webkit-appearance:none;width:56px;height:22px;
    border:.5px solid rgba(0,0,0,.1);border-radius:6px;padding:0;cursor:default;
    background:transparent;flex-shrink:0}
  .twk-swatch::-webkit-color-swatch-wrapper{padding:0}
  .twk-swatch::-webkit-color-swatch{border:0;border-radius:5.5px}
  .twk-swatch::-moz-color-swatch{border:0;border-radius:5.5px}

  .twk-chips{display:flex;gap:6px}
  .twk-chip{position:relative;appearance:none;flex:1;min-width:0;height:46px;
    padding:0;border:0;border-radius:6px;overflow:hidden;cursor:default;
    box-shadow:0 0 0 .5px rgba(0,0,0,.12),0 1px 2px rgba(0,0,0,.06);
    transition:transform .12s cubic-bezier(.3,.7,.4,1),box-shadow .12s}
  .twk-chip:hover{transform:translateY(-1px);
    box-shadow:0 0 0 .5px rgba(0,0,0,.18),0 4px 10px rgba(0,0,0,.12)}
  .twk-chip[data-on="1"]{box-shadow:0 0 0 1.5px rgba(0,0,0,.85),
    0 2px 6px rgba(0,0,0,.15)}
  .twk-chip>span{position:absolute;top:0;bottom:0;right:0;width:34%;
    display:flex;flex-direction:column;box-shadow:-1px 0 0 rgba(0,0,0,.1)}
  .twk-chip>span>i{flex:1;box-shadow:0 -1px 0 rgba(0,0,0,.1)}
  .twk-chip>span>i:first-child{box-shadow:none}
  .twk-chip svg{position:absolute;top:6px;left:6px;width:13px;height:13px;
    filter:drop-shadow(0 1px 1px rgba(0,0,0,.3))}
`;

// ── useTweaks ───────────────────────────────────────────────────────────────
// Single source of truth for tweak values. setTweak persists via the host
// (__edit_mode_set_keys → host rewrites the EDITMODE block on disk).
function useTweaks(defaults) {
  const [values, setValues] = React.useState(defaults);
  // Accepts either setTweak('key', value) or setTweak({ key: value, ... }) so a
  // useState-style call doesn't write a "[object Object]" key into the persisted
  // JSON block.
  const setTweak = React.useCallback((keyOrEdits, val) => {
    const edits = typeof keyOrEdits === 'object' && keyOrEdits !== null ? keyOrEdits : {
      [keyOrEdits]: val
    };
    setValues(prev => ({
      ...prev,
      ...edits
    }));
    window.parent.postMessage({
      type: '__edit_mode_set_keys',
      edits
    }, '*');
    // Same-window signal so in-page listeners (deck-stage rail thumbnails)
    // can react — the parent message only reaches the host, not peers.
    window.dispatchEvent(new CustomEvent('tweakchange', {
      detail: edits
    }));
  }, []);
  return [values, setTweak];
}

// ── TweaksPanel ─────────────────────────────────────────────────────────────
// Floating shell. Registers the protocol listener BEFORE announcing
// availability — if the announce ran first, the host's activate could land
// before our handler exists and the toolbar toggle would silently no-op.
// The close button posts __edit_mode_dismissed so the host's toolbar toggle
// flips off in lockstep; the host echoes __deactivate_edit_mode back which
// is what actually hides the panel.
function TweaksPanel({
  title = 'Tweaks',
  children
}) {
  const [open, setOpen] = React.useState(false);
  const dragRef = React.useRef(null);
  const offsetRef = React.useRef({
    x: 16,
    y: 16
  });
  const PAD = 16;
  const clampToViewport = React.useCallback(() => {
    const panel = dragRef.current;
    if (!panel) return;
    const w = panel.offsetWidth,
      h = panel.offsetHeight;
    const maxRight = Math.max(PAD, window.innerWidth - w - PAD);
    const maxBottom = Math.max(PAD, window.innerHeight - h - PAD);
    offsetRef.current = {
      x: Math.min(maxRight, Math.max(PAD, offsetRef.current.x)),
      y: Math.min(maxBottom, Math.max(PAD, offsetRef.current.y))
    };
    panel.style.right = offsetRef.current.x + 'px';
    panel.style.bottom = offsetRef.current.y + 'px';
  }, []);
  React.useEffect(() => {
    if (!open) return;
    clampToViewport();
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', clampToViewport);
      return () => window.removeEventListener('resize', clampToViewport);
    }
    const ro = new ResizeObserver(clampToViewport);
    ro.observe(document.documentElement);
    return () => ro.disconnect();
  }, [open, clampToViewport]);
  React.useEffect(() => {
    const onMsg = e => {
      const t = e?.data?.type;
      if (t === '__activate_edit_mode') setOpen(true);else if (t === '__deactivate_edit_mode') setOpen(false);
    };
    window.addEventListener('message', onMsg);
    window.parent.postMessage({
      type: '__edit_mode_available'
    }, '*');
    return () => window.removeEventListener('message', onMsg);
  }, []);
  const dismiss = () => {
    setOpen(false);
    window.parent.postMessage({
      type: '__edit_mode_dismissed'
    }, '*');
  };
  const onDragStart = e => {
    const panel = dragRef.current;
    if (!panel) return;
    const r = panel.getBoundingClientRect();
    const sx = e.clientX,
      sy = e.clientY;
    const startRight = window.innerWidth - r.right;
    const startBottom = window.innerHeight - r.bottom;
    const move = ev => {
      offsetRef.current = {
        x: startRight - (ev.clientX - sx),
        y: startBottom - (ev.clientY - sy)
      };
      clampToViewport();
    };
    const up = () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  };
  if (!open) return null;
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("style", null, __TWEAKS_STYLE), /*#__PURE__*/React.createElement("div", {
    ref: dragRef,
    className: "twk-panel",
    "data-omelette-chrome": "",
    style: {
      right: offsetRef.current.x,
      bottom: offsetRef.current.y
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "twk-hd",
    onMouseDown: onDragStart
  }, /*#__PURE__*/React.createElement("b", null, title), /*#__PURE__*/React.createElement("button", {
    className: "twk-x",
    "aria-label": "Close tweaks",
    onMouseDown: e => e.stopPropagation(),
    onClick: dismiss
  }, "\u2715")), /*#__PURE__*/React.createElement("div", {
    className: "twk-body"
  }, children)));
}

// ── Layout helpers ──────────────────────────────────────────────────────────

function TweakSection({
  label,
  children
}) {
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "twk-sect"
  }, label), children);
}
function TweakRow({
  label,
  value,
  children,
  inline = false
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: inline ? 'twk-row twk-row-h' : 'twk-row'
  }, /*#__PURE__*/React.createElement("div", {
    className: "twk-lbl"
  }, /*#__PURE__*/React.createElement("span", null, label), value != null && /*#__PURE__*/React.createElement("span", {
    className: "twk-val"
  }, value)), children);
}

// ── Controls ────────────────────────────────────────────────────────────────

function TweakSlider({
  label,
  value,
  min = 0,
  max = 100,
  step = 1,
  unit = '',
  onChange
}) {
  return /*#__PURE__*/React.createElement(TweakRow, {
    label: label,
    value: `${value}${unit}`
  }, /*#__PURE__*/React.createElement("input", {
    type: "range",
    className: "twk-slider",
    min: min,
    max: max,
    step: step,
    value: value,
    onChange: e => onChange(Number(e.target.value))
  }));
}
function TweakToggle({
  label,
  value,
  onChange
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "twk-row twk-row-h"
  }, /*#__PURE__*/React.createElement("div", {
    className: "twk-lbl"
  }, /*#__PURE__*/React.createElement("span", null, label)), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "twk-toggle",
    "data-on": value ? '1' : '0',
    role: "switch",
    "aria-checked": !!value,
    onClick: () => onChange(!value)
  }, /*#__PURE__*/React.createElement("i", null)));
}
function TweakRadio({
  label,
  value,
  options,
  onChange
}) {
  const trackRef = React.useRef(null);
  const [dragging, setDragging] = React.useState(false);
  // The active value is read by pointer-move handlers attached for the lifetime
  // of a drag — ref it so a stale closure doesn't fire onChange for every move.
  const valueRef = React.useRef(value);
  valueRef.current = value;

  // Segments wrap mid-word once per-segment width runs out. The track is
  // ~248px (280 panel − 28 body pad − 4 seg pad), each button loses 12px
  // to its own padding, and 11.5px system-ui averages ~6.3px/char — so 2
  // options fit ~16 chars each, 3 fit ~10. Past that (or >3 options), fall
  // back to a dropdown rather than wrap.
  const labelLen = o => String(typeof o === 'object' ? o.label : o).length;
  const maxLen = options.reduce((m, o) => Math.max(m, labelLen(o)), 0);
  const fitsAsSegments = maxLen <= ({
    2: 16,
    3: 10
  }[options.length] ?? 0);
  if (!fitsAsSegments) {
    // <select> emits strings — map back to the original option value so the
    // fallback stays type-preserving (numbers, booleans) like the segment path.
    const resolve = s => {
      const m = options.find(o => String(typeof o === 'object' ? o.value : o) === s);
      return m === undefined ? s : typeof m === 'object' ? m.value : m;
    };
    return /*#__PURE__*/React.createElement(TweakSelect, {
      label: label,
      value: value,
      options: options,
      onChange: s => onChange(resolve(s))
    });
  }
  const opts = options.map(o => typeof o === 'object' ? o : {
    value: o,
    label: o
  });
  const idx = Math.max(0, opts.findIndex(o => o.value === value));
  const n = opts.length;
  const segAt = clientX => {
    const r = trackRef.current.getBoundingClientRect();
    const inner = r.width - 4;
    const i = Math.floor((clientX - r.left - 2) / inner * n);
    return opts[Math.max(0, Math.min(n - 1, i))].value;
  };
  const onPointerDown = e => {
    setDragging(true);
    const v0 = segAt(e.clientX);
    if (v0 !== valueRef.current) onChange(v0);
    const move = ev => {
      if (!trackRef.current) return;
      const v = segAt(ev.clientX);
      if (v !== valueRef.current) onChange(v);
    };
    const up = () => {
      setDragging(false);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };
  return /*#__PURE__*/React.createElement(TweakRow, {
    label: label
  }, /*#__PURE__*/React.createElement("div", {
    ref: trackRef,
    role: "radiogroup",
    onPointerDown: onPointerDown,
    className: dragging ? 'twk-seg dragging' : 'twk-seg'
  }, /*#__PURE__*/React.createElement("div", {
    className: "twk-seg-thumb",
    style: {
      left: `calc(2px + ${idx} * (100% - 4px) / ${n})`,
      width: `calc((100% - 4px) / ${n})`
    }
  }), opts.map(o => /*#__PURE__*/React.createElement("button", {
    key: o.value,
    type: "button",
    role: "radio",
    "aria-checked": o.value === value
  }, o.label))));
}
function TweakSelect({
  label,
  value,
  options,
  onChange
}) {
  return /*#__PURE__*/React.createElement(TweakRow, {
    label: label
  }, /*#__PURE__*/React.createElement("select", {
    className: "twk-field",
    value: value,
    onChange: e => onChange(e.target.value)
  }, options.map(o => {
    const v = typeof o === 'object' ? o.value : o;
    const l = typeof o === 'object' ? o.label : o;
    return /*#__PURE__*/React.createElement("option", {
      key: v,
      value: v
    }, l);
  })));
}
function TweakText({
  label,
  value,
  placeholder,
  onChange
}) {
  return /*#__PURE__*/React.createElement(TweakRow, {
    label: label
  }, /*#__PURE__*/React.createElement("input", {
    className: "twk-field",
    type: "text",
    value: value,
    placeholder: placeholder,
    onChange: e => onChange(e.target.value)
  }));
}
function TweakNumber({
  label,
  value,
  min,
  max,
  step = 1,
  unit = '',
  onChange
}) {
  const clamp = n => {
    if (min != null && n < min) return min;
    if (max != null && n > max) return max;
    return n;
  };
  const startRef = React.useRef({
    x: 0,
    val: 0
  });
  const onScrubStart = e => {
    e.preventDefault();
    startRef.current = {
      x: e.clientX,
      val: value
    };
    const decimals = (String(step).split('.')[1] || '').length;
    const move = ev => {
      const dx = ev.clientX - startRef.current.x;
      const raw = startRef.current.val + dx * step;
      const snapped = Math.round(raw / step) * step;
      onChange(clamp(Number(snapped.toFixed(decimals))));
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "twk-num"
  }, /*#__PURE__*/React.createElement("span", {
    className: "twk-num-lbl",
    onPointerDown: onScrubStart
  }, label), /*#__PURE__*/React.createElement("input", {
    type: "number",
    value: value,
    min: min,
    max: max,
    step: step,
    onChange: e => onChange(clamp(Number(e.target.value)))
  }), unit && /*#__PURE__*/React.createElement("span", {
    className: "twk-num-unit"
  }, unit));
}

// Relative-luminance contrast pick — checkmarks drawn over a swatch need to
// read on both #111 and #fafafa without per-option configuration. Hex input
// only (#rgb / #rrggbb); named or rgb()/hsl() colors fall through to "light".
function __twkIsLight(hex) {
  const h = String(hex).replace('#', '');
  const x = h.length === 3 ? h.replace(/./g, c => c + c) : h.padEnd(6, '0');
  const n = parseInt(x.slice(0, 6), 16);
  if (Number.isNaN(n)) return true;
  const r = n >> 16 & 255,
    g = n >> 8 & 255,
    b = n & 255;
  return r * 299 + g * 587 + b * 114 > 148000;
}
const __TwkCheck = ({
  light
}) => /*#__PURE__*/React.createElement("svg", {
  viewBox: "0 0 14 14",
  "aria-hidden": "true"
}, /*#__PURE__*/React.createElement("path", {
  d: "M3 7.2 5.8 10 11 4.2",
  fill: "none",
  strokeWidth: "2.2",
  strokeLinecap: "round",
  strokeLinejoin: "round",
  stroke: light ? 'rgba(0,0,0,.78)' : '#fff'
}));

// TweakColor — curated color/palette picker. Each option is either a single
// hex string or an array of 1-5 hex strings; the card adapts — a lone color
// renders solid, a palette renders colors[0] as the hero (left ~2/3) with the
// rest stacked in a sharp column on the right. onChange emits the
// option in the shape it was passed (string stays string, array stays array).
// Without options it falls back to the native color input for back-compat.
function TweakColor({
  label,
  value,
  options,
  onChange
}) {
  if (!options || !options.length) {
    return /*#__PURE__*/React.createElement("div", {
      className: "twk-row twk-row-h"
    }, /*#__PURE__*/React.createElement("div", {
      className: "twk-lbl"
    }, /*#__PURE__*/React.createElement("span", null, label)), /*#__PURE__*/React.createElement("input", {
      type: "color",
      className: "twk-swatch",
      value: value,
      onChange: e => onChange(e.target.value)
    }));
  }
  // Native <input type=color> emits lowercase hex per the HTML spec, so
  // compare case-insensitively. String() guards JSON.stringify(undefined),
  // which returns the primitive undefined (no .toLowerCase).
  const key = o => String(JSON.stringify(o)).toLowerCase();
  const cur = key(value);
  return /*#__PURE__*/React.createElement(TweakRow, {
    label: label
  }, /*#__PURE__*/React.createElement("div", {
    className: "twk-chips",
    role: "radiogroup"
  }, options.map((o, i) => {
    const colors = Array.isArray(o) ? o : [o];
    const [hero, ...rest] = colors;
    const sup = rest.slice(0, 4);
    const on = key(o) === cur;
    return /*#__PURE__*/React.createElement("button", {
      key: i,
      type: "button",
      className: "twk-chip",
      role: "radio",
      "aria-checked": on,
      "data-on": on ? '1' : '0',
      "aria-label": colors.join(', '),
      title: colors.join(' · '),
      style: {
        background: hero
      },
      onClick: () => onChange(o)
    }, sup.length > 0 && /*#__PURE__*/React.createElement("span", null, sup.map((c, j) => /*#__PURE__*/React.createElement("i", {
      key: j,
      style: {
        background: c
      }
    }))), on && /*#__PURE__*/React.createElement(__TwkCheck, {
      light: __twkIsLight(hero)
    }));
  })));
}
function TweakButton({
  label,
  onClick,
  secondary = false
}) {
  return /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: secondary ? 'twk-btn secondary' : 'twk-btn',
    onClick: onClick
  }, label);
}
Object.assign(window, {
  useTweaks,
  TweaksPanel,
  TweakSection,
  TweakRow,
  TweakSlider,
  TweakToggle,
  TweakRadio,
  TweakSelect,
  TweakText,
  TweakNumber,
  TweakColor,
  TweakButton
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/checkout/tweaks-panel.jsx", error: String((e && e.message) || e) }); }

__ds_ns.HERO = __ds_scope.HERO;

__ds_ns.FRICTION = __ds_scope.FRICTION;

__ds_ns.NAV_LINKS = __ds_scope.NAV_LINKS;

__ds_ns.JOURNEY_STEPS = __ds_scope.JOURNEY_STEPS;

__ds_ns.HOW_CARDS = __ds_scope.HOW_CARDS;

__ds_ns.PROOF_CASES = __ds_scope.PROOF_CASES;

__ds_ns.MANIFESTO = __ds_scope.MANIFESTO;

__ds_ns.PILLARS = __ds_scope.PILLARS;

__ds_ns.MARQUEE_ITEMS = __ds_scope.MARQUEE_ITEMS;

__ds_ns.PLANS = __ds_scope.PLANS;

__ds_ns.ENTERPRISE = __ds_scope.ENTERPRISE;

__ds_ns.FAQ_ITEMS = __ds_scope.FAQ_ITEMS;

__ds_ns.FINAL_CTA = __ds_scope.FINAL_CTA;

__ds_ns.FOOTER_COLS = __ds_scope.FOOTER_COLS;

__ds_ns.SOCIALS = __ds_scope.SOCIALS;

__ds_ns.FOOTER_TAGLINE = __ds_scope.FOOTER_TAGLINE;

__ds_ns.FOOTER_COPYRIGHT = __ds_scope.FOOTER_COPYRIGHT;

})();
