import json
import subprocess
import sys

from integrations.external_cad_extension.object_recipes import RECIPES, recipes_as_dict
from integrations.external_cad_extension.solidworks_command_language import (
    SOLIDWORKS_LANGUAGE,
    language_by_group,
    render_language_markdown,
)


def test_language_pack_has_deep_command_coverage():
    names = {command.name for command in SOLIDWORKS_LANGUAGE}
    assert len(names) >= 70
    for required in [
        "sketch_line",
        "sketch_spline",
        "add_dimension",
        "loft_surface",
        "sweep_boss",
        "hole_wizard",
        "circular_pattern",
        "insert_component",
        "mate_concentric",
        "create_drawing",
        "insert_model_view",
        "export_step",
    ]:
        assert required in names


def test_language_pack_groups_commands():
    groups = language_by_group()
    for group in ["document", "sketch_geometry", "solid_feature", "assembly", "drawing", "export"]:
        assert group in groups
    markdown = render_language_markdown()
    assert "# SolidWorks Planner Command Language" in markdown
    assert "`loft_surface`" in markdown


def test_object_recipes_include_f1_and_engine_assembly():
    recipes = recipes_as_dict()
    assert "f1_front_wing" in recipes
    assert "engine_assembly" in recipes
    assert any("year" in q.lower() or "era" in q.lower() for q in RECIPES["f1_front_wing"].clarifying_questions)
    assert "search/import" in " ".join(RECIPES["engine_assembly"].construction_strategy).lower()


def test_cli_language_and_recipes_json():
    language = subprocess.run(
        [sys.executable, "-m", "integrations.external_cad_extension.cli", "solidworks-language", "--grouped"],
        check=False,
        capture_output=True,
        text=True,
    )
    assert language.returncode == 0, language.stderr + language.stdout
    assert "solid_feature" in json.loads(language.stdout)["groups"]

    recipes = subprocess.run(
        [sys.executable, "-m", "integrations.external_cad_extension.cli", "object-recipes"],
        check=False,
        capture_output=True,
        text=True,
    )
    assert recipes.returncode == 0, recipes.stderr + recipes.stdout
    assert "brake_disc" in json.loads(recipes.stdout)["recipes"]

