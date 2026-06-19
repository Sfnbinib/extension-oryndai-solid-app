"""Deterministic demo examples for the offline prototype."""

from __future__ import annotations

import math

from .schema import Operation, OperationPlan


def _circle_holes(prefix: str, count: int, bolt_circle_dia: float, hole_dia: float) -> list[Operation]:
    radius = bolt_circle_dia / 2.0
    holes: list[Operation] = []
    for idx in range(count):
        angle = 2.0 * math.pi * idx / count
        holes.append(
            Operation(
                command="hole",
                id=f"{prefix}_{idx + 1}",
                args={
                    "center": {
                        "x": round(math.cos(angle) * radius, 3),
                        "y": round(math.sin(angle) * radius, 3),
                    },
                    "diameter": hole_dia,
                    "through_all": True,
                },
                description=f"Through hole {idx + 1} on {bolt_circle_dia} mm bolt circle",
            )
        )
    return holes


def brake_disc_plan() -> OperationPlan:
    operations = [
        Operation("sketch", "disc_sketch", {"plane": "Top"}, "Sketch rotor outer circle"),
        Operation("circle", "outer_disc", {"center": {"x": 0, "y": 0}, "radius": 140}, "Outer diameter 280 mm"),
        Operation("extrude", "disc_body", {"depth": 28}, "Extrude rotor thickness"),
        Operation("hole", "center_bore", {"center": {"x": 0, "y": 0}, "diameter": 61, "through_all": True}, "Center bore"),
        Operation("hole", "vent_inner", {"center": {"x": 0, "y": 0}, "diameter": 182, "through_all": True}, "Simplified annular vent relief"),
        *_circle_holes("bolt", 5, 115, 12),
        Operation("pattern", "bolt_pattern", {"pattern_type": "circular", "count": 5, "radius": 57.5, "axis": "Z", "target_ref": "bolt_1"}, "Bolt-hole pattern declaration"),
        Operation("fillet", "edge_softening", {"radius": 1.5, "selection": "outer_edges"}, "Soften rotor edges"),
        Operation("export", "export_step", {"format": "STEP", "filename": "brake_disc.step"}, "Export editable STEP"),
    ]
    return OperationPlan(
        name="brake_disc",
        prompt="Create a ventilated brake disc diameter 280 mm, thickness 28 mm, center bore 61 mm, 5 bolt holes.",
        operations=operations,
        assumptions=[
            "All dimensions are in mm.",
            "Bolt circle diameter assumed 115 mm because the prompt only specified 5 bolt holes.",
            "Ventilation is represented as a simplified annular relief for the first offline prototype.",
            "SolidWorks execution will require user approval after preview.",
        ],
        warnings=[
            "This is a simplified parametric rotor, not a certified automotive brake component.",
            "Thermal vanes and material constraints need research/model adapter support later.",
        ],
    )


def spur_gear_plan() -> OperationPlan:
    teeth = 24
    module = 2.0
    pitch_diameter = teeth * module
    outer_diameter = pitch_diameter + 2 * module
    operations = [
        Operation("sketch", "gear_blank_sketch", {"plane": "Top"}, "Sketch simplified gear blank"),
        Operation("circle", "gear_outer", {"center": {"x": 0, "y": 0}, "radius": outer_diameter / 2}, "Outer gear diameter"),
        Operation("extrude", "gear_body", {"depth": 8}, "Extrude gear thickness"),
        Operation("hole", "gear_bore", {"center": {"x": 0, "y": 0}, "diameter": 8, "through_all": True}, "Central bore"),
        Operation("pattern", "tooth_pattern", {"pattern_type": "circular", "count": teeth, "radius": outer_diameter / 2, "axis": "Z", "target_ref": "gear_outer"}, "Declare tooth pattern for future involute generator"),
        Operation("chamfer", "tooth_edge_break", {"distance": 0.4, "selection": "tooth_edges"}, "Small edge break"),
        Operation("export", "export_step", {"format": "STEP", "filename": "spur_gear.step"}, "Export editable STEP"),
    ]
    return OperationPlan(
        name="spur_gear",
        prompt="Create a 24 tooth spur gear, module 2, thickness 8 mm, bore 8 mm.",
        operations=operations,
        assumptions=[
            "Pitch diameter is module * teeth = 48 mm.",
            "Outer diameter is pitch diameter + 2 * module = 52 mm.",
            "The first prototype declares a tooth pattern but does not generate true involute geometry in VBA.",
        ],
        warnings=[
            "Use a true involute tooth adapter before manufacturing or mating with real gears.",
        ],
    )


