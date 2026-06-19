# ORYND CAD Bridge Depth Audit

This is a hard audit of how deeply the current prototype covers the original
product intent.

Scale:

```text
0 = not started
1 = concept/document only
2 = scaffold/interface
3 = offline prototype works
4 = integrated but not production-verified
5 = production/runtime verified
```

## Summary

The prototype is useful, but it is not yet the full system described in the
original vision.

Strongest areas:

- operation-plan schema;
- deterministic examples;
- static validation;
- standalone GitHub package;
- SolidWorks add-in/Task Pane scaffold;
- update/release scaffolding.
- explicit runtime MVP focus for the first smooth SolidWorks demo.

Weakest areas:

- full SolidWorks command/API coverage;
- runtime-verified SolidWorks execution;
- real model planning with Opus/Gemini/local models;
- live search/research;
- GenCAD image-to-CAD integration;
- AI Model 4 mesh/freeform integration;
- assembly/object-edit workflows.

## Detailed Audit

| Area | Depth | Current evidence | Honest gap |
| --- | ---: | --- | --- |
| Product shape | 4 | `PRODUCT_FOUNDATION.md`, `SOLIDWORKS_ADDIN_UI_PLAN.md`, Task Pane scaffold | Correct architecture is defined, but not runtime-proven in SolidWorks. |
| Windows SolidWorks add-in | 2 | `solidworks_addin/`, `SwAddin.cs`, `CadBridgeTaskPaneControl.cs` | Scaffold only. Not compiled, registered, or opened in SolidWorks. |
| Mac support | 3 | `MAC_AND_WINDOWS_INSTALLATION.md` | Clarified: native Mac is companion-only; real SolidWorks add-in needs Windows/Parallels. |
| Operation schema | 3 | `schema.py`, tests | Good MVP schema. Needs richer assembly, selection, references, constraints, drawings, materials. |
| Command catalog | 2 | `catalog.py` has 12 operations | This is not the full SolidWorks command language. It is a small allowlist. |
| Planner command language | 3 | `solidworks_command_language.py` has expanded planner-facing command map | Not all commands are executable yet; it is a language pack with runtime statuses. |
| Full SolidWorks API inventory | 2 | `tools/solidworks_api_inventory/` | Extractor scaffold exists, but has not run against installed SolidWorks interop assemblies. |
| Macro emitter | 2 | `solidworks_vba.py` | Emits preview `.bas`; several helpers are placeholders or weak. |
| SolidWorks runtime coverage | 2 | `solidworks_coverage.py`, `out/solidworks_runtime_checklist.md` | Checklist exists, but no command is runtime-verified. |
| Static validator | 3 | `validator.py`, unsafe token checks, tests | Good static gate. Needs semantic selection/reference validation and execution sandbox policy. |
| Brake disc scenario | 3 | `orchestrator.py`, generated artifacts | Works offline. Geometry is simplified; no SolidWorks runtime proof. |
| Spur gear example | 2 | `examples.py` | Macro preview only; no involute tooth geometry/runtime feature tree. |
| F1 front wing example | 2 | `examples.py` | Simplified geometry. Not enough for real aerodynamic wing assemblies. |
| Mounting bracket example | 3 | `examples.py` | Simple part likely closest to runtime feasibility, but still unverified. |
| Object understanding / decomposition | 2 | `decomposition.py`, `research.py` | Deterministic/offline. Not a real agent chain. |
| Live search agent | 1 | Docs/runtime events mention it | Not implemented. No real web/model/source pipeline in extension. |
| GenCAD path | 2 | `gencad_adapter.py`, docs | Readiness/run scaffold only. No repo/checkpoints installed; no output -> operation-plan converter. |
| ORYND AI Model 4 path | 2-3 | `ai_model_4_adapter.py`, standalone fallback | Supports primitive/CoreOps subset. Mesh/freeform/Boolean/assembly not complete. |
| BYO model routing | 1-2 | settings/env docs, model key fields | API key storage/status exists. No real Claude/OpenAI/Gemini planner adapter yet. |
| MCP | 3 | `mcp_server.py`, tests | Local stdio tools work. Not registered/tested in a client in the release repo. |
| Existing ORYND auth reuse | 2 | `EXISTING_ORYND_AUTH_INTEGRATION.md`, env aliases | Correct direction documented. Not wired into CAD Task Pane/bridge session yet. |
| Supabase tables/logging | 2 | migration proposal, REST client | CAD-specific schema is not merged/applied to canonical ORYND project. |
| Packaging/update | 2-3 | GitHub repo, manifest, update-check CLI | Source published. No Windows installer, no updater UI, no signed artifacts. |
| UI/design | 2 | Task Pane scaffold, `ui/companion_preview.html`, `RUNTIME_EVENTS.md` | Looks/prototype only. Needs actual SolidWorks pane design and stateful rendering. |
| Website marketing ideas | 1 | `PRODUCT_FOUNDATION.md` notes | Not implemented in site. Needs separate site work. |

## SolidWorks Command Coverage Audit

Current catalog:

```text
sketch, circle, rectangle, extrude, revolve, cut, hole, pattern, fillet, chamfer, mate, export
```

This is not enough for the original goal.

Expanded planner language:

```text
solidworks_command_language.py
```

This now covers document, selection, sketch geometry, sketch edit, relations,
dimensions, solid features, holes, patterns, surfaces, assemblies, drawings,
exports, properties, and analysis. It is planner-facing, not all executable.

Missing major groups:

