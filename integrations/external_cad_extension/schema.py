"""Operation plan schema for the external CAD extension prototype.

The schema is intentionally plain Python so the prototype has no runtime
dependency beyond the standard library. Plans are JSON-serializable dictionaries
with millimeter units and explicit assumptions.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any


SUPPORTED_UNITS = "mm"


@dataclass(frozen=True)
class Operation:
    """Single constrained CAD operation."""

    command: str
    id: str
    args: dict[str, Any] = field(default_factory=dict)
    description: str = ""
    target: str | None = None

    def to_dict(self) -> dict[str, Any]:
        data: dict[str, Any] = {
            "command": self.command,
            "id": self.id,
            "args": self.args,
        }
        if self.description:
            data["description"] = self.description
        if self.target:
            data["target"] = self.target
        return data


@dataclass(frozen=True)
class OperationPlan:
    """Converged CAD plan used by macro generation and validation."""

    name: str
    prompt: str
    operations: list[Operation]
    assumptions: list[str]
    warnings: list[str] = field(default_factory=list)
    units: str = SUPPORTED_UNITS
    version: str = "0.1"
    source: str = "deterministic_template"
    research_context: str | None = None
    image_context: str | None = None
    mesh_context: str | None = None

    def to_dict(self) -> dict[str, Any]:
        data: dict[str, Any] = {
            "version": self.version,
            "name": self.name,
            "source": self.source,
            "units": self.units,
            "prompt": self.prompt,
            "assumptions": list(self.assumptions),
            "warnings": list(self.warnings),
            "operations": [op.to_dict() for op in self.operations],
        }
        if self.research_context:
            data["research_context"] = self.research_context
        if self.image_context:
            data["image_context"] = self.image_context
        if self.mesh_context:
            data["mesh_context"] = self.mesh_context
        return data

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> "OperationPlan":
        operations = [
            Operation(
                command=str(raw.get("command", "")),
                id=str(raw.get("id", "")),
                args=dict(raw.get("args", {}) or {}),
                description=str(raw.get("description", "") or ""),
                target=raw.get("target"),
            )
            for raw in data.get("operations", [])
        ]
        return cls(
            version=str(data.get("version", "0.1")),
            name=str(data.get("name", "unnamed")),
            source=str(data.get("source", "unknown")),
            units=str(data.get("units", SUPPORTED_UNITS)),
            prompt=str(data.get("prompt", "")),
            assumptions=[str(item) for item in data.get("assumptions", [])],
            warnings=[str(item) for item in data.get("warnings", [])],
            operations=operations,
            research_context=data.get("research_context"),
            image_context=data.get("image_context"),
            mesh_context=data.get("mesh_context"),
        )


def is_positive_number(value: Any) -> bool:
    return isinstance(value, (int, float)) and not isinstance(value, bool) and value > 0


def is_non_negative_number(value: Any) -> bool:
    return isinstance(value, (int, float)) and not isinstance(value, bool) and value >= 0

