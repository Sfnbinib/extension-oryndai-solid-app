# ORYND CAD Bridge E2E QA Report

Date: 2026-06-19

This report verifies what exists in code, what runs offline, and what is still
only scaffolded. It should be read as a product-readiness check, not a marketing
summary.

## Verdict

The project is not production-ready yet.

It is a working offline CAD-bridge prototype:

- prompt/example can generate a constrained operation plan;
- the plan can emit a SolidWorks VBA-style macro preview;
- static validation works;
- four deterministic examples generate artifacts;
- brake-disc scenario runs through offline research/decomposition/plan/macro/validation;
- local HTTP companion API works;
- stdio MCP server tools are callable;
- AI Model 4 supported primitives can convert to operation plan/macro;
- SolidWorks Task Pane add-in scaffold exists.

It is not yet:

- a runtime-verified SolidWorks extension;
- a real in-CAD execution system;
- a live search agent;
- a working GenCAD image-to-CAD path;
- a full mesh/freeform decomposition product;
- a real Supabase-authenticated/billed product;
- a packaged installer/release ready for customers.

## Verified Offline E2E

Test command:

```bash
.venv/bin/python -m pytest integrations/external_cad_extension/tests -q
```

Result:

```text
69 passed
```

Generated deterministic examples into `/private/tmp/orynd_cad_bridge_e2e`:

```bash
.venv/bin/python -m integrations.external_cad_extension.cli --example brake_disc --out-dir /private/tmp/orynd_cad_bridge_e2e
.venv/bin/python -m integrations.external_cad_extension.cli --example spur_gear --out-dir /private/tmp/orynd_cad_bridge_e2e
.venv/bin/python -m integrations.external_cad_extension.cli --example f1_front_wing --out-dir /private/tmp/orynd_cad_bridge_e2e
.venv/bin/python -m integrations.external_cad_extension.cli --example mounting_bracket --out-dir /private/tmp/orynd_cad_bridge_e2e
```

Result:

```text
ok: True
```

Each example wrote:

- `*.operation_plan.json`
- `*.solidworks.bas`
- `*.validation.json`
- `*.preview.md`

Brake-disc scenario trace:

```bash
.venv/bin/python -m integrations.external_cad_extension.cli --scenario brake_disc --prompt "Я хочу тормозной диск диаметром 280 мм с суппортом, 5 отверстий, STEP export" --out-dir /private/tmp/orynd_cad_bridge_e2e
```

Result:

```text
ok: True
scenario_json: /private/tmp/orynd_cad_bridge_e2e/brake_disc.scenario.json
scenario_markdown: /private/tmp/orynd_cad_bridge_e2e/brake_disc.scenario.md
```

## Current Working Chain

The strongest working chain is:

```text
prompt/example
  -> deterministic planner or brake-disc offline scenario
  -> OperationPlan JSON
  -> SolidWorks VBA macro preview
  -> static validator
  -> files/preview/API/MCP response
```

Main files:

- `cli.py`
- `generator.py`
- `examples.py`
- `orchestrator.py`
- `research.py`
- `decomposition.py`
- `schema.py`
- `catalog.py`
- `solidworks_vba.py`
- `validator.py`
- `preview.py`

## HTTP Companion API

The companion server starts when allowed to bind localhost:

```bash
.venv/bin/python -m integrations.external_cad_extension.web_app
```

Verified endpoints:

```text
GET  /api/entitlement
POST /api/generate
POST /api/scenario
GET  /api/gencad/status
```

Findings:

- `/api/generate` returns operation plan, macro code, validation, and preview.
- `/api/scenario` returns offline research/decomposition/plan/macro trace.
- `/api/entitlement` currently reports no signed-in user and no subscription/trial by default.
- This is a local prototype UI/API, not a packaged app.

## MCP

The stdio MCP server is implemented and callable directly through
`handle_request`.

Verified:

- `tools/list`
- `tools/call` with `run_scenario`

Available tools include:

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

Important limitation:

This MCP server generates and validates CAD artifacts. It does not directly
control SolidWorks runtime.

## SolidWorks Add-in

Files exist:

- `solidworks_addin/ORYNDCadBridgeAddin/SwAddin.cs`
- `solidworks_addin/ORYNDCadBridgeAddin/CadBridgeTaskPaneControl.cs`
- `solidworks_addin/ORYNDCadBridgeAddin/BridgeClient.cs`
- `solidworks_addin/ORYNDCadBridgeAddin/ORYNDCadBridgeAddin.csproj`

Current behavior by code:

```text
SolidWorks add-in
  -> creates right-side Task Pane
  -> user enters prompt
  -> calls local bridge http://127.0.0.1:8765/api/generate
  -> shows preview JSON/text
```

Not verified:

- compile against real SolidWorks interop assemblies;
- COM registration on Windows;
- add-in loading in SolidWorks;
- macro execution;
- model creation in a real SolidWorks document;
- STEP export from actual SolidWorks.

Build environment finding:

```text
dotnet: command not found
```

On this machine, the C# add-in cannot be built.

## SolidWorks Macro Runtime Risk

`solidworks_vba.py` emits a macro with helper wrappers.

Static validation passes, but runtime is not proven. Known weak/placeholder
helpers:

- `ORYND_Revolve`: placeholder only.
- `ORYND_Pattern`: declaration only; no actual feature pattern.
- `ORYND_Mate`: declaration only; no assembly mate execution.
- `ORYND_Fillet` / `ORYND_Chamfer`: weak selection strategy.
- `ORYND_Hole`: improved but still needs SolidWorks runtime proof.

