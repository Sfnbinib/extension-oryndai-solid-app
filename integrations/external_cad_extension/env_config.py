"""Environment configuration helpers for the external CAD extension.

This module intentionally reports only presence/masked values. It must not
print or log raw secrets.
"""

from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path
from typing import Any
from urllib.parse import urlparse

from .settings import mask_secret


DEFAULT_ENV_PATH = Path("integrations/external_cad_extension/.env")


def load_env_file(path: Path = DEFAULT_ENV_PATH) -> dict[str, str]:
    if not path.exists():
        return {}

    values: dict[str, str] = {}
    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        if key:
            values[key] = value
    return values


def env_value(name: str, *, env_path: Path = DEFAULT_ENV_PATH, aliases: tuple[str, ...] = ()) -> str | None:
    for candidate in (name, *aliases):
        if os.getenv(candidate):
            return os.getenv(candidate)
    return load_env_file(env_path).get(name)


@dataclass(frozen=True)
class SupabaseConfig:
    url: str | None
    publishable_key: str | None
    secret_key: str | None
    source_path: Path = DEFAULT_ENV_PATH

    @property
    def has_client_config(self) -> bool:
        return bool(self.valid_url and self.valid_publishable_key)

    @property
    def has_backend_config(self) -> bool:
        return bool(self.valid_url and self.valid_secret_key)

    @property
    def valid_url(self) -> bool:
        if not self.url:
            return False
        parsed = urlparse(self.url)
        return parsed.scheme == "https" and parsed.netloc.endswith(".supabase.co")

    @property
    def valid_publishable_key(self) -> bool:
        return _looks_like_real_key(self.publishable_key, prefix="sb_publishable_")

    @property
    def valid_secret_key(self) -> bool:
        return _looks_like_real_key(self.secret_key, prefix="sb_secret_")

    def to_status(self) -> dict[str, Any]:
        return {
            "env_path": str(self.source_path),
            "has_env_file": self.source_path.exists(),
            "has_client_config": self.has_client_config,
            "has_backend_config": self.has_backend_config,
            "valid_url": self.valid_url,
            "valid_publishable_key": self.valid_publishable_key,
            "valid_secret_key": self.valid_secret_key,
            "supabase_url": self.url,
            "publishable_key": mask_secret(self.publishable_key),
            "secret_key": mask_secret(self.secret_key),
            "required_for_client": ["SUPABASE_URL", "SUPABASE_PUBLISHABLE_KEY"],
            "required_for_backend": ["SUPABASE_URL", "SUPABASE_SECRET_KEY"],
            "warnings": self.warnings(),
        }

    def warnings(self) -> list[str]:
        warnings: list[str] = []
        if self.url and not self.valid_url:
            warnings.append("SUPABASE_URL must look like https://<project-ref>.supabase.co")
        if self.publishable_key and not self.valid_publishable_key:
            warnings.append("SUPABASE_PUBLISHABLE_KEY is missing, malformed, or still a placeholder.")
        if self.secret_key and not self.valid_secret_key:
            warnings.append("SUPABASE_SECRET_KEY is missing, malformed, or still a placeholder.")
        return warnings


def load_supabase_config(env_path: Path = DEFAULT_ENV_PATH) -> SupabaseConfig:
    env_file = load_env_file(env_path)

    def from_env_or_file(name: str, *aliases: str) -> str | None:
        for candidate in (name, *aliases):
            if os.getenv(candidate):
                return os.getenv(candidate)
            if env_file.get(candidate):
                return env_file[candidate]
        return None

    return SupabaseConfig(
        url=from_env_or_file("SUPABASE_URL", "VITE_SUPABASE_URL"),
        publishable_key=from_env_or_file("SUPABASE_PUBLISHABLE_KEY", "SUPABASE_ANON_KEY", "VITE_SUPABASE_ANON_KEY"),
        secret_key=from_env_or_file("SUPABASE_SECRET_KEY", "SUPABASE_SERVICE_ROLE_KEY"),
        source_path=env_path,
    )


def _looks_like_real_key(value: str | None, *, prefix: str) -> bool:
    if not value or not value.startswith(prefix):
        return False
    upper = value.upper()
    if "REPLACE" in upper or "YOUR_" in upper or "EXAMPLE" in upper:
        return False
    return len(value) > len(prefix) + 12
