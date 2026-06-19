# ORYND External CAD Extension - Status And Gaps

This file is the honest comparison between the raw product request and the current prototype.

## Current Status

The current implementation is an offline prototype, not a complete SolidWorks extension.

Implemented:

- constrained operation plan schema;
- command catalog for the required operation categories;
- deterministic planner for four demo examples;
- brake-disc scenario trace: intent -> offline research packet -> engineering decomposition -> operation plan -> macro -> validation;
- SolidWorks VBA-style macro emitter;
- macro preview markdown;
- static plan and macro validator;
- local account/settings/trial/API-key state contract;
- masked Supabase environment readiness and first backend schema migration;
- stdlib Supabase REST adapter for table checks and run logging;
- documented integration with existing ORYND Supabase auth/session flow;
- local stdio MCP server exposing CAD Bridge tools;
- minimal local companion web UI and HTTP API;
- GenCAD external adapter scaffold and readiness checks;
- ORYND AI Model 4/CoreOps adapter for supported primitives;
- SolidWorks COM add-in scaffold for Windows-side extension work;
- Windows-only SolidWorks API inventory extractor scaffold;
- SolidWorks command taxonomy for expanding the allowlist safely;
- SolidWorks runtime coverage matrix/checklist;
- product foundation corrected to SolidWorks Task Pane + local bridge;
- GitHub release/update manifest helpers;
- Mac/Windows installation reality documented;
- CLI artifact generation;
- unit/golden tests;
- generated artifacts for brake disc, spur gear, F1 front wing, and mounting bracket.

Verified offline:

```bash
.venv/bin/python -m pytest integrations/external_cad_extension/tests -q
```

Result:

```text
36 passed
```

Generated validation reports for all four examples have:

```json
{"ok": true, "errors": [], "warnings": []}
```

## What This Is Not Yet

This is not yet:

- a runtime-verified full SolidWorks add-in;
- a packaged `.swp` / installer / publishable extension;
- a packaged graphical companion app;
- a real Supabase-authenticated session/payment integration;
- a verified local-model or Claude/OpenAI-connected planner;
- a live search/research agent;
- a complete GenCAD image-to-operation-plan integration;
- a complete ORYND AI Model 4 mesh/freeform integration;
- a verified SolidWorks macro execution path;
- a complete SolidWorks API command library.

## Raw Request vs Current Prototype

| Requirement from raw/plans | Current status | Notes |
| --- | --- | --- |
| User writes engineering request | Partial | CLI accepts `--prompt`, but only deterministic matching, no real chat UI. |
| Local companion UI | Implemented minimal | Stdlib web UI exposes prompt, scenario trace, macro generation, account, API key, trial, settings. Not packaged. |
| Account login/settings | Needs integration correction | ORYND already has Supabase auth in `orynd_desktop/src/ports/auth.port.ts` and backend `current_user`. CAD Bridge should consume that session, not own a separate auth system. |
| Supabase keys/config | Implemented readiness | `.env` can be read and reported with masked keys through CLI/web/MCP. No raw secret output. |
| Supabase schema | CAD-specific proposal only | `supabase/migrations/001_cad_bridge_core.sql` defines CAD-specific tables. It must be merged with the existing canonical ORYND Supabase schema before applying. |
| Supabase REST adapter | Implemented offline-safe | `supabase_client.py` can check tables and log runs once `.env` is valid and migration is applied. Current local `.env` still has invalid URL/secret. |
| Free trial | Local prototype | CLI can start a local 3-day trial and entitlement gate. No server-side abuse prevention yet. |
| Subscription redirect | Local prototype | Entitlement gate returns checkout URL when access is not allowed. No real payment callback yet. |
| Optional image/sketch input | Planned only | `image_context` field exists; no image parser/model call. |
| Optional search/research | Offline scenario fallback | Brake-disc scenario builds search queries, source summaries, extracted facts, missing inputs, and CAD implications. It does not call live web/search APIs yet. |
| CAD operation plan | Implemented | JSON-serializable plan with mm units, assumptions, warnings. |
| Generate CAD macro/code | Partial | Emits VBA-style `.bas`; helper internals need SolidWorks verification. |
| SolidWorks extension format | Scaffolded | Macro pack/add-in/companion formats are separated in `SOLIDWORKS_FORMATS.md`; Windows-side C# add-in scaffold exists under `solidworks_addin/`. Not compiled/tested in SolidWorks yet. |
| Macro preview | Implemented | Markdown preview with steps, assumptions, warnings, validation, code. |
| User approval before execution | Planned only | Preview exists; no UI/run gate yet. |
| Save/execute in target CAD | Save partial, execute missing | Files are saved; SolidWorks execution not implemented or tested. |
| Validate result/export/open in CAD | Static validation only | No SolidWorks runtime validation. |
| Operation schema with sketch/circle/rectangle/extrude/revolve/cut/hole/pattern/fillet/chamfer/mate/export | Implemented as catalog | Some operations are declarations/placeholders at macro-helper level. |
| Full SolidWorks command file with all tools | Scaffolded extraction | Catalog has required MVP categories; Windows-only `tools/solidworks_api_inventory` can extract raw API inventory from installed SolidWorks interop assemblies. Raw methods still need safe allowlist mappings. |
| SolidWorks runtime coverage | Implemented checklist | `solidworks-coverage` reports which helpers need runtime verification and which are placeholders/weak areas. |
| Deterministic demo examples | Implemented | 4 examples generate artifacts and pass static validation. |
| Brake-disc scenario pipeline | Implemented offline | CLI can write `.scenario.json` and `.scenario.md` with intent, research packet, decomposition, plan, macro, validation. |
| Local model test | Interface only | CLI has optional `--planner ollama`, but no local Ollama server was running during this check. |
| Claude/OpenAI BYO key | Interface planned only | No provider implementation. |
| MCP path | Implemented locally | Stdio MCP server exposes catalog, scenario, macro generation, validation, entitlement, settings, GenCAD status, and AI4 primitive conversion tools. Not packaged or registered in a client yet. |
| GenCAD-like path | Adapter placeholder only | No Docker/conda/checkpoint integration. |
| GenCAD status/run adapter | Implemented scaffold | CLI/MCP can check external GenCAD readiness and run inference if repo/checkpoints exist. Output-to-operation-plan conversion is not implemented yet. |
| ORYND AI Model 4 mesh path | Implemented partial | Existing ORYND AI Model 4/CoreOps pipeline can be converted into external operation plans for supported primitives. Mesh adapter calls the existing pipeline, but full freeform/Boolean/assembly coverage is not complete. Unsupported primitives are reported, not silently accepted. |
| Heavy-model strategy | Documented | Not implemented as installer/download/service. |
| Security constraints | Partial | Static unsafe-token scan and catalog validation exist; needs stronger sandboxing before execution. |
| API key storage | Prototype only | Local JSON can store a key or env-var reference and masks output. Production needs OS keychain/Supabase secrets policy. |
| Extension design/UI | Partial, needs SolidWorks-native direction | Static companion preview exists, but production UI should be SolidWorks CommandManager/task pane/PropertyManagerPage, not a standalone web dashboard. |
| Publish/install format | Not done | Needs target decision: macro pack, companion app, or SolidWorks add-in. |
| GitHub release/update flow | Scaffolded | Release manifest, update-check CLI, and packaging plan exist. No installer build yet. |
| macOS support | Companion only | Native SolidWorks add-in target is Windows. On Mac, test through Windows in Parallels/VM, or run companion/demo tooling only. |

