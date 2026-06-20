# Deployment Ports And Backend Map

Date: 2026-06-19

This document defines what runs locally, what runs on ORYND backend/AWS, which
ports are used, and which secrets may live where.

## Bottom Line

For production, expose only HTTPS publicly.

```text
public internet
  -> 443 HTTPS only
  -> ORYND API / website / release manifest
```

Everything else should be local-only or private-network-only:

- local CAD bridge: `127.0.0.1:8765`, never public;
- MCP: stdio, no TCP port;
- local Ollama: usually `127.0.0.1:11434`, optional;
- GenCAD/AI4 workers: private AWS network only;
- databases/queues: private only;
- provider keys/server secrets: backend only.

## Local Machine Components

| Component | Where | Port/Transport | Public? | Notes |
| --- | --- | --- | --- | --- |
| SolidWorks Add-in / Task Pane | Windows machine | in-process COM/.NET | No | Talks to local bridge only. |
| Local bridge HTTP API | User machine | `127.0.0.1:8765` | No | Current prototype uses this port in `web_app.py`. |
| Local companion UI | User machine | `http://127.0.0.1:8765` | No | Dev preview/fallback UI. |
| MCP server | User machine | stdio | No | For Claude/Codex-like external control. No network port. |
| Local model/Ollama | User machine | `127.0.0.1:11434` by convention | No | Optional fallback, not required in installer. |
| Optional local STT/Whisper | User machine | local process or localhost | No | Lazy download model pack; not bundled by default. |
| Updater | User machine | outbound HTTPS 443 | No inbound | Downloads signed manifest/assets. |

Local security rule:

```text
Do not bind local bridge to 0.0.0.0.
Do not expose 8765 through firewall/router.
Do not store backend service-role secrets in the local extension.
```

## AWS / Backend Components

Recommended first production shape:

```text
User Task Pane
  -> local bridge 127.0.0.1:8765
  -> outbound HTTPS 443
  -> ORYND API Gateway / ALB
  -> API service
      -> Supabase Auth/DB
      -> Anthropic/OpenAI/Gemini
      -> Search provider
      -> private GenCAD/AI4 workers
      -> storage/cache/queue
```

| Component | Public Port | Internal Port | Public? | Notes |
| --- | ---: | ---: | --- | --- |
| Website | 443 | static hosting/CDN | Yes | Product pages, docs, download. |
| Download/release manifest | 443 | static hosting/CDN | Yes | Signed manifest + installers/checksums. |
| ORYND CAD Bridge API | 443 | 8000 or app default | Yes via ALB/API Gateway | Auth, entitlement, planning, run logs. |
| WebSocket/SSE status stream | 443 | same API service | Yes via HTTPS upgrade/SSE | Optional; can also poll. |
| GenCAD service | none | 8001/8080 private | No | Heavy image/sketch reconstruction. |
| AI Model 4 service | none | 8002/8080 private | No | Mesh/decomposition/CoreOps. |
| Search worker | none | private worker | No | Called by API/job queue. |
| Queue | none | 6379/5672 private | No | Redis/SQS/RabbitMQ depending stack. |
| Cache | none | 6379 private | No | Search/model result cache. |
| Database | none | Supabase managed / private | No direct public app port | Prefer Supabase APIs/Auth over direct DB from client. |
| Object storage | 443 signed URLs | provider-managed | Controlled | Images/meshes/uploads with expiry. |

First AWS security group rule:

```text
Inbound public:
  443/tcp -> ALB/API Gateway/CDN only

Inbound private:
  API service -> workers/cache/queue only

No public inbound:
  8000, 8001, 8002, 6379, 5432, 8765, 11434
```

## Supabase

The user already configured Supabase locally. Do not paste keys into chat.

Production split:

| Key | Client/Extension | Backend | Notes |
| --- | --- | --- | --- |
| `SUPABASE_URL` | allowed | allowed | Not secret. |
| `SUPABASE_PUBLISHABLE_KEY` / anon key | allowed | allowed | Client-safe, still do not log casually. |
| `SUPABASE_SECRET_KEY` / service role | never | allowed | Backend only. Never ship in installer. |
| Supabase JWT secret | never | allowed | Backend only if verifying JWT directly. |

Local extension may use Supabase publishable config for auth UI/session, but
server-side entitlements and writes that need elevated privileges should go
through ORYND backend.

Recommended flow:

```text
Task Pane / local bridge
  -> Supabase Auth login or existing ORYND session
  -> gets access token
  -> calls ORYND backend with Bearer token
  -> backend verifies token/entitlement
  -> backend logs run and routes model/tool calls
```

Do not let the local app decide paid entitlement by itself. It can display a
cached state, but backend is source of truth.

## Secrets And Keys

### Local Extension Can Store

- user session token;
- user BYO key only if encrypted/OS keychain protected;
- local settings;
- selected provider/model preference;
- cached non-sensitive run summaries;
- local deterministic templates.

### Local Extension Must Not Store

