"""Expanded SolidWorks command language for model planning.

This is the planner-facing language pack. It is intentionally broader than the
currently executable macro catalog. Every command carries a runtime status so
the model can plan with richer vocabulary without pretending all commands are
already implemented in the macro runner.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any


@dataclass(frozen=True)
class SolidWorksLanguageCommand:
    name: str
    group: str
    purpose: str
    args: tuple[str, ...]
    api_hint: str
    runtime_status: str = "planned_not_implemented"

    def to_dict(self) -> dict[str, Any]:
        return {
            "name": self.name,
            "group": self.group,
            "purpose": self.purpose,
            "args": list(self.args),
            "api_hint": self.api_hint,
            "runtime_status": self.runtime_status,
        }


def _cmd(
    name: str,
    group: str,
    purpose: str,
    args: tuple[str, ...],
    api_hint: str,
    runtime_status: str = "planned_not_implemented",
) -> SolidWorksLanguageCommand:
    return SolidWorksLanguageCommand(name, group, purpose, args, api_hint, runtime_status)


SOLIDWORKS_LANGUAGE: tuple[SolidWorksLanguageCommand, ...] = (
    _cmd("new_part", "document", "Create a new part document.", ("template",), "ISldWorks.NewPart", "scaffolded_vba"),
    _cmd("new_assembly", "document", "Create a new assembly document.", ("template",), "ISldWorks.NewAssembly"),
    _cmd("open_document", "document", "Open an existing CAD document.", ("path", "document_type"), "ISldWorks.OpenDoc6"),
    _cmd("save_document", "document", "Save current document.", ("path",), "IModelDoc2.SaveAs3", "scaffolded_vba"),
    _cmd("set_units", "document", "Set document units.", ("length_unit", "angle_unit"), "IModelDocExtension.SetUserPreference*"),
    _cmd("rebuild", "document", "Rebuild model.", (), "IModelDoc2.ForceRebuild3"),
    _cmd("select_plane", "selection", "Select standard/named plane.", ("plane_name",), "IModelDocExtension.SelectByID2", "scaffolded_vba"),
    _cmd("select_face", "selection", "Select face by name, ray, or coordinates.", ("selector",), "IModelDocExtension.SelectByRay"),
    _cmd("select_edge", "selection", "Select edge by name or ray.", ("selector",), "IModelDocExtension.SelectByRay"),
    _cmd("select_feature", "selection", "Select feature by name.", ("feature_name",), "IModelDocExtension.SelectByID2"),
    _cmd("clear_selection", "selection", "Clear active selection.", (), "IModelDoc2.ClearSelection2"),
    _cmd("create_sketch", "sketch", "Start sketch on selected plane/face.", ("plane_or_face_ref",), "ISketchManager.InsertSketch", "scaffolded_vba"),
    _cmd("close_sketch", "sketch", "Exit current sketch.", (), "ISketchManager.InsertSketch"),
    _cmd("sketch_line", "sketch_geometry", "Create line segment.", ("start", "end"), "ISketchManager.CreateLine"),
    _cmd("sketch_centerline", "sketch_geometry", "Create construction centerline.", ("start", "end"), "ISketchManager.CreateCenterLine"),
    _cmd("sketch_circle", "sketch_geometry", "Create sketch circle.", ("center", "radius"), "ISketchManager.CreateCircleByRadius", "scaffolded_vba"),
    _cmd("sketch_rectangle", "sketch_geometry", "Create centered rectangle.", ("center", "width", "height"), "ISketchManager.CreateCenterRectangle", "scaffolded_vba"),
    _cmd("sketch_arc", "sketch_geometry", "Create arc.", ("center", "start", "end", "direction"), "ISketchManager.CreateArc"),
    _cmd("sketch_ellipse", "sketch_geometry", "Create ellipse.", ("center", "major", "minor"), "ISketchManager.CreateEllipse"),
    _cmd("sketch_spline", "sketch_geometry", "Create spline through points.", ("points",), "ISketchManager.CreateSpline"),
    _cmd("sketch_slot", "sketch_geometry", "Create straight/arc slot.", ("slot_type", "points", "width"), "ISketchManager.CreateSketchSlot"),
    _cmd("sketch_polygon", "sketch_geometry", "Create regular polygon.", ("center", "radius", "sides"), "ISketchManager.CreatePolygon"),
    _cmd("sketch_text", "sketch_geometry", "Create text for emboss/engrave.", ("text", "position", "height"), "ISketchManager.CreateText"),
    _cmd("offset_entities", "sketch_edit", "Offset sketch entities.", ("distance", "reverse"), "ISketchManager.SketchOffset2"),
    _cmd("trim_entities", "sketch_edit", "Trim sketch entities.", ("mode", "point"), "ISketchManager.SketchTrim"),
    _cmd("convert_entities", "sketch_edit", "Project selected edges into sketch.", ("selection_ref",), "ISketchManager.SketchUseEdge3"),
    _cmd("add_relation", "sketch_relation", "Add sketch relation.", ("relation_type", "entities"), "ISketchRelationManager.AddRelation"),
    _cmd("add_dimension", "dimension", "Add driving dimension.", ("dimension_type", "entities", "value"), "IModelDoc2.AddDimension2"),
    _cmd("edit_dimension", "dimension", "Edit named dimension value.", ("dimension_name", "value"), "IDimension.SystemValue"),
    _cmd("add_equation", "dimension", "Add equation-driven relation.", ("equation",), "IEquationMgr.Add3"),
    _cmd("extrude_boss", "solid_feature", "Extrude sketch into solid.", ("depth", "end_condition", "direction"), "IFeatureManager.FeatureExtrusion2", "scaffolded_vba"),
    _cmd("extrude_cut", "solid_feature", "Cut sketch into solid.", ("depth", "through_all"), "IFeatureManager.FeatureCut4", "scaffolded_vba"),
    _cmd("revolve_boss", "solid_feature", "Revolve sketch into solid.", ("axis_ref", "angle_deg"), "IFeatureManager.FeatureRevolve2", "placeholder_vba"),
    _cmd("revolve_cut", "solid_feature", "Revolve sketch as cut.", ("axis_ref", "angle_deg"), "IFeatureManager.FeatureRevolve2"),
    _cmd("sweep_boss", "solid_feature", "Sweep profile along path.", ("profile_ref", "path_ref"), "IFeatureManager.InsertProtrusionSwept4"),
    _cmd("sweep_cut", "solid_feature", "Sweep cut profile along path.", ("profile_ref", "path_ref"), "IFeatureManager.InsertCutSwept4"),
    _cmd("loft_boss", "solid_feature", "Loft between profiles.", ("profile_refs", "guide_curves"), "IFeatureManager.InsertProtrusionBlend2"),
    _cmd("loft_cut", "solid_feature", "Loft cut between profiles.", ("profile_refs", "guide_curves"), "IFeatureManager.InsertCutBlend"),
    _cmd("shell", "solid_feature", "Hollow solid body.", ("thickness", "removed_faces"), "IFeatureManager.InsertFeatureShell"),
    _cmd("draft", "solid_feature", "Apply draft angle.", ("angle_deg", "neutral_plane", "faces"), "IFeatureManager.InsertDraft"),
    _cmd("rib", "solid_feature", "Create rib from sketch.", ("thickness", "direction"), "IFeatureManager.InsertRib"),
    _cmd("mirror_feature", "solid_feature", "Mirror selected features.", ("feature_refs", "mirror_plane"), "IFeatureManager.InsertMirrorFeature"),
    _cmd("combine_bodies", "body", "Add/subtract/common bodies.", ("operation", "body_refs"), "IFeatureManager.InsertCombineFeature"),
    _cmd("move_copy_body", "body", "Move or copy solid body.", ("body_ref", "transform"), "IFeatureManager.InsertMoveCopyBody2"),
    _cmd("hole_wizard", "hole", "Create standard hole.", ("hole_type", "diameter", "depth", "positions"), "IFeatureManager.HoleWizard*"),
    _cmd("simple_hole", "hole", "Create simple round hole.", ("center", "diameter", "depth", "through_all"), "sketch circle + FeatureCut", "weak_helper_needs_face_selection_fix"),
    _cmd("linear_pattern", "pattern", "Linear feature/body pattern.", ("target_ref", "direction", "spacing", "count"), "IFeatureManager.FeatureLinearPattern*"),
    _cmd("circular_pattern", "pattern", "Circular feature/body pattern.", ("target_ref", "axis_ref", "angle", "count"), "IFeatureManager.FeatureCircularPattern*"),
    _cmd("curve_pattern", "pattern", "Pattern along curve.", ("target_ref", "curve_ref", "count"), "IFeatureManager.InsertCurveDrivenPattern"),
    _cmd("fillet", "edge_feature", "Apply edge fillet.", ("radius", "edge_refs"), "IFeatureManager.FeatureFillet3", "needs_selection_strategy"),
    _cmd("chamfer", "edge_feature", "Apply edge chamfer.", ("distance", "edge_refs"), "IFeatureManager.InsertFeatureChamfer", "needs_selection_strategy"),
    _cmd("reference_plane", "reference_geometry", "Create reference plane.", ("definition",), "IFeatureManager.InsertRefPlane"),
    _cmd("reference_axis", "reference_geometry", "Create reference axis.", ("definition",), "IFeatureManager.InsertRefAxis"),
    _cmd("coordinate_system", "reference_geometry", "Create coordinate system.", ("origin", "axes"), "IFeatureManager.InsertCoordinateSystem"),
    _cmd("boundary_surface", "surface", "Create boundary surface.", ("profile_refs", "guide_refs"), "IFeatureManager.InsertBoundarySurface"),
    _cmd("loft_surface", "surface", "Create loft surface.", ("profile_refs", "guide_refs"), "IFeatureManager.InsertLoftRefSurface"),
    _cmd("fill_surface", "surface", "Fill bounded surface.", ("edge_refs",), "IFeatureManager.InsertFillSurface"),
    _cmd("knit_surface", "surface", "Knit surfaces.", ("surface_refs",), "IFeatureManager.InsertKnitSurface"),
    _cmd("thicken_surface", "surface", "Thicken surface into solid.", ("surface_ref", "thickness"), "IFeatureManager.InsertThicken"),
    _cmd("insert_component", "assembly", "Insert part/component into assembly.", ("path", "transform"), "IAssemblyDoc.AddComponent5"),
    _cmd("mate_coincident", "assembly", "Create coincident mate.", ("entity_a", "entity_b"), "IAssemblyDoc.AddMate5", "declaration_only_no_assembly_execution"),
    _cmd("mate_concentric", "assembly", "Create concentric mate.", ("entity_a", "entity_b"), "IAssemblyDoc.AddMate5", "declaration_only_no_assembly_execution"),
    _cmd("mate_distance", "assembly", "Create distance mate.", ("entity_a", "entity_b", "distance"), "IAssemblyDoc.AddMate5", "declaration_only_no_assembly_execution"),
    _cmd("fix_component", "assembly", "Fix assembly component.", ("component_ref",), "IAssemblyDoc.FixComponent"),
    _cmd("component_pattern", "assembly", "Pattern assembly component.", ("component_ref", "pattern_definition"), "IAssemblyDoc.FeatureManager.*"),
    _cmd("assign_material", "properties", "Assign material to body/part.", ("material_database", "material_name"), "IPartDoc.SetMaterialPropertyName2"),
    _cmd("set_appearance", "properties", "Set color/appearance.", ("target_ref", "appearance"), "IModelDocExtension.DisplayStateSpecMaterialPropertyValues"),
    _cmd("set_custom_property", "properties", "Set custom property.", ("name", "value"), "ICustomPropertyManager.Add3", "scaffolded_vba"),
    _cmd("measure_mass_properties", "analysis", "Evaluate mass properties.", (), "IModelDocExtension.CreateMassProperty"),
    _cmd("interference_check", "analysis", "Check assembly interference.", ("component_refs",), "IAssemblyDoc.ToolsCheckInterference2"),
    _cmd("create_drawing", "drawing", "Create drawing document.", ("template",), "ISldWorks.NewDocument"),
    _cmd("insert_model_view", "drawing", "Insert drawing view from model.", ("model_path", "view_name", "position"), "IDrawingDoc.CreateDrawViewFromModelView3"),
    _cmd("insert_projected_view", "drawing", "Insert projected drawing view.", ("base_view_ref", "position"), "IDrawingDoc.CreateUnfoldedViewAt3"),
    _cmd("insert_model_annotations", "drawing", "Import dimensions/annotations.", ("source",), "IDrawingDoc.InsertModelAnnotations3"),
    _cmd("insert_bom", "drawing", "Insert BOM table.", ("anchor", "template"), "IView.InsertBomTable4"),
    _cmd("export_step", "export", "Export STEP.", ("filename",), "IModelDocExtension.SaveAs", "scaffolded_vba"),
    _cmd("export_stl", "export", "Export STL.", ("filename", "resolution"), "IModelDocExtension.SaveAs", "scaffolded_vba"),
    _cmd("export_pdf", "export", "Export drawing PDF.", ("filename",), "IModelDocExtension.SaveAs"),
    _cmd("export_dxf", "export", "Export drawing/sketch DXF.", ("filename",), "IModelDocExtension.SaveAs"),
)


def language_as_dict() -> list[dict[str, Any]]:
    return [command.to_dict() for command in SOLIDWORKS_LANGUAGE]


def language_by_group() -> dict[str, list[dict[str, Any]]]:
    grouped: dict[str, list[dict[str, Any]]] = {}
    for command in SOLIDWORKS_LANGUAGE:
        grouped.setdefault(command.group, []).append(command.to_dict())
    return grouped


def render_language_markdown() -> str:
    lines = ["# SolidWorks Planner Command Language", ""]
    for group, commands in language_by_group().items():
        lines.extend([f"## {group}", "", "| Command | Runtime status | API hint | Purpose |", "| --- | --- | --- | --- |"])
        for command in commands:
            lines.append(
                f"| `{command['name']}` | `{command['runtime_status']}` | `{command['api_hint']}` | {command['purpose']} |"
            )
        lines.append("")
    return "\n".join(lines)

