import json
import subprocess
import sys
from pathlib import Path

from integrations.external_cad_extension.examples import EXAMPLES
from integrations.external_cad_extension.generator import generate
from integrations.external_cad_extension.preview import render_preview_markdown
from integrations.external_cad_extension.validator import validate_generation


EXPECTED_COMMANDS = {
    "brake_disc": {"sketch", "circle", "extrude", "hole", "pattern", "fillet", "export"},
    "spur_gear": {"sketch", "circle", "extrude", "hole", "pattern", "chamfer", "export"},
    "f1_front_wing": {"sketch", "rectangle", "extrude", "hole", "fillet", "export"},
    "mounting_bracket": {"sketch", "rectangle", "extrude", "hole", "fillet", "export"},
}


def test_all_examples_generate_valid_artifacts():
    for example in EXAMPLES:
        result = generate(example=example)
        validation = validate_generation(result.plan, result.macro_code)
        assert validation.ok, (example, validation.to_dict())
        commands = {op.command for op in result.plan.operations}
        assert EXPECTED_COMMANDS[example].issubset(commands)
        preview = render_preview_markdown(result.plan, result.macro_code, validation.to_dict())
        assert "Generated SolidWorks VBA Preview" in preview
        assert f"Macro Preview: {example}" in preview
        assert "Option Explicit" in result.macro_code


def test_cli_writes_four_expected_files(tmp_path):
    cmd = [
        sys.executable,
        "-m",
        "integrations.external_cad_extension.cli",
        "--example",
        "brake_disc",
        "--out-dir",
        str(tmp_path),
    ]
    completed = subprocess.run(cmd, check=False, capture_output=True, text=True)
    assert completed.returncode == 0, completed.stderr + completed.stdout

    plan_path = tmp_path / "brake_disc.operation_plan.json"
    macro_path = tmp_path / "brake_disc.solidworks.bas"
    validation_path = tmp_path / "brake_disc.validation.json"
    preview_path = tmp_path / "brake_disc.preview.md"
    for path in (plan_path, macro_path, validation_path, preview_path):
        assert path.exists(), path

    validation = json.loads(validation_path.read_text(encoding="utf-8"))
    assert validation["ok"] is True
    assert "ORYND_Hole" in macro_path.read_text(encoding="utf-8")
    assert "Macro Preview: brake_disc" in preview_path.read_text(encoding="utf-8")


def test_cli_writes_solidworks_smoke_package(tmp_path):
    cmd = [
        sys.executable,
        "-m",
        "integrations.external_cad_extension.cli",
        "solidworks-smoke-package",
        "--example",
        "mounting_bracket",
        "--out-dir",
        str(tmp_path),
    ]
    completed = subprocess.run(cmd, check=False, capture_output=True, text=True)
    assert completed.returncode == 0, completed.stderr + completed.stdout

    payload = json.loads(completed.stdout)
    assert payload["ok"] is True
    assert payload["solidworks_runtime_status"] == "not_verified"
    assert (tmp_path / "mounting_bracket.operation_plan.json").exists()
    assert (tmp_path / "mounting_bracket.solidworks.bas").exists()
    assert (tmp_path / "mounting_bracket.validation.json").exists()
    assert (tmp_path / "mounting_bracket.preview.md").exists()
    readme = (tmp_path / "README_SOLIDWORKS_SMOKE_TEST.md").read_text(encoding="utf-8")
    assert "Required manual QA" in readme
    assert "runtime_verified" in readme
