import pytest

from integrations.external_cad_extension.generator import (
    AnthropicPlanner,
    OpenAIPlanner,
    _extract_openai_response_text,
    _plan_from_model_text,
    planner_from_name,
)


def _minimal_plan_json():
    return """
{
  "version": "0.1",
  "name": "hosted_test",
  "source": "test",
  "units": "mm",
  "prompt": "Create a rectangle",
  "assumptions": ["test assumption"],
  "warnings": [],
  "operations": [
    {"command": "sketch", "id": "sketch1", "args": {"plane": "Top"}},
    {"command": "rectangle", "id": "rect1", "args": {"center": {"x": 0, "y": 0}, "width": 10, "height": 5}},
    {"command": "extrude", "id": "body1", "args": {"depth": 2}},
    {"command": "export", "id": "export_step", "args": {"format": "STEP", "filename": "hosted_test.step"}}
  ]
}
"""


def test_hosted_planner_requires_anthropic_key(monkeypatch):
    monkeypatch.delenv("ANTHROPIC_API_KEY", raising=False)
    planner = AnthropicPlanner(api_key_env="ANTHROPIC_API_KEY", model="claude-test")
    with pytest.raises(RuntimeError, match="Anthropic API key is missing"):
        planner.plan("Create a bracket")


def test_hosted_planner_requires_openai_key(monkeypatch):
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)
    planner = OpenAIPlanner(api_key_env="OPENAI_API_KEY", model="gpt-test")
    with pytest.raises(RuntimeError, match="OpenAI API key is missing"):
        planner.plan("Create a bracket")


def test_plan_from_model_text_accepts_plain_or_fenced_json():
    plain = _plan_from_model_text(_minimal_plan_json(), prompt="x", source="test")
    fenced = _plan_from_model_text("```json\n" + _minimal_plan_json() + "\n```", prompt="x", source="test")
    assert plain.name == "hosted_test"
    assert fenced.name == "hosted_test"
    assert [op.command for op in plain.operations] == ["sketch", "rectangle", "extrude", "export"]


def test_extract_openai_response_text_supports_output_text_and_content_blocks():
    assert _extract_openai_response_text({"output_text": "hello"}) == "hello"
    assert (
        _extract_openai_response_text(
            {"output": [{"content": [{"type": "output_text", "text": "one"}, {"type": "output_text", "text": "two"}]}]}
        )
        == "one\ntwo"
    )


def test_planner_factory_supports_hosted_backends(monkeypatch):
    monkeypatch.setenv("ANTHROPIC_API_KEY", "test")
    monkeypatch.setenv("OPENAI_API_KEY", "test")
    assert planner_from_name("anthropic", hosted_model="claude-test").name == "anthropic"
    assert planner_from_name("openai", hosted_model="gpt-test").name == "openai"
