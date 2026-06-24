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

## Quick start

### 1 — Start the local bridge

The bridge requires **Python 3.10+** and no additional packages.

```bash
# Mac / Linux
python bridge/bridge.py

# Windows
python bridge\bridge.py
```

You should see:
```
ORYND Bridge running on http://127.0.0.1:8765
```

Keep this terminal open while using your CAD app.

### 2 — Install the add-in for your CAD

| CAD | Install guide |
|-----|---------------|
| Autodesk Fusion | [docs/INSTALL_FUSION360.md](docs/INSTALL_FUSION360.md) |
| AutoCAD | [docs/INSTALL_AUTOCAD.md](docs/INSTALL_AUTOCAD.md) |
| SolidWorks | [docs/INSTALL_SOLIDWORKS.md](docs/INSTALL_SOLIDWORKS.md) |

### 3 — Open your CAD app and use ORYND

The ORYND panel appears in the toolbar (Fusion / AutoCAD) or as a task pane
(SolidWorks). Type a prompt and press **Generate**.

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
