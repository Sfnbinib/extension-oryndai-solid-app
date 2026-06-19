# ORYND CAD Bridge

Working names:

- ORYND CAD Bridge
- ORYND External CAD Extension

Final product name is TBD. `Supernova plan/` is not the product name; it is the
planning/control folder that contains the owner's raw messages, task extraction,
execution plans, decisions, and handoff prompts.

## Owner Concept

This module exists because the owner described a simple but powerful CAD agent
idea:

> "чувак заходит ... пишет ... и если он получает результат который он хочет он остается"

The target product is not just a web dashboard. It is a CAD-native companion:

```text
SolidWorks right-side Task Pane
  -> local bridge
  -> model/search/tool orchestration
  -> constrained CAD operation plan
  -> macro/API preview
  -> validation
  -> user approval
  -> SolidWorks execution/export
```

The owner repeatedly framed the product as a lightweight combination of a few
high-leverage parts:

> "Элемент состоит, система из четырех частей."

The practical version of that idea is:

1. A strong planning model route:
   - Claude/Opus via BYO API key;
   - OpenAI or other hosted provider;
   - local model/Ollama;
   - external Claude/Codex-like agent through MCP if feasible.
2. A search/research layer:
   - find how an engineering object is built;
   - extract components, dimensions, assumptions, and CAD implications;
   - show sources and reasoning states in the UI.
3. A SolidWorks command/macro language:
   - keep a constrained command catalog;
   - give the model enough CAD vocabulary to plan;
   - never allow arbitrary shell/network/delete code.
4. A CAD operation planner:
   - transform text/image/mesh/search context into a JSON-like operation plan;
   - keep units in millimeters;
   - make assumptions explicit.
5. A macro/API executor path:
   - generate SolidWorks VBA-style macro/code preview;
   - validate it statically;
   - show it to the user;
   - run only after explicit approval.

The intended user experience:

> "Брат Я хочу себе там Диск Тормозной ... Он тебе буквально ... Создает full макрос ... Макрос готов ... он нажимает на макрос Макрос выполнился У него появился Этот элемент"

The current repository is the first isolated prototype of that idea.

## Product Shape

The corrected product shape is:

```text
SolidWorks Add-in + right-side Task Pane + local bridge + ORYND backend/model routes
```

The local web UI in this repo is only:

- a development preview;
- a fallback local companion;
- a way to test operation-plan and macro generation without SolidWorks.

The final product should feel similar in placement to modern CAD copilots:

- open SolidWorks;
- enable ORYND CAD Bridge;
- use the right-side Task Pane;
- sign in through ORYND/Supabase;
- write a request or attach image/mesh/reference;
- watch states: understanding, search, planning, validation, macro preview;
- approve execution;
- receive a CAD result and export.

## Core Scenarios

### 1. Text To Macro

Example:

```text
Create a ventilated brake disc diameter 280 mm, thickness 28 mm, center bore 61 mm, 5 bolt holes.
```

Expected flow:

```text
text prompt
  -> intent recognition
  -> optional search/research
  -> engineering decomposition
  -> operation plan
  -> SolidWorks macro preview
  -> static validation
  -> approval
  -> target CAD execution/export
```

### 2. Search + Macro

Example:

```text
How do I make a brake disc? Build me one.
```

Expected flow:

```text
prompt
  -> search agent finds/understands object structure
  -> planner extracts CAD construction steps
  -> macro/code generation
  -> validation and approval
```

The first implemented scenario is an offline brake-disc research packet. It does
not call live search yet.

### 3. Image/Sketch To CAD

Target future flow:

```text
image/sketch
  -> GenCAD adapter
  -> CAD command sequence
  -> ORYND operation plan
  -> validator
  -> macro/API preview
  -> target CAD
```

GenCAD is treated as an external image-conditioned CAD command sequence model.
It is not bundled in the base installer.

### 4. Mesh/STL/OBJ To Editable Plan

Target future flow:

```text
STL/OBJ/search-import
  -> ORYND AI Model 4
  -> mesh decomposition/features
  -> CoreOps
  -> operation plan
  -> macro/API preview
```

The current prototype supports a limited AI Model 4/CoreOps primitive adapter.
Supported smoke path:

- axis-aligned box;
- Z-axis cylinder;
- sketch/rectangle/circle/extrude/export conversion.

### 5. Assembly And Iterative CAD Work

Longer-term target:

```text
find/import model
  -> decompose into usable parts
  -> generate or modify missing components
  -> add mates/constraints
  -> export STEP/drawings
```

This is not production-ready in the current prototype.

## Runtime MVP

The owner correctly challenged the idea that a huge command list is enough:

> "mechagetn созадет свое ... с помощью 70 команд? понятно что там ключевыз 5"

The first real SolidWorks proof should focus on a small command set that works
smoothly:

