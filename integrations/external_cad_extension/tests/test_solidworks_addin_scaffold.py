from pathlib import Path


ADDIN_ROOT = Path("integrations/external_cad_extension/solidworks_addin")


def test_solidworks_addin_scaffold_files_exist():
    expected = [
        "README.md",
        "manifest.json",
        "Register-ORYNDCADBridgeAddin.ps1",
        "Unregister-ORYNDCADBridgeAddin.ps1",
        "ORYNDCadBridgeAddin/ORYNDCadBridgeAddin.csproj",
        "ORYNDCadBridgeAddin/SwAddin.cs",
        "ORYNDCadBridgeAddin/BridgeClient.cs",
        "ORYNDCadBridgeAddin/CadBridgeTaskPaneControl.cs",
        "ORYNDCadBridgeAddin/Properties/AssemblyInfo.cs",
    ]
    for item in expected:
        assert (ADDIN_ROOT / item).exists(), item


def test_solidworks_addin_contains_registration_identity():
    addin = (ADDIN_ROOT / "ORYNDCadBridgeAddin/SwAddin.cs").read_text(encoding="utf-8")
    register = (ADDIN_ROOT / "Register-ORYNDCADBridgeAddin.ps1").read_text(encoding="utf-8")
    assert "ORYND.CadBridge.SolidWorksAddin" in addin
    assert "B7F2B6BE-AC0E-4591-A466-BA92A238E9D4" in addin
    assert "B7F2B6BE-AC0E-4591-A466-BA92A238E9D4" in register


def test_solidworks_addin_uses_local_bridge_and_preview_only():
    addin = (ADDIN_ROOT / "ORYNDCadBridgeAddin/SwAddin.cs").read_text(encoding="utf-8")
    client = (ADDIN_ROOT / "ORYNDCadBridgeAddin/BridgeClient.cs").read_text(encoding="utf-8")
    assert "http://127.0.0.1:8765" in addin
    assert "api/generate" in client
    assert "Review it in the task pane before execution" in addin
    assert ".RunMacro" not in addin


def test_solidworks_addin_has_taskpane_control_scaffold():
    addin = (ADDIN_ROOT / "ORYNDCadBridgeAddin/SwAddin.cs").read_text(encoding="utf-8")
    control = (ADDIN_ROOT / "ORYNDCadBridgeAddin/CadBridgeTaskPaneControl.cs").read_text(encoding="utf-8")
    project = (ADDIN_ROOT / "ORYNDCadBridgeAddin/ORYNDCadBridgeAddin.csproj").read_text(encoding="utf-8")
    assert "CreateTaskpaneView2" in addin
    assert "ORYND.CadBridge.TaskPaneControl" in addin
    assert "UserControl" in control
    assert "Generate Preview" in control
    assert "CadBridgeTaskPaneControl.cs" in project
