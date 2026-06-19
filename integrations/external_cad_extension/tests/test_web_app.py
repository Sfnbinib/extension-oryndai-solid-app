import json
from io import BytesIO

from integrations.external_cad_extension.web_app import CadBridgeHandler


class DummyRequest(CadBridgeHandler):
    def __init__(self, method: str, path: str, body: dict | None = None):
        self._response_status = None
        self._headers = []
        self.rfile = BytesIO(json.dumps(body or {}).encode("utf-8"))
        self.wfile = BytesIO()
        self.command = method
        self.path = path
        self.request_version = "HTTP/1.1"
        self.requestline = f"{method} {path} HTTP/1.1"
        body_bytes = json.dumps(body or {}).encode("utf-8")
        self.headers = {"Content-Length": str(len(body_bytes))}
        self.rfile = BytesIO(body_bytes)

    def send_response(self, code, message=None):  # noqa: ANN001
        self._response_status = code

    def send_header(self, keyword, value):  # noqa: ANN001
        self._headers.append((keyword, value))

    def end_headers(self):
        return None


def _json_response(handler: DummyRequest) -> dict:
    return json.loads(handler.wfile.getvalue().decode("utf-8"))


def test_web_app_index_renders():
    req = DummyRequest("GET", "/")
    req.do_GET()
    assert req._response_status == 200
    assert "ORYND CAD Bridge" in req.wfile.getvalue().decode("utf-8")


def test_web_app_scenario_endpoint():
    req = DummyRequest("POST", "/api/scenario", {"prompt": "I want a brake disc with 5 holes.", "scenario": "brake_disc"})
    req.do_POST()
    assert req._response_status == 200
    data = _json_response(req)
    assert data["validation"]["ok"] is True
    assert data["scenario"] == "brake_disc"
    assert "Search Queries" in data["scenario_markdown"]
    assert "Sub main()" in data["macro_code"]


def test_web_app_generate_endpoint():
    req = DummyRequest("POST", "/api/generate", {"example": "mounting_bracket"})
    req.do_POST()
    assert req._response_status == 200
    data = _json_response(req)
    assert data["validation"]["ok"] is True
    assert "ORYND_Rectangle" in data["macro_code"]


def test_web_app_gencad_status_endpoint():
    req = DummyRequest("GET", "/api/gencad/status")
    req.do_GET()
    assert req._response_status == 200
    data = _json_response(req)
    assert data["config"]["repo_path"]
    assert "available" in data


def test_web_app_ai4_primitives_endpoint():
    req = DummyRequest(
        "POST",
        "/api/ai4/primitives",
        {
            "name": "web_ai4_smoke",
            "ai_model_4_doc": {
                "operations": [
                    {
                        "op": "box",
                        "params": {"size": [20, 10, 5]},
                        "transform": {"center": [0, 0, 2.5], "axes": [[1, 0, 0], [0, 1, 0], [0, 0, 1]]},
                    },
                    {
                        "op": "cylinder",
                        "params": {"radius": 2, "height": 5},
                        "transform": {"center": [0, 0, 2.5], "axis": [0, 0, 1]},
                    },
                ]
            },
        },
    )
    req.do_POST()
    assert req._response_status == 200
    data = _json_response(req)
    assert data["validation"]["ok"] is True
    assert data["operation_plan"]["name"] == "web_ai4_smoke"
    assert "ORYND_Rectangle" in data["macro_code"]
