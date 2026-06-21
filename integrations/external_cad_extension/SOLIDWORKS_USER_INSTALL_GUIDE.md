# ORYND CAD Bridge SolidWorks Install Guide

This guide explains how to install ORYND CAD Bridge so it opens as a right-side
panel inside SolidWorks.

## Short Answer

For the real SolidWorks extension, install the Windows package:

```text
ORYND-CAD-Bridge-Setup-x.y.z.exe
```

Then open SolidWorks and enable:

```text
Tools -> Add-Ins -> ORYND CAD Bridge
```

The macOS `.dmg` is only a companion/demo package. It will not appear inside
native macOS SolidWorks because the desktop SolidWorks add-in target is Windows
COM/.NET.

## Supported Setups

| Setup | Works inside SolidWorks? | What to install |
| --- | --- | --- |
| Windows PC with desktop SolidWorks | Yes | Windows `.exe` installer |
| Mac with Parallels/Windows and SolidWorks installed inside Windows | Yes, inside the VM | Windows `.exe` installer inside Windows |
| Native macOS without Windows SolidWorks | No right-side SolidWorks panel | macOS `.dmg` companion only |

## Before You Start

You need:

- Windows 10/11 64-bit;
- desktop SolidWorks installed;
- internet access for account login/model routing;
- local administrator rights if the installer asks for them;
- an ORYND account or access to the beta login page.

Close SolidWorks before installing or updating the extension.

## Normal Installation

1. Download the Windows installer from the ORYND download page:

```text
ORYND-CAD-Bridge-Setup-x.y.z.exe
```

2. Run the installer.

3. Keep the default install location unless you have a reason to change it.

4. When Windows asks for permission, approve the installer.

5. Wait until the installer finishes.

6. Open SolidWorks.

7. In the top menu, open:

```text
Tools -> Add-Ins
```

8. Find:

```text
ORYND CAD Bridge
```

9. Enable the left checkbox to load it now.

10. Enable the right checkbox if you want it to start automatically with
    SolidWorks.

11. Click `OK`.

12. Open the right-side SolidWorks Task Pane.

13. Select the `ORYND CAD Bridge` tab.

Expected result:

- the ORYND panel opens on the right side;
- it shows connection/account status;
- it can ask you to sign in;
- it can generate a preview before any CAD execution.

## Sign In

The extension should use the existing ORYND/Supabase account flow.

Expected flow:

```text
Task Pane -> Sign in -> browser opens ORYND login -> login/signup -> return to app
```

If Google login is used, complete it in the browser window. Do not paste account
passwords or API keys into chat.

## Add Your Own API Key

By default the extension should use:

```text
Cloud Anthropic
```

If you want to use your own key:

1. Open `Settings`.
2. Find `Model routing`.
3. Paste your Anthropic/OpenAI/Gemini key into the matching key field.
4. Save.
5. Go back to the chat.
6. The matching BYO route should become selectable.

If a provider is greyed out, it means no valid key or local model is connected.

## First Smoke Test

After the panel opens, run a simple test:

```text
Create a 280 mm brake disc with 5 bolt holes and STEP export.
```

Expected beta behavior:

1. ORYND understands the request.
2. It creates an operation plan.
3. It validates the plan.
4. It shows assumptions and warnings.
5. It shows macro/code preview.
6. It waits for approval before execution.

For the current scaffold, real execution may still be disabled until SolidWorks
runtime QA passes. Preview and validation should still work.

## Updating

When a new version is available, the panel should show an update notice.

Expected flow:

```text
Update available
  -> Review version/release notes
  -> Refresh & Update
  -> installer downloads
  -> checksum is verified
  -> close SolidWorks
  -> installer runs
  -> reopen SolidWorks
```

Do not run hidden updates while SolidWorks is open.

## Manual Beta Installation

Use this only before the production installer is ready.

### 1. Clone The Repo

Open PowerShell:

```powershell
git clone https://github.com/Sfnbinib/extension-oryndai-solid-app.git
cd extension-oryndai-solid-app
```

### 2. Start The Local Bridge

From the repository root:

```powershell
python -m integrations.external_cad_extension.web_app
```

Expected:

```text
ORYND CAD Bridge companion UI: http://127.0.0.1:8765
```

Keep this PowerShell window open while testing.

### 3. Check SolidWorks Add-in Requirements

Go to:

```powershell
cd integrations\external_cad_extension\solidworks_addin
```

Run:

```powershell
.\Preflight-ORYNDCADBridgeAddin.ps1
```

