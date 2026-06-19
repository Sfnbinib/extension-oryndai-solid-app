import json
import subprocess
import sys

from integrations.external_cad_extension.release_manifest import (
    ReleaseManifest,
    is_update_available,
    update_status,
)


def test_release_version_compare():
    assert is_update_available("0.1.0", "0.1.1") is True
    assert is_update_available("0.1.0", "0.2.0") is True
    assert is_update_available("0.1.1", "0.1.0") is False
    assert is_update_available("0.1.0", "0.1.0") is False


def test_update_status_from_manifest():
    manifest = ReleaseManifest(product="ORYND CAD Bridge", version="0.2.0", minimum_supported_version="0.1.5")
    status = update_status("0.1.0", manifest)
    assert status["update_available"] is True
    assert status["force_update"] is True


def test_cli_update_check_local_manifest():
    completed = subprocess.run(
        [
            sys.executable,
            "-m",
            "integrations.external_cad_extension.cli",
            "update-check",
            "--manifest-file",
            "integrations/external_cad_extension/release/manifest.example.json",
            "--current-version",
            "0.0.1",
        ],
        check=False,
        capture_output=True,
        text=True,
    )
    assert completed.returncode == 0, completed.stderr + completed.stdout
    data = json.loads(completed.stdout)
    assert data["product"] == "ORYND CAD Bridge"
    assert data["update_available"] is True


def test_cli_release_asset(tmp_path):
    artifact = tmp_path / "installer.exe"
    artifact.write_bytes(b"fake installer")
    completed = subprocess.run(
        [
            sys.executable,
            "-m",
            "integrations.external_cad_extension.cli",
            "release-asset",
            "--file",
            str(artifact),
            "--url",
            "https://example.com/installer.exe",
            "--platform",
            "windows-x64",
        ],
        check=False,
        capture_output=True,
        text=True,
    )
    assert completed.returncode == 0, completed.stderr + completed.stdout
    data = json.loads(completed.stdout)
    assert data["name"] == "installer.exe"
    assert data["sha256"]
    assert data["size_bytes"] == len(b"fake installer")

