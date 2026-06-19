"""Planner recipes for common engineering objects.

These are not final geometry generators. They are structured construction
guides for model planners so prompts such as "make an F1 front wing" can become
clarifying questions and operation-plan steps instead of vague macro text.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any


@dataclass(frozen=True)
class ObjectRecipe:
    name: str
    aliases: tuple[str, ...]
    clarifying_questions: tuple[str, ...]
    construction_strategy: tuple[str, ...]
    useful_commands: tuple[str, ...]
    assumptions: tuple[str, ...]

    def to_dict(self) -> dict[str, Any]:
        return {
            "name": self.name,
            "aliases": list(self.aliases),
            "clarifying_questions": list(self.clarifying_questions),
            "construction_strategy": list(self.construction_strategy),
            "useful_commands": list(self.useful_commands),
            "assumptions": list(self.assumptions),
        }


RECIPES: dict[str, ObjectRecipe] = {
    "brake_disc": ObjectRecipe(
        name="brake_disc",
        aliases=("brake rotor", "vented disc", "тормозной диск"),
        clarifying_questions=(
            "Outer diameter, thickness, hub bore diameter, bolt pattern count/PCD?",
            "Solid rotor, vented rotor, drilled, slotted, or decorative preview?",
        ),
        construction_strategy=(
            "Sketch rotor cross-section and/or top profile.",
            "Create outer rotor body with hub bore.",
            "Cut center bore and bolt holes on bolt circle.",
            "Pattern holes circularly.",
            "Add chamfers/fillets and optional slots/vents.",
            "Export STEP after validation.",
        ),
        useful_commands=("create_sketch", "sketch_circle", "extrude_boss", "extrude_cut", "circular_pattern", "fillet", "chamfer", "export_step"),
        assumptions=("Units are mm.", "If dimensions are missing, ask before execution or use visible assumptions in preview."),
    ),
    "f1_front_wing": ObjectRecipe(
        name="f1_front_wing",
        aliases=("formula front wing", "f1 wing", "переднее антикрыло"),
        clarifying_questions=(
            "Which regulation era/year or visual style should be approximated?",
            "Do you need a simple visual model, manufacturable surfaces, or aerodynamic profile study?",
            "How many elements/flaps and endplates?",
        ),
        construction_strategy=(
            "Ask for era/year if absent because wing shape depends strongly on regulation generation.",
            "Create central reference planes and wing span envelope.",
            "Sketch airfoil-like profiles for main plane and upper flap.",
            "Loft or sweep surfaces/solids across span with slight angle of attack.",
            "Create endplates as side profiles with cutouts.",
            "Add mounting pylons, slots, and simple fastener holes.",
            "Mirror symmetric geometry if needed.",
            "Export STEP and keep assumptions visible.",
        ),
        useful_commands=(
            "reference_plane",
            "sketch_spline",
            "loft_surface",
            "thicken_surface",
            "extrude_boss",
            "extrude_cut",
            "mirror_feature",
            "fillet",
            "export_step",
        ),
        assumptions=("Default to simplified visual/parametric model unless manufacturable detail is requested.",),
    ),
    "spur_gear": ObjectRecipe(
        name="spur_gear",
        aliases=("gear", "straight gear", "шестерня"),
        clarifying_questions=(
            "Module, tooth count, pressure angle, face width, bore diameter?",
            "Do you need true involute teeth or simplified preview teeth?",
        ),
        construction_strategy=(
            "Compute pitch/root/outer diameters from module and tooth count.",
            "Sketch base circles and one tooth profile.",
            "Use circular pattern for teeth.",
            "Cut bore/keyway and optional lightening holes.",
            "Chamfer edges and export STEP.",
        ),
        useful_commands=("create_sketch", "sketch_circle", "sketch_line", "sketch_arc", "extrude_boss", "extrude_cut", "circular_pattern", "chamfer", "export_step"),
        assumptions=("Simplified teeth are acceptable for preview; true involute requires generated curve points.",),
    ),
    "mounting_bracket": ObjectRecipe(
        name="mounting_bracket",
        aliases=("bracket", "mount", "кронштейн"),
        clarifying_questions=("Plate size, thickness, hole diameter/count, bend/flange requirements?",),
        construction_strategy=(
            "Sketch base plate rectangle.",
            "Extrude thickness.",
            "Cut mounting holes.",
            "Add side flange or vertical tab if requested.",
            "Fillet/chamfer external edges.",
            "Export STEP.",
        ),
        useful_commands=("create_sketch", "sketch_rectangle", "extrude_boss", "simple_hole", "linear_pattern", "fillet", "chamfer", "export_step"),
        assumptions=("Default bracket is a simple flat mounting plate unless flanges are requested.",),
    ),
    "engine_assembly": ObjectRecipe(
        name="engine_assembly",
        aliases=("engine", "motor assembly", "двигатель"),
        clarifying_questions=(
            "Generate from scratch, search/import existing model, or decompose a provided mesh?",
            "Which engine type: piston, turbine, electric motor, simplified visual assembly?",
        ),
        construction_strategy=(
            "Prefer search/import for complex assemblies.",
            "If mesh/model is found, import/decompose into components.",
            "Create/insert major components: block/casing, shaft, rotors/gears/pistons, fasteners.",
            "Use assembly mates to position components.",
            "Generate missing simple components parametrically.",
            "Export assembly STEP and run interference/mass checks if available.",
        ),
        useful_commands=("open_document", "insert_component", "mate_concentric", "mate_coincident", "mate_distance", "circular_pattern", "measure_mass_properties", "export_step"),
        assumptions=("Complex engine geometry should not be generated purely from scratch unless simplified visual output is acceptable.",),
    ),
}


def recipes_as_dict() -> dict[str, dict[str, Any]]:
    return {name: recipe.to_dict() for name, recipe in RECIPES.items()}


def render_recipes_markdown() -> str:
    lines = ["# CAD Object Recipes", ""]
    for recipe in RECIPES.values():
        lines.extend([f"## {recipe.name}", "", "Clarifying questions:"])
        lines.extend(f"- {item}" for item in recipe.clarifying_questions)
        lines.append("")
        lines.append("Construction strategy:")
        lines.extend(f"{idx}. {item}" for idx, item in enumerate(recipe.construction_strategy, start=1))
        lines.append("")
        lines.append("Useful commands:")
        lines.append(", ".join(f"`{item}`" for item in recipe.useful_commands))
        lines.append("")
    return "\n".join(lines)

