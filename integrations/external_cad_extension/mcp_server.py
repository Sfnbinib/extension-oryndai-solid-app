"""Minimal stdio MCP server for ORYND CAD Bridge.

This implementation intentionally avoids third-party dependencies so it can run
inside the prototype environment. It implements the MCP JSON-RPC methods needed
by common clients:

- initialize
- tools/list
- tools/call

Run:
    python -m integrations.external_cad_extension.mcp_server
"""

from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Any, Callable

from .catalog import catalog_as_dict
from .ai_model_4_adapter import primitives_to_operation_plan
from .env_config import load_supabase_config
from .gencad_adapter import GenCADConfig, gencad_status
from .generator import generate
from .object_recipes import recipes_as_dict, render_recipes_markdown
from .orchestrator import render_scenario_markdown, run_scenario
from .preview import render_preview_markdown
from .runtime_mvp import render_runtime_mvp_markdown, runtime_mvp_as_dict
from .settings import entitlement_gate, load_settings
from .solidworks_coverage import render_solidworks_runtime_checklist, solidworks_coverage_matrix
from .solidworks_command_language import language_as_dict, language_by_group, render_language_markdown
from .supabase_client import default_supabase_client
from .validator import validate_generation, validate_macro_text


SERVER_NAME = "orynd-cad-bridge"
SERVER_VERSION = "0.1.0"


def _schema(properties: dict[str, Any], required: list[str] | None = None) -> dict[str, Any]:
    return {
        "type": "object",
        "properties": properties,
        "required": required or [],
        "additionalProperties": False,
    }


TOOLS: dict[str, dict[str, Any]] = {
    "list_catalog": {
        "name": "list_catalog",
        "description": "Return the constrained CAD command catalog available to the planner.",
        "inputSchema": _schema({}),
    },
    "run_scenario": {
        "name": "run_scenario",
        "description": "Run prompt -> research packet -> decomposition -> operation plan -> macro -> validation.",
        "inputSchema": _schema(
            {
                "prompt": {"type": "string"},
                "scenario": {"type": "string", "enum": ["auto", "brake_disc"], "default": "auto"},
                "include_markdown": {"type": "boolean", "default": False},
            },
            ["prompt"],
        ),
    },
    "generate_macro": {
        "name": "generate_macro",
        "description": "Generate an operation plan, SolidWorks VBA-style macro, preview, and validation report.",
        "inputSchema": _schema(
            {
                "prompt": {"type": "string"},
                "example": {
                    "type": "string",
                    "enum": ["brake_disc", "spur_gear", "f1_front_wing", "mounting_bracket"],
                },
                "research_context": {"type": "string"},
                "image_context": {"type": "string"},
                "mesh_context": {"type": "string"},
                "include_code": {"type": "boolean", "default": True},
            },
        ),
    },
    "validate_macro": {
        "name": "validate_macro",
        "description": "Static-check generated macro text for unsafe tokens and catalog helper usage.",
        "inputSchema": _schema({"macro_code": {"type": "string"}}, ["macro_code"]),
    },
    "entitlement": {
        "name": "entitlement",
        "description": "Return local prototype account/trial/subscription gate status.",
        "inputSchema": _schema({"settings_path": {"type": "string"}}),
    },
    "settings_show": {
        "name": "settings_show",
        "description": "Return local prototype account/subscription/model settings with secrets masked.",
        "inputSchema": _schema({"settings_path": {"type": "string"}}),
    },
    "supabase_status": {
        "name": "supabase_status",
        "description": "Return masked Supabase environment readiness without exposing raw keys.",
        "inputSchema": _schema({"env_path": {"type": "string"}}),
    },
    "supabase_check": {
        "name": "supabase_check",
        "description": "Check Supabase REST table availability. Requires valid local .env.",
        "inputSchema": _schema(
            {
                "table": {"type": "string", "default": "cad_bridge_runs"},
                "backend": {"type": "boolean", "default": False},
            }
        ),
    },
    "solidworks_coverage": {
        "name": "solidworks_coverage",
        "description": "Return SolidWorks command runtime verification coverage and checklist.",
        "inputSchema": _schema({"include_markdown": {"type": "boolean", "default": False}}),
    },
    "solidworks_language": {
        "name": "solidworks_language",
        "description": "Return expanded planner-facing SolidWorks command language with runtime statuses.",
        "inputSchema": _schema(
            {
                "grouped": {"type": "boolean", "default": True},
                "include_markdown": {"type": "boolean", "default": False},
            }
        ),
    },
    "object_recipes": {
        "name": "object_recipes",
        "description": "Return construction recipes and clarifying questions for common CAD objects.",
        "inputSchema": _schema({"include_markdown": {"type": "boolean", "default": False}}),
    },
    "runtime_mvp": {
        "name": "runtime_mvp",
        "description": "Return the small command set that must work smoothly in real SolidWorks first.",
        "inputSchema": _schema({"include_markdown": {"type": "boolean", "default": False}}),
    },
    "gencad_status": {
        "name": "gencad_status",
        "description": "Check whether external GenCAD repo/checkpoints are installed and ready.",
        "inputSchema": _schema({"repo_path": {"type": "string"}}),
    },
    "ai4_primitives_to_plan": {
        "name": "ai4_primitives_to_plan",
        "description": "Convert ORYND AI Model 4 primitive JSON into operation plan, macro preview, and validation.",
        "inputSchema": _schema(
            {
                "ai_model_4_doc": {"type": "object"},
                "name": {"type": "string"},
                "include_code": {"type": "boolean", "default": True},
            },
            ["ai_model_4_doc"],
        ),
    },
}


