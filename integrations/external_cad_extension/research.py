"""Research/search layer for scenario orchestration.

The first implementation is an offline research pack. It behaves like the
contract a future search agent must satisfy: search queries, source summaries,
extracted engineering facts, missing dimensions, and CAD-relevant implications.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any


@dataclass(frozen=True)
class ResearchSource:
    title: str
    source_type: str
    summary: str
    facts: list[str] = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        return {
            "title": self.title,
            "source_type": self.source_type,
            "summary": self.summary,
            "facts": list(self.facts),
        }


@dataclass(frozen=True)
class ResearchPacket:
    object_key: str
    search_needed: bool
    search_queries: list[str]
    sources: list[ResearchSource]
    extracted_facts: list[str]
    cad_implications: list[str]
    missing_inputs: list[str]
    confidence: float

    def to_dict(self) -> dict[str, Any]:
        return {
            "object_key": self.object_key,
            "search_needed": self.search_needed,
            "search_queries": list(self.search_queries),
            "sources": [source.to_dict() for source in self.sources],
            "extracted_facts": list(self.extracted_facts),
            "cad_implications": list(self.cad_implications),
            "missing_inputs": list(self.missing_inputs),
            "confidence": self.confidence,
        }

    def to_context_text(self) -> str:
        lines = [
            f"object_key: {self.object_key}",
            f"search_needed: {self.search_needed}",
            "extracted_facts:",
        ]
        lines.extend(f"- {fact}" for fact in self.extracted_facts)
        lines.append("cad_implications:")
        lines.extend(f"- {item}" for item in self.cad_implications)
        if self.missing_inputs:
            lines.append("missing_inputs:")
            lines.extend(f"- {item}" for item in self.missing_inputs)
        return "\n".join(lines)


class OfflineResearchAgent:
    """Deterministic fallback for testing the research contract."""

    def research(self, prompt: str) -> ResearchPacket:
        normalized = (prompt or "").lower()
        if "brake" in normalized or "тормозн" in normalized or "диск" in normalized:
            return brake_disc_research_packet(prompt)
        return ResearchPacket(
            object_key="unknown",
            search_needed=True,
            search_queries=[prompt],
            sources=[],
            extracted_facts=[],
            cad_implications=[],
            missing_inputs=["Object type was not recognized by offline research fallback."],
            confidence=0.0,
        )


def brake_disc_research_packet(prompt: str) -> ResearchPacket:
    include_caliper = "caliper" in prompt.lower() or "суппорт" in prompt.lower()
    sources = [
        ResearchSource(
            title="Offline engineering knowledge: disc brake rotor",
            source_type="offline_knowledge_base",
            summary="A brake disc/rotor is a circular plate mounted to a hub, with a center bore and bolt pattern.",
            facts=[
                "Rotor body is circular and usually modeled from an outer circle extruded to thickness.",
                "The hub interface uses a center bore and equally spaced bolt holes.",
                "Vented rotors contain air gaps or vane geometry between friction faces.",
            ],
        ),
        ResearchSource(
            title="Offline engineering knowledge: disc brake assembly",
            source_type="offline_knowledge_base",
            summary="A full brake assembly can also include a caliper that clamps around the rotor.",
            facts=[
                "The caliper is a separate assembly component, not part of the rotor body.",
                "A simplified caliper can be represented by a U-shaped bridge and mounting lugs.",
                "Caliper placement needs clearance around the rotor edge.",
            ],
        ),
    ]
    facts = [
        "Primary geometry is a round rotor disc.",
        "Required CAD features: base circle, extrusion, center bore, bolt-hole circle, edge finishing.",
        "For a ventilated disc, first-pass macro can represent ventilation as an annular relief or repeated slots.",
        "Bolt holes should be equally spaced around the center axis.",
    ]
    implications = [
        "Start with a Top-plane sketch and outer circle.",
        "Extrude the sketch by rotor thickness.",
        "Cut the center bore through all.",
        "Cut bolt holes through all on a circular pattern.",
        "Apply small fillets/chamfers to visible edges.",
        "Export STEP for later CAD inspection.",
    ]
    missing = [
        "Exact bolt circle diameter if the user does not provide it.",
        "Exact bolt-hole diameter if the user does not provide it.",
        "Vent vane pattern if a production-like vented rotor is required.",
    ]
    if include_caliper:
        facts.append("User asked for caliper/suppport context, so the plan should treat it as a separate simplified component.")
        implications.extend(
            [
                "Add a separate caliper bridge outside the rotor edge.",
                "Add mounting holes/lugs on the caliper component.",
            ]
        )
    else:
        missing.append("Whether a caliper should be generated; a brake disc request alone means rotor first.")

    return ResearchPacket(
        object_key="brake_disc",
        search_needed=True,
        search_queries=[
            "brake disc rotor components center bore bolt pattern vented rotor",
            "SolidWorks macro create disc holes circular pattern",
            "brake caliper simplified CAD geometry" if include_caliper else "brake disc simplified CAD geometry",
        ],
        sources=sources,
        extracted_facts=facts,
        cad_implications=implications,
        missing_inputs=missing,
        confidence=0.78 if include_caliper else 0.82,
    )

