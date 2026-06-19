# Mac And Windows Installation Reality

## Short Answer

The production SolidWorks add-in is a Windows add-in.

Official SOLIDWORKS system requirements list SOLIDWORKS client products under
Windows 10/11 64-bit. macOS entries are for eDrawings for Mac, not native
SOLIDWORKS. The same page lists Parallels Desktop for Mac under supported
virtual environments.

Practical meaning:

```text
Native Windows PC
  -> install ORYND CAD Bridge Windows installer
  -> SolidWorks add-in works inside SolidWorks

Mac with Parallels/Windows VM
  -> install Windows + SolidWorks inside VM
  -> install ORYND CAD Bridge Windows installer inside VM
  -> SolidWorks add-in works inside VM

Native macOS without Windows SolidWorks
  -> no native SolidWorks add-in target
  -> can run companion/demo tools only
```

## Why

SolidWorks desktop automation/add-ins use Windows COM/.NET/C++ integration.
The right-side Task Pane is created from the SolidWorks Windows API, for example
through `ISldWorks.CreateTaskpaneView2/CreateTaskpaneView3`.

That means our `.dll` add-in and Task Pane are Windows-side artifacts.

## Packages We Should Ship

### 1. Windows Installer

```text
ORYND-CAD-Bridge-Setup-x.y.z.exe
```

Includes:

- SolidWorks COM add-in DLL;
- Task Pane UI;
- local bridge executable/service;
- updater;
- unregister/uninstall scripts.

### 2. macOS Companion Package

```text
ORYND-CAD-Bridge-Companion-x.y.z.dmg
```

Useful for:

- website demos;
- prompt/plan/macro preview without SolidWorks;
- MCP/local bridge testing;
- generating `.bas` artifacts;
- remote/server workflows.

Not useful for:

- native SolidWorks Task Pane on macOS, because native SolidWorks desktop is not
  the supported target there.

### 3. Mac Test Path For The Owner

If testing from a Mac:

1. Install Parallels Desktop.
2. Install Windows 11 ARM/x64 as appropriate.
3. Install SolidWorks inside Windows.
4. Install `ORYND-CAD-Bridge-Setup-x.y.z.exe` inside Windows.
5. Open SolidWorks inside Windows.
6. Enable ORYND CAD Bridge under Add-Ins.
7. Test the right-side Task Pane.

Do not install the macOS `.dmg` and expect it to appear inside SolidWorks. The
`.dmg` is only the companion/demo tool.

