# ORYND External CAD Extension - Implementation Plan

Working names:

- ORYND External CAD Extension
- ORYND CAD Bridge

`Supernova plan/` is only the planning folder. It is not the product or extension name.

## MVP Goal

Build a standalone, offline-validatable prototype that turns an engineering request into:

1. a constrained CAD operation plan;
2. a human-readable macro preview;
3. generated SolidWorks VBA-style macro code;
4. a static validation report;
5. saved artifacts for review or later execution in a target CAD environment.

SolidWorks is not required for this first pass. The prototype must validate generated files offline.

## Architecture

```text
text/research -> CAD planner -> operation plan
image/sketch -> GenCAD adapter -> CAD command sequence -> operation plan
STL/OBJ/search-import -> mesh decomposition/features -> CoreOps adapter -> operation plan

operation plan -> validator -> macro/code -> preview -> user approval -> target CAD
```

All paths converge through the same operation plan. That keeps macro generation, validation, preview, logging, and target execution consistent.

## Components In This Prototype

- `schema.py` - JSON-like operation-plan structures and structural checks.
- `catalog.py` - allowed commands, argument specs, safety restrictions, target macro mapping.
- `examples.py` - deterministic demo examples: brake disc, spur gear, F1 front wing, mounting bracket.
- `generator.py` - deterministic planner with future model-adapter seam.
- `solidworks_vba.py` - SolidWorks VBA-style macro emitter using constrained helper calls.
- `preview.py` - markdown preview for steps, assumptions, warnings, and code.
- `validator.py` - static safety checker for plan and macro text.
- `cli.py` - offline command entrypoint.
- `tests/` - unit and golden tests.

## Model Routing Plan

The base extension must not ship heavy model weights. It must work in minimal macro-generation mode with deterministic templates and an optional remote/local model adapter.

Supported future backends:

- BYO Claude/OpenAI key mode for strong planning and image understanding.
- Local lightweight mode for cheap simple requests.
- Server mode on AWS for heavier orchestration and model inference.
- Lazy downloadable model packs for advanced local use.
- External Claude/Codex via MCP if feasible and user-controlled.

GenCAD-like path:

- Treat GenCAD as a separate image-conditioned CAD command sequence model.
- Wrap it behind `GenCADAdapter`.
- Convert its output into this operation plan format.
- Do not bundle Docker/conda/checkpoints/pythonocc-core in the base installer.

ORYND AI Model 4 path:

- Treat ORYND AI Model 4 as mesh/STL/OBJ -> decomposition/features -> CoreOps.
- Wrap it behind `MeshCoreOpsAdapter`.
- Convert CoreOps/features into this operation plan format.
- Prefer server-side inference or lazy model download if model artifacts are 1.5GB+.

## Security Rules

- Generated macro/code is constrained to catalog commands.
- No arbitrary shell, network, registry access, file delete, or hidden execution.
- Export is allowed only through explicit `export` operations.
- Preview shows assumptions and generated code before execution.
- Execution in CAD requires explicit user approval in a later UI/add-in.

## Current Session Acceptance

- Four examples generate operation plans, macros, validation reports, and markdown previews.
- Static validators pass.
- Tests pass without SolidWorks.
- No ORYND Electron UI files are modified.

