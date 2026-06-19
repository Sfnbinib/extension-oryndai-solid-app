# Safe Supabase Key Setup

Do not paste real keys into chat.

Use local environment variables or a local `.env` file ignored by git.

## What To Copy From Supabase

From Supabase Dashboard:

```text
Project -> Connect
```

or:

```text
Project -> Settings -> API Keys
```

Copy:

```env
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

For backend-only entitlement/payment/admin logic, also copy:

```env
SUPABASE_SECRET_KEY=sb_secret_...
```

Never place `SUPABASE_SECRET_KEY` in a browser bundle, public repo, screenshot, chat, URL, or client-side app.

## Local File Method

```bash
cp integrations/external_cad_extension/.env.example integrations/external_cad_extension/.env
```

Then edit:

```text
integrations/external_cad_extension/.env
```

This folder has its own `.gitignore`, so `.env` and `.env.*` are ignored.

## Shell Method Without Echoing Secrets

In your terminal:

```bash
read -r SUPABASE_URL
read -s SUPABASE_PUBLISHABLE_KEY
read -s SUPABASE_SECRET_KEY
export SUPABASE_URL
export SUPABASE_PUBLISHABLE_KEY
export SUPABASE_SECRET_KEY
```

`read -s` hides typed values.

## Current Prototype Status

The prototype already has:

- local account/trial/settings;
- masked Supabase config status through CLI/web/MCP;
- initial SQL migration under `supabase/migrations/`.

Real Supabase Auth sessions and remote entitlement checks still need to be wired to these environment values.

Check readiness without printing raw secrets:

```bash
.venv/bin/python -m integrations.external_cad_extension.cli supabase-status
```

After the `.env` is valid and the migration is applied, check REST table availability:

```bash
.venv/bin/python -m integrations.external_cad_extension.cli supabase-check --table cad_bridge_runs
```

Supabase REST API uses:

```text
https://<project_ref>.supabase.co/rest/v1/
```

API URL/keys are available in the Supabase Dashboard under Data API / API Keys.
