"""Markdown macro preview renderer."""

from __future__ import annotations

from .schema import OperationPlan


def render_preview_markdown(plan: OperationPlan, macro_code: str, validation: dict) -> str:
    lines = [
        f"# Macro Preview: {plan.name}",
        "",
        f"Prompt: {plan.prompt}",
        "",
        "## Operation Steps",
        "",
    ]
    for idx, op in enumerate(plan.operations, 1):
        desc = f" - {op.description}" if op.description else ""
        lines.append(f"{idx}. `{op.command}` `{op.id}`{desc}")
    lines.extend(["", "## Assumptions", ""])
    for item in plan.assumptions:
        lines.append(f"- {item}")
    lines.extend(["", "## Warnings", ""])
    if plan.warnings:
        for item in plan.warnings:
            lines.append(f"- {item}")
    else:
        lines.append("- None.")
    lines.extend(["", "## Validation", ""])
    lines.append(f"- ok: `{str(validation.get('ok', False)).lower()}`")
    for error in validation.get("errors", []):
        lines.append(f"- error: {error}")
    for warning in validation.get("warnings", []):
        lines.append(f"- warning: {warning}")
    lines.extend(["", "## Generated SolidWorks VBA Preview", "", "```vb", macro_code, "```", ""])
    return "\n".join(lines)

