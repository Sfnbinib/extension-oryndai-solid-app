"""Scenario orchestration for prompt -> research -> decomposition -> macro."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from .decomposition import ConceptDecomposition, decompose_research
from .generator import GenerationResult, generate
from .preview import render_preview_markdown
from .research import OfflineResearchAgent, ResearchPacket
from .validator import ValidationReport, validate_generation


@dataclass(frozen=True)
class ScenarioStage:
    name: str
    status: str
    summary: str
    data: dict[str, Any]

    def to_dict(self) -> dict[str, Any]:
        return {
            "name": self.name,
            "status": self.status,
            "summary": self.summary,
            "data": self.data,
        }


@dataclass(frozen=True)
class ScenarioResult:
    prompt: str
    scenario: str
    stages: list[ScenarioStage]
    research: ResearchPacket
    decomposition: ConceptDecomposition
    generation: GenerationResult
    validation: ValidationReport
    preview_markdown: str

    def to_dict(self) -> dict[str, Any]:
        return {
            "prompt": self.prompt,
            "scenario": self.scenario,
            "stages": [stage.to_dict() for stage in self.stages],
            "research": self.research.to_dict(),
            "decomposition": self.decomposition.to_dict(),
            "operation_plan": self.generation.plan.to_dict(),
            "validation": self.validation.to_dict(),
        }


def run_scenario(prompt: str, *, scenario: str = "auto") -> ScenarioResult:
    research_agent = OfflineResearchAgent()
    research = research_agent.research(prompt)
    decomposition = decompose_research(prompt, research)
    generation = generate(prompt=prompt, research_context=research.to_context_text())
    validation = validate_generation(generation.plan, generation.macro_code)
    preview = render_preview_markdown(generation.plan, generation.macro_code, validation.to_dict())

    stages = [
        ScenarioStage(
            name="intent",
            status="ok" if research.object_key != "unknown" else "needs_model",
            summary=f"Recognized object: {research.object_key}",
            data={"prompt": prompt, "object_key": research.object_key},
        ),
        ScenarioStage(
            name="search_research",
            status="offline_fallback",
            summary="Built an offline research packet with search queries, facts, missing inputs, and CAD implications.",
            data=research.to_dict(),
        ),
        ScenarioStage(
            name="engineering_decomposition",
            status="ok" if decomposition.construction_steps else "missing",
            summary=decomposition.summary,
            data=decomposition.to_dict(),
        ),
        ScenarioStage(
            name="cad_operation_plan",
            status="ok",
            summary=f"Generated {len(generation.plan.operations)} constrained CAD operations.",
            data=generation.plan.to_dict(),
        ),
        ScenarioStage(
            name="macro_generation",
            status="ok",
            summary=f"Generated SolidWorks VBA-style macro with {len(generation.macro_code.splitlines())} lines.",
            data={"macro_language": "solidworks_vba", "line_count": len(generation.macro_code.splitlines())},
        ),
        ScenarioStage(
            name="static_validation",
            status="ok" if validation.ok else "failed",
            summary="Static validator checked catalog commands, dimensions, export path, and unsafe macro tokens.",
            data=validation.to_dict(),
        ),
    ]
    scenario_name = scenario if scenario != "auto" else research.object_key
    return ScenarioResult(
        prompt=prompt,
        scenario=scenario_name,
        stages=stages,
        research=research,
        decomposition=decomposition,
        generation=generation,
        validation=validation,
        preview_markdown=preview,
    )


def render_scenario_markdown(result: ScenarioResult) -> str:
    lines = [
        f"# Scenario Trace: {result.scenario}",
        "",
        f"Prompt: {result.prompt}",
        "",
        "## Pipeline Stages",
        "",
    ]
    for idx, stage in enumerate(result.stages, 1):
        lines.append(f"{idx}. `{stage.name}` - `{stage.status}` - {stage.summary}")
    lines.extend(["", "## Search Queries", ""])
    for query in result.research.search_queries:
        lines.append(f"- {query}")
    lines.extend(["", "## Extracted Facts", ""])
    for fact in result.research.extracted_facts:
        lines.append(f"- {fact}")
    lines.extend(["", "## CAD Construction Steps", ""])
    for step in result.decomposition.construction_steps:
        lines.append(f"{step.order}. {step.intent} (`{step.operation_hint}`): {step.rationale}")
    lines.extend(["", "## Validation", ""])
    lines.append(f"- ok: `{str(result.validation.ok).lower()}`")
    for error in result.validation.errors:
        lines.append(f"- error: {error}")
    for warning in result.validation.warnings:
        lines.append(f"- warning: {warning}")
    lines.extend(["", "## Macro Preview", "", result.preview_markdown])
    return "\n".join(lines)

