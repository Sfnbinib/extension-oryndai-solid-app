"""CLI entrypoint for offline macro generation.

Example:
    python -m integrations.external_cad_extension.cli --example brake_disc
"""

from __future__ import annotations

import argparse
import asyncio
import json
from pathlib import Path

from .examples import EXAMPLES
from .ai_model_4_adapter import mesh_file_to_operation_plan, primitives_to_operation_plan
from .env_config import load_supabase_config
from .generator import generate, planner_from_name
from .gencad_adapter import GenCADConfig, gencad_status, run_gencad_inference
from .orchestrator import render_scenario_markdown, run_scenario
from .object_recipes import recipes_as_dict, render_recipes_markdown
from .preview import render_preview_markdown
from .release_manifest import CURRENT_VERSION, asset_from_file, fetch_manifest, load_manifest, update_status
from .runtime_mvp import render_runtime_mvp_markdown, runtime_mvp_as_dict
from .settings import (
    configure_model_key,
    entitlement_gate,
    load_settings,
    mark_subscription_active,
    sign_in_local,
    start_trial,
)
from .solidworks_vba import emit_solidworks_vba
from .solidworks_coverage import render_solidworks_runtime_checklist, solidworks_coverage_matrix, write_solidworks_runtime_checklist
from .solidworks_command_language import language_as_dict, language_by_group, render_language_markdown
from .supabase_client import default_supabase_client
from .validator import validate_generation


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="ORYND External CAD Extension prototype CLI")
    subparsers = parser.add_subparsers(dest="command")

    settings_show = subparsers.add_parser("settings-show", help="Show local account/subscription/model settings.")
    settings_show.add_argument("--settings-path", default=None)

    sign_in = subparsers.add_parser("account-signin", help="Set a local prototype account email.")
    sign_in.add_argument("--email", required=True)
    sign_in.add_argument("--settings-path", default=None)

    key_set = subparsers.add_parser("model-key-set", help="Configure local model provider/API key reference.")
    key_set.add_argument("--provider", required=True, choices=("anthropic", "openai", "ollama", "local"))
    key_group = key_set.add_mutually_exclusive_group(required=True)
    key_group.add_argument("--api-key")
    key_group.add_argument("--api-key-env")
    key_set.add_argument("--model")
    key_set.add_argument("--settings-path", default=None)

    trial = subparsers.add_parser("trial-start", help="Start a local 3-day prototype trial.")
    trial.add_argument("--settings-path", default=None)

    sub_active = subparsers.add_parser("subscription-activate", help="Mark local prototype subscription active.")
    sub_active.add_argument("--days", type=int, default=30)
    sub_active.add_argument("--settings-path", default=None)

    gate = subparsers.add_parser("entitlement", help="Check local trial/subscription gate.")
    gate.add_argument("--settings-path", default=None)

    supabase_status = subparsers.add_parser("supabase-status", help="Show masked Supabase environment readiness.")
    supabase_status.add_argument("--env-path", default="integrations/external_cad_extension/.env")

    supabase_check = subparsers.add_parser("supabase-check", help="Check Supabase REST table availability.")
    supabase_check.add_argument("--table", default="cad_bridge_runs")
    supabase_check.add_argument("--backend", action="store_true", help="Use backend secret key instead of publishable key.")

    sw_coverage = subparsers.add_parser("solidworks-coverage", help="Show SolidWorks command runtime coverage matrix.")
    sw_coverage.add_argument("--out", default=None, help="Optional markdown output path.")

    sw_language = subparsers.add_parser("solidworks-language", help="Show expanded planner command language.")
    sw_language.add_argument("--format", choices=("json", "markdown"), default="json")
    sw_language.add_argument("--grouped", action="store_true")
    sw_language.add_argument("--out", default=None)

    recipes = subparsers.add_parser("object-recipes", help="Show CAD object construction recipes for planners.")
    recipes.add_argument("--format", choices=("json", "markdown"), default="json")
    recipes.add_argument("--out", default=None)

    runtime_mvp = subparsers.add_parser("runtime-mvp", help="Show the small command set that must work smoothly first.")
    runtime_mvp.add_argument("--format", choices=("json", "markdown"), default="json")
    runtime_mvp.add_argument("--out", default=None)

    smoke_package = subparsers.add_parser(
        "solidworks-smoke-package",
        help="Write a minimal SolidWorks runtime QA package for the mounting bracket MVP.",
    )
    smoke_package.add_argument("--example", choices=("mounting_bracket", "brake_disc"), default="mounting_bracket")
    smoke_package.add_argument("--out-dir", default="integrations/external_cad_extension/out/solidworks_smoke_package")

    update_check = subparsers.add_parser("update-check", help="Check local or remote ORYND CAD Bridge release manifest.")
    update_source = update_check.add_mutually_exclusive_group(required=True)
    update_source.add_argument("--manifest-file")
    update_source.add_argument("--manifest-url")
    update_check.add_argument("--current-version", default=CURRENT_VERSION)

    release_asset = subparsers.add_parser("release-asset", help="Create release asset metadata with SHA256.")
    release_asset.add_argument("--file", required=True)
    release_asset.add_argument("--url", required=True)
    release_asset.add_argument("--platform", default="windows-x64")

    gencad = subparsers.add_parser("gencad-status", help="Check external GenCAD installation readiness.")
    gencad.add_argument("--repo-path", default="integrations/GenCAD")

    gencad_run = subparsers.add_parser("gencad-run", help="Run external GenCAD inference if installed.")
    gencad_run.add_argument("--repo-path", default="integrations/GenCAD")
    gencad_run.add_argument("--image-path", default="data/images")
    gencad_run.add_argument("--results-path", default="results")
    gencad_run.add_argument("--python-executable", default="python")
    gencad_run.add_argument("--no-xvfb", action="store_true")

    ai4_prims = subparsers.add_parser("ai4-primitives", help="Convert AI Model 4 primitive JSON into operation plan/macro.")
    ai4_prims.add_argument("--input-json", required=True)
    ai4_prims.add_argument("--name", default="ai_model_4_part")
    ai4_prims.add_argument("--out-dir", default="integrations/external_cad_extension/out")

    ai4_mesh = subparsers.add_parser("ai4-mesh", help="Run ORYND AI Model 4 mesh pipeline and convert to operation plan/macro.")
    ai4_mesh.add_argument("--mesh-path", required=True)
    ai4_mesh.add_argument("--session-id", default="external_cad_mesh")
    ai4_mesh.add_argument("--out-dir", default="integrations/external_cad_extension/out")

    parser.add_argument("--example", choices=sorted(EXAMPLES), help="Generate one deterministic demo example.")
    parser.add_argument(
        "--scenario",
        choices=("auto", "brake_disc"),
        help="Run a full scenario trace: intent -> research -> decomposition -> plan -> macro -> validation.",
    )
    parser.add_argument("--prompt", help="Engineering prompt. Uses deterministic matching in this prototype.")
    parser.add_argument(
        "--planner",
        choices=("deterministic", "ollama", "anthropic", "openai"),
        default="deterministic",
        help="Planner backend. Ollama requires a local server; hosted planners require API key env vars.",
    )
    parser.add_argument("--ollama-url", default="http://localhost:11434", help="Ollama base URL.")
    parser.add_argument("--ollama-model", default="llama3.2:3b", help="Ollama model name.")
    parser.add_argument("--api-key-env", default=None, help="Environment variable name for hosted planner API key.")
    parser.add_argument("--hosted-model", default=None, help="Hosted model override for Anthropic/OpenAI planners.")
    parser.add_argument(
        "--out-dir",
        default="integrations/external_cad_extension/out",
        help="Artifact output directory.",
    )
    parser.add_argument("--research-context", help="Optional research summary/context text.")
    parser.add_argument("--image-context", help="Optional image/sketch adapter context text.")
    parser.add_argument("--mesh-context", help="Optional mesh/CoreOps adapter context text.")
    return parser


