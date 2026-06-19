# SolidWorks API Inventory Extractor

Windows-only helper for building the real SolidWorks API inventory.

Run this on a machine with SolidWorks installed:

```powershell
dotnet run --project .\SolidWorksApiInventory.csproj -- `
  --solidworks-dir "C:\Program Files\SOLIDWORKS Corp\SOLIDWORKS" `
  --out ..\..\solidworks_api_inventory.json
```

The generated JSON is not an allowlist by itself. It is raw API coverage data.
Production planning should map raw API members into constrained ORYND commands.

Expected SolidWorks assemblies:

```text
api\redist\SolidWorks.Interop.sldworks.dll
api\redist\SolidWorks.Interop.swconst.dll
api\redist\SolidWorks.Interop.swpublished.dll
```

Do not run this on macOS unless those assemblies are available locally.

