"""ORYND CAD Bridge — Fusion 360 Add-In (thin client)

Architecture:
  Fusion UI panel (HTML palette) → local bridge 127.0.0.1:8765 → AWS/Opus → macro code
  → execute via adsk.fusion API locally

Install:
  Windows: %APPDATA%\\Autodesk\\Autodesk Fusion 360\\API\\AddIns\\ORYNDFusion360AddIn\\
  Mac:     ~/Library/Application Support/Autodesk/Autodesk Fusion 360/API/AddIns/ORYNDFusion360AddIn/

  Then: Utilities > Add-Ins > Add-Ins tab > ORYNDFusion360AddIn > Run
"""

import adsk.core
import adsk.fusion
import json
import traceback
import urllib.request
import urllib.error
from pathlib import Path

_app: adsk.core.Application | None = None
_ui: adsk.core.UserInterface | None = None
_handlers: list = []
_palette: adsk.core.Palette | None = None

BRIDGE_URL = "http://127.0.0.1:8765"
PALETTE_ID = "ORYNDPalette"
BUTTON_ID = "ORYNDToggleButton"
WORKSPACE_ID = "FusionSolidEnvironment"
TAB_ID = "SolidTab"
PANEL_ID = "ORYNDPanel"

_ADDON_DIR = Path(__file__).resolve().parent

# Diagnostic log — the click handler already wraps everything in try/except with
# a messageBox on failure, but if the click never reaches the handler at all
# (Fusion ribbon/dropdown UI quirk) there's no error to show. This file gives a
# hard trail of exactly how far execution got, instead of guessing from screenshots.
_LOG_PATH = Path.home() / '.orynd' / 'fusion_addin.log'
def _log(msg: str) -> None:
    try:
        _LOG_PATH.parent.mkdir(parents=True, exist_ok=True)
        import datetime
        with open(_LOG_PATH, 'a') as f:
            f.write(f"{datetime.datetime.now().isoformat()} {msg}\n")
    except Exception:
        pass


# ---------------------------------------------------------------------------
# Palette HTML — served from local bridge, or fallback inline
# ---------------------------------------------------------------------------

def _palette_html_url() -> str:
    return f"{BRIDGE_URL}/cloud-design"


# ---------------------------------------------------------------------------
# Context snapshot: read current Fusion document state
# ---------------------------------------------------------------------------

def _get_context_snapshot() -> dict:
    try:
        design = _app.activeProduct
        if not isinstance(design, adsk.fusion.Design):
            return {"status": "no_design"}
        root = design.rootComponent
        bodies = [b.name for b in root.bRepBodies]
        sketches = [s.name for s in root.sketches]
        features = [f.name for f in root.features]
        sel = _ui.activeSelections
        selected = [sel.item(i).entity.objectType.split("::")[-1]
                    for i in range(sel.count)] if sel else []
        return {
            "status": "ok",
            "doc_name": _app.activeDocument.name if _app.activeDocument else "",
            "bodies": bodies,
            "sketches": sketches,
            "features": features[:20],
            "selected": selected,
            "units": design.fusionUnitsManager.distanceDisplayUnits,
        }
    except Exception:
        return {"status": "error", "detail": traceback.format_exc()}


# ---------------------------------------------------------------------------
# Execute macro returned from backend
# ---------------------------------------------------------------------------

def _import_file(path: str) -> dict:
    """Import a STEP/STL/OBJ file into the active Fusion design.

    This is the "Open in Fusion" path: the backend built a file, the bridge saved
    it to disk, the palette sends its path here and it lands in the user's document
    instead of just sitting in a folder.
    """
    try:
        design = _app.activeProduct
        if not isinstance(design, adsk.fusion.Design):
            return {"ok": False, "error": "No active Fusion design"}
        root = design.rootComponent
        im = _app.importManager
        ext = Path(path).suffix.lower()
        if ext in (".step", ".stp"):
            opts = im.createSTEPImportOptions(path)
        elif ext == ".stl":
            opts = im.createMeshImportOptions(path)
        elif ext == ".obj":
            opts = im.createOBJImportOptions(path)
        else:
            return {"ok": False, "error": f"Unsupported file type: {ext}"}
        im.importToTarget(opts, root)
        return {"ok": True, "imported": path}
    except Exception as exc:
        return {"ok": False, "error": str(exc), "trace": traceback.format_exc()}


