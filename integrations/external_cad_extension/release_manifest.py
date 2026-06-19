"""Release manifest and update-check helpers for ORYND CAD Bridge.

The installed add-in/companion should not scrape GitHub HTML. It should read a
small version manifest, compare semantic versions, then let the user approve an
installer download/update.
"""

from __future__ import annotations

import hashlib
import json
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


CURRENT_VERSION = "0.1.0"


@dataclass(frozen=True)
class ReleaseAsset:
    name: str
    url: str
    sha256: str | None = None
    size_bytes: int | None = None
    platform: str | None = None

    def to_dict(self) -> dict[str, Any]:
        data = {"name": self.name, "url": self.url}
        if self.sha256:
            data["sha256"] = self.sha256
        if self.size_bytes is not None:
            data["size_bytes"] = self.size_bytes
        if self.platform:
            data["platform"] = self.platform
        return data

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> "ReleaseAsset":
        return cls(
            name=str(data.get("name", "")),
            url=str(data.get("url", "")),
            sha256=data.get("sha256"),
            size_bytes=data.get("size_bytes"),
            platform=data.get("platform"),
        )


@dataclass(frozen=True)
class ReleaseManifest:
    product: str
    version: str
    channel: str = "stable"
    minimum_supported_version: str | None = None
    notes_url: str | None = None
    assets: list[ReleaseAsset] = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        return {
            "product": self.product,
            "version": self.version,
            "channel": self.channel,
            "minimum_supported_version": self.minimum_supported_version,
            "notes_url": self.notes_url,
            "assets": [asset.to_dict() for asset in self.assets],
        }

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> "ReleaseManifest":
        return cls(
            product=str(data.get("product", "ORYND CAD Bridge")),
            version=str(data.get("version", "0.0.0")),
            channel=str(data.get("channel", "stable")),
            minimum_supported_version=data.get("minimum_supported_version"),
            notes_url=data.get("notes_url"),
            assets=[ReleaseAsset.from_dict(item) for item in data.get("assets", [])],
        )


def parse_version(value: str) -> tuple[int, int, int, tuple[str, ...]]:
    main, *suffix = value.split("-", 1)
    parts = main.split(".")
    numbers = [int(part) if part.isdigit() else 0 for part in parts[:3]]
    while len(numbers) < 3:
        numbers.append(0)
    return numbers[0], numbers[1], numbers[2], tuple(suffix)


def is_update_available(current: str, latest: str) -> bool:
    return parse_version(latest) > parse_version(current)


def load_manifest(path: Path) -> ReleaseManifest:
    return ReleaseManifest.from_dict(json.loads(path.read_text(encoding="utf-8")))


def write_manifest(path: Path, manifest: ReleaseManifest) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(manifest.to_dict(), indent=2), encoding="utf-8")


def fetch_manifest(url: str) -> tuple[ReleaseManifest | None, str | None]:
    request = Request(url, headers={"Accept": "application/json", "User-Agent": "ORYND-CAD-Bridge-Updater"})
    try:
        with urlopen(request, timeout=15) as response:  # noqa: S310 - user-configured update manifest URL
            payload = response.read().decode("utf-8")
            return ReleaseManifest.from_dict(json.loads(payload)), None
    except HTTPError as exc:
        return None, f"HTTP {exc.code}: {exc.reason}"
    except URLError as exc:
        return None, str(exc.reason)
    except Exception as exc:
        return None, str(exc)


def update_status(current_version: str, manifest: ReleaseManifest) -> dict[str, Any]:
    return {
        "product": manifest.product,
        "channel": manifest.channel,
        "current_version": current_version,
        "latest_version": manifest.version,
        "update_available": is_update_available(current_version, manifest.version),
        "minimum_supported_version": manifest.minimum_supported_version,
        "force_update": (
            bool(manifest.minimum_supported_version)
            and is_update_available(current_version, manifest.minimum_supported_version or current_version)
        ),
        "assets": [asset.to_dict() for asset in manifest.assets],
        "notes_url": manifest.notes_url,
    }


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def asset_from_file(path: Path, *, url: str, platform: str | None = None) -> ReleaseAsset:
    return ReleaseAsset(
        name=path.name,
        url=url,
        sha256=sha256_file(path),
        size_bytes=path.stat().st_size,
        platform=platform,
    )

