# Existing ORYND Auth Integration

Correction: ORYND CAD Bridge should not create a separate authentication system.

The main ORYND workspace already has Supabase authentication:

- Desktop auth port:
  - `orynd_desktop/src/ports/auth.port.ts`
  - Google OAuth through `https://oryndai.com/signup?return=orynd://callback`
  - email/password login and signup through Supabase
  - session persisted through the Electron auth bridge / OS Keychain
- Backend auth:
  - `orynd_core/auth/dependencies.py`
  - `current_user`
  - `optional_user`
  - Supabase JWT verification through `SUPABASE_JWT_SECRET`
- Backend auth router:
  - `orynd_core/routers/auth.py`
  - `/api/auth/me`
  - `/api/auth/sync`
  - `/api/auth/consents`

## Correct CAD Bridge Behavior

CAD Bridge should consume the existing auth session:

```text
SolidWorks add-in / companion
  -> existing ORYND login/signup
  -> existing Supabase access token
  -> ORYND backend current_user
  -> CAD Bridge entitlement/credits/run logging
```

The external CAD extension should not own signup/login UI as a separate account
system. It can show a compact account status and redirect/open the existing ORYND
auth flow.

## What Supabase Is For Here

Use the existing Supabase project for:

- user identity;
- session/JWT validation;
- plan/credits/entitlement;
- run logs;
- optional payment/subscription state;
- future team/workspace ownership.

## What The Added CAD Bridge Supabase Files Mean

The files under:

```text
integrations/external_cad_extension/supabase/
```

are not meant to replace existing auth. They are CAD-specific table proposals
for runs/entitlements/routes if those tables are not already covered by the main
ORYND schema.

Before applying any migration, compare it against the existing project schema
and merge into the canonical ORYND Supabase migration set.

