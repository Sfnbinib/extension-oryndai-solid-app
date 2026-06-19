from integrations.external_cad_extension.solidworks_coverage import (
    render_solidworks_runtime_checklist,
    solidworks_coverage_matrix,
)


def test_solidworks_coverage_matrix_mentions_all_catalog_commands():
    coverage = {item.command: item for item in solidworks_coverage_matrix()}
    for command in [
        "sketch",
        "circle",
        "rectangle",
        "extrude",
        "revolve",
        "cut",
        "hole",
        "pattern",
        "fillet",
        "chamfer",
        "mate",
        "export",
    ]:
        assert command in coverage


def test_solidworks_coverage_calls_out_weak_runtime_areas():
    coverage = {item.command: item.status for item in solidworks_coverage_matrix()}
    assert coverage["hole"] == "weak_helper_needs_face_selection_fix"
    assert coverage["pattern"] == "placeholder_helper_needs_real_feature_pattern"
    assert coverage["mate"] == "declaration_only_no_assembly_execution"


def test_solidworks_runtime_checklist_renders_markdown():
    markdown = render_solidworks_runtime_checklist()
    assert "# SolidWorks Runtime Verification Checklist" in markdown
    assert "| `extrude` |" in markdown
    assert "brake_disc" in markdown

