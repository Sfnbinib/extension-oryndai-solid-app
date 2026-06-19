# ORYND CAD Bridge Windows Add-in Build And Test Guide

This guide is the next practical step for turning the prototype into a real
SolidWorks add-in.

## Short Answer About Mac

For this add-in format, the real target is Windows SolidWorks.

The desktop SOLIDWORKS client products are listed for Windows 10/11 64-bit in
official SOLIDWORKS system requirements. macOS appears there for eDrawings for
Mac, not for the desktop SOLIDWORKS add-in runtime.

The supported Mac-owner testing route is:

```text
Mac
  -> Parallels Desktop / supported Windows VM
  -> Windows 11
  -> desktop SolidWorks
  -> ORYND CAD Bridge Windows add-in
```

Native macOS can run:

- the Python local bridge;
- the companion web preview;
- tests and static validation;
- documentation and artifact generation.

Native macOS cannot prove:

- COM registration;
- SolidWorks Task Pane add-in loading;
- SolidWorks interop API calls;
- macro execution in desktop SolidWorks.

## Why Windows Is Required For The Add-in

The add-in scaffold is a classic desktop SolidWorks add-in:

```text
C# / .NET Framework 4.8
  -> COM-visible DLL
  -> ISwAddin
  -> SolidWorks.Interop.sldworks
  -> CreateTaskpaneView2 / TaskPane control
```

That stack depends on Windows COM and SolidWorks desktop interop assemblies.

## Current Add-in Scope

Implemented scaffold:

- C# project file;
- `ISwAddin` lifecycle class;
- right-side Task Pane WinForms control;
- local HTTP bridge client;
- register/unregister PowerShell scripts;
- preflight PowerShell script.

Current runtime behavior:

```text
SolidWorks Task Pane
  -> user prompt
  -> local bridge http://127.0.0.1:8765/api/generate
  -> preview operation plan/macro JSON
```

Not implemented yet:

- direct macro execution;
- approve/run button;
- SolidWorks feature creation through add-in API;
- installer;
- runtime QA in a real SolidWorks document.

## Minimum Hardware/Software Needed

Windows test machine:

- Windows 11 64-bit;
- desktop SolidWorks installed;
- SolidWorks API redist assemblies present;
- Visual Studio Build Tools or Visual Studio with MSBuild;
- .NET Framework 4.8 developer tooling;
- PowerShell;
- Python environment for the local bridge.

Expected SolidWorks DLLs:

```text
C:\Program Files\SOLIDWORKS Corp\SOLIDWORKS\api\redist\
  SolidWorks.Interop.sldworks.dll
  SolidWorks.Interop.swconst.dll
  SolidWorks.Interop.swpublished.dll
```

## Step 1: Copy Or Clone The Repo On Windows

```powershell
git clone https://github.com/Sfnbinib/extension-oryndai-solid-app.git
cd extension-oryndai-solid-app
```

If testing from the ORYND workspace instead, run the same commands from:

```text
integrations\external_cad_extension\solidworks_addin
```

## Step 2: Start The Local Bridge

From repository root:

```powershell
python -m integrations.external_cad_extension.web_app
```

Expected:

```text
ORYND CAD Bridge companion UI: http://127.0.0.1:8765
```

Verify:

```powershell
curl http://127.0.0.1:8765/api/entitlement
```

Expected:

```json
{
  "allowed": false,
  "reason": "no trial or subscription"
}
```

This still means the bridge is reachable. Entitlement is local prototype state.

## Step 3: Preflight The Windows Add-in Environment

From:

```text
integrations\external_cad_extension\solidworks_addin
```

Run:

```powershell
.\Preflight-ORYNDCADBridgeAddin.ps1
```

If SolidWorks is installed in a custom location:

```powershell
.\Preflight-ORYNDCADBridgeAddin.ps1 -SolidWorksInstallDir "D:\Apps\SOLIDWORKS"
```

Expected pass:

```text
solidworks_install_dir   OK
solidworks_redist_dir    OK
interop_sldworks         OK
interop_swconst          OK
interop_swpublished      OK
msbuild                  OK
regasm                   OK
```

JSON mode:

```powershell
.\Preflight-ORYNDCADBridgeAddin.ps1 -Json
```

## Step 4: Build The Add-in DLL

