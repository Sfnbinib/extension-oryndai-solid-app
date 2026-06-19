from pathlib import Path


ROOT = Path("integrations/external_cad_extension")


def test_supabase_migration_contains_rls_and_core_tables():
    migration = (ROOT / "supabase/migrations/001_cad_bridge_core.sql").read_text(encoding="utf-8")
    for table in [
        "cad_bridge_profiles",
        "cad_bridge_entitlements",
        "cad_bridge_trials",
        "cad_bridge_runs",
        "cad_bridge_model_routes",
    ]:
        assert table in migration
    assert "enable row level security" in migration
    assert "auth.uid() = user_id" in migration
    assert "macro_hash" in migration


def test_solidworks_inventory_extractor_scaffold():
    tool_root = ROOT / "tools/solidworks_api_inventory"
    program = (tool_root / "Program.cs").read_text(encoding="utf-8")
    project = (tool_root / "SolidWorksApiInventory.csproj").read_text(encoding="utf-8")
    assert "SolidWorks.Interop.sldworks.dll" in program
    assert "SolidWorks.Interop.swconst.dll" in program
    assert "SolidWorks.Interop.swpublished.dll" in program
    assert "GetExportedTypes" in program
    assert "net8.0" in project


def test_solidworks_taxonomy_keeps_raw_api_behind_allowlist():
    taxonomy = (ROOT / "SOLIDWORKS_COMMAND_TAXONOMY.md").read_text(encoding="utf-8")
    assert "No model output should call arbitrary" in taxonomy
    assert "CommandSpec -> validator -> macro/add-in emitter -> runtime test" in taxonomy


def test_ui_preview_artifacts_exist():
    preview = ROOT / "ui/companion_preview.html"
    spec = ROOT / "UI_PRODUCTION_SPEC.md"
    assert preview.exists()
    assert spec.exists()
    html = preview.read_text(encoding="utf-8")
    assert "ORYND CAD Bridge" in html
    assert "Generate CAD Macro" in html
    assert "SolidWorks runtime pending" in html


def test_existing_orynd_auth_integration_doc_exists():
    doc = (ROOT / "EXISTING_ORYND_AUTH_INTEGRATION.md").read_text(encoding="utf-8")
    assert "should not create a separate authentication system" in doc
    assert "orynd_desktop/src/ports/auth.port.ts" in doc
    assert "current_user" in doc


def test_solidworks_addin_ui_plan_prioritizes_native_extension_ui():
    doc = (ROOT / "SOLIDWORKS_ADDIN_UI_PLAN.md").read_text(encoding="utf-8")
    normalized = " ".join(doc.split())
    assert "CommandManager Toolbar" in doc
    assert "Task Pane" in doc
    assert "PropertyManagerPage" in doc
    assert "not as a standalone web dashboard" in normalized


def test_product_foundation_and_runtime_events_exist():
    foundation = (ROOT / "PRODUCT_FOUNDATION.md").read_text(encoding="utf-8")
    events = (ROOT / "RUNTIME_EVENTS.md").read_text(encoding="utf-8")
    assert "SolidWorks Add-in + right-side Task Pane" in foundation
    assert "local bridge process" in foundation
    assert "started -> thinking -> searching" in foundation
    assert "preview_ready" in events
    assert "approval_required" in events


def test_packaging_update_plan_exists():
    plan = (ROOT / "PACKAGING_AND_UPDATE_PLAN.md").read_text(encoding="utf-8")
    manifest = ROOT / "release/manifest.example.json"
    assert "GitHub Release" in plan
    assert "update-check" in plan
    assert manifest.exists()


def test_mac_windows_installation_doc_exists():
    doc = (ROOT / "MAC_AND_WINDOWS_INSTALLATION.md").read_text(encoding="utf-8")
    assert "Windows add-in" in doc
    assert "Parallels" in doc
    assert "Companion" in doc
