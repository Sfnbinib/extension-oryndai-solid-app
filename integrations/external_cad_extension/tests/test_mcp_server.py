import json
import subprocess
import sys

from integrations.external_cad_extension.mcp_server import handle_request


def test_mcp_initialize_and_tools_list_direct():
    init = handle_request({"jsonrpc": "2.0", "id": 1, "method": "initialize", "params": {}})
    assert init["result"]["serverInfo"]["name"] == "orynd-cad-bridge"

    tools = handle_request({"jsonrpc": "2.0", "id": 2, "method": "tools/list", "params": {}})
    names = {tool["name"] for tool in tools["result"]["tools"]}
    assert {
        "list_catalog",
        "run_scenario",
        "generate_macro",
        "validate_macro",
        "entitlement",
        "supabase_status",
        "supabase_check",
        "solidworks_coverage",
        "solidworks_language",
        "object_recipes",
        "gencad_status",
    }.issubset(names)


def test_mcp_run_scenario_direct():
    response = handle_request(
        {
            "jsonrpc": "2.0",
            "id": 3,
            "method": "tools/call",
            "params": {
                "name": "run_scenario",
                "arguments": {"prompt": "I want a brake disc with 5 bolt holes."},
            },
        }
    )
    text = response["result"]["content"][0]["text"]
    data = json.loads(text)
    assert data["scenario"] == "brake_disc"
    assert data["validation"]["ok"] is True
    assert data["research"]["search_queries"]


def test_mcp_generate_and_validate_macro_direct():
    generated = handle_request(
        {
            "jsonrpc": "2.0",
            "id": 4,
            "method": "tools/call",
            "params": {
                "name": "generate_macro",
                "arguments": {"example": "mounting_bracket", "include_code": True},
            },
        }
    )
    data = json.loads(generated["result"]["content"][0]["text"])
    assert data["validation"]["ok"] is True
    assert "ORYND_Rectangle" in data["macro_code"]

    validated = handle_request(
        {
            "jsonrpc": "2.0",
            "id": 5,
            "method": "tools/call",
            "params": {"name": "validate_macro", "arguments": {"macro_code": data["macro_code"]}},
        }
    )
    report = json.loads(validated["result"]["content"][0]["text"])
    assert report["ok"] is True


def test_mcp_server_subprocess_roundtrip():
    requests = [
        {"jsonrpc": "2.0", "id": 1, "method": "initialize", "params": {}},
        {"jsonrpc": "2.0", "id": 2, "method": "tools/list", "params": {}},
        {
            "jsonrpc": "2.0",
            "id": 3,
            "method": "tools/call",
            "params": {
                "name": "generate_macro",
                "arguments": {"example": "brake_disc", "include_code": False},
            },
        },
    ]
    payload = "\n".join(json.dumps(item) for item in requests) + "\n"
    completed = subprocess.run(
        [sys.executable, "-m", "integrations.external_cad_extension.mcp_server"],
        input=payload,
        capture_output=True,
        text=True,
        check=False,
        timeout=10,
    )
    assert completed.returncode == 0, completed.stderr + completed.stdout
    lines = [json.loads(line) for line in completed.stdout.splitlines()]
    assert lines[0]["result"]["serverInfo"]["name"] == "orynd-cad-bridge"
    assert any(tool["name"] == "run_scenario" for tool in lines[1]["result"]["tools"])
    data = json.loads(lines[2]["result"]["content"][0]["text"])
    assert data["operation_plan"]["name"] == "brake_disc"
    assert data["validation"]["ok"] is True
