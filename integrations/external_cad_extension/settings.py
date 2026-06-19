"""Local account, API-key, trial, and subscription settings.

This is a prototype product shell. It does not process real payments and does
not authenticate with Supabase yet. It defines the state contract that the UI,
MCP server, and future backend can share.
"""

from __future__ import annotations

import json
import os
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any


DEFAULT_STATE_PATH = Path("integrations/external_cad_extension/out/user_settings.json")
DEFAULT_CHECKOUT_URL = "https://orynd.ai/checkout?product=cad-bridge"
TRIAL_DAYS = 3


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def parse_time(value: str | None) -> datetime | None:
    if not value:
        return None
    return datetime.fromisoformat(value.replace("Z", "+00:00"))


def format_time(value: datetime | None) -> str | None:
    if value is None:
        return None
    return value.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")


def mask_secret(secret: str | None) -> str | None:
    if not secret:
        return None
    if len(secret) <= 8:
        return "*" * len(secret)
    return f"{secret[:4]}...{secret[-4:]}"


@dataclass
class ModelKeySettings:
    provider: str = "none"
    api_key: str | None = None
    api_key_env: str | None = None
    model: str | None = None

    def effective_key(self) -> str | None:
        if self.api_key_env:
            return os.getenv(self.api_key_env)
        return self.api_key

    def to_dict(self, *, include_secret: bool = False) -> dict[str, Any]:
        return {
            "provider": self.provider,
            "api_key": self.api_key if include_secret else mask_secret(self.api_key),
            "api_key_env": self.api_key_env,
            "model": self.model,
            "has_effective_key": bool(self.effective_key()),
        }

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> "ModelKeySettings":
        return cls(
            provider=str(data.get("provider", "none")),
            api_key=data.get("api_key"),
            api_key_env=data.get("api_key_env"),
            model=data.get("model"),
        )


@dataclass
class AccountSettings:
    email: str | None = None
    user_id: str | None = None
    signed_in: bool = False

    def to_dict(self) -> dict[str, Any]:
        return {
            "email": self.email,
            "user_id": self.user_id,
            "signed_in": self.signed_in,
        }

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> "AccountSettings":
        return cls(
            email=data.get("email"),
            user_id=data.get("user_id"),
            signed_in=bool(data.get("signed_in", False)),
        )


@dataclass
class SubscriptionSettings:
    status: str = "none"  # none | trial | active | expired | canceled
    trial_started_at: datetime | None = None
    trial_expires_at: datetime | None = None
    subscription_expires_at: datetime | None = None
    checkout_url: str = DEFAULT_CHECKOUT_URL

    def is_entitled(self, *, now: datetime | None = None) -> bool:
        now = now or utc_now()
        if self.status == "active":
            return self.subscription_expires_at is None or self.subscription_expires_at > now
        if self.status == "trial":
            return self.trial_expires_at is not None and self.trial_expires_at > now
        return False

    def entitlement_reason(self, *, now: datetime | None = None) -> str:
        now = now or utc_now()
        if self.is_entitled(now=now):
            if self.status == "trial":
                return f"trial active until {format_time(self.trial_expires_at)}"
            return "subscription active"
        if self.status == "trial":
            return "trial expired"
        if self.status in {"expired", "canceled"}:
            return f"subscription {self.status}"
        return "no trial or subscription"

    def to_dict(self) -> dict[str, Any]:
        return {
            "status": self.status,
            "trial_started_at": format_time(self.trial_started_at),
            "trial_expires_at": format_time(self.trial_expires_at),
            "subscription_expires_at": format_time(self.subscription_expires_at),
            "checkout_url": self.checkout_url,
        }

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> "SubscriptionSettings":
        return cls(
            status=str(data.get("status", "none")),
            trial_started_at=parse_time(data.get("trial_started_at")),
            trial_expires_at=parse_time(data.get("trial_expires_at")),
            subscription_expires_at=parse_time(data.get("subscription_expires_at")),
            checkout_url=str(data.get("checkout_url", DEFAULT_CHECKOUT_URL)),
        )


@dataclass
class UserSettings:
    account: AccountSettings = field(default_factory=AccountSettings)
    model_key: ModelKeySettings = field(default_factory=ModelKeySettings)
    subscription: SubscriptionSettings = field(default_factory=SubscriptionSettings)

    def to_dict(self, *, include_secret: bool = False) -> dict[str, Any]:
        return {
            "account": self.account.to_dict(),
            "model_key": self.model_key.to_dict(include_secret=include_secret),
            "subscription": self.subscription.to_dict(),
            "entitlement": {
                "allowed": self.subscription.is_entitled(),
                "reason": self.subscription.entitlement_reason(),
                "checkout_url": self.subscription.checkout_url,
            },
        }

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> "UserSettings":
        return cls(
            account=AccountSettings.from_dict(data.get("account", {}) or {}),
            model_key=ModelKeySettings.from_dict(data.get("model_key", {}) or {}),
            subscription=SubscriptionSettings.from_dict(data.get("subscription", {}) or {}),
        )


def load_settings(path: Path = DEFAULT_STATE_PATH) -> UserSettings:
    if not path.exists():
        return UserSettings()
    return UserSettings.from_dict(json.loads(path.read_text(encoding="utf-8")))


def save_settings(settings: UserSettings, path: Path = DEFAULT_STATE_PATH) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(settings.to_dict(include_secret=True), indent=2), encoding="utf-8")


def sign_in_local(email: str, *, path: Path = DEFAULT_STATE_PATH) -> UserSettings:
    settings = load_settings(path)
    settings.account.email = email
    settings.account.user_id = email.lower()
    settings.account.signed_in = True
    save_settings(settings, path)
    return settings


def configure_model_key(
    *,
    provider: str,
    api_key: str | None = None,
    api_key_env: str | None = None,
    model: str | None = None,
    path: Path = DEFAULT_STATE_PATH,
) -> UserSettings:
    if bool(api_key) == bool(api_key_env):
        raise ValueError("Provide exactly one of api_key or api_key_env.")
    settings = load_settings(path)
    settings.model_key = ModelKeySettings(provider=provider, api_key=api_key, api_key_env=api_key_env, model=model)
    save_settings(settings, path)
    return settings


def start_trial(*, path: Path = DEFAULT_STATE_PATH, now: datetime | None = None) -> UserSettings:
    now = now or utc_now()
    settings = load_settings(path)
    if settings.subscription.trial_started_at is not None:
        raise ValueError("Trial already started for this local account.")
    settings.subscription.status = "trial"
    settings.subscription.trial_started_at = now
    settings.subscription.trial_expires_at = now + timedelta(days=TRIAL_DAYS)
    save_settings(settings, path)
    return settings


def mark_subscription_active(
    *,
    days: int | None = 30,
    path: Path = DEFAULT_STATE_PATH,
    now: datetime | None = None,
) -> UserSettings:
    now = now or utc_now()
    settings = load_settings(path)
    settings.subscription.status = "active"
    settings.subscription.subscription_expires_at = now + timedelta(days=days) if days else None
    save_settings(settings, path)
    return settings


def entitlement_gate(*, path: Path = DEFAULT_STATE_PATH) -> dict[str, Any]:
    settings = load_settings(path)
    allowed = settings.subscription.is_entitled()
    return {
        "allowed": allowed,
        "reason": settings.subscription.entitlement_reason(),
        "checkout_url": None if allowed else settings.subscription.checkout_url,
        "has_model_key": bool(settings.model_key.effective_key()),
        "provider": settings.model_key.provider,
        "signed_in": settings.account.signed_in,
    }