## Key Technical Risks

1. The generated VBA is static-valid but not SolidWorks-runtime-verified.
2. Some helper methods require robust face/feature selection in real SolidWorks documents.
3. Gear teeth and F1 airfoils are simplified; production geometry needs involute/surface generation.
4. The current validator restricts code text, but a real execution product needs a stronger approval and sandbox boundary.
5. Search/image/mesh paths are partly scaffolded, but live web/image/mesh adapters are not working yet.
6. A local LLM may produce invalid plans unless its output is forced through catalog validation and repair.

## Next Build Order

1. Apply Supabase migration to the real project and wire Supabase Auth sessions into the companion UI.
2. Register and test the local MCP server inside Claude Code/Cursor.
3. Build the C# add-in scaffold on Windows with SolidWorks installed.
4. Run the SolidWorks API inventory extractor on Windows and map verified methods into `catalog.py`.
5. Run brake-disc preview from inside SolidWorks against the local companion API.
6. Run and evaluate the optional Ollama planner against a real local model.
7. Add plan repair/retry after validator errors.
8. Decide target package:
   - macro pack first for quickest SolidWorks test;
   - local companion app second;
   - full SolidWorks add-in after macro execution is proven.
7. Test generated `.bas`/macro on a Windows machine with SolidWorks.
8. Replace helper placeholders with runtime-verified SolidWorks API calls.
9. Expand command catalog toward the real SolidWorks command surface.
10. Add optional search adapter.
11. Install/test external GenCAD once on a suitable machine and implement artifact -> operation plan conversion.
12. Expand ORYND AI Model 4 mappings for sphere/cone/torus/freeform and real Boolean/assembly handling.

## Acceptance Level Reached

Reached:

- offline operation-plan generation;
- brake-disc scenario trace with offline research/decomposition;
- offline macro/code preview;
- static safety validation;
- local account/settings/trial entitlement contract;
- local stdio MCP tool server;
- masked Supabase config readiness and SQL migration scaffold;
- Supabase REST adapter scaffold;
- minimal local companion UI/API;
- SolidWorks COM add-in scaffold;
- SolidWorks API inventory extractor scaffold;
- SolidWorks runtime coverage checklist;
- ORYND AI Model 4 supported-primitive adapter;
- four deterministic examples;
- local tests.

Not reached:

- runtime-verified full user-facing extension;
- packaged/installable user-facing extension;
- GitHub release installer and updater flow;
- real Supabase auth/payment/subscription backend;
- local/Claude model test;
- live search/image/mesh working paths;
- SolidWorks execution;
- extension packaging/publishing readiness.
