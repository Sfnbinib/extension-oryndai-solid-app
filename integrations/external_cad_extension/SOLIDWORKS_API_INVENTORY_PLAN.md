# SolidWorks API Inventory Plan

The current prototype does not contain the full SolidWorks API command list.

Current implemented catalog:

```text
sketch, circle, rectangle, extrude, revolve, cut, hole, pattern, fillet, chamfer, mate, export
```

This is an MVP operation layer, not the complete SolidWorks command surface.

## How To Build The Full Inventory Correctly

The reliable source is a Windows machine with SolidWorks installed.

Inventory sources:

- SolidWorks API Help for the target version;
- SolidWorks interop assemblies:
  - `SolidWorks.Interop.sldworks.dll`
  - `SolidWorks.Interop.swconst.dll`
  - `SolidWorks.Interop.swpublished.dll`
- COM type libraries from the installed SolidWorks version;
- macro recorder output for real user workflows;
- runtime tests inside SolidWorks.

## Extractor Target

On Windows, add a small reflection extractor that emits:

```json
{
  "version": "SOLIDWORKS 20xx",
  "interfaces": [],
  "methods": [],
  "enums": [],
  "macro_recorder_examples": [],
  "safe_operation_mappings": []
}
```

Then map raw API members into ORYND operation categories:

```text
raw SolidWorks API -> allowlisted ORYND command -> validator -> preview -> user approval -> execution
```

Do not expose every SolidWorks API method directly to the model. The model should target a constrained operation plan, and only the trusted bridge/add-in should translate that plan into SolidWorks calls.

## Why Not Dump Everything Into The Planner

SolidWorks has a broad COM API with many document, file, selection, add-in, equation, feature, sketch, assembly, and export surfaces.

A production AI CAD extension should avoid:

- arbitrary API calls from model output;
- hidden file/network/delete behavior;
- direct model access to COM automation;
- unvalidated macro text execution.

The full list is useful for engineering coverage, but execution should stay allowlisted.

## Next Implementation Step

Add a Windows-only tool under this module:

```text
tools/solidworks_api_inventory/
```

Expected commands:

```powershell
dotnet run --project tools\solidworks_api_inventory\SolidWorksApiInventory.csproj -- `
  --solidworks-dir "C:\Program Files\SOLIDWORKS Corp\SOLIDWORKS" `
  --out integrations\external_cad_extension\solidworks_api_inventory.json
```

After that, expand `catalog.py` with verified mappings, not raw method dumps.

Current scaffold:

- `tools/solidworks_api_inventory/SolidWorksApiInventory.csproj`
- `tools/solidworks_api_inventory/Program.cs`
- `tools/solidworks_api_inventory/README.md`

