from integrations.external_cad_extension.catalog import COMMAND_CATALOG, catalog_as_dict
from integrations.external_cad_extension.examples import mounting_bracket_plan
from integrations.external_cad_extension.schema import Operation, OperationPlan
from integrations.external_cad_extension.solidworks_vba import emit_solidworks_vba
from integrations.external_cad_extension.validator import (
    validate_generation,
    validate_macro_text,
    validate_plan,
)


def test_catalog_contains_required_commands():
    required = {
        "sketch",
        "circle",
        "rectangle",
        "line",
        "extrude",
        "revolve",
        "cut",
        "hole",
        "pattern",
        "fillet",
        "chamfer",
        "mate",
        "export",
    }
    assert required.issubset(COMMAND_CATALOG)
    exported = catalog_as_dict()
    assert exported["hole"]["target_macro_call"] == "ORYND_Hole"
    assert exported["line"]["target_macro_call"] == "ORYND_Line"


def test_plan_roundtrip_and_validation():
    plan = mounting_bracket_plan()
    cloned = OperationPlan.from_dict(plan.to_dict())
    assert cloned.name == "mounting_bracket"
    report = validate_plan(cloned)
    assert report.ok, report.to_dict()


def test_validator_rejects_unknown_command():
    plan = OperationPlan(
        name="bad",
        prompt="bad",
        assumptions=["test assumption"],
        operations=[Operation("shell", "bad_shell", {"command": "rm -rf"})],
    )
    report = validate_plan(plan)
    assert not report.ok
    assert "not in the allowed catalog" in report.errors[0]


def test_validator_rejects_bad_dimensions():
    plan = OperationPlan(
        name="bad",
        prompt="bad",
        assumptions=["test assumption"],
        operations=[Operation("circle", "bad_circle", {"center": {"x": 0, "y": 0}, "radius": -1})],
    )
    report = validate_plan(plan)
    assert not report.ok
    assert any("circle.radius" in error for error in report.errors)


def test_macro_safety_rejects_shell_and_network_tokens():
    report = validate_macro_text('Sub main()\nShell "curl http://example.com"\nEnd Sub\n')
    assert not report.ok
    assert any("unsafe token" in error for error in report.errors)


def test_generated_mounting_bracket_passes_full_validation():
    plan = mounting_bracket_plan()
    macro = emit_solidworks_vba(plan)
    report = validate_generation(plan, macro)
    assert report.ok, report.to_dict()
    assert "ORYND_Rectangle" in macro
    assert "ORYND_Export" in macro


def test_line_operation_emits_catalog_macro_call():
    plan = OperationPlan(
        name="line_smoke",
        prompt="draw one line",
        assumptions=["Line smoke test uses millimeters."],
        operations=[
            Operation("sketch", "sketch_top", {"plane": "Top"}),
            Operation("line", "profile_edge", {"start": {"x": 0, "y": 0}, "end": {"x": 25, "y": 0}}),
            Operation("export", "export_step", {"format": "STEP", "filename": "line_smoke.step"}),
        ],
    )
    macro = emit_solidworks_vba(plan)
    report = validate_generation(plan, macro)
    assert report.ok, report.to_dict()
    assert "ORYND_Line swModel" in macro