def _settings_path(value: str | None) -> Path:
    from .settings import DEFAULT_STATE_PATH

    return Path(value) if value else DEFAULT_STATE_PATH


def _print_json(data: dict) -> None:
    print(json.dumps(data, indent=2, ensure_ascii=False))


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    if args.command == "settings-show":
        _print_json(load_settings(_settings_path(args.settings_path)).to_dict())
        return 0
    if args.command == "account-signin":
        settings = sign_in_local(args.email, path=_settings_path(args.settings_path))
        _print_json(settings.to_dict())
        return 0
    if args.command == "model-key-set":
        settings = configure_model_key(
            provider=args.provider,
            api_key=args.api_key,
            api_key_env=args.api_key_env,
            model=args.model,
            path=_settings_path(args.settings_path),
        )
        _print_json(settings.to_dict())
        return 0
    if args.command == "trial-start":
        try:
            settings = start_trial(path=_settings_path(args.settings_path))
        except ValueError as exc:
            print(str(exc))
            return 2
        _print_json(settings.to_dict())
        return 0
    if args.command == "subscription-activate":
        settings = mark_subscription_active(days=args.days, path=_settings_path(args.settings_path))
        _print_json(settings.to_dict())
        return 0
    if args.command == "entitlement":
        _print_json(entitlement_gate(path=_settings_path(args.settings_path)))
        return 0
    if args.command == "supabase-status":
        _print_json(load_supabase_config(Path(args.env_path)).to_status())
        return 0
    if args.command == "supabase-check":
        response = default_supabase_client(use_backend_key=args.backend).check_table(args.table)
        _print_json(response.to_dict())
        return 0 if response.ok else 2
    if args.command == "solidworks-coverage":
        if args.out:
            write_solidworks_runtime_checklist(Path(args.out))
            print(f"wrote: {args.out}")
        else:
            _print_json({"coverage": [item.to_dict() for item in solidworks_coverage_matrix()]})
        return 0
    if args.command == "solidworks-language":
        if args.format == "markdown":
            text = render_language_markdown()
            if args.out:
                Path(args.out).write_text(text, encoding="utf-8")
                print(f"wrote: {args.out}")
            else:
                print(text)
        else:
            _print_json({"groups": language_by_group()} if args.grouped else {"commands": language_as_dict()})
        return 0
    if args.command == "object-recipes":
        if args.format == "markdown":
            text = render_recipes_markdown()
            if args.out:
                Path(args.out).write_text(text, encoding="utf-8")
                print(f"wrote: {args.out}")
            else:
                print(text)
        else:
            _print_json({"recipes": recipes_as_dict()})
        return 0
    if args.command == "runtime-mvp":
        if args.format == "markdown":
            text = render_runtime_mvp_markdown()
            if args.out:
                Path(args.out).write_text(text, encoding="utf-8")
                print(f"wrote: {args.out}")
            else:
                print(text)
        else:
            _print_json(runtime_mvp_as_dict())
        return 0
    if args.command == "solidworks-smoke-package":
        report = write_solidworks_smoke_package(example=args.example, out_dir=Path(args.out_dir))
        _print_json(report)
        return 0 if report["validation"]["ok"] else 2
    if args.command == "update-check":
        if args.manifest_file:
            manifest = load_manifest(Path(args.manifest_file))
            _print_json(update_status(args.current_version, manifest))
            return 0
        manifest, error = fetch_manifest(args.manifest_url)
        if error or manifest is None:
            _print_json({"ok": False, "error": error})
            return 2
        _print_json({"ok": True, **update_status(args.current_version, manifest)})
        return 0
    if args.command == "release-asset":
        asset = asset_from_file(Path(args.file), url=args.url, platform=args.platform)
        _print_json(asset.to_dict())
        return 0
    if args.command == "gencad-status":
        _print_json(gencad_status(GenCADConfig(repo_path=Path(args.repo_path))).to_dict())
        return 0
    if args.command == "gencad-run":
        config = GenCADConfig(
            repo_path=Path(args.repo_path),
            python_executable=args.python_executable,
            use_xvfb=not args.no_xvfb,
            image_path=Path(args.image_path),
            results_path=Path(args.results_path),
        )
        result = run_gencad_inference(config)
        _print_json(result.to_dict())
        return 0 if result.ok else 2
    if args.command == "ai4-primitives":
        ai_doc = json.loads(Path(args.input_json).read_text(encoding="utf-8"))
        result = primitives_to_operation_plan(ai_doc, name=args.name)
        validation = _write_adapter_artifacts(result.operation_plan, Path(args.out_dir))
        _print_json({"adapter": result.to_dict(), "validation": validation.to_dict()})
        return 0 if validation.ok else 2
    if args.command == "ai4-mesh":
        result = asyncio.run(mesh_file_to_operation_plan(args.mesh_path, session_id=args.session_id))
        validation = _write_adapter_artifacts(result.operation_plan, Path(args.out_dir))
        _print_json({"adapter": result.to_dict(), "validation": validation.to_dict()})
        return 0 if validation.ok else 2

    if args.scenario:
        prompt = args.prompt or "I want a brake disc."
        scenario_result = run_scenario(prompt, scenario=args.scenario)
        result = scenario_result.generation
        validation = scenario_result.validation
    else:
        scenario_result = None
        result = generate(
            prompt=args.prompt,
            example=args.example,
            research_context=args.research_context,
            image_context=args.image_context,
            mesh_context=args.mesh_context,
            planner=planner_from_name(
                args.planner,
                ollama_url=args.ollama_url,
                ollama_model=args.ollama_model,
                api_key_env=args.api_key_env,
                hosted_model=args.hosted_model,
            ),
        )
        validation = validate_generation(result.plan, result.macro_code)

    out_dir = Path(args.out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    stem = result.plan.name
    plan_path = out_dir / f"{stem}.operation_plan.json"
    macro_path = out_dir / f"{stem}.solidworks.bas"
    validation_path = out_dir / f"{stem}.validation.json"
    preview_path = out_dir / f"{stem}.preview.md"
    scenario_json_path = out_dir / f"{stem}.scenario.json"
    scenario_md_path = out_dir / f"{stem}.scenario.md"

    plan_path.write_text(json.dumps(result.plan.to_dict(), indent=2, ensure_ascii=False), encoding="utf-8")
    macro_path.write_text(result.macro_code, encoding="utf-8")
    validation_path.write_text(json.dumps(validation.to_dict(), indent=2, ensure_ascii=False), encoding="utf-8")
    preview_path.write_text(
        render_preview_markdown(result.plan, result.macro_code, validation.to_dict()),
        encoding="utf-8",
    )
    if scenario_result:
        scenario_json_path.write_text(
            json.dumps(scenario_result.to_dict(), indent=2, ensure_ascii=False),
            encoding="utf-8",
        )
        scenario_md_path.write_text(render_scenario_markdown(scenario_result), encoding="utf-8")

    print(f"plan: {plan_path}")
    print(f"macro: {macro_path}")
    print(f"validation: {validation_path}")
    print(f"preview: {preview_path}")
    if scenario_result:
        print(f"scenario_json: {scenario_json_path}")
        print(f"scenario_markdown: {scenario_md_path}")
    print(f"ok: {validation.ok}")
    return 0 if validation.ok else 2


def _write_adapter_artifacts(plan, out_dir: Path):
    macro_code = emit_solidworks_vba(plan)
    validation = validate_generation(plan, macro_code)
    out_dir.mkdir(parents=True, exist_ok=True)
    stem = plan.name
    (out_dir / f"{stem}.operation_plan.json").write_text(json.dumps(plan.to_dict(), indent=2), encoding="utf-8")
    (out_dir / f"{stem}.solidworks.bas").write_text(macro_code, encoding="utf-8")
    (out_dir / f"{stem}.validation.json").write_text(json.dumps(validation.to_dict(), indent=2), encoding="utf-8")
    (out_dir / f"{stem}.preview.md").write_text(render_preview_markdown(plan, macro_code, validation.to_dict()), encoding="utf-8")
    return validation


def write_solidworks_smoke_package(*, example: str, out_dir: Path) -> dict:
    result = generate(example=example)
    validation = validate_generation(result.plan, result.macro_code)
    out_dir.mkdir(parents=True, exist_ok=True)
    stem = result.plan.name

    plan_path = out_dir / f"{stem}.operation_plan.json"
    macro_path = out_dir / f"{stem}.solidworks.bas"
    validation_path = out_dir / f"{stem}.validation.json"
    preview_path = out_dir / f"{stem}.preview.md"
    readme_path = out_dir / "README_SOLIDWORKS_SMOKE_TEST.md"

    plan_path.write_text(json.dumps(result.plan.to_dict(), indent=2, ensure_ascii=False), encoding="utf-8")
    macro_path.write_text(result.macro_code, encoding="utf-8")
    validation_path.write_text(json.dumps(validation.to_dict(), indent=2, ensure_ascii=False), encoding="utf-8")
    preview_path.write_text(render_preview_markdown(result.plan, result.macro_code, validation.to_dict()), encoding="utf-8")
    readme_path.write_text(_render_smoke_package_readme(stem, validation.ok), encoding="utf-8")

    return {
        "ok": validation.ok,
        "example": stem,
        "out_dir": str(out_dir),
        "artifacts": {
            "plan": str(plan_path),
            "macro": str(macro_path),
            "validation": str(validation_path),
            "preview": str(preview_path),
            "readme": str(readme_path),
        },
        "validation": validation.to_dict(),
        "solidworks_runtime_status": "not_verified",
    }


def _render_smoke_package_readme(example: str, validation_ok: bool) -> str:
    return f"""# ORYND CAD Bridge SolidWorks Smoke Package

Example: `{example}`

Static validation ok: `{str(validation_ok).lower()}`

This package is for Windows/SolidWorks runtime QA. It does not prove runtime by
itself; it gives the tester the exact generated artifacts to inspect and run in a
controlled SolidWorks session.

Files:

- `{example}.operation_plan.json` - constrained CAD operation plan.
- `{example}.solidworks.bas` - generated SolidWorks VBA-style macro preview.
- `{example}.validation.json` - static validation report.
- `{example}.preview.md` - human-readable plan, assumptions, validation, code.

Required manual QA:

1. Start SolidWorks on Windows.
2. Inspect `{example}.preview.md`.
3. Confirm `{example}.validation.json` has no errors.
4. Open/recreate the macro in SolidWorks macro editor if needed.
5. Run only after manual review.
6. Confirm:
   - part is created;
   - expected sketch/features appear;
   - rebuild succeeds;
   - STEP export succeeds.

Do not mark this scenario `runtime_verified` until it creates the expected model
inside real desktop SolidWorks.
"""


if __name__ == "__main__":
    raise SystemExit(main())
