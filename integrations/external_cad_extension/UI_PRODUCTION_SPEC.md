# ORYND CAD Bridge UI Production Spec

Current visual artifact:

```text
ui/companion_preview.html
```

Current implemented web UI:

```text
web_app.py
```

## Current UI State

Correction: this is not the final product UI if the product ships as a
SolidWorks extension. It is a companion/dev preview. The production UI should be
a SolidWorks add-in task pane / CommandManager toolbar, optionally backed by a
local companion process.

Implemented:

- account/settings panel;
- provider/model/API-key input;
- trial button;
- engineering prompt;
- run scenario/generate macro controls;
- output tabs for summary, plan, macro, settings;
- basic entitlement status;
- responsive two-column layout.

Static preview adds:

- clearer product navigation;
- backend readiness status;
- pipeline visualization;
- validation summary;
- SolidWorks runtime pending state;
- macro/plan preview surface.

## Production UI Gaps

- real Supabase Auth session screens;
- account/subscription/payment state;
- free trial activation flow with server-side enforcement;
- file/image/mesh upload controls;
- search/research agent controls and source review;
- operation-plan diff/repair UI;
- approval gate before target execution;
- SolidWorks connection status;
- export/open-in-CAD controls;
- run log and failure diagnostics;
- responsive task-pane version for SolidWorks add-in.

## Product Screen Order

1. Generate
2. Research Context
3. Operation Plan
4. Macro Preview
5. Validation
6. Approval
7. SolidWorks Target
8. Export/Run Log
9. Settings

## Design Direction

Quiet engineering tool, not a landing page:

- dense but readable layout;
- strong status signaling;
- restrained colors;
- no decorative gradients;
- no hidden execution;
- code and assumptions always visible before run.
