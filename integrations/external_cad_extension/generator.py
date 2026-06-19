"""Macro-generation orchestration for the prototype.

The first pass is deterministic so it can be tested without a connected LLM.
Future Claude/OpenAI/local/MCP adapters can replace only the planning step while
keeping validation, preview, and target emitters unchanged.
"""

from __future__ import annotations

import re
import json
import os
import urllib.request
from urllib.error import HTTPError, URLError
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


class AnthropicPlanner(PlannerAdapter):
    """Hosted Claude/Opus planner using the Anthropic Messages API."""

    name = "anthropic"

    def __init__(
        self,
        *,
        api_key: str | None = None,
        api_key_env: str = "ANTHROPIC_API_KEY",
        model: str | None = None,
        base_url: str = "https://api.anthropic.com/v1/messages",
        max_tokens: int = 4000,
    ) -> None:
        self.api_key = api_key or os.getenv(api_key_env)
        self.api_key_env = api_key_env
        self.model = model or os.getenv("ORYND_ANTHROPIC_MODEL", "claude-opus-4-1-20250805")
        self.base_url = base_url
        self.max_tokens = max_tokens

    def plan(
        self,
        prompt: str,
        *,
        research_context: str | None = None,
        image_context: str | None = None,
        mesh_context: str | None = None,
    ) -> OperationPlan:
        if not self.api_key:
            raise RuntimeError(f"Anthropic API key is missing. Set {self.api_key_env} or pass api_key.")
        body = {
            "model": self.model,
            "max_tokens": self.max_tokens,
            "system": _planner_system_prompt(),
            "messages": [
                {
                    "role": "user",
                    "content": _planner_user_payload(
                        prompt,
                        research_context=research_context,
                        image_context=image_context,
                        mesh_context=mesh_context,
                    ),
                }
            ],
        }
        request = urllib.request.Request(
            self.base_url,
            data=json.dumps(body).encode("utf-8"),
            headers={
                "Content-Type": "application/json",
                "x-api-key": self.api_key,
                "anthropic-version": "2023-06-01",
            },
            method="POST",
        )
        raw = _post_json(request, provider=self.name)
        text = "\n".join(
            block.get("text", "")
            for block in raw.get("content", [])
            if isinstance(block, dict) and block.get("type") == "text"
        ).strip()
        return _plan_from_model_text(text, prompt=prompt, source=self.name)


class OpenAIPlanner(PlannerAdapter):
    """Hosted OpenAI planner using the Responses API."""

    name = "openai"

    def __init__(
        self,
        *,
        api_key: str | None = None,
        api_key_env: str = "OPENAI_API_KEY",
        model: str | None = None,
        base_url: str = "https://api.openai.com/v1/responses",
        max_output_tokens: int = 4000,
    ) -> None:
        self.api_key = api_key or os.getenv(api_key_env)
        self.api_key_env = api_key_env
        self.model = model or os.getenv("ORYND_OPENAI_MODEL", "gpt-5.2")
        self.base_url = base_url
        self.max_output_tokens = max_output_tokens

    def plan(
        self,
        prompt: str,
        *,
        research_context: str | None = None,
        image_context: str | None = None,
        mesh_context: str | None = None,
    ) -> OperationPlan:
        if not self.api_key:
            raise RuntimeError(f"OpenAI API key is missing. Set {self.api_key_env} or pass api_key.")
        body = {
            "model": self.model,
            "instructions": _planner_system_prompt(),
            "input": _planner_user_payload(
                prompt,
                research_context=research_context,
                image_context=image_context,
                mesh_context=mesh_context,
            ),
            "max_output_tokens": self.max_output_tokens,
        }
        request = urllib.request.Request(
            self.base_url,
            data=json.dumps(body).encode("utf-8"),
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {self.api_key}",
            },
            method="POST",
        )
        raw = _post_json(request, provider=self.name)
        text = _extract_openai_response_text(raw)
        return _plan_from_model_text(text, prompt=prompt, source=self.name)


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
    api_key_env: str | None = None,
    hosted_model: str | None = None,
) -> PlannerAdapter:
    if name == "deterministic":
        return DeterministicPlanner()
    if name == "ollama":
        return OllamaPlanner(base_url=ollama_url, model=ollama_model)
    if name == "anthropic":
        return AnthropicPlanner(api_key_env=api_key_env or "ANTHROPIC_API_KEY", model=hosted_model)
    if name == "openai":
        return OpenAIPlanner(api_key_env=api_key_env or "OPENAI_API_KEY", model=hosted_model)
    raise ValueError("planner must be 'deterministic', 'ollama', 'anthropic', or 'openai'")


def _planner_system_prompt() -> str:
    return (
        "You are ORYND CAD Bridge planner. Return ONLY valid JSON for the OperationPlan schema. "
        "Use units='mm'. Use only the provided catalog commands. Include explicit assumptions and warnings. "
        "Do not include markdown, prose, comments, shell commands, network calls, or file deletion logic. "
        "If the request is underspecified, choose conservative demo assumptions and list them."
    )


def _planner_user_payload(
    prompt: str,
    *,
    research_context: str | None,
    image_context: str | None,
    mesh_context: str | None,
) -> str:
    payload = {
        "prompt": prompt,
        "research_context": research_context,
        "image_context": image_context,
        "mesh_context": mesh_context,
        "catalog": catalog_as_dict(),
        "required_shape": {
            "version": "0.1",
            "name": "short_snake_case_name",
            "source": "hosted_model",
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
    return json.dumps(payload, ensure_ascii=False)


def _post_json(request: urllib.request.Request, *, provider: str) -> dict:
    try:
        with urllib.request.urlopen(request, timeout=120) as response:
            return json.loads(response.read().decode("utf-8"))
    except HTTPError as exc:
        body = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"{provider} planner request failed with HTTP {exc.code}: {body[:500]}") from exc
    except URLError as exc:
        raise RuntimeError(f"{provider} planner request failed: {exc.reason}") from exc
    except Exception as exc:
        raise RuntimeError(f"{provider} planner request failed: {exc}") from exc


def _extract_openai_response_text(raw: dict) -> str:
    if isinstance(raw.get("output_text"), str):
        return raw["output_text"].strip()
    chunks: list[str] = []
    for item in raw.get("output", []) or []:
        if not isinstance(item, dict):
            continue
        for content in item.get("content", []) or []:
            if not isinstance(content, dict):
                continue
            if isinstance(content.get("text"), str):
                chunks.append(content["text"])
    return "\n".join(chunks).strip()


def _plan_from_model_text(text: str, *, prompt: str, source: str) -> OperationPlan:
    if not text:
        raise ValueError(f"{source} planner returned empty content.")
    cleaned = text.strip()
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
        cleaned = re.sub(r"\s*```$", "", cleaned)
    try:
        plan_data = json.loads(cleaned)
    except json.JSONDecodeError as exc:
        raise ValueError(f"{source} planner returned non-JSON content: {text[:500]}") from exc
    plan_data.setdefault("source", source)
    plan_data.setdefault("prompt", prompt)
    plan_data.setdefault("units", "mm")
    return OperationPlan.from_dict(plan_data)