def _execute_macro(macro_code: str) -> dict:
    """Run the Python macro string in Fusion context."""
    try:
        design = _app.activeProduct
        if not isinstance(design, adsk.fusion.Design):
            return {"ok": False, "error": "No active Fusion design"}
        root = design.rootComponent
        sketches = root.sketches
        # Provide minimal globals so generated code can reference Fusion objects
        exec_globals = {
            "adsk": adsk,
            "design": design,
            "rootComp": root,
            "sketches": sketches,
            "app": _app,
            "ui": _ui,
        }
        exec(macro_code, exec_globals)  # noqa: S102
        return {"ok": True}
    except Exception as exc:
        return {"ok": False, "error": str(exc), "trace": traceback.format_exc()}


# ---------------------------------------------------------------------------
# IPC: palette → add-in message handler
# ---------------------------------------------------------------------------

class PaletteReceiveHandler(adsk.core.HTMLEventHandler):
    """Handle messages sent from the palette HTML via window.adsk.fusionSendData."""

    def notify(self, args: adsk.core.HTMLEventArgs) -> None:
        try:
            data = json.loads(args.data)
            action = data.get("action", "")

            if action == "get_context":
                snapshot = _get_context_snapshot()
                args.returnData = json.dumps(snapshot)

            elif action == "execute_macro":
                result = _execute_macro(data.get("macro_code", ""))
                args.returnData = json.dumps(result)

            elif action == "import_file":
                result = _import_file(data.get("path", ""))
                args.returnData = json.dumps(result)

            elif action == "ping":
                args.returnData = json.dumps({"ok": True, "host": "fusion360"})

            else:
                args.returnData = json.dumps({"error": f"unknown action: {action}"})

        except Exception:
            args.returnData = json.dumps({"error": traceback.format_exc()})


# ---------------------------------------------------------------------------
# Button command
# ---------------------------------------------------------------------------

class ToggleCommandCreatedHandler(adsk.core.CommandCreatedEventHandler):
    def notify(self, args: adsk.core.CommandCreatedEventArgs) -> None:
        _log("ToggleCommandCreatedHandler.notify fired (command UI instance created)")
        args.command.execute.add(_ToggleExecuteHandler())
        _handlers.append(args.command.execute)
        _log("execute handler attached")


def _show_palette(toggle: bool = False) -> None:
    """Create the palette if it doesn't exist, or (when toggle=True) flip its
    visibility if it does. Called both from the ribbon button click AND
    directly from run() so the palette doesn't depend on that click working
    (Fusion ribbon click-to-execute proved unreliable for this add-in on Mac —
    commandCreated fires, execute never does, confirmed via _log — auto-open
    on Run sidesteps it entirely)."""
    global _palette
    try:
        palettes = _ui.palettes
        _palette = palettes.itemById(PALETTE_ID)
        if _palette:
            _log(f"existing palette found, isVisible was {_palette.isVisible}")
            if toggle:
                _palette.isVisible = not _palette.isVisible
            else:
                _palette.isVisible = True
            return

        _log("no existing palette — creating new one at " + _palette_html_url())
        _palette = _ui.palettes.add(
            PALETTE_ID,
            "ORYND",
            _palette_html_url(),
            True,   # isVisible
            True,   # showCloseButton
            True,   # isResizable
            400,    # width
            600,    # height
            # useNewWebBrowser=True: the legacy CEF webview has spotty fetch()/
            # modern-JS support, which our React app (session relay, clipboard,
            # onboarding panel) all depend on. Confirmed 2026-07-14: with the
            # legacy engine the palette stayed stuck on Sign-in even though the
            # bridge had a valid session and cache-busting was fixed — the
            # relay fetch() call likely just silently failed on that engine.
            True,   # useNewWebBrowser
        )
        _log("palettes.add returned: " + repr(_palette))
        receive_handler = PaletteReceiveHandler()
        _palette.incomingFromHTML.add(receive_handler)
        _handlers.append(receive_handler)
        _log("palette created OK, isVisible=" + str(_palette.isVisible))

    except Exception:
        _log("EXCEPTION in _show_palette: " + traceback.format_exc())
        if _ui:
            _ui.messageBox("ORYND: palette error\n" + traceback.format_exc())


