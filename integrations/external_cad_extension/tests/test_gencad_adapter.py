from pathlib import Path

from integrations.external_cad_extension.gencad_adapter import (
    GenCADConfig,
    build_gencad_inference_command,
    gencad_status,
    run_gencad_inference,
)


def test_gencad_status_reports_missing_repo(tmp_path):
    config = GenCADConfig(repo_path=tmp_path / "missing")
    status = gencad_status(config)
    assert status.available is False
    assert status.repo_exists is False
    assert "not installed" in status.message


def test_gencad_status_reports_missing_checkpoints(tmp_path):
    repo = tmp_path / "GenCAD"
    repo.mkdir()
    (repo / "inference_gencad.py").write_text("print('ok')", encoding="utf-8")
    (repo / "Dockerfile").write_text("FROM python:3.10", encoding="utf-8")
    status = gencad_status(GenCADConfig(repo_path=repo))
    assert status.repo_exists is True
    assert status.inference_script_exists is True
    assert status.dockerfile_exists is True
    assert status.checkpoint_dir_exists is False
    assert status.available is False


def test_gencad_command_uses_xvfb_by_default():
    command = build_gencad_inference_command(GenCADConfig(repo_path=Path("x"), python_executable="python3"))
    assert command[0] == "xvfb-run"
    assert "inference_gencad.py" in command
    assert "-export_img" in command


def test_gencad_run_returns_not_ready_without_repo(tmp_path):
    result = run_gencad_inference(GenCADConfig(repo_path=tmp_path / "missing"))
    assert result.ok is False
    assert result.error
    assert result.command

