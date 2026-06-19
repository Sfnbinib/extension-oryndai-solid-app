"""SolidWorks production coverage helpers."""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Any

from .catalog import COMMAND_CATALOG


RUNTIME_VERIFICATION_STATUS: dict[str, str] = {
    "sketch": "needs_solidworks_runtime",
    "circle": "needs_solidworks_runtime",
    "rectangle": "needs_solidworks_runtime",
    "extrude": "needs_solidworks_runtime",
    "revolve": "needs_solidworks_runtime",
    "cut": "needs_solidworks_runtime",
    "hole": "weak_helper_needs_face_selection_fix",
    "pattern": "placeholder_helper_needs_real_feature_pattern",
    "fillet": "needs_selection_strategy",
    "chamfer": "needs_selection_strategy",
    "mate": "declaration_only_no_assembly_execution",
    "export": "needs_solidworks_runtime",
}


@dataclass(frozen=True)
class CoverageItem:
    command: str
    target_macro_call: str
    status: str
    runtime_test: str

    def to_dict(self) -> dict[str, Any]:
        return {
            "command": self.command,
            "target_macro_call": self.target_macro_call,
            "status": self.status,
            "runtime_test": self.runtime_test,
        }


def solidworks_coverage_matrix() -> list[CoverageItem]:
    items: list[CoverageItem] = []
    for command, spec in sorted(COMMAND_CATALOG.items()):
        status = RUNTIME_VERIFICATION_STATUS.get(command, "needs_solidworks_runtime")
        items.append(
            CoverageItem(
                command=command,
                target_macro_call=spec.target_macro_call,
                status=status,
                runtime_test=f"Create minimal part using {command}; rebuild; export STEP; visually inspect feature tree.",
            )
        )
    return items


def render_solidworks_runtime_checklist() -> str:
    lines = [
        "# SolidWorks Runtime Verification Checklist",
        "",
        "Run this on Windows with SolidWorks installed.",
        "",
        "| Command | Macro helper | Status | Runtime test |",
        "| --- | --- | --- | --- |",
    ]
    for item in solidworks_coverage_matrix():
        lines.append(f"| `{item.command}` | `{item.target_macro_call}` | `{item.status}` | {item.runtime_test} |")
    lines.extend(
        [
            "",
            "Required example runs:",
            "",
            "- brake_disc",
            "- spur_gear",
            "- f1_front_wing",
            "- mounting_bracket",
            "",
            "A command can move from `needs_solidworks_runtime` to `runtime_verified` only after the generated macro creates the expected feature in a real SolidWorks document.",
        ]
    )
    return "\n".join(lines) + "\n"


def write_solidworks_runtime_checklist(path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(render_solidworks_runtime_checklist(), encoding="utf-8")

