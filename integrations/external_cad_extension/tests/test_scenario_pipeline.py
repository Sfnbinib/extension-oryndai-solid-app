import json
import subprocess
import sys

from integrations.external_cad_extension.orchestrator import run_scenario


def test_brake_disc_scenario_runs_full_pipeline():
    result = run_scenario("Я хочу тормозной диск диаметром 280 мм с 5 отверстиями.")
    assert result.validation.ok, result.validation.to_dict()
    assert result.research.object_key == "brake_disc"
    assert result.research.search_needed is True
    assert any("brake disc" in query for query in result.research.search_queries)
    assert any("center bore" in fact.lower() for fact in result.research.extracted_facts)
    assert any("bolt" in fact.lower() for fact in result.research.extracted_facts)
    assert any(step.operation_hint == "extrude" for step in result.decomposition.construction_steps)
    assert any("circular pattern" in step.operation_hint for step in result.decomposition.construction_steps)
    assert len(result.generation.plan.operations) >= 10
    assert "ORYND_Hole" in result.generation.macro_code


def test_brake_disc_with_caliper_mentions_optional_caliper_component():
    result = run_scenario("Сделай тормозной диск с суппортом.")
    components = {component.name: component for component in result.decomposition.components}
    assert components["caliper_proxy"].included_in_plan is True
    assert any("caliper" in fact.lower() or "suppport" in fact.lower() for fact in result.research.extracted_facts)
    assert result.validation.ok, result.validation.to_dict()


def test_cli_scenario_writes_trace_files(tmp_path):
    cmd = [
        sys.executable,
        "-m",
        "integrations.external_cad_extension.cli",
        "--scenario",
        "brake_disc",
        "--prompt",
        "I want a brake disc diameter 280 mm with 5 bolt holes.",
        "--out-dir",
        str(tmp_path),
    ]
    completed = subprocess.run(cmd, check=False, capture_output=True, text=True)
    assert completed.returncode == 0, completed.stderr + completed.stdout
    scenario_path = tmp_path / "brake_disc.scenario.json"
    scenario_md_path = tmp_path / "brake_disc.scenario.md"
    assert scenario_path.exists()
    assert scenario_md_path.exists()
    data = json.loads(scenario_path.read_text(encoding="utf-8"))
    stage_names = [stage["name"] for stage in data["stages"]]
    assert stage_names == [
        "intent",
        "search_research",
        "engineering_decomposition",
        "cad_operation_plan",
        "macro_generation",
        "static_validation",
    ]
    assert data["validation"]["ok"] is True
    assert "Search Queries" in scenario_md_path.read_text(encoding="utf-8")