The generated brake-disc macro also contains both explicit bolt holes and a
placeholder pattern declaration. For first runtime MVP, explicit repeated holes
should be used and the placeholder pattern should not be marketed as working.

## Search / Research

Current state:

- Brake disc has an offline research packet.
- It creates search queries, extracted facts, CAD implications, missing inputs.
- It does not call live web search.

Unknown/general prompts fail in deterministic mode:

```bash
.venv/bin/python -m integrations.external_cad_extension.cli --prompt "создай корпус болида formula 1 2018 с колесами и подвеской"
```

Result:

```text
ValueError: No deterministic template matched.
```

Implication:

The system does not yet handle arbitrary user requests without an LLM planner
or additional deterministic scenario recipes.

## GenCAD Path

Command:

```bash
.venv/bin/python -m integrations.external_cad_extension.cli gencad-status
```

Result:

```json
{
  "available": false,
  "repo_exists": false,
  "message": "GenCAD repo is not installed. Clone/download it separately; do not bundle it in the base extension."
}
```

Code limitation:

`convert_gencad_output_to_operation_plan` raises `NotImplementedError`.

Implication:

The GenCAD path is currently a readiness/run scaffold only:

```text
image/sketch -> GenCAD adapter -> CAD command sequence -> OperationPlan
```

is architecturally planned, but not implemented end to end.

## ORYND AI Model 4 Path

Supported primitive smoke test:

```bash
.venv/bin/python -m integrations.external_cad_extension.cli ai4-primitives --input-json /private/tmp/orynd_cad_bridge_e2e/ai4_supported.json --name qa_ai4_supported --out-dir /private/tmp/orynd_cad_bridge_e2e
```

Result:

```json
"ok": true
"validation": {"ok": true, "errors": [], "warnings": []}
```

Supported:

- axis-aligned box;
- Z-axis cylinder;
- CoreOps sketch/circle/rectangle/extrude/cut-hole/fillet/chamfer mappings.

Limitations:

- Boolean union is represented implicitly, not as a real runtime operation.
- Non-axis-aligned box is skipped.
- Non-Z-axis cylinder is skipped.
- Full mesh/freeform decomposition depends on existing `orynd_core` pipeline and is not production-covered here.

## Local Model / Opus / BYO Key

Ollama check:

```bash
curl -sS http://127.0.0.1:11434/api/tags
```

Result:

```text
Couldn't connect to server
```

Current state:

- CLI has `--planner ollama`.
- Settings can store provider/API key or env-var reference.
- Claude/OpenAI/BYO key planner adapters are not implemented.
- Opus via MCP is not implemented here.
- Model routing is a contract/UI/settings layer, not a working production router.

## Supabase / Auth / Subscription

Command:

```bash
.venv/bin/python -m integrations.external_cad_extension.cli supabase-status
```

Current finding:

```text
has_client_config: false
has_backend_config: false
valid_url: false
supabase_url: https:https://dblquhnokgpavubobfoj.supabase.co
valid_publishable_key: true
valid_secret_key: false
```

Issues:

- URL is malformed: `https:https://...`
- backend secret key is missing or placeholder.
- local account system in `settings.py` explicitly says it does not authenticate with Supabase yet.
- Supabase REST adapter exists, but real auth/session/payment flow is not wired.

## Product Readiness Matrix

| Area | QA status |
| --- | --- |
| Operation schema/catalog | Works offline |
| Static validator | Works offline |
| Four deterministic examples | Works offline |
| Brake-disc scenario trace | Works offline |
| Companion HTTP API | Works locally |
| MCP server | Works locally |
| AI4 supported primitives | Works offline |
| Arbitrary prompt planning | Not ready |
| Live search/research | Not implemented |
| GenCAD image path | Not implemented end to end |
| Full mesh/freeform path | Partial only |
| SolidWorks add-in | Scaffold only |
| SolidWorks macro runtime | Not verified |
| Direct CAD execution | Not implemented |
| Approval/run gate | Planned, not complete |
| Supabase auth/subscription | Not wired |
| Claude/OpenAI/Opus routing | Not implemented |
| Installer/publish | Not ready |

## Highest-Priority Fixes

1. Make one real SolidWorks runtime path work first:
   `mounting bracket -> macro -> SolidWorks creates part -> STEP export`.
2. Remove or disable placeholder operations in runtime MVP macros:
   `pattern`, `revolve`, `mate` should not appear as executable until implemented.
3. Implement explicit approval/run gate in Task Pane/companion.
4. Build and test C# add-in on Windows with SolidWorks installed.
5. Fix Supabase env and wire existing ORYND Supabase auth/session.
6. Implement one real model route:
   either local Ollama planner or Claude/OpenAI planner that returns strict OperationPlan JSON.
7. Add plan repair loop after validator errors.
8. Implement live search adapter or clearly label research as offline.
9. Install external GenCAD separately and implement output artifact -> OperationPlan conversion.
10. Expand AI Model 4 mapping only after supported primitives are stable.

## What Can Be Shown Today

Safe demo:

```text
Prompt/example -> operation plan -> macro preview -> static validation -> preview artifacts
```

Do not claim today:

```text
"Runs smoothly inside SolidWorks"
"Converts any image to editable CAD"
"Finds/decomposes any model"
"Supports full SolidWorks command surface"
"Production Supabase login/subscription is ready"
```
