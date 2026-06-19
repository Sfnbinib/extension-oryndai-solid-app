# GenCAD Integration Plan

GenCAD is a separate image-conditioned CAD command sequence model:

```text
image/sketch -> GenCAD inference -> CAD command sequence/artifacts -> ORYND operation plan -> validator -> macro/code
```

It is not bundled into the base ORYND CAD Bridge installer.

## Why It Is External

The upstream repository currently expects:

- cloned GenCAD repo;
- downloaded dataset/checkpoints;
- `data/ckpt/` with pretrained models;
- Docker or manual conda setup;
- `pythonocc-core`;
- headless visualization/inference through `xvfb-run` on servers.

Bundling that into the lightweight SolidWorks companion would make the base installer too heavy and fragile.

## Current Adapter

Implemented now:

- `gencad_adapter.py`;
- CLI `gencad-status`;
- CLI `gencad-run`;
- MCP `gencad_status`;
- explicit unavailable state when repo/checkpoints are missing.

Not implemented yet:

- downloading GenCAD repo/checkpoints;
- running Docker/conda setup;
- parsing actual GenCAD inference artifacts;
- converting GenCAD command sequence into ORYND `OperationPlan`.

## Commands

Check readiness:

```bash
.venv/bin/python -m integrations.external_cad_extension.cli gencad-status \
  --repo-path integrations/GenCAD
```

Run inference if GenCAD is installed:

```bash
.venv/bin/python -m integrations.external_cad_extension.cli gencad-run \
  --repo-path integrations/GenCAD \
  --image-path data/images \
  --results-path results
```

Expected not-ready state on a clean install:

```json
{
  "available": false,
  "message": "GenCAD repo is not installed. Clone/download it separately; do not bundle it in the base extension."
}
```

## Next Steps

1. Clone GenCAD into `integrations/GenCAD` or configure another path.
2. Download pretrained checkpoints into `data/ckpt/`.
3. Build Docker image or conda environment.
4. Run inference on one sample image.
5. Inspect outputs.
6. Implement `convert_gencad_output_to_operation_plan`.
7. Feed converted plan through ORYND validator and macro generator.