Expected result:

```text
solidworks_install_dir   OK
solidworks_redist_dir    OK
interop_sldworks         OK
interop_swconst          OK
interop_swpublished      OK
msbuild                  OK
regasm                   OK
```

If SolidWorks is installed somewhere else:

```powershell
.\Preflight-ORYNDCADBridgeAddin.ps1 -SolidWorksInstallDir "D:\Apps\SOLIDWORKS"
```

### 4. Build The Add-in

Set the SolidWorks install path:

```powershell
$env:SolidWorksInstallDir = "C:\Program Files\SOLIDWORKS Corp\SOLIDWORKS"
```

Build:

```powershell
msbuild .\ORYNDCadBridgeAddin\ORYNDCadBridgeAddin.csproj /p:Configuration=Release
```

Expected file:

```text
ORYNDCadBridgeAddin\bin\Release\ORYNDCadBridgeAddin.dll
```

### 5. Register The Add-in

From:

```text
integrations\external_cad_extension\solidworks_addin
```

Run:

```powershell
.\Register-ORYNDCADBridgeAddin.ps1 `
  -DllPath .\ORYNDCadBridgeAddin\bin\Release\ORYNDCadBridgeAddin.dll
```

If registration fails because of permissions, reopen PowerShell as
Administrator and run the same command again.

### 6. Enable In SolidWorks

1. Open SolidWorks.
2. Go to `Tools -> Add-Ins`.
3. Enable `ORYND CAD Bridge`.
4. Open the right-side Task Pane.
5. Select the ORYND tab.
6. Generate a preview.

### 7. Uninstall Manual Beta Registration

Close SolidWorks first.

Then run:

```powershell
.\Unregister-ORYNDCADBridgeAddin.ps1 `
  -DllPath .\ORYNDCadBridgeAddin\bin\Release\ORYNDCadBridgeAddin.dll
```

## Mac Installation

There are two different Mac scenarios.

### Mac With Parallels / Windows VM

This is the correct path for testing the real SolidWorks panel from a Mac:

1. Install Parallels Desktop.
2. Install Windows 11 inside Parallels.
3. Install desktop SolidWorks inside Windows.
4. Download `ORYND-CAD-Bridge-Setup-x.y.z.exe` inside Windows.
5. Run the installer inside Windows.
6. Open SolidWorks inside Windows.
7. Enable `ORYND CAD Bridge` under `Tools -> Add-Ins`.

### Native macOS

Install:

```text
ORYND-CAD-Bridge-Companion-x.y.z.dmg
```

This can be used for:

- previewing prompts/plans/macros;
- local bridge testing;
- demo flows;
- MCP/local-agent experiments.

It cannot load a native right-side SolidWorks Task Pane.

## Troubleshooting

### ORYND CAD Bridge Does Not Appear In Add-Ins

Try:

1. Close SolidWorks.
2. Run the installer again.
3. For manual beta, rerun the register script.
4. Check that you built the Release DLL.
5. Check that SolidWorks interop DLLs exist under:

```text
C:\Program Files\SOLIDWORKS Corp\SOLIDWORKS\api\redist\
```

### Panel Opens But Says Bridge Is Offline

Start the local bridge:

```powershell
python -m integrations.external_cad_extension.web_app
```

Then verify:

```powershell
curl http://127.0.0.1:8765/api/entitlement
```

If this fails, the local bridge is not running or Windows blocked it.

### Login Does Not Return To The App

Try:

1. Use the default browser.
2. Disable popup blockers for the ORYND login page.
3. Make sure the local bridge is running.
4. Sign out and sign in again.

### BYO Model Is Greyed Out

This means the key is not configured.

Open:

```text
Settings -> Model routing
```

Then add and save the provider key.

### Macro Execution Is Disabled

This is expected in preview/beta scaffold builds. The system should still show:

- operation plan;
- assumptions;
- warnings;
- validation report;
- generated macro/code preview.

Real execution should only be enabled after runtime QA passes.

### SolidWorks Crashes Or Hangs

1. Disable `ORYND CAD Bridge` from `Tools -> Add-Ins`.
2. Restart SolidWorks.
3. Save the local bridge logs.
4. Report the SolidWorks version, Windows version, and the prompt used.

## What Good Looks Like

A correct install ends with this:

```text
SolidWorks
  -> right-side Task Pane
  -> ORYND CAD Bridge tab
  -> prompt input
  -> operation plan
  -> validation
  -> macro preview
  -> explicit approval gate
```

No macro should execute without visible user approval.