- create part;
- create/select sketch on Top/Front/Right plane;
- draw circle, rectangle, line;
- extrude boss;
- extrude cut/hole;
- repeat bolt holes explicitly or with a verified circular pattern;
- apply basic fillet/chamfer;
- export STEP.

The expanded SolidWorks command language is useful for planning, but most of it
is not runtime-verified yet.

## Current Status

This is a working offline prototype, not a production SolidWorks extension.

Implemented:

- constrained operation plan schema;
- allowed command catalog;
- static plan/macro validator;
- deterministic examples:
  - brake disc;
  - spur gear;
  - F1 front wing;
  - mounting bracket;
- SolidWorks VBA-style macro preview generator;
- brake-disc scenario:
  - intent;
  - offline research packet;
  - decomposition;
  - operation plan;
  - macro;
  - validation;
- local CLI;
- local companion HTTP API;
- stdio MCP server;
- local account/trial/model-key settings contract;
- masked Supabase config readiness;
- Supabase REST adapter scaffold;
- GenCAD readiness/run scaffold;
- ORYND AI Model 4/CoreOps supported-primitive adapter;
- SolidWorks C# add-in scaffold with right-side Task Pane;
- SolidWorks runtime coverage checklist;
- UI/chat implementation prompts;
- E2E QA report.

Verified offline:

```bash
.venv/bin/python -m pytest integrations/external_cad_extension/tests -q
```

Latest verified result:

```text
69 passed
```

## What Is Not Ready Yet

Not production-ready:

- real SolidWorks runtime execution;
- verified macro execution inside SolidWorks;
- C# add-in compile/load on Windows with SolidWorks;
- installer/MSI/MSIX/marketplace publishing;
- real Supabase auth/session/payment integration;
- Claude/OpenAI/Opus planner implementation;
- local Ollama planner test with a running model;
- live search;
- GenCAD output to operation-plan conversion;
- full mesh/freeform/assembly decomposition;
- robust approval/run gate inside the Task Pane;
- full SolidWorks command library.

Known placeholder/runtime-risk areas:

- `ORYND_Revolve` is placeholder only;
- `ORYND_Pattern` is declaration only;
- `ORYND_Mate` is declaration only;
- fillet/chamfer selection needs runtime proof;
- macro helpers are static-valid but not SolidWorks-runtime-verified.

## Quick Start

From ORYND workspace root:

```bash
.venv/bin/python -m pytest integrations/external_cad_extension/tests -q
```

Generate a brake-disc demo:

```bash
.venv/bin/python -m integrations.external_cad_extension.cli --example brake_disc
```

Run full offline brake-disc scenario:

```bash
.venv/bin/python -m integrations.external_cad_extension.cli \
  --scenario brake_disc \
  --prompt "Я хочу тормозной диск 280 мм с 5 отверстиями" \
  --out-dir /private/tmp/orynd_cad_bridge_e2e
```

Start local companion API/UI:

```bash
.venv/bin/python -m integrations.external_cad_extension.web_app
```

Default URL:

```text
http://127.0.0.1:8765
```

Check GenCAD readiness:

```bash
.venv/bin/python -m integrations.external_cad_extension.cli gencad-status
```

Check Supabase readiness:

```bash
.venv/bin/python -m integrations.external_cad_extension.cli supabase-status
```

Show runtime MVP:

```bash
.venv/bin/python -m integrations.external_cad_extension.cli runtime-mvp --format markdown
```

## CLI Examples

Generate deterministic examples:

```bash
.venv/bin/python -m integrations.external_cad_extension.cli --example brake_disc
.venv/bin/python -m integrations.external_cad_extension.cli --example spur_gear
.venv/bin/python -m integrations.external_cad_extension.cli --example f1_front_wing
.venv/bin/python -m integrations.external_cad_extension.cli --example mounting_bracket
```

Use optional Ollama planner if a local Ollama server is running:

```bash
.venv/bin/python -m integrations.external_cad_extension.cli \
  --planner ollama \
  --ollama-url http://localhost:11434 \
  --ollama-model llama3.2:3b \
  --prompt "Create a 160 x 38 x 6 mm mounting bracket with two M4 holes"
```

Use hosted BYO-key planner routes:

```bash
export ANTHROPIC_API_KEY="..."
.venv/bin/python -m integrations.external_cad_extension.cli \
  --planner anthropic \
  --hosted-model claude-opus-4-1-20250805 \
  --prompt "Create a 160 x 38 x 6 mm mounting bracket with two M4 holes"
```

```bash
export OPENAI_API_KEY="..."
.venv/bin/python -m integrations.external_cad_extension.cli \
  --planner openai \
  --hosted-model gpt-5.2 \
  --prompt "Create a 160 x 38 x 6 mm mounting bracket with two M4 holes"
```