- document lifecycle: new part, new assembly, open, save, rebuild, units;
- selection: select face, edge, vertex, feature, body, component;
- references: planes, axes, coordinate systems, named points;
- sketch geometry: line, arc, spline, ellipse, polygon, slot, text, trim, offset, convert entities;
- sketch relations: coincident, concentric, tangent, horizontal, vertical, equal, symmetry;
- dimensions: linear, angular, radial, diameter, equations, driven/driving dimensions;
- solid features: sweep, loft, shell, draft, rib, mirror, combine, split, move/copy body;
- advanced holes: Hole Wizard, countersink/counterbore, threaded holes;
- patterns: real linear/circular feature patterns, curve-driven patterns, component patterns;
- surfaces: boundary, loft, fill, knit, thicken, trim;
- sheet metal: base flange, bends, unfold/fold;
- weldments/structures;
- assemblies: insert component, mate creation, mate edit, component transform, fix/float;
- drawings: create drawing, views, dimensions, annotations, BOM, export PDF/DWG;
- import/export: STEP, Parasolid, IGES, STL, OBJ, DXF/DWG, drawings;
- materials/appearance/custom properties;
- measurements/mass properties/interference checks.

## Current Macro Helper Truth

| Helper | Status |
| --- | --- |
| `ORYND_CreateSketch` | basic plane sketch only |
| `ORYND_Circle` | likely simple sketch circle |
| `ORYND_Rectangle` | likely simple rectangle |
| `ORYND_Extrude` | static-valid, runtime unknown |
| `ORYND_Revolve` | placeholder |
| `ORYND_Cut` | static-valid, runtime unknown |
| `ORYND_Hole` | weak face selection |
| `ORYND_Pattern` | placeholder |
| `ORYND_Fillet` | weak selection strategy |
| `ORYND_Chamfer` | weak selection strategy |
| `ORYND_Mate` | declaration only |
| `ORYND_Export` | simple SaveAs3, runtime unknown |

## What Opus Needs But Does Not Have Yet

For Opus/Gemini/local models to reliably build objects, it needs more than a
short command list. It needs a constrained "CAD language pack":

1. allowed operation schema;
2. examples for each operation;
3. selection/reference rules;
4. feature dependency rules;
5. common object recipes;
6. repair rules when validation fails;
7. target-specific emitter mapping;
8. runtime feedback from SolidWorks.

Current prototype has only items 1, part of 2, and part of 7.

Update: the prototype now has a broader planner-facing language pack and common
object recipes, but still lacks runtime mappings and repair feedback for most
commands.

## Required Deepening Order

### Phase 1 - SolidWorks Runtime Minimum

Goal: make simple parts actually appear in SolidWorks.

- Build add-in on Windows.
- Register and open Task Pane.
- Runtime-test `sketch`, `circle`, `rectangle`, `extrude`, `cut`, `export`.
- Fix macro helper calls until mounting bracket and brake disc basic body work.

Exit criteria:

```text
mounting_bracket.solidworks.bas creates a part and exports STEP in real SolidWorks
brake_disc.solidworks.bas creates a recognisable rotor and exports STEP
```

### Phase 2 - Real Command Expansion

Goal: give the model enough language to build non-trivial objects.

- Run `tools/solidworks_api_inventory` on Windows.
- Extract interop methods/enums.
- Map raw API into safe operation groups.
- Add commands for:
  - line/arc/spline/slot;
  - dimensions/relations;
  - plane/axis;
  - sweep/loft/shell/mirror;
  - real pattern;
  - Hole Wizard subset;
  - material/custom props;
  - drawing view/export.

Exit criteria:

```text
catalog has 40-80 safe commands with docs/tests
each command has emitter mapping or explicit unsupported runtime status
```

### Phase 3 - Agent Planning

Goal: turn prompts into valid plans, not templates.

- Implement Claude/OpenAI/Gemini planner adapter.
- Force JSON operation-plan output.
- Add validation repair loop.
- Add "ask clarifying question" mechanism for ambiguous objects.
- Add object recipes:
  - brake disc;
  - spur gear;
  - F1 front wing;
  - mounting bracket;
  - engine assembly/import workflow;
  - wheel/rim;
  - chassis/body shell.

Exit criteria:

```text
model produces valid plans for new variants without hand-coded example selection
```

### Phase 4 - Search / GenCAD / AI Model 4

Goal: combine paths instead of relying only on macro generation.

- Live search agent with source cards.
- Model finder/import path.
- GenCAD install/run/output parser.
- AI Model 4 real mesh/freeform decomposition.
- Converge all into operation plan or imported STEP workflow.

Exit criteria:

```text
prompt can choose: generate from scratch, search/import, image-to-CAD, mesh decomposition
```

### Phase 5 - Product Packaging

Goal: owner can install/update/test fast.

- Build Windows installer.
- Add signed release manifest.
- Add updater UI.
- Add Mac companion package.
- Document Parallels/SolidWorks test flow.

Exit criteria:

```text
download from GitHub release -> install -> SolidWorks Task Pane opens -> update-check works
```

## Bottom Line

The current repo is a good foundation, but it is not yet the full "AI CAD
agent that can build arbitrary engineering objects" system.

The highest-risk missing piece is not UI. It is:

```text
fuller SolidWorks command language + runtime-verified execution + model planner repair loop
```

After the MecAgent comparison, the first execution target is deliberately
smaller:

```text
create part -> sketch -> circle/rectangle/line -> extrude -> cut -> repeat/pattern -> fillet/chamfer -> export STEP
```

These few commands must feel smooth before broader command coverage matters.
