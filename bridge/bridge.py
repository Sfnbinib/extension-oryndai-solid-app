"""
ORYND Local Bridge — thin HTTP proxy (127.0.0.1:8765)
Forwards add-in requests to the ORYND backend. No logic lives here.

Usage:
    pip install -r requirements.txt
    python bridge.py [--backend https://your-backend-url]
"""

import argparse
import json
import os
import urllib.request
import urllib.error
from http.server import BaseHTTPRequestHandler, HTTPServer

BACKEND_URL = os.environ.get("ORYND_BACKEND", "https://api.oryndai.com")

CLOUD_DESIGN_HTML = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>ORYND</title>
<style>
  body { margin:0; font-family: -apple-system, sans-serif; background:#0f1117; color:#e2e8f0; display:flex; flex-direction:column; align-items:center; justify-content:center; height:100vh; }
  h2 { font-size:18px; margin-bottom:8px; }
  p  { font-size:13px; color:#64748b; }
  input { width:320px; padding:10px 14px; border-radius:8px; border:1px solid #334155; background:#1e293b; color:#e2e8f0; font-size:14px; outline:none; }
  button { margin-top:10px; padding:10px 24px; border-radius:8px; background:#6366f1; color:#fff; border:none; font-size:14px; cursor:pointer; }
  button:hover { background:#4f46e5; }
  #status { margin-top:14px; font-size:13px; color:#94a3b8; min-height:20px; }
</style>
</head>
<body>
  <h2>ORYND CAD Bridge</h2>
  <p>Type a prompt and press Generate</p>
  <input id="prompt" placeholder="Create a bracket 80 x 40 x 20 mm…" />
  <button onclick="generate()">Generate</button>
  <div id="status"></div>
<script>
async function generate() {
  const prompt = document.getElementById('prompt').value.trim();
  if (!prompt) return;
  document.getElementById('status').textContent = 'Working…';
  try {
    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({prompt})
    });
    const data = await res.json();
    document.getElementById('status').textContent =
      data.message || data.error || JSON.stringify(data);
  } catch(e) {
    document.getElementById('status').textContent = 'Bridge error: ' + e.message;
  }
}
document.getElementById('prompt').addEventListener('keydown', e => {
  if (e.key === 'Enter') generate();
});
</script>
</body>
</html>
"""


def _forward(method: str, path: str, body: bytes | None = None) -> tuple[int, dict]:
    url = BACKEND_URL + path
    headers = {"Content-Type": "application/json"}
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            return resp.status, json.loads(resp.read())
    except urllib.error.HTTPError as e:
        return e.code, {"error": e.reason}
    except Exception as e:
        return 502, {"error": str(e)}


class BridgeHandler(BaseHTTPRequestHandler):
    def log_message(self, fmt, *args):
        print(f"[bridge] {self.address_string()} {fmt % args}")

    def _send_json(self, code: int, data: dict):
        body = json.dumps(data).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_GET(self):
        if self.path == "/cloud-design":
            body = CLOUD_DESIGN_HTML.encode()
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return

        if self.path == "/api/entitlement":
            self._send_json(200, {"plan": "trial", "days_left": 1, "active": True})
            return

        if self.path == "/health":
            code, data = _forward("GET", "/health")
            self._send_json(code, data)
            return

        self._send_json(404, {"error": "not found"})

    def do_POST(self):
        length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(length) if length else b"{}"

        if self.path == "/api/generate":
            try:
                payload = json.loads(body)
            except Exception:
                self._send_json(400, {"error": "invalid JSON"})
                return

            prompt = payload.get("prompt", "")
            context = payload.get("context", {})

            backend_payload = json.dumps({
                "message": prompt,
                "session_id": payload.get("session_id", "cad-bridge"),
                "context": context,
                "mode": "auto",
            }).encode()

            code, data = _forward("POST", "/chat", backend_payload)
            self._send_json(code, {"message": data.get("content", ""), "raw": data})
            return

        self._send_json(404, {"error": "not found"})


def main():
    global BACKEND_URL
    parser = argparse.ArgumentParser(description="ORYND Local Bridge")
    parser.add_argument("--backend", default=BACKEND_URL, help="ORYND backend URL")
    parser.add_argument("--port", type=int, default=8765)
    args = parser.parse_args()

    BACKEND_URL = args.backend.rstrip("/")

    server = HTTPServer(("127.0.0.1", args.port), BridgeHandler)
    print(f"ORYND Bridge running on http://127.0.0.1:{args.port}")
    print(f"Backend: {BACKEND_URL}")
    print("Press Ctrl+C to stop.")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopped.")


if __name__ == "__main__":
    main()
