# ORYND CAD Bridge Production Readiness Gaps

Date: 2026-06-19

This document is the honest release checklist. It separates:

- what is already implemented enough for offline/beta proof;
- what can be shown in a controlled demo;
- what must be finished before a public production release.

## Current Bottom Line

We are not production-ready yet.

We are close to a controlled beta/demo if we position it correctly:

```text
prompt/example -> operation plan -> validation -> macro preview -> approval
```

But we are not yet at:

```text
user installs extension -> signs in -> asks for any part -> SolidWorks reliably
creates it -> updates safely -> backend/model routes are stable -> paid users
can use it without manual debugging
```

The biggest unfinished areas are:

1. real SolidWorks runtime proof;
2. staged macro/add-in execution with postcondition checks;
3. production UI/design implementation;
4. Supabase auth/entitlement wiring;
5. backend/model gateway strategy;
6. installer/update/signing;
7. website download/docs flow.

## What Is Implemented

Offline prototype:

- operation schema;
- command catalog;
- deterministic examples;
- macro/code preview;
- static macro safety checks;
- operation plan validation;
- hosted planner adapter code paths;
- local/Ollama-style route concept;
- GenCAD adapter placeholder;
- ORYND AI Model 4/CoreOps primitive adapter;
- MCP server scaffold;
- local companion API/UI scaffold;
- Supabase readiness/config scaffolds;
- Windows SolidWorks add-in scaffold;
- SolidWorks API inventory extraction plan/tool scaffold;
- Windows add-in build/test guide;
- component-first UI/code-design prompt;
- production gap and QA reports.

Latest hardening added:

- sketch geometry now requires an active sketch;
- extrude/revolve now require sketch geometry;
- hole/cut/fillet/chamfer now require an earlier solid body;
- export now requires a solid body;
- holes are checked against known circle/rectangle body profiles when possible;
- circular pattern target references must point to an earlier operation id;
- circular pattern radius is checked against the target hole radius when possible.

This catches the exact class of offline errors where the model tries to:

- cut before a body exists;
- export an empty document;
- place a hole outside the part;
- pattern a missing feature;
- use the wrong bolt-circle radius.

## What Is Not Done Yet

### 1. Real SolidWorks Runtime Proof

Status: not done.

The current code can generate macros and an add-in scaffold, but we have not
verified inside a real Windows SolidWorks session that:

- the add-in loads;
- the Task Pane appears;
- the local bridge responds from the Task Pane;
- `mounting_bracket` creates the expected body;
- `brake_disc_basic` creates the expected holes on the correct PCD;
- STEP export writes and reopens correctly.

Production gate:

```text
Windows + SolidWorks -> install add-in -> open Task Pane -> run mounting bracket
-> verify feature tree/body dimensions -> export STEP -> reopen STEP
```

### 2. Staged Execution And Postcondition Checks

Status: not done.

A single full macro preview is useful, but production should not trust a long
macro blindly. The safer runtime design is staged execution:

```text
operation plan
  -> static validator
  -> macro/API preview
  -> user approval
  -> execute operation 1
  -> check postcondition
  -> execute operation 2
  -> check postcondition
  -> stop/repair if a step fails
```

Required postconditions:

- after `create_part`: active document exists;
- after `sketch`: expected plane selected and sketch opened;
- after `circle/rectangle/line`: sketch segment count increased;
- after `extrude`: feature object exists and body count increased;
- after `hole/cut`: feature object exists and cut changed body;
- after brake-disc holes: hole count/positions match expected PCD;
- after `fillet/chamfer`: feature exists or warning is shown;
- after `export`: file exists and size > 0.

Repair loop:

```text
failed operation + SolidWorks error/log + current feature tree state
  -> planner/model repair prompt
  -> patched operation
  -> validator
  -> preview diff
  -> user approval if needed
```

This is how we reduce failures from unit/axis/selection mistakes.

### 3. Macro Helper Runtime Quality

Status: partial.

Known weak spots:

- `pattern` helper is still a placeholder;
- `revolve` helper is still a placeholder;
- `mate` helper is still a declaration;
- `fillet/chamfer` use weak selection strategy;
- `hole` helper needs real face/plane/feature selection testing;
- `SaveAs3` export path behavior must be verified in real SolidWorks;
- some SolidWorks API calls may need version-specific argument fixes.

MVP strategy:

- first use explicit repeated holes for brake disc instead of relying on pattern;
- verify one simple feature chain before expanding;
- keep placeholders clearly marked in UI as not runtime-verified.

### 4. Production UI / Visual Layer

Status: prompt/spec exists; implementation not done.

Created:

- `UI_AND_CHAT_IMPLEMENTATION_PROMPTS.md`
- `CODE_DESIGN_SYSTEM_IMPLEMENTATION_PROMPT.md`
- `SOLIDWORKS_ADDIN_UI_PLAN.md`
- `RUNTIME_EVENTS.md`

Not created yet:

- `design/` component docs;
- standalone HTML state prototypes;
- polished Task Pane visual;
- settings/account UI;
- trial/subscription UI;
- API key UI;
- visual smoke screenshots;
- production WebView2 Task Pane UI integration.

Production gate:

```text
Task Pane states exist -> visual QA at 360-460 px -> auth/settings states
-> macro preview/approval visible -> no text overflow -> screenshots approved
```

