from integrations.external_cad_extension.env_config import SupabaseConfig
from integrations.external_cad_extension.supabase_client import SupabaseRestClient


def test_supabase_client_rejects_invalid_config_without_network():
    client = SupabaseRestClient(
        SupabaseConfig(
            url="https:https://example.supabase.co",
            publishable_key="sb_publishable_realistic1234567890",
            secret_key=None,
        )
    )
    response = client.check_table("cad_bridge_runs")
    assert response.ok is False
    assert response.status is None
    assert "not valid" in response.error


def test_supabase_client_builds_rest_url():
    client = SupabaseRestClient(
        SupabaseConfig(
            url="https://example.supabase.co",
            publishable_key="sb_publishable_realistic1234567890",
            secret_key="sb_secret_realistic1234567890",
        )
    )
    url = client.table_url("cad_bridge_runs", {"select": "*", "limit": "1"})
    assert url == "https://example.supabase.co/rest/v1/cad_bridge_runs?select=%2A&limit=1"


def test_supabase_client_backend_mode_requires_secret_key():
    client = SupabaseRestClient(
        SupabaseConfig(
            url="https://example.supabase.co",
            publishable_key="sb_publishable_realistic1234567890",
            secret_key=None,
        ),
        use_backend_key=True,
    )
    assert client.ready is False

