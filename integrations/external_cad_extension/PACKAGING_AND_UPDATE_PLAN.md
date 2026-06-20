# Packaging And Update Plan

This is the installation/update path for the first external CAD extension test.

## What The User Installs

For Windows/SolidWorks the user should install one package:

```text
ORYND-CAD-Bridge-Setup-x.y.z.exe
```

The installer should include:

- SolidWorks COM add-in DLL;
- Task Pane UI resources;
- local ORYND bridge executable/service;
- MCP server entrypoint;
- updater metadata;
- uninstall script.

For macOS, ship a separate companion package only:

```text
ORYND-CAD-Bridge-Companion-x.y.z.dmg
```

The macOS package is not a native SolidWorks add-in. It is for local bridge,
MCP, previews, and demos. SolidWorks add-in testing on a Mac should happen
inside Windows running in a supported virtual environment such as Parallels.

It should not include:

- GenCAD model checkpoints;
- large ORYND AI Model 4 model weights;
- raw provider API keys;
- server secrets.

## GitHub Release Shape

Recommended private/public release repository:

```text
orynd-cad-bridge
  releases/
    v0.1.0
      ORYND-CAD-Bridge-Setup-0.1.0.exe
      ORYND-CAD-Bridge-Companion-0.1.0.dmg
      manifest.json
      checksums.txt
```

The website Download button should point to the latest stable installer or a
download landing page that resolves the latest GitHub release.

## Update Strategy

Installed app checks a stable manifest URL:

```text
https://raw.githubusercontent.com/ORYND-AI/orynd-cad-bridge/main/releases/stable.json
```

Flow:

```text
app starts
  -> fetch manifest
  -> compare version
  -> show update available
  -> user approves
  -> download installer
  -> verify SHA256
  -> ask user to close SolidWorks
  -> run installer only after explicit approval
```

Do not auto-run hidden updates while SolidWorks is open.

## Why This Beats "Just Download From GitHub Again"

Users will install once. After that, they need a visible update flow:

- update available;
- release notes;
- download size;
- checksum verification;
- restart SolidWorks requirement;
- rollback note if update fails.

## CLI Helpers In Prototype

Check a local manifest:

```bash
.venv/bin/python -m integrations.external_cad_extension.cli update-check \
  --manifest-file integrations/external_cad_extension/release/manifest.example.json
```

Generate a release asset manifest entry from a built installer:

```bash
.venv/bin/python -m integrations.external_cad_extension.cli release-asset \
  --file dist/ORYND-CAD-Bridge-Setup-0.1.0.exe \
  --url https://github.com/ORYND-AI/orynd-cad-bridge/releases/download/v0.1.0/ORYND-CAD-Bridge-Setup-0.1.0.exe \
  --platform windows-x64
```

Download and verify an update asset without executing it:

```bash
.venv/bin/python -m integrations.external_cad_extension.cli update-download \
  --manifest-file integrations/external_cad_extension/release/manifest.example.json \
  --platform windows-x64 \
  --current-version 0.0.1
```

For the website, publish a stable manifest URL and make the Download page read
that manifest:

```text
GET /downloads/cad-bridge
  -> fetch stable.json
  -> show Windows .exe and macOS .dmg assets
  -> show version, size, SHA256, release notes
```

The macOS `.dmg` is a companion/demo package. The real in-SolidWorks Task Pane
add-in is Windows/SolidWorks because native SolidWorks add-ins are Windows COM
add-ins.

## First Test Build

First practical test should be:

1. Build the C# add-in on Windows.
2. Package local bridge as a Windows executable.
3. Create installer.
4. Publish GitHub release.
5. Download/install on second Windows machine or Windows VM on Mac.
6. Open SolidWorks inside Windows.
7. Enable ORYND CAD Bridge add-in.
8. Generate brake-disc preview from the right-side Task Pane.