class _ToggleExecuteHandler(adsk.core.CommandEventHandler):
    def notify(self, args: adsk.core.CommandEventArgs) -> None:
        _log("_ToggleExecuteHandler.notify fired — click reached the handler")
        _show_palette(toggle=True)


# ---------------------------------------------------------------------------
# Add-in lifecycle
# ---------------------------------------------------------------------------

def run(context) -> None:
    global _app, _ui
    _log("=== run() called ===")
    try:
        _app = adsk.core.Application.get()
        _ui = _app.userInterface

        ws = _ui.workspaces.itemById(WORKSPACE_ID)
        if not ws:
            _log(f"ABORT: workspace {WORKSPACE_ID!r} not found")
            return
        tab = ws.toolbarTabs.itemById(TAB_ID)
        if not tab:
            _log(f"ABORT: tab {TAB_ID!r} not found in workspace")
            return
        panel = tab.toolbarPanels.itemById(PANEL_ID)
        if not panel:
            panel = tab.toolbarPanels.add(PANEL_ID, "ORYND", "", False)
            _log("created new panel")
        else:
            _log("reused existing panel")

        # Clean up stale command def
        existing = _ui.commandDefinitions.itemById(BUTTON_ID)
        if existing:
            _log("deleting stale command def from a previous run")
            existing.deleteMe()

        # resourceFolder is optional (Fusion falls back to a default icon when
        # omitted) — pass it only if the folder actually exists. We don't ship
        # custom icon assets yet, so passing a non-existent path unconditionally
        # made Fusion raise "RuntimeError: 3 : the relative resourceFolder path
        # not found" and crash the whole add-in on load.
        resources_dir = _ADDON_DIR / "resources"
        button_args = [BUTTON_ID, "ORYND", "Toggle ORYND AI assistant"]
        if resources_dir.is_dir():
            button_args.append(str(resources_dir))
        cmd_def = _ui.commandDefinitions.addButtonDefinition(*button_args)
        _log("addButtonDefinition OK, cmd_def=" + repr(cmd_def))
        created_handler = ToggleCommandCreatedHandler()
        cmd_def.commandCreated.add(created_handler)
        _handlers.append(created_handler)
        control = panel.controls.addCommand(cmd_def)
        _log("controls.addCommand OK, control=" + repr(control) + " panel.controls.count=" + str(panel.controls.count))
        # Also pin to Quick Access (top-left, always visible) — a second, more
        # reliable click target. The panel-only button collapses into a narrow
        # dropdown when the ribbon is tight, and that inner click sometimes
        # doesn't reach execute (confirmed via _log: commandCreated fires,
        # execute never does) — a known Fusion ribbon quirk, not our bug.
        try:
            control.isPromoted = True
            control.isPromotedByDefault = True
            _log("promoted to Quick Access")
        except Exception:
            _log("promote to Quick Access failed: " + traceback.format_exc())

        # Auto-open on Run — see _show_palette docstring for why.
        _show_palette(toggle=False)

    except Exception:
        _log("EXCEPTION in run(): " + traceback.format_exc())
        if _ui:
            _ui.messageBox("ORYND failed to start:\n" + traceback.format_exc())


def stop(context) -> None:
    global _palette
    try:
        if _ui:
            ws = _ui.workspaces.itemById(WORKSPACE_ID)
            if ws:
                tab = ws.toolbarTabs.itemById(TAB_ID)
                if tab:
                    panel = tab.toolbarPanels.itemById(PANEL_ID)
                    if panel:
                        panel.deleteMe()
            cmd_def = _ui.commandDefinitions.itemById(BUTTON_ID)
            if cmd_def:
                cmd_def.deleteMe()
            if _palette:
                _palette.deleteMe()
                _palette = None
    except Exception:
        pass
