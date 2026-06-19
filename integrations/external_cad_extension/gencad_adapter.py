"""GenCAD service adapter scaffold.

GenCAD is intentionally external to the base ORYND CAD Bridge install. The
upstream project requires Docker/conda, checkpoints, pythonocc-core, and a GPU-
friendly runtime for practical inference. This module defines the integration
contract without bundling the model.
"""

from __future__ import annotations

import json
import subprocess
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

from .schema import OperationPlan


DEFAULT_GENCAD_REPO = Path("integrations/GenCAD")


@dataclass(frozen=True)
class GenCADConfig:
    repo_path: Path = DEFAULT_GENCAD_REPO
    python_executable: str = "python"
    use_xvfb: bool = True
    image_path: Path = Path("data/images")
    results_path: Path = Path("results")
    export_img: bool = True
    docker_image: str = "gencad:latest"

    def to_dict(self) -> dict[str, Any]:
        return {
            "repo_path": str(self.repo_path),
            "python_executable": self.python_executable,
            "use_xvfb": self.use_xvfb,
            "image_path": str(self.image_path),
            "results_path": str(self.results_path),
            "export_img": self.export_img,
            "docker_image": self.docker_image,
        }


@dataclass(frozen=True)
class GenCADStatus:
    available: bool
    repo_exists: bool
    inference_script_exists: bool
    checkpoint_dir_exists: bool
    dockerfile_exists: bool
    message: str
    config: GenCADConfig

    def to_dict(self) -> dict[str, Any]:
        return {
            "available": self.available,
            "repo_exists": self.repo_exists,
            "inference_script_exists": self.inference_script_exists,
            "checkpoint_dir_exists": self.checkpoint_dir_exists,
            "dockerfile_exists": self.dockerfile_exists,
            "message": self.message,
            "config": self.config.to_dict(),
        }


@dataclass(frozen=True)
class GenCADInferenceResult:
    ok: bool
    command: list[str]
    stdout: str = ""
    stderr: str = ""
    artifacts: list[str] = field(default_factory=list)
    operation_plan: dict[str, Any] | None = None
    error: str | None = None

    def to_dict(self) -> dict[str, Any]:
        return {
            "ok": self.ok,
            "command": list(self.command),
            "stdout": self.stdout,
            "stderr": self.stderr,
            "artifacts": list(self.artifacts),
            "operation_plan": self.operation_plan,
            "error": self.error,
        }


def gencad_status(config: GenCADConfig | None = None) -> GenCADStatus:
    config = config or GenCADConfig()
    repo = config.repo_path
    repo_exists = repo.exists()
    inference_script_exists = (repo / "inference_gencad.py").exists()
    checkpoint_dir_exists = (repo / "data" / "ckpt").exists()
    dockerfile_exists = (repo / "Dockerfile").exists()
    available = repo_exists and inference_script_exists and checkpoint_dir_exists
    if available:
        message = "GenCAD repo, inference script, and checkpoint directory are present."
    elif not repo_exists:
        message = "GenCAD repo is not installed. Clone/download it separately; do not bundle it in the base extension."
    elif not inference_script_exists:
        message = "GenCAD repo exists but inference_gencad.py was not found."
    elif not checkpoint_dir_exists:
        message = "GenCAD repo exists but data/ckpt checkpoints are missing."
    else:
        message = "GenCAD is not ready."
    return GenCADStatus(
        available=available,
        repo_exists=repo_exists,
        inference_script_exists=inference_script_exists,
        checkpoint_dir_exists=checkpoint_dir_exists,
        dockerfile_exists=dockerfile_exists,
        message=message,
        config=config,
    )


def build_gencad_inference_command(config: GenCADConfig | None = None) -> list[str]:
    config = config or GenCADConfig()
    command = [config.python_executable, "inference_gencad.py", "-image_path", str(config.image_path)]
    if config.export_img:
        command.append("-export_img")
    if config.use_xvfb:
        return ["xvfb-run", "--server-args=-screen 0 2048x2048x24", *command]
    return command


def run_gencad_inference(config: GenCADConfig | None = None, *, timeout_seconds: int = 600) -> GenCADInferenceResult:
    config = config or GenCADConfig()
    status = gencad_status(config)
    command = build_gencad_inference_command(config)
    if not status.available:
        return GenCADInferenceResult(ok=False, command=command, error=status.message)
    try:
        completed = subprocess.run(
            command,
            cwd=str(config.repo_path),
            capture_output=True,
            text=True,
            check=False,
            timeout=timeout_seconds,
        )
    except Exception as exc:
        return GenCADInferenceResult(ok=False, command=command, error=str(exc))
    artifacts = [str(path) for path in (config.repo_path / config.results_path).glob("**/*") if path.is_file()]
    return GenCADInferenceResult(
        ok=completed.returncode == 0,
        command=command,
        stdout=completed.stdout,
        stderr=completed.stderr,
        artifacts=artifacts,
        operation_plan=None,
        error=None if completed.returncode == 0 else f"GenCAD exited with code {completed.returncode}",
    )


def convert_gencad_output_to_operation_plan(_: GenCADInferenceResult) -> OperationPlan:
    raise NotImplementedError(
        "GenCAD output mapping is not implemented yet. The next step is to inspect actual inference artifacts "
        "and convert CAD command sequences into ORYND OperationPlan."
    )


def write_gencad_status_report(path: Path, config: GenCADConfig | None = None) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(gencad_status(config).to_dict(), indent=2), encoding="utf-8")

