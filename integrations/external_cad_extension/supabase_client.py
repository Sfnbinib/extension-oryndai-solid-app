"""Minimal Supabase REST adapter for ORYND CAD Bridge.

Uses only the Python standard library so the prototype does not need a new
runtime dependency. Secrets are never returned by status helpers.
"""

from __future__ import annotations

import hashlib
import json
from dataclasses import dataclass
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from .env_config import SupabaseConfig, load_supabase_config
from .schema import OperationPlan
from .validator import ValidationReport


@dataclass(frozen=True)
class SupabaseResponse:
    ok: bool
    status: int | None
    data: Any = None
    error: str | None = None

    def to_dict(self) -> dict[str, Any]:
        return {
            "ok": self.ok,
            "status": self.status,
            "data": self.data,
            "error": self.error,
        }


class SupabaseRestClient:
    def __init__(self, config: SupabaseConfig, *, use_backend_key: bool = False):
        self.config = config
        self.use_backend_key = use_backend_key

    @property
    def key(self) -> str | None:
        return self.config.secret_key if self.use_backend_key else self.config.publishable_key

    @property
    def ready(self) -> bool:
        return self.config.has_backend_config if self.use_backend_key else self.config.has_client_config

    def table_url(self, table: str, query: dict[str, str] | None = None) -> str:
        if not self.config.url:
            raise ValueError("SUPABASE_URL is not configured.")
        base = self.config.url.rstrip("/") + f"/rest/v1/{table}"
        if query:
            return base + "?" + urlencode(query)
        return base

    def request(
        self,
        method: str,
        table: str,
        *,
        query: dict[str, str] | None = None,
        body: Any = None,
        prefer: str | None = None,
    ) -> SupabaseResponse:
        if not self.ready:
            return SupabaseResponse(
                ok=False,
                status=None,
                error="Supabase config is not valid for this client mode.",
            )
        payload = None if body is None else json.dumps(body).encode("utf-8")
        headers = {
            "apikey": self.key or "",
            "Authorization": f"Bearer {self.key or ''}",
            "Accept": "application/json",
        }
        if payload is not None:
            headers["Content-Type"] = "application/json"
        if prefer:
            headers["Prefer"] = prefer
        request = Request(self.table_url(table, query), data=payload, method=method.upper(), headers=headers)
        try:
            with urlopen(request, timeout=20) as response:  # noqa: S310 - configured Supabase project URL only
                text = response.read().decode("utf-8")
                data = json.loads(text) if text else None
                return SupabaseResponse(ok=200 <= response.status < 300, status=response.status, data=data)
        except HTTPError as exc:
            text = exc.read().decode("utf-8", errors="replace")
            return SupabaseResponse(ok=False, status=exc.code, error=text)
        except URLError as exc:
            return SupabaseResponse(ok=False, status=None, error=str(exc.reason))

    def check_table(self, table: str) -> SupabaseResponse:
        return self.request("GET", table, query={"select": "*", "limit": "1"})

    def insert_run(
        self,
        *,
        user_id: str | None,
        local_session_id: str | None,
        prompt: str,
        scenario: str | None,
        source_path: str,
        plan: OperationPlan,
        validation: ValidationReport,
        macro_code: str,
        status: str = "previewed",
    ) -> SupabaseResponse:
        macro_hash = hashlib.sha256(macro_code.encode("utf-8")).hexdigest()
        row = {
            "user_id": user_id,
            "local_session_id": local_session_id,
            "prompt": prompt,
            "scenario": scenario,
            "source_path": source_path,
            "operation_plan": plan.to_dict(),
            "validation": validation.to_dict(),
            "macro_hash": macro_hash,
            "status": status,
            "target_cad": "solidworks",
        }
        return self.request("POST", "cad_bridge_runs", body=row, prefer="return=representation")


def default_supabase_client(*, use_backend_key: bool = False) -> SupabaseRestClient:
    return SupabaseRestClient(load_supabase_config(), use_backend_key=use_backend_key)

