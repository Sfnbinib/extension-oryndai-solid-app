# Local Bridge — contract (TO IMPLEMENT)

The CAD add-ins call a local HTTP bridge on `http://127.0.0.1:8765`. This bridge
is a **thin proxy** — it holds NO ORYND algorithms. It forwards requests to the
ORYND backend and returns the result.

> Status: NOT YET IMPLEMENTED as a thin proxy. The current local bridge
> (`web_app.py` in the private repo) still embeds planning logic and must be
> rewritten to forward to the backend before it can ship publicly.

## Endpoints the add-ins expect

| Method | Path | Used by | Purpose |
|--------|------|---------|---------|
| POST | `/api/generate` | all add-ins | prompt (+ context) → CAD macro / model |
| GET | `/api/entitlement` | all add-ins | check account / trial status |

## Required behaviour (thin proxy)

1. Receive `/api/generate` from the add-in.
2. Forward to the ORYND backend over HTTPS (search → decompose → build CoreOps).
3. Return the resulting macro / model to the add-in.

No decomposition, fitting, or orchestration logic lives here. Those stay
server-side. Macro emission (CoreOps → VBA / Fusion script / LISP) placement is
an open decision — default: server-side.
