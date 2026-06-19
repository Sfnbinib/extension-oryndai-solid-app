# ORYND CAD Bridge

SolidWorks-focused external CAD extension prototype.

Working names:

- ORYND CAD Bridge
- ORYND External CAD Extension

Final product name is TBD. `Supernova plan` is not the product name; it was the
planning folder used in the original ORYND workspace.

## Concept

The product idea is a lightweight CAD copilot that connects a strong model,
search/research, image/mesh adapters, and a constrained SolidWorks command/macro
layer.

Target flow:

```text
user prompt / image / mesh / reference
  -> understand the engineering intent
  -> optionally search/research
  -> build a CAD operation plan
  -> generate macro/API code
  -> show preview, assumptions, and warnings
  -> validate safety
  -> require user approval
  -> run/export in target CAD
```

The intended product shape is:

```text
SolidWorks Add-in + right-side Task Pane + local bridge + ORYND backend/model routes
```

The local web UI is only a development preview and fallback companion.

## What This Repo Contains

Main module:

```text
integrations/external_cad_extension/
```

Included:

- constrained CAD operation schema;
- command catalog and static validator;
- deterministic demo generation for:
  - brake disc;
  - spur gear;
  - F1 front wing;
  - mounting bracket;
- SolidWorks VBA-style macro generator;
- macro preview renderer;
- local CLI;
- local companion HTTP API/UI;
- stdio MCP server;
- GenCAD adapter scaffold;
- ORYND AI Model 4/CoreOps supported-primitive adapter;
- SolidWorks C# add-in scaffold with right-side Task Pane control;
- Windows-only SolidWorks API inventory extractor scaffold;
- release/update manifest helpers;
- UI/chat implementation prompts;
- E2E QA readiness report.

Detailed module README:

```text
integrations/external_cad_extension/README.md
```

## Current Status

This is a working offline prototype, not a production SolidWorks extension.

Verified offline:

```bash
python -m pytest integrations/external_cad_extension/tests -q
```

Latest verified result in ORYND workspace:

```text
69 passed
```

Working offline chain:

```text
prompt/example
  -> deterministic planner or brake-disc offline scenario
  -> OperationPlan JSON
  -> SolidWorks VBA macro preview
  -> static validator
  -> files/preview/API/MCP response
```

Not ready yet:

- runtime-verified SolidWorks execution;
- packaged Windows installer;
- production Supabase auth/payment;
- Claude/OpenAI/Opus planner implementation;
- live search;
- GenCAD image-to-operation-plan conversion;
- full mesh/freeform/assembly decomposition;
- full SolidWorks command coverage.

## Quick Smoke Test

From repo root:

```bash
python -m pytest integrations/external_cad_extension/tests -q
python -m integrations.external_cad_extension.cli --example brake_disc
python -m integrations.external_cad_extension.cli --scenario brake_disc --prompt "Я хочу тормозной диск 280 мм с 5 отверстиями"
```

Start local companion:

```bash
python -m integrations.external_cad_extension.web_app
```

Default URL:

```text
http://127.0.0.1:8765
```

Run MCP server:

```bash
python -m integrations.external_cad_extension.mcp_server
```

## SolidWorks Add-in Scaffold

Windows/SolidWorks files:

```text
integrations/external_cad_extension/solidworks_addin/
```

Current scaffold behavior:

```text
SolidWorks Task Pane
  -> prompt input
  -> local bridge HTTP call
  -> generated operation plan/macro preview
```

It does not yet execute CAD operations inside SolidWorks. Runtime execution must
be verified on Windows with SolidWorks installed.

## Runtime MVP

The first real SolidWorks proof should focus on a small set of reliable actions:

- create part;
- sketch on standard plane;
- draw circle/rectangle/line;
- extrude boss;
- cut/hole;
- repeat bolt holes;
- basic fillet/chamfer;
- export STEP.

The broader planner command language is useful for model reasoning, but most of
it is not runtime-verified yet.

## Model Strategy

Base installer should stay lightweight.

Supported target routes:

- BYO Claude/OpenAI key;
- ORYND server route;
- local model/Ollama;
- external Claude/Codex-like agent through MCP if feasible;
- optional server/lazy-download GenCAD and AI Model 4 services.

Heavy model checkpoints should not be bundled in the base extension.

## Security

- Generated code is constrained by the command catalog.
- No arbitrary shell/network/delete calls in generated macro.
- Static validation runs before preview is considered usable.
- User approval is required before any future CAD execution.
- API keys and Supabase secrets must be masked.

## Important Docs

- `integrations/external_cad_extension/README.md`
- `integrations/external_cad_extension/E2E_QA_REPORT_2026-06-19.md`
- `integrations/external_cad_extension/PRODUCT_FOUNDATION.md`
- `integrations/external_cad_extension/STATUS_AND_GAPS.md`
- `integrations/external_cad_extension/UI_AND_CHAT_IMPLEMENTATION_PROMPTS.md`
- `integrations/external_cad_extension/MCP.md`
- `integrations/external_cad_extension/SOLIDWORKS_ADDIN_UI_PLAN.md`
- `integrations/external_cad_extension/SOLIDWORKS_FORMATS.md`

## Honest Demo Claim

Safe to say today:

```text
Offline CAD-bridge prototype:
prompt/example -> operation plan -> macro preview -> static validation.
```

Do not claim yet:

```text
Fully runtime-verified SolidWorks extension.
Any image to editable CAD.
Any mesh to clean STEP.
Production auth/payment/installer ready.
```
