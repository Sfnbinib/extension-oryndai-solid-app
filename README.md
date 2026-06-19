# ORYND CAD Bridge

SolidWorks-focused external CAD extension prototype.

Current product shape:

```text
SolidWorks Add-in + right-side Task Pane + local bridge + ORYND backend/model routes
```

This repository contains the isolated CAD Bridge module only. It should not
contain the full ORYND workspace, local `.env` files, or large model weights.

## What Is Included

- constrained CAD operation schema;
- command catalog and static validator;
- deterministic demo generation for brake disc, spur gear, F1 front wing, and mounting bracket;
- SolidWorks VBA-style macro generator;
- local CLI and web bridge;
- stdio MCP server;
- GenCAD adapter scaffold;
- ORYND AI Model 4/CoreOps adapter scaffold;
- SolidWorks C# add-in scaffold with right-side Task Pane control;
- Windows-only SolidWorks API inventory extractor;
- packaging/update manifest helpers.

## Quick Smoke Test

From repository root:

```bash
python -m pytest integrations/external_cad_extension/tests -q
python -m integrations.external_cad_extension.cli --example brake_disc
python -m integrations.external_cad_extension.cli update-check \
  --manifest-file integrations/external_cad_extension/release/manifest.example.json \
  --current-version 0.0.1
```

## Local Bridge

```bash
python -m integrations.external_cad_extension.web_app
```

Default URL:

```text
http://127.0.0.1:8765
```

## SolidWorks Add-in Scaffold

Windows/SolidWorks side:

```text
integrations/external_cad_extension/solidworks_addin/
```

Target flow:

```text
Build C# add-in DLL -> register COM add-in -> open SolidWorks -> Tools > Add-Ins -> ORYND CAD Bridge -> right-side Task Pane
```

The add-in currently generates previews through the local bridge. Runtime
execution inside SolidWorks still needs verification on a Windows machine with
SolidWorks installed.

## Security

- Do not commit `.env` or API keys.
- Do not bundle heavy model checkpoints in the base installer.
- Generated macro/code must pass the validator.
- Execution should require visible user approval.

