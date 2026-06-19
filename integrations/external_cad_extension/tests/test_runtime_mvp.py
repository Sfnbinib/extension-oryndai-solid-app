import json
import subprocess
import sys

from integrations.external_cad_extension.runtime_mvp import (
    RUNTIME_MVP_COMMANDS,
    render_runtime_mvp_markdown,
    runtime_mvp_as_dict,
)


def test_runtime_mvp_is_small_and_result_focused():
    data = runtime_mvp_as_dict()
    names = {command["name"] for command in data["commands"]}
    assert 5 <= len(names) <= 10
    assert "extrude_boss" in names
    assert "extrude_cut" in names
    assert "export_step" in names
    assert "full F1 front wing" in data["not_mvp_yet"]


def test_runtime_mvp_markdown_calls_out_smoothness():
    markdown = render_runtime_mvp_markdown()
    assert "# Runtime MVP" in markdown
    assert "work smoothly in SolidWorks" in markdown
    assert "mounting bracket" in markdown


def test_cli_runtime_mvp():
    completed = subprocess.run(
        [sys.executable, "-m", "integrations.external_cad_extension.cli", "runtime-mvp"],
        check=False,
        capture_output=True,
        text=True,
    )
    assert completed.returncode == 0, completed.stderr + completed.stdout
    data = json.loads(completed.stdout)
    assert data["commands"][0]["name"] == RUNTIME_MVP_COMMANDS[0].name