def _content_json(data: Any) -> dict[str, Any]:
    return {
        "content": [
            {
                "type": "text",
                "text": json.dumps(data, indent=2, ensure_ascii=False),
            }
        ]
    }


def _tool_list_catalog(_: dict[str, Any]) -> dict[str, Any]:
    return _content_json({"catalog": catalog_as_dict()})


def _tool_run_scenario(args: dict[str, Any]) -> dict[str, Any]:
    result = run_scenario(str(args["prompt"]), scenario=str(args.get("scenario", "auto")))
    payload = result.to_dict()
    if args.get("include_markdown", False):
        payload["scenario_markdown"] = render_scenario_markdown(result)
    return _content_json(payload)


def _tool_generate_macro(args: dict[str, Any]) -> dict[str, Any]:
    result = generate(
        prompt=args.get("prompt"),
        example=args.get("example"),
        research_context=args.get("research_context"),
        image_context=args.get("image_context"),
        mesh_context=args.get("mesh_context"),
    )
    validation = validate_generation(result.plan, result.macro_code)
    payload = {
        "operation_plan": result.plan.to_dict(),
        "validation": validation.to_dict(),
        "preview_markdown": render_preview_markdown(result.plan, result.macro_code, validation.to_dict()),
    }
    if args.get("include_code", True):
        payload["macro_code"] = result.macro_code
    return _content_json(payload)


def _tool_validate_macro(args: dict[str, Any]) -> dict[str, Any]:
    return _content_json(validate_macro_text(str(args["macro_code"])).to_dict())


def _settings_path(args: dict[str, Any]) -> Path | None:
    value = args.get("settings_path")
    return Path(value) if value else None


def _tool_entitlement(args: dict[str, Any]) -> dict[str, Any]:
    path = _settings_path(args)
    return _content_json(entitlement_gate(path=path) if path else entitlement_gate())


def _tool_settings_show(args: dict[str, Any]) -> dict[str, Any]:
    path = _settings_path(args)
    settings = load_settings(path) if path else load_settings()
    return _content_json(settings.to_dict())


def _tool_supabase_status(args: dict[str, Any]) -> dict[str, Any]:
    env_path = Path(args["env_path"]) if args.get("env_path") else Path("integrations/external_cad_extension/.env")
    return _content_json(load_supabase_config(env_path).to_status())


def _tool_supabase_check(args: dict[str, Any]) -> dict[str, Any]:
    response = default_supabase_client(use_backend_key=bool(args.get("backend", False))).check_table(
        str(args.get("table") or "cad_bridge_runs")
    )
    return _content_json(response.to_dict())


def _tool_solidworks_coverage(args: dict[str, Any]) -> dict[str, Any]:
    payload: dict[str, Any] = {"coverage": [item.to_dict() for item in solidworks_coverage_matrix()]}
    if args.get("include_markdown", False):
        payload["checklist_markdown"] = render_solidworks_runtime_checklist()
    return _content_json(payload)


def _tool_solidworks_language(args: dict[str, Any]) -> dict[str, Any]:
    payload: dict[str, Any] = {"groups": language_by_group()} if args.get("grouped", True) else {"commands": language_as_dict()}
    if args.get("include_markdown", False):
        payload["markdown"] = render_language_markdown()
    return _content_json(payload)


