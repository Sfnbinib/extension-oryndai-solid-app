"""Engineering decomposition from research facts into CAD construction steps."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

from .research import ResearchPacket


@dataclass(frozen=True)
class Component:
    name: str
    role: str
    cad_features: list[str]
    included_in_plan: bool = True

    def to_dict(self) -> dict[str, Any]:
        return {
            "name": self.name,
            "role": self.role,
            "cad_features": list(self.cad_features),
            "included_in_plan": self.included_in_plan,
        }


@dataclass(frozen=True)
class ConstructionStep:
    order: int
    intent: str
    operation_hint: str
    rationale: str

    def to_dict(self) -> dict[str, Any]:
        return {
            "order": self.order,
            "intent": self.intent,
            "operation_hint": self.operation_hint,
            "rationale": self.rationale,
        }


@dataclass(frozen=True)
class ConceptDecomposition:
    object_key: str
    summary: str
    components: list[Component]
    construction_steps: list[ConstructionStep]
    assumptions: list[str] = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        return {
            "object_key": self.object_key,
            "summary": self.summary,
            "components": [component.to_dict() for component in self.components],
            "construction_steps": [step.to_dict() for step in self.construction_steps],
            "assumptions": list(self.assumptions),
        }


def decompose_research(prompt: str, research: ResearchPacket) -> ConceptDecomposition:
    if research.object_key == "brake_disc":
        return brake_disc_decomposition(prompt, research)
    return ConceptDecomposition(
        object_key=research.object_key,
        summary="No deterministic decomposition is available for this object.",
        components=[],
        construction_steps=[],
        assumptions=["Use a model adapter or add a deterministic scenario for this object."],
    )


def brake_disc_decomposition(prompt: str, research: ResearchPacket) -> ConceptDecomposition:
    include_caliper = "caliper" in prompt.lower() or "суппорт" in prompt.lower()
    components = [
        Component(
            name="rotor_disc",
            role="main rotating brake disc body",
            cad_features=["outer circle", "extrude thickness", "edge fillet"],
        ),
        Component(
            name="center_bore",
            role="hub alignment opening",
            cad_features=["through hole at origin"],
        ),
        Component(
            name="bolt_hole_pattern",
            role="hub fastening holes",
            cad_features=["equally spaced through holes", "circular pattern around Z axis"],
        ),
        Component(
            name="ventilation_relief",
            role="first-pass representation of a vented rotor",
            cad_features=["annular cut or repeated vent cuts"],
        ),
        Component(
            name="caliper_proxy",
            role="separate clamping/support component",
            cad_features=["bridge body", "mounting lugs", "mounting holes"],
            included_in_plan=include_caliper,
        ),
    ]
    steps = [
        ConstructionStep(1, "Create rotor base sketch", "sketch + circle", "A rotor starts as a circular profile."),
        ConstructionStep(2, "Create rotor solid", "extrude", "Rotor thickness is a straight extrusion from the base sketch."),
        ConstructionStep(3, "Cut center bore", "hole", "The center bore is coaxial with the rotor axis."),
        ConstructionStep(4, "Cut ventilation relief", "hole/cut", "Offline MVP uses a simplified annular cut/relief."),
        ConstructionStep(5, "Cut bolt holes", "hole + circular pattern", "Bolt holes are equally spaced around the center."),
        ConstructionStep(6, "Finish edges", "fillet/chamfer", "Small edge treatment improves the generated part."),
        ConstructionStep(7, "Export editable CAD", "export STEP", "STEP is the target review/exchange format."),
    ]
    if include_caliper:
        steps.insert(
            6,
            ConstructionStep(
                6,
                "Add simplified caliper proxy",
                "sketch + rectangle + extrude + holes",
                "The user asked for caliper context; model it as a separate simplified component.",
            ),
        )

    return ConceptDecomposition(
        object_key="brake_disc",
        summary=(
            "A brake disc scenario decomposes into a circular rotor, center bore, bolt-hole pattern, "
            "ventilation relief, edge finishing, and optionally a separate caliper proxy."
        ),
        components=components,
        construction_steps=steps,
        assumptions=[
            "Dimensions default to the deterministic brake-disc demo when the prompt is underspecified.",
            "Caliper geometry is generated only when explicitly requested.",
            "Production vane geometry requires a stronger model/search adapter or CAD-specific surface routine.",
        ],
    )

