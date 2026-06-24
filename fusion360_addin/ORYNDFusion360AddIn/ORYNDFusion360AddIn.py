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
        args.command.execute.add(_ToggleExecuteHandler())
        _handlers.append(args.command.execute)


class _ToggleExecuteHandler(adsk.core.CommandEventHandler):
    def notify(self, args: adsk.core.CommandEventArgs) -> None:
        global _palette
        try:
            palettes = _ui.palettes
            _palette = palettes.itemById(PALETTE_ID)
            if _palette:
                _palette.isVisible = not _palette.isVisible
                return

            _palette = palettes.add(
                PALETTE_ID,
                "ORYND",
                _palette_html_url(),
                True,   # isVisible
                True,   # showCloseButton
                True,   # isResizable
                400,    # width
                600,    # height
                False,  # useNewWebBrowser
            )
            receive_handler = PaletteReceiveHandler()
            _palette.incomingFromHTML.add(receive_handler)
            _handlers.append(receive_handler)

        except Exception:
            if _ui:
                _ui.messageBox("ORYND: palette error\n" + traceback.format_exc())


# ---------------------------------------------------------------------------
# Add-in lifecycle
# ---------------------------------------------------------------------------

def run(context) -> None:
    global _app, _ui
    try:
        _app = adsk.core.Application.get()
        _ui = _app.userInterface

        ws = _ui.workspaces.itemById(WORKSPACE_ID)
        if not ws:
            return
        tab = ws.toolbarTabs.itemById(TAB_ID)
        if not tab:
            return
        panel = tab.toolbarPanels.itemById(PANEL_ID)
        if not panel:
            panel = tab.toolbarPanels.add(PANEL_ID, "ORYND", "", False)

        # Clean up stale command def
        existing = _ui.commandDefinitions.itemById(BUTTON_ID)
        if existing:
            existing.deleteMe()

        cmd_def = _ui.commandDefinitions.addButtonDefinition(
            BUTTON_ID,
            "ORYND",
            "Toggle ORYND AI assistant",
            str(_ADDON_DIR / "resources"),
        )
        created_handler = ToggleCommandCreatedHandler()
        cmd_def.commandCreated.add(created_handler)
        _handlers.append(created_handler)
        panel.controls.addCommand(cmd_def)

    except Exception:
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
