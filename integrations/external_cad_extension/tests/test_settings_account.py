import json
import subprocess
import sys
from datetime import datetime, timedelta, timezone

import pytest

from integrations.external_cad_extension.settings import (
    configure_model_key,
    entitlement_gate,
    load_settings,
    mark_subscription_active,
    sign_in_local,
    start_trial,
)
from integrations.external_cad_extension.env_config import load_supabase_config


def test_local_account_trial_and_entitlement(tmp_path):
    path = tmp_path / "settings.json"
    settings = sign_in_local("demo@example.com", path=path)
    assert settings.account.signed_in is True

    gate = entitlement_gate(path=path)
    assert gate["allowed"] is False
    assert gate["checkout_url"]

    now = datetime(2026, 6, 18, tzinfo=timezone.utc)
    settings = start_trial(path=path, now=now)
    assert settings.subscription.status == "trial"
    assert settings.subscription.is_entitled(now=now) is True
    assert settings.subscription.is_entitled(now=now + timedelta(days=4)) is False

    gate = entitlement_gate(path=path)
    assert gate["allowed"] is True
    assert gate["checkout_url"] is None


def test_trial_can_only_start_once(tmp_path):
    path = tmp_path / "settings.json"
    start_trial(path=path)
    with pytest.raises(ValueError):
        start_trial(path=path)


def test_model_key_is_masked_in_public_settings(tmp_path, monkeypatch):
    path = tmp_path / "settings.json"
    settings = configure_model_key(provider="anthropic", api_key="sk-ant-1234567890", model="claude-opus", path=path)
    public = settings.to_dict()
    assert public["model_key"]["api_key"] == "sk-a...7890"
    private = load_settings(path).to_dict(include_secret=True)
    assert private["model_key"]["api_key"] == "sk-ant-1234567890"

    settings = configure_model_key(provider="openai", api_key_env="OPENAI_TEST_KEY", model="gpt-test", path=path)
    monkeypatch.setenv("OPENAI_TEST_KEY", "secret")
    assert settings.model_key.effective_key() == "secret"


def test_subscription_activation_allows_access(tmp_path):
    path = tmp_path / "settings.json"
    mark_subscription_active(days=30, path=path)
    gate = entitlement_gate(path=path)
    assert gate["allowed"] is True
    assert gate["reason"] == "subscription active"


def test_cli_settings_commands(tmp_path):
    path = tmp_path / "settings.json"
    base = [
        sys.executable,
        "-m",
        "integrations.external_cad_extension.cli",
    ]
    signin = subprocess.run(
        base + ["account-signin", "--email", "demo@example.com", "--settings-path", str(path)],
        check=False,
        capture_output=True,
        text=True,
    )
    assert signin.returncode == 0, signin.stderr + signin.stdout

    trial = subprocess.run(
        base + ["trial-start", "--settings-path", str(path)],
        check=False,
        capture_output=True,
        text=True,
    )
    assert trial.returncode == 0, trial.stderr + trial.stdout

    key = subprocess.run(
        base
        + [
            "model-key-set",
            "--provider",
            "anthropic",
            "--api-key",
            "sk-ant-1234567890",
            "--model",
            "claude-opus",
            "--settings-path",
            str(path),
        ],
        check=False,
        capture_output=True,
        text=True,
    )
    assert key.returncode == 0, key.stderr + key.stdout
    key_data = json.loads(key.stdout)
    assert key_data["model_key"]["api_key"] == "sk-a...7890"

    gate = subprocess.run(
        base + ["entitlement", "--settings-path", str(path)],
        check=False,
        capture_output=True,
        text=True,
    )
    assert gate.returncode == 0, gate.stderr + gate.stdout
    assert json.loads(gate.stdout)["allowed"] is True


def test_supabase_env_status_masks_keys(tmp_path):
    env_path = tmp_path / ".env"
    env_path.write_text(
        "\n".join(
            [
                "SUPABASE_URL=https://example.supabase.co",
                "SUPABASE_PUBLISHABLE_KEY=sb_publishable_1234567890abcdef",
                "SUPABASE_SECRET_KEY=sb_secret_abcdefghijklmnopqrstuvwxyz",
            ]
        ),
        encoding="utf-8",
    )
    status = load_supabase_config(env_path).to_status()
    assert status["has_client_config"] is True
    assert status["has_backend_config"] is True
    assert status["publishable_key"] == "sb_p...cdef"
    assert status["secret_key"] == "sb_s...wxyz"
    assert "sb_publishable_1234567890abcdef" not in str(status)
    assert "sb_secret_abcdefghijklmnopqrstuvwxyz" not in str(status)


def test_supabase_env_status_rejects_placeholders_and_bad_url(tmp_path):
    env_path = tmp_path / ".env"
    env_path.write_text(
        "\n".join(
            [
                "SUPABASE_URL=https:https://example.supabase.co",
                "SUPABASE_PUBLISHABLE_KEY=sb_publishable_REPLACE_ME",
                "SUPABASE_SECRET_KEY=sb_secret_REPLACE_ME",
            ]
        ),
        encoding="utf-8",
    )
    status = load_supabase_config(env_path).to_status()
    assert status["has_client_config"] is False
    assert status["has_backend_config"] is False
    assert status["valid_url"] is False
    assert status["warnings"]


def test_supabase_env_status_accepts_existing_orynd_aliases(tmp_path):
    env_path = tmp_path / ".env"
    env_path.write_text(
        "\n".join(
            [
                "VITE_SUPABASE_URL=https://example.supabase.co",
                "VITE_SUPABASE_ANON_KEY=sb_publishable_1234567890abcdef",
                "SUPABASE_SERVICE_ROLE_KEY=sb_secret_abcdefghijklmnopqrstuvwxyz",
            ]
        ),
        encoding="utf-8",
    )
    status = load_supabase_config(env_path).to_status()
    assert status["has_client_config"] is True
    assert status["has_backend_config"] is True
    assert status["valid_publishable_key"] is True
    assert status["valid_secret_key"] is True


def test_cli_supabase_status_masks_keys(tmp_path):
    env_path = tmp_path / ".env"
    env_path.write_text(
        "SUPABASE_URL=https://example.supabase.co\nSUPABASE_PUBLISHABLE_KEY=sb_publishable_1234567890abcdef\n",
        encoding="utf-8",
    )
    completed = subprocess.run(
        [
            sys.executable,
            "-m",
            "integrations.external_cad_extension.cli",
            "supabase-status",
            "--env-path",
            str(env_path),
        ],
        check=False,
        capture_output=True,
        text=True,
    )
    assert completed.returncode == 0, completed.stderr + completed.stdout
    assert "sb_publishable_1234567890abcdef" not in completed.stdout
    data = json.loads(completed.stdout)
    assert data["has_client_config"] is True
