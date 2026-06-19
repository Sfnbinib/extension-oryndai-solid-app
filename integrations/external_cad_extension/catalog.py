"""Constrained command catalog for macro generation.

The model is only allowed to plan with these commands. Macro emitters map them
to SolidWorks VBA-style helper calls instead of letting model output call
arbitrary APIs directly.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any


@dataclass(frozen=True)
class ArgumentSpec:
    name: str
    kind: str
    required: bool = True
    min_value: float | None = None
    max_value: float | None = None
    choices: tuple[str, ...] = ()
    description: str = ""


@dataclass(frozen=True)
class CommandSpec:
    name: str
    description: str
    args: tuple[ArgumentSpec, ...]
    target_macro_call: str
    safety: tuple[str, ...] = field(default_factory=tuple)

    def required_args(self) -> set[str]:
        return {arg.name for arg in self.args if arg.required}


COMMAND_CATALOG: dict[str, CommandSpec] = {
    "sketch": CommandSpec(
        name="sketch",
        description="Create/select a sketch plane in the target CAD document.",
        args=(
            ArgumentSpec("plane", "str", choices=("Front", "Top", "Right")),
            ArgumentSpec("origin", "point3", required=False),
        ),
        target_macro_call="ORYND_CreateSketch",
        safety=("no document deletion", "no external calls"),
    ),
    "circle": CommandSpec(
        name="circle",
        description="Add a circle to the active sketch.",
        args=(
            ArgumentSpec("center", "point2"),
            ArgumentSpec("radius", "number", min_value=0.001),
        ),
        target_macro_call="ORYND_Circle",
    ),
    "rectangle": CommandSpec(
        name="rectangle",
        description="Add a centered rectangle to the active sketch.",
        args=(
            ArgumentSpec("center", "point2"),
            ArgumentSpec("width", "number", min_value=0.001),
            ArgumentSpec("height", "number", min_value=0.001),
        ),
        target_macro_call="ORYND_Rectangle",
    ),
    "extrude": CommandSpec(
        name="extrude",
        description="Extrude the active sketch into a solid feature.",
        args=(
            ArgumentSpec("depth", "number", min_value=0.001),
            ArgumentSpec("symmetric", "bool", required=False),
        ),
        target_macro_call="ORYND_Extrude",
    ),
    "revolve": CommandSpec(
        name="revolve",
        description="Revolve the active sketch around an axis.",
        args=(
            ArgumentSpec("axis", "str", choices=("X", "Y", "Z")),
            ArgumentSpec("angle_deg", "number", min_value=0.001, max_value=360.0),
        ),
        target_macro_call="ORYND_Revolve",
    ),
    "cut": CommandSpec(
        name="cut",
        description="Cut the active sketch into the current solid.",
        args=(
            ArgumentSpec("depth", "number", required=False, min_value=0.001),
            ArgumentSpec("through_all", "bool", required=False),
        ),
        target_macro_call="ORYND_Cut",
    ),
    "hole": CommandSpec(
        name="hole",
        description="Create a round through/blind hole on the selected face.",
        args=(
            ArgumentSpec("center", "point2"),
            ArgumentSpec("diameter", "number", min_value=0.001),
            ArgumentSpec("through_all", "bool", required=False),
            ArgumentSpec("depth", "number", required=False, min_value=0.001),
        ),
        target_macro_call="ORYND_Hole",
    ),
    "pattern": CommandSpec(
        name="pattern",
        description="Pattern a referenced operation linearly or circularly.",
        args=(
            ArgumentSpec("pattern_type", "str", choices=("circular", "linear")),
            ArgumentSpec("count", "int", min_value=2, max_value=360),
            ArgumentSpec("radius", "number", required=False, min_value=0.001),
            ArgumentSpec("axis", "str", required=False, choices=("X", "Y", "Z")),
            ArgumentSpec("target_ref", "str"),
        ),
        target_macro_call="ORYND_Pattern",
    ),
    "fillet": CommandSpec(
        name="fillet",
        description="Apply a fillet to selected/all edges.",
        args=(
            ArgumentSpec("radius", "number", min_value=0.001),
            ArgumentSpec("selection", "str", required=False),
        ),
        target_macro_call="ORYND_Fillet",
    ),
    "chamfer": CommandSpec(
        name="chamfer",
        description="Apply a chamfer to selected/all edges.",
        args=(
            ArgumentSpec("distance", "number", min_value=0.001),
            ArgumentSpec("selection", "str", required=False),
        ),
        target_macro_call="ORYND_Chamfer",
    ),
    "mate": CommandSpec(
        name="mate",
        description="Declare an assembly mate for future add-in execution.",
        args=(
            ArgumentSpec("mate_type", "str", choices=("coincident", "concentric", "parallel", "distance")),
            ArgumentSpec("entity_a", "str"),
            ArgumentSpec("entity_b", "str"),
            ArgumentSpec("distance", "number", required=False, min_value=0.0),
        ),
        target_macro_call="ORYND_Mate",
    ),
    "export": CommandSpec(
        name="export",
        description="Export the active model to an approved CAD format.",
        args=(
            ArgumentSpec("format", "str", choices=("STEP", "STL", "OBJ")),
            ArgumentSpec("filename", "str"),
        ),
        target_macro_call="ORYND_Export",
        safety=("export path must be explicit", "no delete/overwrite without later user approval"),
    ),
}


UNSAFE_MACRO_TOKENS = (
    "Shell",
    "CreateObject(\"WScript.Shell\"",
    "WScript.Shell",
    "WinHttp",
    "XMLHTTP",
    "URLDownloadToFile",
    "Kill ",
    "RmDir",
    "FileSystemObject",
    "Open ",
    "Put #",
    "Get #",
    "Declare PtrSafe",
    "Declare Function",
    "Environ(",
    "CreateObject(\"Scripting.FileSystemObject\"",
)


def catalog_as_dict() -> dict[str, dict[str, Any]]:
    return {
        name: {
            "description": spec.description,
            "target_macro_call": spec.target_macro_call,
            "safety": list(spec.safety),
            "args": [
                {
                    "name": arg.name,
                    "kind": arg.kind,
                    "required": arg.required,
                    "min_value": arg.min_value,
                    "max_value": arg.max_value,
                    "choices": list(arg.choices),
                    "description": arg.description,
                }
                for arg in spec.args
            ],
        }
        for name, spec in COMMAND_CATALOG.items()
    }