def _tool_object_recipes(args: dict[str, Any]) -> dict[str, Any]:
    payload: dict[str, Any] = {"recipes": recipes_as_dict()}
    if args.get("include_markdown", False):
        payload["markdown"] = render_recipes_markdown()
    return _content_json(payload)


def _tool_runtime_mvp(args: dict[str, Any]) -> dict[str, Any]:
    payload = runtime_mvp_as_dict()
    if args.get("include_markdown", False):
        payload["markdown"] = render_runtime_mvp_markdown()
    return _content_json(payload)


def _tool_gencad_status(args: dict[str, Any]) -> dict[str, Any]:
    repo_path = Path(args["repo_path"]) if args.get("repo_path") else Path("integrations/GenCAD")
    return _content_json(gencad_status(GenCADConfig(repo_path=repo_path)).to_dict())


def _tool_ai4_primitives_to_plan(args: dict[str, Any]) -> dict[str, Any]:
    from .solidworks_vba import emit_solidworks_vba

    result = primitives_to_operation_plan(args["ai_model_4_doc"], name=args.get("name", "ai_model_4_part"))
    macro_code = emit_solidworks_vba(result.operation_plan)
    validation = validate_generation(result.operation_plan, macro_code)
    payload = {
        "adapter": result.to_dict(),
        "validation": validation.to_dict(),
        "preview_markdown": render_preview_markdown(result.operation_plan, macro_code, validation.to_dict()),
    }
    if args.get("include_code", True):
        payload["macro_code"] = macro_code
    return _content_json(payload)


TOOL_HANDLERS: dict[str, Callable[[dict[str, Any]], dict[str, Any]]] = {
    "list_catalog": _tool_list_catalog,
    "run_scenario": _tool_run_scenario,
    "generate_macro": _tool_generate_macro,
    "validate_macro": _tool_validate_macro,
    "entitlement": _tool_entitlement,
    "settings_show": _tool_settings_show,
    "supabase_status": _tool_supabase_status,
    "supabase_check": _tool_supabase_check,
    "solidworks_coverage": _tool_solidworks_coverage,
    "solidworks_language": _tool_solidworks_language,
    "object_recipes": _tool_object_recipes,
    "runtime_mvp": _tool_runtime_mvp,
    "gencad_status": _tool_gencad_status,
    "ai4_primitives_to_plan": _tool_ai4_primitives_to_plan,
}


def handle_request(request: dict[str, Any]) -> dict[str, Any] | None:
    method = request.get("method")
    request_id = request.get("id")

    if method == "notifications/initialized":
        return None
    if method == "initialize":
        return {
            "jsonrpc": "2.0",
            "id": request_id,
            "result": {
                "protocolVersion": "2025-06-18",
                "capabilities": {"tools": {}},
                "serverInfo": {"name": SERVER_NAME, "version": SERVER_VERSION},
            },
        }
    if method == "tools/list":
        return {
            "jsonrpc": "2.0",
            "id": request_id,
            "result": {"tools": list(TOOLS.values())},
        }
    if method == "tools/call":
        params = request.get("params", {}) or {}
        name = params.get("name")
        args = params.get("arguments", {}) or {}
        if name not in TOOL_HANDLERS:
            return _error(request_id, -32602, f"Unknown tool: {name}")
        try:
            result = TOOL_HANDLERS[name](args)
        except Exception as exc:
            return _error(request_id, -32000, str(exc))
        return {"jsonrpc": "2.0", "id": request_id, "result": result}
    if request_id is None:
        return None
    return _error(request_id, -32601, f"Method not found: {method}")


def _error(request_id: Any, code: int, message: str) -> dict[str, Any]:
    return {"jsonrpc": "2.0", "id": request_id, "error": {"code": code, "message": message}}


def serve(input_stream: Any = sys.stdin, output_stream: Any = sys.stdout) -> None:
    for line in input_stream:
        line = line.strip()
        if not line:
            continue
        try:
            request = json.loads(line)
            response = handle_request(request)
        except Exception as exc:
            response = _error(None, -32700, f"Parse error: {exc}")
        if response is not None:
            output_stream.write(json.dumps(response, ensure_ascii=False) + "\n")
            output_stream.flush()


def main() -> int:
    serve()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
