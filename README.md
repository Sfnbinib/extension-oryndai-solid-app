# ORYND CAD Bridge

Connect your CAD application to ORYND AI. Describe what you want to build — ORYND
generates geometry, finds models, and runs the operations directly inside your CAD app.

```
CAD app  ──►  ORYND add-in panel  ──►  local bridge (127.0.0.1:8765)  ──►  ORYND
```

The add-in never talks to the internet directly. Your CAD files stay on your machine.

---

## Platform support

| CAD | Mac | Windows | Notes |
|-----|:---:|:-------:|-------|
| Autodesk Fusion | ✅ | ✅ | Python add-in, full panel |
| AutoCAD | ✅ | ✅ | LISP loader (Mac); LISP + .NET panel (Win) |
| SolidWorks | — | ✅ | Windows only (COM add-in) |

---

## Quick start (recommended — installer)

1. Download the installer for your OS from
   [**Releases**](https://github.com/Sfnbinib/extension-oryndai-solid-app/releases):
   - **macOS** → `ORYND Extension-x.y.z.dmg`
   - **Windows** → `ORYND Extension Setup x.y.z.exe`
2. Install and launch **ORYND Extension**. It runs in the menu bar / system tray.
3. In the app, click **Enable** next to your CAD — the add-in installs itself.
4. Open your CAD app. The ORYND panel appears inside it automatically.

No Python, no terminal. The bridge runs inside the app, and updates install
themselves (after a few launches).

---

## Advanced — run the bridge manually (developers)

If you only want the bridge without the desktop app, it runs on Python stdlib
(3.10+, no pip install):

```bash
python bridge/bridge.py            # mac / linux
python bridge\bridge.py            # windows
```

Then install the add-in for your CAD by hand:

| CAD | Manual install guide |
|-----|---------------|
| Autodesk Fusion | [docs/INSTALL_FUSION360.md](docs/INSTALL_FUSION360.md) |
| AutoCAD | [docs/INSTALL_AUTOCAD.md](docs/INSTALL_AUTOCAD.md) |
| SolidWorks | [docs/INSTALL_SOLIDWORKS.md](docs/INSTALL_SOLIDWORKS.md) |

---

## Repository structure

```
orynd_cad_bridge/
├── bridge/
│   ├── bridge.py              ← local HTTP proxy (run this first)
│   ├── requirements.txt       ← stdlib only, no pip install needed
│   └── BRIDGE_CONTRACT.md     ← endpoint spec
├── docs/
│   ├── INSTALL_FUSION360.md
│   ├── INSTALL_SOLIDWORKS.md
│   └── INSTALL_AUTOCAD.md
├── fusion360_addin/           ← Python add-in (Mac + Windows)
├── solidworks_addin/          ← C# add-in (Windows only)
└── autocad_addin/             ← LISP + C# add-in (LISP: Mac+Win, C#: Win only)
```

---

## How it works

1. The add-in captures context from your active CAD session (selected bodies, active document).
2. It sends your prompt + context to the local bridge on `127.0.0.1:8765`.
3. The bridge forwards to the ORYND backend (search → decompose → CoreOps).
4. The backend returns a macro (Python / VBA / AutoLISP) which the add-in executes.

No ORYND algorithms run locally — the bridge is a thin proxy only.

---

## Privacy

- The add-in sends only what you explicitly prompt.
- Your CAD files are never uploaded automatically.
- The bridge runs entirely on your machine.

---

## Requirements

| Component | Requirement |
|-----------|-------------|
| Python | 3.10+ |
| Fusion 360 | Any current version |
| AutoCAD | 2019+ for .NET panel; any version for LISP loader |
| SolidWorks | 2020+ with .NET Framework 4.8 (Windows) |

---

## License

MIT — see LICENSE file.
