"""Macro-generation orchestration for the prototype.

The first pass is deterministic so it can be tested without a connected LLM.
Future Claude/OpenAI/local/MCP adapters can replace only the planning step while
keeping validation, preview, and target emitters unchanged.
"""

from __future__ import annotations

import re
import json
import urllib.request
from dataclasses import dataclass

from .catalog import catalog_as_dict
from .examples import EXAMPLES
from .schema import OperationPlan
from .solidworks_vba import emit_solidworks_vba


@dataclass(frozen=True)
class GenerationResult:
    plan: OperationPlan
    macro_code: str


class PlannerAdapter:
    """Future adapter interface for Claude/OpenAI/local/search/model routing."""

    name = "base"

    def plan(
        self,
        prompt: str,
        *,
        research_context: str | None = None,
        image_context: str | None = None,
        mesh_context: str | None = None,
    ) -> OperationPlan:
        raise NotImplementedError


class DeterministicPlanner(PlannerAdapter):
    """Offline planner used for tests, demos, and no-key fallback."""

    name = "deterministic_template"

    def plan(
        self,
        prompt: str,
        *,
        research_context: str | None = None,
        image_context: str | None = None,
        mesh_context: str | None = None,
    ) -> OperationPlan:
        key = infer_example_key(prompt)
        if key is None:
            raise ValueError(
                "No deterministic template matched. Use --example or include one of: "
                "brake disc, spur gear, F1 front wing, mounting bracket."
            )
        plan = EXAMPLES[key]()
        if research_context or image_context or mesh_context:
            data = plan.to_dict()
            data["research_context"] = research_context
            data["image_context"] = image_context
            data["mesh_context"] = mesh_context
            plan = OperationPlan.from_dict(data)
        return plan


class GenCADAdapter(PlannerAdapter):
    """Placeholder for image/sketch -> CAD command sequence integration."""

    name = "gencad_adapter"

    def plan(self, prompt: str, **kwargs: str | None) -> OperationPlan:
        raise NotImplementedError(
            "GenCAD is intentionally not bundled. Run it as a separate Docker/conda/model "
            "service and convert its CAD command sequence into OperationPlan."
        )


class MeshCoreOpsAdapter(PlannerAdapter):
    """Placeholder for STL/OBJ/search-import -> mesh features -> operation plan."""

    name = "mesh_coreops_adapter"

    def plan(self, prompt: str, **kwargs: str | None) -> OperationPlan:
        raise NotImplementedError(
            "Mesh/CoreOps conversion should call ORYND AI Model 4 or a server-side "
            "feature service, then map features into OperationPlan."
        )


class OllamaPlanner(PlannerAdapter):
    """Optional local-model planner for Ollama-compatible runtimes.

    This is intentionally strict: the model must return only OperationPlan JSON.
    The normal validator still decides whether the result is usable.
    """

    name = "ollama"

    def __init__(self, *, base_url: str = "http://localhost:11434", model: str = "llama3.2:3b") -> None:
        self.base_url = base_url.rstrip("/")
        self.model = model

    def plan(
        self,
        prompt: str,
        *,
        research_context: str | None = None,
        image_context: str | None = None,
        mesh_context: str | None = None,
    ) -> OperationPlan:
        system_prompt = {
            "role": "system",
            "content": (
                "You are ORYND CAD Bridge planner. Return ONLY valid JSON for the OperationPlan schema. "
                "Use units='mm'. Use only catalog commands. Include assumptions. Do not include markdown."
            ),
        }
        user_payload = {
            "prompt": prompt,
            "research_context": research_context,
            "image_context": image_context,
            "mesh_context": mesh_context,
            "catalog": catalog_as_dict(),
            "required_shape": {
                "version": "0.1",
                "name": "short_snake_case_name",
                "source": "ollama",
                "units": "mm",
                "prompt": prompt,
                "assumptions": ["explicit assumptions"],
                "warnings": [],
                "operations": [
                    {
                        "command": "sketch",
                        "id": "unique_id",
                        "args": {"plane": "Top"},
                        "description": "human readable step",
                    }
                ],
            },
        }
        body = {
            "model": self.model,
            "stream": False,
            "prompt": system_prompt["content"] + "\n\nINPUT:\n" + json.dumps(user_payload, ensure_ascii=False),
            "format": "json",
        }
        request = urllib.request.Request(
            f"{self.base_url}/api/generate",
            data=json.dumps(body).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        try:
            with urllib.request.urlopen(request, timeout=120) as response:
                raw = json.loads(response.read().decode("utf-8"))
        except Exception as exc:
            raise RuntimeError(f"Ollama planner request failed: {exc}") from exc

        content = raw.get("response", "")
        try:
            plan_data = json.loads(content)
        except json.JSONDecodeError as exc:
            raise ValueError(f"Ollama planner returned non-JSON content: {content[:500]}") from exc
        plan_data.setdefault("source", self.name)
        plan_data.setdefault("prompt", prompt)
        plan_data.setdefault("units", "mm")
        return OperationPlan.from_dict(plan_data)


def infer_example_key(text: str) -> str | None:
    normalized = (text or "").lower()
    checks = [
        ("brake_disc", r"brake\s*(disc|rotor)|тормозн\w*\s+диск"),
        ("spur_gear", r"spur\s*gear|\bgear\b|шестер"),
        ("f1_front_wing", r"f1|front\s*wing|крыл"),
        ("mounting_bracket", r"mounting\s*bracket|\bbracket\b|кронштейн"),
    ]
    for key, pattern in checks:
        if re.search(pattern, normalized, re.IGNORECASE):
            return key
    return None


def generate(
    *,
    prompt: str | None = None,
    example: str | None = None,
    research_context: str | None = None,
    image_context: str | None = None,
    mesh_context: str | None = None,
    planner: PlannerAdapter | None = None,
) -> GenerationResult:
    planner = planner or DeterministicPlanner()
    if example:
        if example not in EXAMPLES:
            raise ValueError(f"Unknown example: {example}. Available: {', '.join(sorted(EXAMPLES))}")
        plan = EXAMPLES[example]()
        if research_context or image_context or mesh_context:
            data = plan.to_dict()
            data["research_context"] = research_context
            data["image_context"] = image_context
            data["mesh_context"] = mesh_context
            plan = OperationPlan.from_dict(data)
    else:
        if not prompt:
            raise ValueError("Either prompt or example is required.")
        plan = planner.plan(
            prompt,
            research_context=research_context,
            image_context=image_context,
            mesh_context=mesh_context,
        )
    return GenerationResult(plan=plan, macro_code=emit_solidworks_vba(plan))


def planner_from_name(
    name: str,
    *,
    ollama_url: str = "http://localhost:11434",
    ollama_model: str = "llama3.2:3b",
) -> PlannerAdapter:
    if name == "deterministic":
        return DeterministicPlanner()
    if name == "ollama":
        return OllamaPlanner(base_url=ollama_url, model=ollama_model)
    raise ValueError("planner must be 'deterministic' or 'ollama'")
