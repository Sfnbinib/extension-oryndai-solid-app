import json
import subprocess
import sys

from integrations.external_cad_extension.ai_model_4_adapter import (
    coreops_to_operation_plan,
    primitives_to_operation_plan,
)
from integrations.external_cad_extension.solidworks_vba import emit_solidworks_vba
from integrations.external_cad_extension.validator import validate_generation


def _supported_ai_doc():
    return {
        "operations": [
            {
                "op": "box",
                "params": {"size": [20, 10, 5]},
                "transform": {"center": [0, 0, 2.5], "axes": [[1, 0, 0], [0, 1, 0], [0, 0, 1]]},
            },
            {
                "op": "cylinder",
                "params": {"radius": 3, "height": 8},
                "transform": {"center": [18, 0, 4], "axis": [0, 0, 1]},
            },
        ]
    }


def test_ai_model_4_primitives_convert_to_valid_operation_plan():
    result = primitives_to_operation_plan(_supported_ai_doc(), name="ai4_supported")
    assert result.ok is True
    commands = [op.command for op in result.operation_plan.operations]
    assert "rectangle" in commands
    assert "circle" in commands
    assert commands.count("extrude") == 2
    assert commands[-1] == "export"

    macro = emit_solidworks_vba(result.operation_plan)
    validation = validate_generation(result.operation_plan, macro)
    assert validation.ok, validation.to_dict()


def test_ai_model_4_unsupported_primitives_fail_honestly():
    result = primitives_to_operation_plan({"operations": [{"op": "sphere", "params": {"radius": 5}, "transform": {}}]})
    assert result.ok is False
    assert result.operation_plan.operations == []
    assert any("No supported" in note for note in result.notes)


def test_coreops_to_operation_plan_maps_cut_hole_and_fillet():
    coreops = {
        "units": "mm",
        "operations": [
            {
                "op": "CreateSketch",
                "id": "sketch1",
                "plane": "XY",
                "shapes": [{"type": "rect", "center": {"x": 0, "y": 0}, "width": 40, "height": 12}],
            },
            {"op": "Extrude", "id": "body1", "sketch_ref": "sketch1", "height": 6},
            {"op": "CutHole", "id": "hole1", "center": {"x": 0, "y": 0}, "radius": 2.25, "through": True},
            {"op": "Fillet", "id": "fillet1", "radius": 1},
        ],
        "meta": {"source_op_count": 1, "bodies_built": 1, "translation_notes": []},
    }
    plan, notes = coreops_to_operation_plan(coreops, name="coreops_bracket", prompt="test")
    assert not notes
    commands = [op.command for op in plan.operations]
    assert commands == ["sketch", "rectangle", "extrude", "hole", "fillet", "export"]


def test_cli_ai4_primitives_writes_artifacts(tmp_path):
    input_json = tmp_path / "ai4.json"
    input_json.write_text(json.dumps(_supported_ai_doc()), encoding="utf-8")
    cmd = [
        sys.executable,
        "-m",
        "integrations.external_cad_extension.cli",
        "ai4-primitives",
        "--input-json",
        str(input_json),
        "--name",
        "ai4_cli_part",
        "--out-dir",
        str(tmp_path),
    ]
    completed = subprocess.run(cmd, check=False, capture_output=True, text=True)
    assert completed.returncode == 0, completed.stderr + completed.stdout
    assert (tmp_path / "ai4_cli_part.operation_plan.json").exists()
    assert (tmp_path / "ai4_cli_part.solidworks.bas").exists()
    data = json.loads(completed.stdout)
    assert data["validation"]["ok"] is True

