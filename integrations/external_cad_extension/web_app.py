"""Local companion web UI for ORYND CAD Bridge prototype."""

from __future__ import annotations

import json
import mimetypes
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any
from urllib.parse import parse_qs, unquote, urlparse

from .ai_model_4_adapter import primitives_to_operation_plan
from .env_config import load_supabase_config
from .generator import generate
from .gencad_adapter import GenCADConfig, gencad_status
from .orchestrator import render_scenario_markdown, run_scenario
from .preview import render_preview_markdown
from .settings import (
    DEFAULT_STATE_PATH,
    configure_model_key,
    entitlement_gate,
    load_settings,
    sign_in_local,
    start_trial,
)
from .solidworks_vba import emit_solidworks_vba
from .validator import validate_generation


HOST = "127.0.0.1"
PORT = 8765
MODULE_DIR = Path(__file__).resolve().parent
CLOUD_DESIGN_DIR = MODULE_DIR / "ui" / "cloud_design"
CLOUD_DESIGN_INDEX = CLOUD_DESIGN_DIR / "ORYND CAD Bridge.html"


class CadBridgeHandler(BaseHTTPRequestHandler):
    server_version = "ORYNDCADBridge/0.1"

    def do_GET(self) -> None:  # noqa: N802 - stdlib handler API
        parsed = urlparse(self.path)
        if parsed.path in {"/", "/index.html"}:
            self._send_html(INDEX_HTML)
            return
        if parsed.path in {"/cloud-design", "/cloud-design/"}:
            self._send_file(CLOUD_DESIGN_INDEX)
            return
        if parsed.path.startswith("/cloud-design/"):
            self._send_cloud_design_asset(parsed.path.removeprefix("/cloud-design/"))
            return
        if parsed.path == "/api/settings":
            self._send_json(load_settings(_path_from_query(parsed.query)).to_dict())
            return
        if parsed.path == "/api/entitlement":
            path = _path_from_query(parsed.query)
            self._send_json(entitlement_gate(path=path))
            return
        if parsed.path == "/api/gencad/status":
            params = parse_qs(parsed.query)
            repo_path = Path(params.get("repo_path", ["integrations/GenCAD"])[0])
            self._send_json(gencad_status(GenCADConfig(repo_path=repo_path)).to_dict())
            return
        if parsed.path == "/api/supabase/status":
            params = parse_qs(parsed.query)
            env_path = Path(params.get("env_path", ["integrations/external_cad_extension/.env"])[0])
            self._send_json(load_supabase_config(env_path).to_status())
            return
        self._send_json({"error": "not found"}, status=404)

    def do_POST(self) -> None:  # noqa: N802 - stdlib handler API
        parsed = urlparse(self.path)
        try:
            payload = self._read_json()
            if parsed.path == "/api/scenario":
                result = run_scenario(str(payload.get("prompt") or "I want a brake disc."), scenario=payload.get("scenario", "auto"))
                data = result.to_dict()
                data["scenario_markdown"] = render_scenario_markdown(result)
                data["macro_code"] = result.generation.macro_code
                data["preview_markdown"] = render_preview_markdown(
                    result.generation.plan,
                    result.generation.macro_code,
                    result.validation.to_dict(),
                )
                self._send_json(data)
                return
            if parsed.path == "/api/generate":
                result = generate(prompt=payload.get("prompt"), example=payload.get("example"))
                validation = validate_generation(result.plan, result.macro_code)
                self._send_json(
                    {
                        "operation_plan": result.plan.to_dict(),
                        "macro_code": result.macro_code,
                        "validation": validation.to_dict(),
                        "preview_markdown": render_preview_markdown(result.plan, result.macro_code, validation.to_dict()),
                    }
                )
                return
            if parsed.path == "/api/account/signin":
                settings = sign_in_local(str(payload["email"]), path=_settings_path(payload))
                self._send_json(settings.to_dict())
                return
            if parsed.path == "/api/trial/start":
                try:
                    settings = start_trial(path=_settings_path(payload))
                except ValueError as exc:
                    self._send_json({"error": str(exc)}, status=409)
                    return
                self._send_json(settings.to_dict())
                return
            if parsed.path == "/api/model-key":
                settings = configure_model_key(
                    provider=str(payload["provider"]),
                    api_key=payload.get("api_key"),
                    api_key_env=payload.get("api_key_env"),
                    model=payload.get("model"),
                    path=_settings_path(payload),
                )
                self._send_json(settings.to_dict())
                return
            if parsed.path == "/api/ai4/primitives":
                result = primitives_to_operation_plan(
                    payload.get("ai_model_4_doc", {}),
                    name=str(payload.get("name") or "ai_model_4_part"),
                )
                macro_code = emit_solidworks_vba(result.operation_plan)
                validation = validate_generation(result.operation_plan, macro_code)
                self._send_json(
                    {
                        "adapter": result.to_dict(),
                        "operation_plan": result.operation_plan.to_dict(),
                        "macro_code": macro_code,
                        "validation": validation.to_dict(),
                        "preview_markdown": render_preview_markdown(
                            result.operation_plan,
                            macro_code,
                            validation.to_dict(),
                        ),
                    }
                )
                return
        except Exception as exc:
            self._send_json({"error": str(exc)}, status=400)
            return
        self._send_json({"error": "not found"}, status=404)

    def log_message(self, format: str, *args: Any) -> None:
        return

    def _read_json(self) -> dict[str, Any]:
        length = int(self.headers.get("Content-Length", "0"))
        if length <= 0:
            return {}
        return json.loads(self.rfile.read(length).decode("utf-8"))

    def _send_json(self, data: Any, *, status: int = 200) -> None:
        body = json.dumps(data, ensure_ascii=False, indent=2).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _send_html(self, html: str) -> None:
        body = html.encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _send_cloud_design_asset(self, raw_relative_path: str) -> None:
        relative_path = unquote(raw_relative_path)
        if not relative_path or relative_path.endswith("/"):
            self._send_file(CLOUD_DESIGN_INDEX)
            return
        candidate = (CLOUD_DESIGN_DIR / relative_path).resolve()
        try:
            candidate.relative_to(CLOUD_DESIGN_DIR.resolve())
        except ValueError:
            self._send_json({"error": "not found"}, status=404)
            return
        self._send_file(candidate)

    def _send_file(self, path: Path) -> None:
        if not path.exists() or not path.is_file():
            self._send_json({"error": "not found"}, status=404)
            return
        body = path.read_bytes()
        self.send_response(200)
        self.send_header("Content-Type", _content_type_for(path))
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)