### 5. Supabase Auth And Entitlements

Status: scaffold/readiness, not production-wired.

The extension should reuse existing ORYND/Supabase auth. It should not create a
separate fake account system.

Not done:

- real sign-in/session handoff into Task Pane/companion;
- Supabase access token verification in CAD bridge API;
- trial creation;
- subscription entitlement check;
- usage logging;
- billing redirect;
- server-side enforcement.

Production gate:

```text
sign in -> token stored safely -> bridge verifies token -> entitlement checked
-> trial/subscription/BYO route selected -> run logged -> sign out clears token
```

### 6. Backend / Model Gateway

Status: adapter interfaces exist; production server not deployed.

The extension should not bundle heavy model packs by default.

Recommended strategy:

- lightweight local mode for deterministic/offline demos;
- BYO API key mode for Claude/OpenAI/Gemini-compatible hosted routes;
- ORYND server mode for paid users;
- optional lazy downloadable model packs;
- GenCAD/AI Model 4 as separate model services;
- cache model/research outputs;
- keep heavy inference off the base installer.

Not done:

- deployed model gateway;
- queueing/timeouts;
- cache store;
- account-based usage limits;
- secret handling on server;
- production observability;
- failure/retry policy.

Production gate:

```text
Task Pane -> backend/model gateway -> selected model/tool -> traceable result
-> safe timeout/error -> cached/logged run -> no leaked keys
```

### 7. Installer, Update, Signing

Status: packaging docs/scaffolds exist; updater is not implemented.

The owner target:

```text
user clicks refresh/update -> app closes safely -> update applies -> app reopens
```

Not done:

- Windows installer build pipeline;
- code signing;
- release manifest hosting;
- update check endpoint;
- bridge/add-in version compatibility check;
- safe self-update flow;
- rollback strategy;
- macOS companion `.dmg` packaging;
- clear Mac messaging that native macOS companion is not the SolidWorks COM
  Task Pane add-in.

Recommended update design:

```text
local bridge checks signed release manifest
  -> compares version/channel
  -> downloads installer/package
  -> verifies checksum/signature
  -> asks user approval
  -> stops bridge/add-in session safely
  -> runs updater
  -> restarts bridge
  -> SolidWorks reconnects Task Pane
```

Production gate:

```text
install v1 -> receive update v2 -> update without losing settings
-> rollback if failure -> no unsigned package accepted
```

### 8. Website Download And Docs Flow

Status: not done.

Not done:

- public download page;
- beta waitlist/download gating;
- install guide;
- Mac vs Windows explanation;
- SolidWorks add-in install screenshots;
- troubleshooting;
- privacy/security page;
- pricing/trial copy;
- demo workflow pages.

Production gate:

```text
new user -> website -> download -> install guide -> sign in -> run first demo
```

### 9. Real E2E Demo On A Separate Machine

Status: not done.

Required demo script:

1. Download installer from website/release.
2. Install local bridge/add-in.
3. Open Windows SolidWorks.
4. Enable ORYND CAD Bridge.
5. Sign in or enter BYO key.
6. Run mounting bracket.
7. Run brake disc basic.
8. Review generated plan/macro.
9. Approve execution.
10. Verify feature tree/body dimensions.
11. Export STEP.
12. Reopen/export proof.
13. Record video.

This is the practical line between "prototype works offline" and "we can show a
real beta demo".

## Can We Do The Safer Macro Strategy?

Yes.

The right design is not "give the model SolidWorks language and trust one long
macro". The right design is:

```text
model/planner proposes operation plan
  -> validator checks schema/order/geometry/security
  -> renderer shows preview
  -> user approves
  -> trusted runner executes constrained operations
  -> each operation returns success/failure/postcondition data
  -> runner stops or repairs on failure
```

For the model, this feels like a new CAD language. For the product, it must be a
constrained instruction set with validation and runtime feedback.

This gives us:

- fewer unit mistakes;
- fewer center/PCD mistakes;
- fewer sketch/feature dependency failures;
- better repair when SolidWorks rejects an operation;
- clearer UI state for the user;
- safer execution than arbitrary generated VBA.

## Recommended Next Execution Order

1. Implement staged runner contract and postcondition result schema.
2. Make `mounting_bracket` the first runtime-verified SolidWorks demo.
3. Make `brake_disc_basic` second, using explicit repeated holes first.
4. Build Task Pane HTML/component prototype from the new design prompt.
5. Wire existing ORYND/Supabase auth/session into the bridge.
6. Add BYO key settings UI and a server model gateway stub.
7. Implement signed release manifest + update flow.
8. Build Windows installer and manual install guide.
9. Publish website download/docs pages.
10. Run E2E on another machine and record the demo.

## Beta Claim We Can Make After Runtime Test

After a real SolidWorks runtime pass, the safe public beta claim is:

```text
ORYND CAD Bridge is an AI-assisted SolidWorks companion that turns engineering
prompts into constrained operation plans, validates them, shows macro/API
previews, and can execute approved MVP CAD operations for selected examples.
```

Do not claim:

- "creates any CAD model";
- "full SolidWorks command coverage";
- "GenCAD built in";
- "AI Model 4 production reconstruction";
- "Mac native SolidWorks add-in";
- "manufacturing-ready engineering parts";

until those paths are verified.

