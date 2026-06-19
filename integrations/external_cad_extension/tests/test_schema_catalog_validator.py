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
        prompt="draw one line marker on a rectangular plate",
        assumptions=["Line smoke test uses millimeters and creates a body before export."],
        operations=[
            Operation("sketch", "sketch_top", {"plane": "Top"}),
            Operation("line", "profile_edge", {"start": {"x": 0, "y": 0}, "end": {"x": 25, "y": 0}}),
            Operation("rectangle", "plate_profile", {"center": {"x": 0, "y": 0}, "width": 30, "height": 10}),
            Operation("extrude", "plate_body", {"depth": 2}),
            Operation("export", "export_step", {"format": "STEP", "filename": "line_smoke.step"}),
        ],
    )
    macro = emit_solidworks_vba(plan)
    report = validate_generation(plan, macro)
    assert report.ok, report.to_dict()
    assert "ORYND_Line swModel" in macro


def test_validator_rejects_geometry_before_sketch():
    plan = OperationPlan(
        name="bad_order",
        prompt="draw without sketch",
        assumptions=["test assumption"],
        operations=[
            Operation("circle", "circle_without_sketch", {"center": {"x": 0, "y": 0}, "radius": 10}),
            Operation("extrude", "body", {"depth": 2}),
        ],
    )
    report = validate_plan(plan)
    assert not report.ok
    assert any("requires an active sketch" in error for error in report.errors)


def test_validator_rejects_hole_before_solid_body():
    plan = OperationPlan(
        name="bad_hole_order",
        prompt="cut a hole before body",
        assumptions=["test assumption"],
        operations=[
            Operation("sketch", "sketch_top", {"plane": "Top"}),
            Operation("hole", "floating_hole", {"center": {"x": 0, "y": 0}, "diameter": 5, "through_all": True}),
        ],
    )
    report = validate_plan(plan)
    assert not report.ok
    assert any("requires a solid body" in error for error in report.errors)


def test_validator_rejects_hole_outside_known_body_profile():
    plan = OperationPlan(
        name="bad_hole_position",
        prompt="hole outside plate",
        assumptions=["test assumption"],
        operations=[
            Operation("sketch", "sketch_top", {"plane": "Top"}),
            Operation("rectangle", "plate_profile", {"center": {"x": 0, "y": 0}, "width": 20, "height": 10}),
            Operation("extrude", "plate_body", {"depth": 2}),
            Operation("hole", "outside_hole", {"center": {"x": 20, "y": 0}, "diameter": 5, "through_all": True}),
        ],
    )
    report = validate_plan(plan)
    assert not report.ok
    assert any("does not fit inside known solid profile" in error for error in report.errors)


def test_validator_rejects_missing_pattern_target():
    plan = OperationPlan(
        name="bad_pattern_target",
        prompt="pattern missing thing",
        assumptions=["test assumption"],
        operations=[
            Operation("sketch", "sketch_top", {"plane": "Top"}),
            Operation("circle", "outer", {"center": {"x": 0, "y": 0}, "radius": 50}),
            Operation("extrude", "body", {"depth": 5}),
            Operation(
                "pattern",
                "bad_pattern",
                {"pattern_type": "circular", "count": 5, "radius": 25, "axis": "Z", "target_ref": "missing_hole"},
            ),
        ],
    )
    report = validate_plan(plan)
    assert not report.ok
    assert any("must reference an earlier operation id" in error for error in report.errors)


def test_validator_rejects_circular_pattern_radius_mismatch():
    plan = OperationPlan(
        name="bad_pattern_radius",
        prompt="pattern hole on wrong radius",
        assumptions=["test assumption"],
        operations=[
            Operation("sketch", "sketch_top", {"plane": "Top"}),
            Operation("circle", "outer", {"center": {"x": 0, "y": 0}, "radius": 50}),
            Operation("extrude", "body", {"depth": 5}),
            Operation("hole", "bolt_1", {"center": {"x": 30, "y": 0}, "diameter": 5, "through_all": True}),
            Operation(
                "pattern",
                "bad_pattern",
                {"pattern_type": "circular", "count": 5, "radius": 20, "axis": "Z", "target_ref": "bolt_1"},
            ),
        ],
    )
    report = validate_plan(plan)
    assert not report.ok
    assert any("does not match target hole radius" in error for error in report.errors)
