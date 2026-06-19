# ORYND CAD Bridge Product Foundation

This is the corrected product shape after comparing the target with MecAgent-like
CAD copilot positioning.

## Product Definition

ORYND CAD Bridge is not primarily a web dashboard.

It is:

```text
SolidWorks Add-in + right-side Task Pane + local bridge + ORYND backend/model routes
```

The standalone web UI in this repo is only:

- a development preview;
- a fallback local companion;
- a way to test API/macro generation without SolidWorks.

## User Experience Target

The user should experience the product inside SolidWorks:

1. Install ORYND CAD Bridge.
2. Open SolidWorks.
3. Enable ORYND CAD Bridge in Add-Ins.
4. Use right-side Task Pane.
5. Sign in through existing ORYND/Supabase auth.
6. Enter prompt or attach image/mesh.
7. Watch statuses: research, search, planning, validation, macro preview.
8. Approve execution.
9. SolidWorks model updates.
10. Export STEP/STL/drawing.

## System Architecture

```text
SolidWorks Task Pane
  -> local bridge process
  -> existing ORYND auth/session
  -> model router
      -> BYO Claude/OpenAI/Gemini key
      -> ORYND server route
      -> local model/Ollama
  -> optional services
      -> search agent
      -> GenCAD adapter
      -> AI Model 4 adapter
  -> operation plan
  -> validator
  -> macro/API executor
  -> SolidWorks document
```

## Design Integration Rule

Design and CAD logic must stay decoupled.

UI can be replaced without changing:

- operation schema;
- command catalog;
- macro emitter;
- validator;
- model adapters;
- SolidWorks API executor.

Frontend UI should consume state events:

```text
started -> thinking -> searching -> planning -> validating -> preview_ready -> approved -> executing -> finished/failed
```

Each event should be serializable and renderable by:

- SolidWorks Task Pane UI;
- local web preview;
- future website demo;
- MCP client.

## Release Strategy

First usable build:

```text
GitHub release -> Windows installer -> SolidWorks add-in + local bridge
```

Updates:

```text
installed app -> stable release manifest -> user-approved update -> checksum verification
```

Heavy models:

- not bundled in base installer;
- server-side by default;
- lazy download only if user opts in;
- BYO API key mode for low-cost testing.

## Competitive Marketing Notes

MecAgent's positioning is strong because it shows concrete CAD outcomes:

- macro AI generation;
- drawing generation;
- CAD copilot actions;
- text-to-STEP/STL;
- catalog part finder;
- engineering expert answers.

ORYND should market concrete workflows, not generic "AI for CAD":

- create brake disc from prompt;
- find/import/decompose engine assembly;
- sketch/photo to editable operation plan;
- generate SolidWorks macro and preview;
- validate and export STEP;
- ask engineering question with sources;
- turn model into drawing package.

