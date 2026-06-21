import json
import subprocess
import sys

from integrations.external_cad_extension.release_manifest import (
    ReleaseAsset,
    ReleaseManifest,
    asset_from_file,
    download_asset,
    is_update_available,
    select_asset,
    should_force_update,
    update_status,
    write_manifest,
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


def test_update_forces_after_four_deferrals():
    manifest = ReleaseManifest(product="ORYND CAD Bridge", version="0.2.0")
    assert should_force_update(current_version="0.1.0", manifest=manifest, deferral_count=3) is False
    assert should_force_update(current_version="0.1.0", manifest=manifest, deferral_count=4) is True

    status = update_status("0.1.0", manifest, deferral_count=4)
    assert status["force_update"] is True
    assert status["deferral_count"] == 4
    assert status["max_deferrals"] == 4


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
            "--deferral-count",
            "4",
        ],
        check=False,
        capture_output=True,
        text=True,
    )
    assert completed.returncode == 0, completed.stderr + completed.stdout
    data = json.loads(completed.stdout)
    assert data["product"] == "ORYND CAD Bridge"
    assert data["update_available"] is True
    assert data["force_update"] is True


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


def test_release_asset_download_verifies_file_url(tmp_path):
    artifact = tmp_path / "installer.dmg"
    artifact.write_bytes(b"fake dmg")
    asset = asset_from_file(artifact, url=artifact.as_uri(), platform="macos-arm64")

    downloaded, error = download_asset(asset, tmp_path / "downloads")

    assert error is None
    assert downloaded is not None
    assert downloaded.read_bytes() == b"fake dmg"


def test_release_asset_download_rejects_bad_sha(tmp_path):
    artifact = tmp_path / "installer.exe"
    artifact.write_bytes(b"fake installer")
    asset = ReleaseAsset(
        name="installer.exe",
        url=artifact.as_uri(),
        sha256="0" * 64,
        size_bytes=len(b"fake installer"),
        platform="windows-x64",
    )

    downloaded, error = download_asset(asset, tmp_path / "downloads")

    assert downloaded is None
    assert error == "downloaded SHA256 does not match manifest"


def test_select_asset_by_platform():
    manifest = ReleaseManifest(
        product="ORYND CAD Bridge",
        version="0.2.0",
        assets=[
            ReleaseAsset(name="setup.exe", url="https://example.com/setup.exe", platform="windows-x64"),
            ReleaseAsset(name="companion.dmg", url="https://example.com/companion.dmg", platform="macos-arm64"),
        ],
    )
    assert select_asset(manifest, "macos-arm64").name == "companion.dmg"
    assert select_asset(manifest, "linux-x64") is None


def test_cli_update_download_local_manifest(tmp_path):
    artifact = tmp_path / "setup.exe"
    artifact.write_bytes(b"fake installer")
    asset = asset_from_file(artifact, url=artifact.as_uri(), platform="windows-x64")
    manifest_path = tmp_path / "manifest.json"
    write_manifest(
        manifest_path,
        ReleaseManifest(product="ORYND CAD Bridge", version="0.2.0", assets=[asset]),
    )
    out_dir = tmp_path / "downloaded"

    completed = subprocess.run(
        [
            sys.executable,
            "-m",
            "integrations.external_cad_extension.cli",
            "update-download",
            "--manifest-file",
            str(manifest_path),
            "--platform",
            "windows-x64",
            "--out-dir",
            str(out_dir),
            "--current-version",
            "0.1.0",
        ],
        check=False,
        capture_output=True,
        text=True,
    )

    assert completed.returncode == 0, completed.stderr + completed.stdout
    data = json.loads(completed.stdout)
    assert data["ok"] is True
    assert data["downloaded"] is True
    assert (out_dir / "setup.exe").read_bytes() == b"fake installer"