From:

```text
integrations\external_cad_extension\solidworks_addin
```

Run:

```powershell
$env:SolidWorksInstallDir = "C:\Program Files\SOLIDWORKS Corp\SOLIDWORKS"
msbuild .\ORYNDCadBridgeAddin\ORYNDCadBridgeAddin.csproj /p:Configuration=Release
```

Expected output:

```text
ORYNDCadBridgeAddin\bin\Release\ORYNDCadBridgeAddin.dll
```

If `msbuild` is not on PATH, use the path from preflight:

```powershell
& "C:\Program Files\Microsoft Visual Studio\2022\BuildTools\MSBuild\Current\Bin\MSBuild.exe" `
  .\ORYNDCadBridgeAddin\ORYNDCadBridgeAddin.csproj `
  /p:Configuration=Release
```

## Step 5: Register For Local Testing

From:

```text
integrations\external_cad_extension\solidworks_addin
```

Run PowerShell as normal user first:

```powershell
.\Register-ORYNDCADBridgeAddin.ps1 `
  -DllPath .\ORYNDCadBridgeAddin\bin\Release\ORYNDCadBridgeAddin.dll
```

If COM registration fails due permissions, run PowerShell as Administrator.

The script writes:

```text
HKCU:\Software\SolidWorks\AddIns\{B7F2B6BE-AC0E-4591-A466-BA92A238E9D4}
HKCU:\Software\SolidWorks\AddInsStartup\{B7F2B6BE-AC0E-4591-A466-BA92A238E9D4}
```

## Step 6: Load In SolidWorks

1. Start the local bridge:

```powershell
python -m integrations.external_cad_extension.web_app
```

2. Open SolidWorks.
3. Go to:

```text
Tools -> Add-Ins
```

4. Enable:

```text
ORYND CAD Bridge
```

5. Open/check the right-side Task Pane.
6. Enter:

```text
Create a 280 mm brake disc with 5 bolt holes and STEP export.
```

7. Click:

```text
Generate Preview
```

Expected result:

- task pane stays open;
- local bridge receives request;
- preview JSON/text appears;
- no SolidWorks crash;
- no macro is executed yet.

## Step 7: Pass/Fail Checklist

Pass means:

- add-in DLL builds;
- registration script succeeds;
- SolidWorks lists `ORYND CAD Bridge` in Add-Ins;
- Task Pane appears;
- Task Pane can call local bridge;
- generated preview appears;
- SolidWorks remains stable.

Fail means:

- missing interop DLLs;
- MSBuild not found;
- RegAsm registration failed;
- add-in not listed in SolidWorks;
- Task Pane AddControl fails;
- bridge call fails;
- SolidWorks crashes or hangs.

## Step 8: Unregister After Testing

```powershell
.\Unregister-ORYNDCADBridgeAddin.ps1 `
  -DllPath .\ORYNDCadBridgeAddin\bin\Release\ORYNDCadBridgeAddin.dll
```

## Next Implementation After Preview Works

Once the preview-only add-in loads successfully, implement:

1. structured task pane state:
   - connected;
   - generating;
   - validation passed/failed;
   - waiting approval;
   - running;
   - finished/failed.
2. approval gate:
   - show assumptions;
   - show validation;
   - show macro preview;
   - require `Approve & Run`.
3. first runtime MVP command path:
   - mounting bracket only;
   - sketch rectangle;
   - extrude;
   - two holes;
   - export STEP.
4. runtime log:
   - each SolidWorks operation;
   - errors;
   - export path.

Do not start with full F1 assembly or GenCAD runtime. The first product proof is:

```text
mounting bracket -> preview -> approve -> SolidWorks creates part -> STEP export
```

## What Can Be Tested On Mac Today

On native macOS:

```bash
.venv/bin/python -m pytest integrations/external_cad_extension/tests -q
.venv/bin/python -m integrations.external_cad_extension.cli --example mounting_bracket
.venv/bin/python -m integrations.external_cad_extension.web_app
```

This proves:

- Python bridge;
- operation-plan generation;
- macro preview;
- static validation;
- local companion UI/API.

It does not prove:

- C# add-in build;
- SolidWorks COM add-in registration;
- Task Pane inside desktop SolidWorks;
- macro/API execution in SolidWorks.
