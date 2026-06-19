"""Runtime MVP profile.

Smooth CAD copilot demos come from a small set of reliable actions, not a huge
unverified command list. This module defines the first commands that must work
in real SolidWorks before expanding further.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any


@dataclass(frozen=True)
class RuntimeMvpCommand:
    name: str
    why_it_matters: str
    proof_required: str
    current_status: str

    def to_dict(self) -> dict[str, Any]:
        return {
            "name": self.name,
            "why_it_matters": self.why_it_matters,
            "proof_required": self.proof_required,
            "current_status": self.current_status,
        }


RUNTIME_MVP_COMMANDS: tuple[RuntimeMvpCommand, ...] = (
    RuntimeMvpCommand(
        "create_part",
        "Every generation needs a clean SolidWorks document target.",
        "New part opens; ORYND custom property is written; rebuild succeeds.",
        "scaffolded_not_verified",
    ),
    RuntimeMvpCommand(
        "create_sketch_on_plane",
        "Most parametric parts start from a sketch.",
        "Top/Front/Right plane sketch opens and closes without errors.",
        "scaffolded_not_verified",
    ),
    RuntimeMvpCommand(
        "draw_circle_rectangle_line",
        "Brake discs, brackets, hubs, plates, and many profiles need basic sketch geometry.",
        "Circle, rectangle, and line appear in feature tree/sketch.",
        "circle_rectangle_scaffolded_line_missing",
    ),
    RuntimeMvpCommand(
        "extrude_boss",
        "Turns sketches into visible solid bodies.",
        "Mounting bracket base extrudes to expected thickness.",
        "scaffolded_not_verified",
    ),
    RuntimeMvpCommand(
        "extrude_cut",
        "Creates holes, slots, bores, and negative features.",
        "Through hole/center bore cuts expected faces.",
        "scaffolded_not_verified",
    ),
    RuntimeMvpCommand(
        "circular_pattern_or_explicit_repeat",
        "Brake disc holes and gear teeth need repeated geometry.",
        "Five brake-disc bolt holes appear at correct PCD. Can be true pattern or explicit repeated cuts for MVP.",
        "pattern_placeholder_use_explicit_repeat_first",
    ),
    RuntimeMvpCommand(
        "fillet_chamfer_basic",
        "Makes demo parts look engineered instead of raw blocks.",
        "Selected outer edges get visible fillet/chamfer without selecting random edges.",
        "weak_selection_strategy",
    ),
    RuntimeMvpCommand(
        "export_step",
        "A demo must produce a portable CAD output.",
        "STEP file is written and can be reopened.",
        "scaffolded_not_verified",
    ),
)


RUNTIME_MVP_EXAMPLES: tuple[str, ...] = ("mounting_bracket", "brake_disc_basic")


def runtime_mvp_as_dict() -> dict[str, Any]:
    return {
        "principle": "Make a small number of CAD actions feel reliable before expanding the catalog.",
        "commands": [command.to_dict() for command in RUNTIME_MVP_COMMANDS],
        "examples": list(RUNTIME_MVP_EXAMPLES),
        "not_mvp_yet": [
            "full F1 front wing",
            "engine assembly decomposition",
            "drawing automation",
            "GenCAD image reconstruction",
            "full command inventory execution",
        ],
    }


def render_runtime_mvp_markdown() -> str:
    lines = [
        "# Runtime MVP",
        "",
        "The first release should prove a few CAD actions work smoothly in SolidWorks.",
        "",
        "| Command | Current status | Proof required |",
        "| --- | --- | --- |",
    ]
    for command in RUNTIME_MVP_COMMANDS:
        lines.append(f"| `{command.name}` | `{command.current_status}` | {command.proof_required} |")
    lines.extend(
        [
            "",
            "MVP examples:",
            "",
            "- mounting bracket",
            "- basic brake disc",
            "",
            "Do not expand marketing claims beyond these until they run in real SolidWorks.",
        ]
    )
    return "\n".join(lines) + "\n"

