# Supabase Backend Contract

This folder contains the first production backend contract for ORYND CAD Bridge.

Apply manually in Supabase SQL Editor or through Supabase CLI after linking the project.

```bash
supabase db push
```

Current migration:

```text
migrations/001_cad_bridge_core.sql
```

## Tables

- `cad_bridge_profiles`
- `cad_bridge_entitlements`
- `cad_bridge_trials`
- `cad_bridge_runs`
- `cad_bridge_model_routes`

## Security Notes

- Row Level Security is enabled.
- Users can read/write only their own rows through `auth.uid()`.
- Service/backend code can manage entitlements.
- Raw provider API keys should not be stored here in this MVP schema.