def f1_front_wing_plan() -> OperationPlan:
    operations = [
        Operation("sketch", "main_plane", {"plane": "Front"}, "Sketch main wing planform"),
        Operation("rectangle", "main_airfoil_proxy", {"center": {"x": 0, "y": 0}, "width": 620, "height": 42}, "Simplified main airfoil envelope"),
        Operation("extrude", "main_airfoil_body", {"depth": 80, "symmetric": True}, "Create simplified main plane"),
        Operation("sketch", "left_endplate_sketch", {"plane": "Right"}, "Sketch left endplate"),
        Operation("rectangle", "left_endplate_profile", {"center": {"x": -330, "y": 0}, "width": 6, "height": 120}, "Left endplate"),
        Operation("extrude", "left_endplate", {"depth": 90}, "Extrude left endplate"),
        Operation("sketch", "right_endplate_sketch", {"plane": "Right"}, "Sketch right endplate"),
        Operation("rectangle", "right_endplate_profile", {"center": {"x": 330, "y": 0}, "width": 6, "height": 120}, "Right endplate"),
        Operation("extrude", "right_endplate", {"depth": 90}, "Extrude right endplate"),
        Operation("sketch", "pylon_sketch", {"plane": "Top"}, "Sketch two mounting pylons"),
        Operation("rectangle", "pylon_left", {"center": {"x": -55, "y": 0}, "width": 18, "height": 80}, "Left pylon"),
        Operation("rectangle", "pylon_right", {"center": {"x": 55, "y": 0}, "width": 18, "height": 80}, "Right pylon"),
        Operation("extrude", "pylons", {"depth": 60}, "Extrude pylons"),
        Operation("hole", "mount_hole_1", {"center": {"x": -55, "y": -25}, "diameter": 6, "through_all": True}, "Mount hole 1"),
        Operation("hole", "mount_hole_2", {"center": {"x": -55, "y": 25}, "diameter": 6, "through_all": True}, "Mount hole 2"),
        Operation("hole", "mount_hole_3", {"center": {"x": 55, "y": -25}, "diameter": 6, "through_all": True}, "Mount hole 3"),
        Operation("hole", "mount_hole_4", {"center": {"x": 55, "y": 25}, "diameter": 6, "through_all": True}, "Mount hole 4"),
        Operation("fillet", "aero_softening", {"radius": 3, "selection": "outer_edges"}, "Softened visual edges"),
        Operation("export", "export_step", {"format": "STEP", "filename": "f1_front_wing.step"}, "Export editable STEP"),
    ]
    return OperationPlan(
        name="f1_front_wing",
        prompt="Create a simplified F1 front wing with main airfoil, two side endplates, mounting pylons, and 4 mounting holes.",
        operations=operations,
        assumptions=[
            "This is a simplified visual/mechanical envelope, not an aerodynamic solver output.",
            "Main plane width assumed 620 mm for demo scale.",
            "Airfoil curvature is approximated with rectangular/extruded proxy geometry in this offline macro prototype.",
        ],
        warnings=[
            "Real airfoil surfaces should come from research/image/mesh adapters or a surface modeling macro.",
        ],
    )


def mounting_bracket_plan() -> OperationPlan:
    operations = [
        Operation("sketch", "bracket_sketch", {"plane": "Top"}, "Sketch bracket base"),
        Operation("rectangle", "bracket_rect", {"center": {"x": 0, "y": 0}, "width": 160, "height": 38}, "160 x 38 mm base rectangle"),
        Operation("extrude", "bracket_body", {"depth": 6}, "Extrude 6 mm thickness"),
        Operation("hole", "m4_hole_left", {"center": {"x": -55, "y": 0}, "diameter": 4.5, "through_all": True}, "M4 clearance hole left"),
        Operation("hole", "m4_hole_right", {"center": {"x": 55, "y": 0}, "diameter": 4.5, "through_all": True}, "M4 clearance hole right"),
        Operation("fillet", "bracket_fillets", {"radius": 2, "selection": "all_edges"}, "2 mm fillets"),
        Operation("export", "export_step", {"format": "STEP", "filename": "mounting_bracket.step"}, "Export editable STEP"),
    ]
    return OperationPlan(
        name="mounting_bracket",
        prompt="Create a 160 x 38 x 6 mm mounting bracket with two M4 holes and 2 mm fillets.",
        operations=operations,
        assumptions=[
            "M4 clearance hole diameter assumed 4.5 mm.",
            "Hole centers assumed at +/-55 mm along the length.",
            "All dimensions are in mm.",
        ],
        warnings=[],
    )


EXAMPLES = {
    "brake_disc": brake_disc_plan,
    "spur_gear": spur_gear_plan,
    "f1_front_wing": f1_front_wing_plan,
    "mounting_bracket": mounting_bracket_plan,
}