- ORYND Anthropic/OpenAI/Gemini production keys;
- Supabase service role key;
- backend signing keys;
- paid orchestration prompts if they are proprietary;
- GenCAD/AI4 private model weights unless explicitly lazy-downloaded and allowed.

### Backend Stores

- ORYND provider API keys;
- Supabase service role key;
- model routing prompts;
- paid orchestration logic;
- GenCAD/AI4 service credentials;
- usage limits and entitlement rules.

## Provider / Model Routes

Default:

```text
ORYND Cloud -> Anthropic
```

Optional:

```text
BYO Anthropic/OpenAI/Gemini key
Local Ollama
External MCP agent
```

Heavy:

```text
GenCAD service
AI Model 4 service
mesh decomposition workers
```

Routing rules:

- simple deterministic edits should not call a large model;
- BYO key can run from local bridge or via ORYND proxy only with explicit user
  consent;
- ORYND Cloud route uses backend-held keys;
- heavy services are backend/private by default;
- all routes converge to `operation plan -> validator -> preview -> approval`.

## Public API Endpoints To Plan

These are suggested backend endpoints. Names can change, but the separation is
important.

| Endpoint | Public? | Purpose |
| --- | --- | --- |
| `GET /health` | Yes | API health. |
| `GET /v1/me` | Yes/auth | Account/session summary. |
| `GET /v1/entitlements` | Yes/auth | Trial/subscription/credits. |
| `POST /v1/runs` | Yes/auth | Create CAD generation run. |
| `GET /v1/runs/{id}` | Yes/auth | Run status/result. |
| `POST /v1/planner/text` | Yes/auth | Text/research -> operation plan. |
| `POST /v1/planner/image` | Yes/auth | Image/sketch -> vision/GenCAD path. |
| `POST /v1/planner/mesh` | Yes/auth | Mesh/import -> AI4/decomposition path. |
| `POST /v1/search` | Yes/auth/rate-limited | Research/search tool. |
| `POST /v1/validate` | Yes/auth | Optional server validation mirror. |
| `POST /v1/feedback` | Yes/auth | Runtime failure/repair logs. |
| `GET /v1/releases/stable` | Yes | Stable release manifest. |

Local bridge endpoints stay local:

| Endpoint | Bind | Purpose |
| --- | --- | --- |
| `GET /api/settings` | `127.0.0.1:8765` | Local settings state. |
| `GET /api/entitlement` | `127.0.0.1:8765` | Prototype entitlement gate. |
| `GET /api/supabase/status` | `127.0.0.1:8765` | Masked Supabase readiness. |
| `POST /api/generate` | `127.0.0.1:8765` | Local preview generation. |
| `POST /api/scenario` | `127.0.0.1:8765` | Offline scenario run. |
| `POST /api/ai4/primitives` | `127.0.0.1:8765` | Local primitive adapter smoke path. |
| `POST /api/cad/selection-context` | `127.0.0.1:8765` | Future SolidWorks selection snapshot. |

## Uploads: Images / Meshes / CAD Files

Recommended production path:

```text
local bridge
  -> request upload URL from backend
  -> upload file to object storage with signed URL
  -> backend sends job to vision/GenCAD/AI4 worker
  -> result returns compact operation plan / feature packet
```

File handling rules:

- limit file size by tier;
- scan/validate file extension and MIME;
- never execute uploaded files;
- use short-lived signed URLs;
- delete or expire uploads by policy;
- store only derived feature metadata when possible.

## Updates / Installer

Public:

```text
443 HTTPS -> release manifest + installer downloads
```

Manifest should include:

- version;
- platform;
- URL;
- SHA256;
- signature;
- release notes;
- minimum compatible bridge/add-in version.

Local updater flow:

```text
check manifest
  -> show update
  -> download over HTTPS
  -> verify checksum/signature
  -> ask user to close SolidWorks
  -> update bridge/add-in
  -> restart bridge
  -> reconnect Task Pane
```

## First Beta Network Setup

For the first beta, keep it simple:

```text
Local:
  127.0.0.1:8765 local bridge
  optional 127.0.0.1:11434 local model

Public:
  https://cad-api.orynd.ai or equivalent -> ORYND backend
  https://orynd.ai/cad-bridge -> website/docs
  https://orynd.ai/downloads/... -> installers/manifest

External managed:
  Supabase HTTPS
  Anthropic/OpenAI/Gemini HTTPS
```

Do not expose model-worker ports publicly during beta.

## Open Decisions

Need owner decision:

1. Public backend domain:
   - `cad-api.orynd.ai`
   - `api.orynd.ai/cad-bridge`
   - another domain.

2. Trial policy:
   - days;
   - credits;
   - whether BYO key remains available after trial.

3. BYO key routing:
   - local direct provider calls;
   - ORYND proxy with user consent;
   - both.

4. Upload limits:
   - image max size;
   - mesh/CAD max size;
   - retention period.

5. Backend platform:
   - AWS ECS/Fargate;
   - EC2 + Docker Compose;
   - Lambda for light API + separate GPU worker;
   - other.

6. Heavy model workers:
   - AWS GPU instance;
   - separate rented GPU;
   - disabled for first beta.

