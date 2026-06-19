# ORYND AI Model 4 Integration

This path connects the existing ORYND AI Model 4/CoreOps pipeline to the external CAD extension.

Target flow:

```text
STL/OBJ/search-import
  -> ORYND AI Model 4 mesh decomposition/features/primitives
  -> CoreOps
  -> external OperationPlan
  -> validator
  -> SolidWorks macro/code preview
```

## Implemented Now

- `ai_model_4_adapter.py`
- CLI `ai4-primitives`
- CLI `ai4-mesh`
- MCP `ai4_primitives_to_plan`
- tests for supported and unsupported primitives

Supported mapping:

- AI Model 4 `box` -> CoreOps `CreateSketch(rect)` + `Extrude` -> external `sketch` + `rectangle` + `extrude`
- AI Model 4 `cylinder` -> CoreOps `CreateSketch(circle)` + `Extrude` -> external `sketch` + `circle` + `extrude`
- CoreOps `CutHole` -> external `hole`
- CoreOps `Fillet` -> external `fillet`
- CoreOps `Chamfer` -> external `chamfer`
- CoreOps `Boolean` -> noted as implicit/unsupported in macro preview

Unsupported primitives are not silently accepted. If nothing can be converted, the adapter returns `ok=false` and no export-only fake plan.

## Commands

Primitive JSON:

```bash
.venv/bin/python -m integrations.external_cad_extension.cli ai4-primitives \
  --input-json /path/to/ai_model_4_primitives.json \
  --name ai4_part
```

Mesh file through existing ORYND pipeline:

```bash
.venv/bin/python -m integrations.external_cad_extension.cli ai4-mesh \
  --mesh-path /path/to/model.stl \
  --session-id external_cad_mesh
```

## Current Limits

- Non-axis-aligned primitives are skipped by the existing ORYND translator.
- Sphere/cone/torus/freeform mesh are not mapped to SolidWorks macro operations yet.
- Boolean union is only represented as a note in the external macro path.
- Real mesh quality depends on the existing ORYND AI Model 4 extraction pipeline.

