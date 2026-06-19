# ORYND CAD Bridge SolidWorks Add-in Scaffold

This folder is the Windows/SolidWorks-side scaffold for the real extension target.

It is intentionally separate from the Python prototype:

```text
SolidWorks Add-in DLL
  -> local ORYND CAD Bridge HTTP/MCP process
  -> operation plan / validator / macro preview
  -> explicit user approval before any future CAD execution
```

## Current Scope

Implemented here:

- C#/.NET Framework add-in project skeleton;
- COM-visible add-in class implementing the SolidWorks add-in lifecycle;
- COM-visible right-side Task Pane control scaffold;
- local bridge HTTP client;
- registration script template;
- manifest describing the extension package.

Not implemented here yet:

- verified compile against a real SolidWorks installation;
- toolbar icons;
- production task pane UI styling and runtime QA;
- direct macro execution;
- installer MSI/MSIX;
- Dassault partner/store submission.

## Expected Windows Layout

On a Windows machine with SolidWorks installed:

```text
C:\Program Files\SOLIDWORKS Corp\SOLIDWORKS\
  api\redist\SolidWorks.Interop.sldworks.dll
  api\redist\SolidWorks.Interop.swconst.dll
  api\redist\SolidWorks.Interop.swpublished.dll
```

Build variable:

```powershell
$env:SolidWorksInstallDir = "C:\Program Files\SOLIDWORKS Corp\SOLIDWORKS"
```

Build:

```powershell
msbuild .\ORYNDCadBridgeAddin\ORYNDCadBridgeAddin.csproj /p:Configuration=Release
```

Register for local testing:

```powershell
.\Register-ORYNDCADBridgeAddin.ps1 -DllPath .\ORYNDCadBridgeAddin\bin\Release\ORYNDCadBridgeAddin.dll
```

## Runtime Flow

1. Start the Python bridge:

```powershell
python -m integrations.external_cad_extension.web_app
```

2. Start SolidWorks.
3. Enable `ORYND CAD Bridge` in SolidWorks Add-Ins.
4. Open the right-side SolidWorks Task Pane and select `ORYND CAD Bridge`.
5. Enter prompt in the task pane and generate a preview through the local bridge.
6. Review generated operation plan and macro before any execution path is added.

This matches the target pattern shown by tools such as MecAgent: a SolidWorks
add-in owns a docked right-side panel, while backend/model work happens in a
local or remote service behind it.

## Mac Reality

This add-in target is for desktop SolidWorks on Windows. Native macOS can run the
Python bridge, companion preview, and tests, but it cannot verify the COM/.NET
SolidWorks Task Pane add-in.

Mac owner-testing path:

```text
Mac -> Parallels/Windows VM -> desktop SolidWorks -> ORYND Windows add-in
```

Use the full build/test guide before trying the add-in on Windows:

```text
../WINDOWS_ADDIN_BUILD_AND_TEST_GUIDE.md
```

Preflight script:

```powershell
.\Preflight-ORYNDCADBridgeAddin.ps1
```

## Security Boundary

The add-in should stay thin:

- no hidden macro execution;
- no arbitrary shell commands;
- no network target except configured local bridge by default;
- show plan/code/warnings before future execution;
- execute only validated operation-plan output.
