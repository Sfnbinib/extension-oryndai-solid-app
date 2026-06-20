# Auth, Privacy, And Trial Flow

Date: 2026-06-20

This product should reuse existing ORYND/Supabase auth. It should not invent a
separate fake account system for the CAD extension.

## User Flow

```text
Task Pane opens
  -> if no session: show Sign in
  -> click Sign in
  -> open system browser to ORYND login/signup page
  -> Supabase email or Google OAuth
  -> user accepts Privacy Policy and Terms
  -> auth callback returns to local bridge/deep link
  -> Task Pane receives session
  -> backend checks entitlement/trial
  -> user can run CAD planning
```

Do not run OAuth inside an unsafe embedded WebView if the provider blocks or
discourages it. Use the system browser flow for Google.

## Trial Policy

For the SolidWorks extension, a short free trial is enough for beta:

- one day is acceptable for closed beta;
- three days is better for public beta;
- no card required for first beta is simpler;
- backend is the source of truth;
- local bridge may cache display state but cannot grant paid access.

Suggested states:

```text
trial_available
trial_active
trial_expired
subscription_active
subscription_required
blocked_by_auth
blocked_by_entitlement
```

## API Key Flow

Default route:

```text
Cloud Anthropic -> backend-held ORYND key
```

Optional BYO route:

```text
Settings -> paste user key -> local encrypted storage/keychain -> enabled route
```

BYO means "bring your own". The user provides their own Anthropic/OpenAI/Gemini
API key. This can reduce ORYND inference cost, but it should be explicit and
separate from the default subscription route.

Rules:

- never show full keys after save;
- never send BYO key to ORYND backend unless the user explicitly chooses proxy
  mode;
- model options without keys stay visible but disabled;
- logs must mask keys.

## Privacy Policy Draft Coverage

Privacy Policy must cover:

- account email and OAuth profile data;
- prompts and chat messages;
- uploaded images/sketches;
- CAD files and meshes;
- generated operation plans, macros, previews, and exports;
- usage logs, validation errors, and crash reports;
- payment/subscription data;
- provider/model routing;
- data retention and deletion request path;
- subprocessors such as Supabase, AWS, model providers, and payment provider.

## Terms Draft Coverage

Terms must cover:

- generated CAD output is user-reviewed before execution;
- user is responsible for engineering validation, safety, manufacturability, and
  compliance;
- no hidden macro execution;
- no warranty for production-critical parts without human review;
- subscription/trial limits;
- acceptable use;
- export/control restrictions where relevant.

## Login Screens Needed

The extension needs these states:

- signed out;
- login in progress;
- callback received;
- auth failed;
- trial available;
- trial active;
- trial expired;
- subscription active;
- payment required;
- offline/cache-only.