def _settings_path(payload: dict[str, Any]) -> Path:
    value = payload.get("settings_path")
    return Path(value) if value else DEFAULT_STATE_PATH


def _path_from_query(query: str) -> Path:
    params = parse_qs(query)
    value = params.get("settings_path", [None])[0]
    return Path(value) if value else DEFAULT_STATE_PATH


def run_server(host: str = HOST, port: int = PORT) -> ThreadingHTTPServer:
    server = ThreadingHTTPServer((host, port), CadBridgeHandler)
    print(f"ORYND CAD Bridge companion UI: http://{host}:{port}", flush=True)
    server.serve_forever()
    return server


def _content_type_for(path: Path) -> str:
    if path.suffix == ".jsx":
        return "text/babel; charset=utf-8"
    if path.suffix == ".md":
        return "text/markdown; charset=utf-8"
    if path.suffix in {".html", ".css", ".js", ".json", ".svg"}:
        guessed = mimetypes.guess_type(path.name)[0]
        return f"{guessed or 'text/plain'}; charset=utf-8"
    return mimetypes.guess_type(path.name)[0] or "application/octet-stream"


def main() -> int:
    run_server()
    return 0


INDEX_HTML = r'''<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>ORYND CAD Bridge</title>
  <style>
    :root {
      color-scheme: light;
      --bg: #f6f7f9;
      --panel: #ffffff;
      --text: #16181d;
      --muted: #667085;
      --line: #d7dce3;
      --accent: #0f766e;
      --accent-2: #334155;
      --danger: #b42318;
      --ok: #067647;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font: 14px/1.45 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background: var(--bg);
      color: var(--text);
    }
    header {
      height: 56px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 20px;
      border-bottom: 1px solid var(--line);
      background: var(--panel);
    }
    h1 { font-size: 17px; margin: 0; font-weight: 650; }
    main {
      display: grid;
      grid-template-columns: minmax(320px, 420px) minmax(0, 1fr);
      gap: 16px;
      padding: 16px;
      max-width: 1440px;
      margin: 0 auto;
    }
    section {
      background: var(--panel);
      border: 1px solid var(--line);
      border-radius: 8px;
      padding: 14px;
    }
    h2 { font-size: 14px; margin: 0 0 10px; }
    label { display: block; margin: 10px 0 5px; color: var(--muted); font-size: 12px; }
    input, textarea, select {
      width: 100%;
      border: 1px solid var(--line);
      border-radius: 6px;
      padding: 9px 10px;
      background: #fff;
      color: var(--text);
      font: inherit;
    }
    textarea { min-height: 108px; resize: vertical; }
    button {
      border: 0;
      border-radius: 6px;
      padding: 9px 12px;
      background: var(--accent-2);
      color: white;
      font: inherit;
      cursor: pointer;
    }
    button.primary { background: var(--accent); }
    .row { display: flex; gap: 8px; align-items: center; }
    .row > * { flex: 1; }
    .stack { display: grid; gap: 12px; }
    .status {
      padding: 8px 10px;
      border-radius: 6px;
      border: 1px solid var(--line);
      color: var(--muted);
      overflow-wrap: anywhere;
    }
    .ok { color: var(--ok); }
    .bad { color: var(--danger); }
    pre {
      white-space: pre-wrap;
      overflow-wrap: anywhere;
      margin: 0;
      padding: 12px;
      border-radius: 6px;
      background: #0f172a;
      color: #e5e7eb;
      min-height: 220px;
      max-height: 72vh;
      overflow: auto;
      font-size: 12px;
    }
    .tabs { display: flex; gap: 6px; margin-bottom: 10px; }
    .tabs button { background: #e5e7eb; color: var(--text); }
    .tabs button.active { background: var(--accent); color: #fff; }
    @media (max-width: 900px) {
      main { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <header>
    <h1>ORYND CAD Bridge</h1>
    <div id="gate" class="status">Checking access</div>
  </header>
  <main>
    <div class="stack">
      <section>
        <h2>Account</h2>
        <label>Email</label>
        <div class="row">
          <input id="email" placeholder="demo@example.com">
          <button onclick="signIn()">Sign in</button>
        </div>
        <label>Model Provider</label>
        <div class="row">
          <select id="provider">
            <option value="anthropic">Anthropic</option>
            <option value="openai">OpenAI</option>
            <option value="ollama">Ollama</option>
            <option value="local">Local</option>
          </select>
          <input id="model" placeholder="model">
        </div>
        <label>API Key</label>
        <div class="row">
          <input id="apiKey" placeholder="sk-..." type="password">
          <button onclick="saveKey()">Save</button>
        </div>
        <div class="row" style="margin-top:10px">
          <button onclick="startTrial()">Start Trial</button>
          <button onclick="refreshSettings()">Refresh</button>
        </div>
      </section>
      <section>
        <h2>Prompt</h2>
        <textarea id="prompt">Я хочу тормозной диск диаметром 280 мм с 5 отверстиями. Объясни как построить и сгенерируй макрос.</textarea>
        <div class="row" style="margin-top:10px">
          <button class="primary" onclick="runScenario()">Run Scenario</button>
          <button onclick="generateMacro()">Generate Macro</button>
        </div>
      </section>
    </div>
    <section>
      <div class="tabs">
        <button id="tab-summary" class="active" onclick="setTab('summary')">Summary</button>
        <button id="tab-plan" onclick="setTab('plan')">Plan</button>
        <button id="tab-code" onclick="setTab('code')">Macro</button>
        <button id="tab-settings" onclick="setTab('settings')">Settings</button>
      </div>
      <pre id="output">Ready.</pre>
    </section>
  </main>
  <script>
    let state = { summary: "Ready.", plan: "", code: "", settings: "" };
    let activeTab = "summary";
    const out = document.getElementById("output");

    function setTab(name) {
      activeTab = name;
      for (const key of ["summary", "plan", "code", "settings"]) {
        document.getElementById(`tab-${key}`).classList.toggle("active", key === name);
      }
      out.textContent = state[name] || "";
    }
    async function post(url, body) {
      const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || res.statusText);
      return data;
    }
    async function refreshSettings() {
      const data = await fetch("/api/settings").then(r => r.json());
      state.settings = JSON.stringify(data, null, 2);
      const gate = await fetch("/api/entitlement").then(r => r.json());
      document.getElementById("gate").innerHTML = gate.allowed
        ? `<span class="ok">${gate.reason}</span>`
        : `<span class="bad">${gate.reason}</span> -> ${gate.checkout_url}`;
      if (activeTab === "settings") setTab("settings");
    }
    async function signIn() {
      const data = await post("/api/account/signin", { email: document.getElementById("email").value });
      state.settings = JSON.stringify(data, null, 2);
      setTab("settings");
      refreshSettings();
    }
    async function saveKey() {
      const data = await post("/api/model-key", {
        provider: document.getElementById("provider").value,
        model: document.getElementById("model").value,
        api_key: document.getElementById("apiKey").value
      });
      state.settings = JSON.stringify(data, null, 2);
      setTab("settings");
      refreshSettings();
    }
    async function startTrial() {
      const data = await post("/api/trial/start", {});
      state.settings = JSON.stringify(data, null, 2);
      setTab("settings");
      refreshSettings();
    }
    async function runScenario() {
      state.summary = "Running scenario...";
      setTab("summary");
      const data = await post("/api/scenario", { prompt: document.getElementById("prompt").value, scenario: "brake_disc" });
      state.summary = data.scenario_markdown;
      state.plan = JSON.stringify(data.operation_plan, null, 2);
      state.code = data.macro_code;
      setTab("summary");
    }
    async function generateMacro() {
      state.summary = "Generating macro...";
      setTab("summary");
      const data = await post("/api/generate", { prompt: document.getElementById("prompt").value });
      state.summary = data.preview_markdown;
      state.plan = JSON.stringify(data.operation_plan, null, 2);
      state.code = data.macro_code;
      setTab("summary");
    }
    refreshSettings();
  </script>
</body>
</html>'''


if __name__ == "__main__":
    raise SystemExit(main())
