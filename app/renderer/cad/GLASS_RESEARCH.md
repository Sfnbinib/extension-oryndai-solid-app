# Liquid-glass UI — research (proposal only, nothing installed)

Per the spec: **research only, do not install until approved.** Here are 3 viable
options plus my recommendation for the ORYND CAD Bridge task pane.

## Context
The pane already uses real glass today — hand-rolled CSS `backdrop-filter: blur()`
+ translucent surfaces + inset highlights on the header, composer, popovers, and
settings groups. So this is a question of whether to adopt a library or keep the
bespoke CSS.

## Options

### 1. Keep bespoke CSS glass (recommended)
- **What:** the current approach — `backdrop-filter`, layered translucency, `inset 0 1px 0` speculars, ORYND tokens.
- **Pros:** zero dependency, already on-brand (warm graphite + ORYND orange), full control, renders identically in the prototype and a real WebView2/CEF task pane. No React-version or bundler risk.
- **Cons:** we maintain it. No "refraction"/Fresnel realism — but that's arguably *off-brand* for ORYND's "warm minimal industrial" voice anyway.

### 2. Ein UI — `ui.eindev.ir`
- Open-source, **shadcn-compatible**, accessible, TypeScript, built-in dark mode.
- **Pros:** closest to a "real" component kit; accessible; dark-mode native.
- **Cons:** shadcn/Tailwind-oriented — heavier to graft onto our plain-CSS + `window.ORYNDAIDesignSystem` setup. Would fight the ORYND token system.

### 3. Glass UI kits (`liquidglassui.org`, `liquidglass.liqueai.com`)
- visionOS / iOS-26-inspired translucent component sets (Button, Card, Modal…).
- **Pros:** drop-in fancy glass, specular highlights, light-reactive.
- **Cons:** Apple-visionOS aesthetic is **cooler/brighter** than ORYND's warm cream-and-orange brand; risks looking generic-Apple, not ORYND. Tailwind/Next assumptions.

### (Noted, not applicable) callstack/liquid-glass, reactGlass, React Liquid Kit
- These are **React Native / native iOS** (Xcode 26, RN 0.80+) — not for an HTML/WebView CAD task pane.

## Recommendation
**Stay with bespoke CSS glass (Option 1)** and, if we want more depth, selectively
borrow *techniques* (not the dependency) from Ein UI: e.g. a subtle moving specular
on hover for primary buttons. This keeps us dependency-free, on-brand, and safe for
embedding in the real SolidWorks task-pane WebView.

**Awaiting your approval before integrating anything.**
