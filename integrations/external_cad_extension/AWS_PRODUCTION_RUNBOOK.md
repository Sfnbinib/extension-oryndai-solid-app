# AWS Production Runbook

Date: 2026-06-20

This is the practical handoff for moving ORYND CAD Bridge from local beta to a
server-backed release.

## Production Split

Keep these pieces local:

- SolidWorks add-in / Task Pane UI;
- local bridge on `127.0.0.1:8765`;
- static validator and macro preview;
- user approval gate before macro execution;
- encrypted local session and optional BYO key reference;
- MCP stdio server;
- deterministic fallback examples.

Move these pieces to AWS/backend:

- ORYND Cloud model routing, defaulting to Anthropic;
- Supabase auth/session verification and entitlement source of truth;
- trial/subscription/credit checks;
- search/research workers;
- GenCAD image/sketch worker;
- ORYND AI Model 4 mesh/decomposition worker;
- run logging, failure repair context, and usage metering;
- release manifest and download metadata;
- update notification state.

## Public Ports

Only expose HTTPS publicly:

```text
443/tcp -> website, auth callback, API, release manifest
```

Do not expose:

```text
8000, 8001, 8002, 5432, 6379, 8765, 11434
```

Recommended private service ports:

```text
api service:      8000 private behind ALB/API Gateway
gencad worker:    8001 private
ai4 worker:       8002 private
redis/cache:      6379 private
```

## Secrets

Never paste production secrets into chat or commit them.

Backend-only secrets:

- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_JWT_SECRET` if verifying JWT directly
- `ANTHROPIC_API_KEY`
- `OPENAI_API_KEY`
- `GEMINI_API_KEY`
- search provider keys
- Stripe/payment keys
- worker signing tokens

Client/local-safe config:

- `SUPABASE_URL`
- Supabase publishable/anon key
- public backend URL
- public release manifest URL

Store backend secrets in AWS Secrets Manager or SSM Parameter Store. For a first
manual EC2 setup, `.env` on the server is acceptable only if permissions are
locked down and the file is never committed.

## Minimal Backend API

First beta backend should expose:

```text
GET  /health
GET  /v1/me
GET  /v1/entitlements
POST /v1/runs
GET  /v1/runs/{id}
POST /v1/planner/text
POST /v1/planner/image
POST /v1/planner/mesh
POST /v1/search
POST /v1/validate
GET  /v1/releases/stable
```

The local bridge should call these over HTTPS with the Supabase access token:

```text
Authorization: Bearer <supabase_access_token>
```

## Model Services

Do not ship heavy model weights in the installer.

Recommended strategy:

- Anthropic default route runs server-side.
- BYO key route is optional and user-controlled.
- GenCAD runs as a separate worker/service.
- ORYND AI Model 4 runs as a separate worker/service.
- Workers receive signed job IDs or short-lived upload URLs, not raw user
  secrets.
- Cache image/mesh decomposition results by content hash.

## Uploads

Images, sketches, STL/OBJ/STEP, and generated macro artifacts should use
short-lived upload/download URLs.

Flow:

```text
Task Pane
  -> local bridge
  -> backend creates signed upload URL
  -> local bridge uploads file
  -> backend/worker processes file
  -> operation plan returned
  -> local validator/macro preview
  -> user approval
  -> SolidWorks execution
```

## EC2 SSH

Yes, EC2 can be accessed over SSH when the instance security group allows it.
Recommended first command shape:

```bash
ssh -i /path/to/key.pem ubuntu@EC2_PUBLIC_IP
```

Security group:

```text
22/tcp -> your current IP only
443/tcp -> public
all worker ports -> private security group only
```

Prefer AWS Systems Manager Session Manager later so SSH does not need to stay
open.

## What To Copy To AWS

From this repository, the server should receive only backend/service code and
deployment config, not the full local ORYND workspace.

Candidate package:

```text
integrations/external_cad_extension/
  schema.py
  catalog.py
  generator.py
  validator.py
  orchestrator.py
  research.py
  gencad_adapter.py
  ai_model_4_adapter.py
  solidworks_command_language.py
  object_recipes.py
  release_manifest.py
  supabase_client.py
  env_config.py
  tests/
```

Do not copy:

```text
.env
__pycache__/
out/
large model checkpoints
local generated installer outputs
```

## Release Gate

Before public website download:

1. Supabase auth callback works from Task Pane through system browser.
2. Trial/entitlement is checked by backend, not local mock state.
3. Windows add-in builds and opens a right-side Task Pane in SolidWorks.
4. Local bridge binds only to `127.0.0.1`.
5. One smoke macro runs in real SolidWorks.
6. Update manifest has real `.exe` and `.dmg` assets with SHA256.
7. Website Download page reads the stable release manifest.
8. Privacy Policy and Terms are linked during signup/login.
9. No production key is committed or bundled into installer.