Hosted planners must still return `OperationPlan` JSON and pass the normal
validator before any macro preview is considered usable.

Convert supported AI Model 4 primitives:

```bash
.venv/bin/python -m integrations.external_cad_extension.cli ai4-primitives \
  --input-json /path/to/primitives.json \
  --name ai4_part
```

## MCP

Run the stdio MCP server:

```bash
.venv/bin/python -m integrations.external_cad_extension.mcp_server
```

Implemented tools:

- `list_catalog`
- `run_scenario`
- `generate_macro`
- `validate_macro`
- `entitlement`
- `settings_show`
- `supabase_status`
- `supabase_check`
- `solidworks_coverage`
- `solidworks_language`
- `object_recipes`
- `runtime_mvp`
- `gencad_status`
- `ai4_primitives_to_plan`

Important: this MCP server generates/validates CAD artifacts. It does not yet
control SolidWorks runtime directly.

## SolidWorks Add-in Scaffold

Windows/SolidWorks-side files:

```text
integrations/external_cad_extension/solidworks_addin/
```

Intended flow:

```text
Build C# add-in DLL
  -> register COM add-in
  -> open SolidWorks
  -> enable ORYND CAD Bridge
  -> right-side Task Pane calls local bridge
  -> preview generated plan/macro
```

Current add-in behavior:

- creates a right-side Task Pane;
- accepts a prompt;
- calls `http://127.0.0.1:8765/api/generate`;
- displays preview text/JSON.

Not implemented in the add-in yet:

- direct execution in SolidWorks;
- approval/run gate;
- robust state timeline;
- packaged installer;
- verified compile/load on a Windows SolidWorks machine.

## Model And Server Strategy

Base installer should stay lightweight.

Do not bundle heavy models in the default install. Support optional backends:

- local lightweight mode;
- server mode on AWS/GPU machine;
- lazy downloadable model packs;
- BYO API key mode;
- external Claude/Codex-like agent through MCP if feasible.

For GenCAD and ORYND AI Model 4:

- prefer server-side inference or optional lazy download;
- cache results;
- keep them behind adapter interfaces;
- do not block the MVP if the model pack is 1.5GB+.

## Auth, Trial, And Subscription Direction

The target product should use existing ORYND/Supabase auth, not a separate fake
auth system.

Desired flow:

```text
sign up / sign in
  -> trial starts
  -> user runs CAD tasks
  -> subscription expires or trial ends
  -> settings/account sends user to checkout
  -> successful payment unlocks subscription
```

Current implementation is only a local state contract plus Supabase readiness
helpers. Real server-side enforcement and payment callbacks are not done.

## Security Rules

- Generated code must be constrained to allowed CAD operations.
- No arbitrary shell.
- No network calls in generated macro.
- No hidden execution.
- No file delete.
- Show assumptions and generated code before run.
- Require explicit user approval before CAD execution.
- Mask API keys and Supabase secrets in status outputs.

## Important Docs

- `IMPLEMENTATION_PLAN.md`
- `PRODUCT_FOUNDATION.md`
- `STATUS_AND_GAPS.md`
- `E2E_QA_REPORT_2026-06-19.md`
- `SCENARIO_ORCHESTRATION_MAP.md`
- `UI_AND_CHAT_IMPLEMENTATION_PROMPTS.md`
- `SOLIDWORKS_ADDIN_UI_PLAN.md`
- `WINDOWS_ADDIN_BUILD_AND_TEST_GUIDE.md`
- `SOLIDWORKS_FORMATS.md`
- `MCP.md`
- `DEPTH_AUDIT.md`

Original owner source:

- `Supernova plan/00_raw/01_original_message_main.txt`
- `Supernova plan/00_raw/02_original_message_solidworks_extension.txt`

## Honest Demo Claim

Safe to claim today:

```text
Offline CAD-bridge prototype:
prompt/example -> operation plan -> macro preview -> static validation.
```

Do not claim yet:

```text
Fully runtime-verified SolidWorks extension.
Any image to editable CAD.
Any mesh to clean STEP.
Full SolidWorks command coverage.
Production auth/payment/installer ready.
```

## Next Build Order

1. Make one real SolidWorks runtime path work:
   `mounting bracket -> macro -> SolidWorks creates part -> STEP export`.
2. Disable placeholder operations from runtime MVP macro output until verified.
3. Implement approval/run gate in Task Pane and companion UI.
4. Build and test C# add-in on Windows with SolidWorks installed.
5. Fix Supabase env and wire existing ORYND auth/session.
6. Implement one real model route:
   Claude/OpenAI BYO key or local Ollama planner.
7. Add validator repair loop.
8. Implement live search adapter.
9. Install GenCAD externally and convert its output to `OperationPlan`.
10. Expand AI Model 4 primitive/freeform mappings after runtime MVP is stable.
