# ORYND CAD Bridge Publishing And Production Plan

This document separates what can be shipped now from what is required for a real SolidWorks extension release.

## Product Shapes

### 1. Macro Pack

Fastest user test:

```text
Python bridge -> generated .bas -> user imports/saves .swp in SolidWorks -> macro run
```

Good for:

- validating geometry generation;
- testing the brake disc / gear / wing / bracket scenarios;
- collecting failures from real SolidWorks API calls.

Not enough for:

- "installed extension" claim;
- marketplace/partner distribution;
- automatic execution.

### 2. Local Companion App

Desktop companion around the current web UI/API:

```text
account/settings/API key/trial
  -> prompt/image/mesh/search
  -> operation plan
  -> macro preview
  -> approval
  -> SolidWorks target runner
```

Good for:

- BYO API key;
- subscription/free trial;
- MCP control;
- search/model routing outside the SolidWorks process.

### 3. SolidWorks COM Add-in

Real extension target:

```text
SolidWorks add-in DLL
  -> toolbar/task pane/menu
  -> localhost bridge
  -> preview/approval
  -> validated CAD execution
```

Required for release:

- Windows build machine with SolidWorks installed;
- SolidWorks interop assemblies;
- COM-visible DLL registration;
- installer/uninstaller;
- code signing for production distribution;
- version compatibility matrix for target SolidWorks releases;
- runtime QA for every generated operation;
- user-visible privacy/security policy for prompts, images, meshes, and API keys.

## Publishing Conditions To Verify Before Release

Before public distribution, verify current Dassault/SolidWorks partner and distribution requirements. Treat these as release gates:

- whether the add-in must go through a partner program or marketplace review;
- installer and signing requirements;
- supported SolidWorks versions;
- API usage restrictions;
- telemetry/privacy requirements;
- support/contact and update policy;
- any restrictions around AI-generated CAD automation.

The prototype does not depend on marketplace approval. It can be tested privately as:

- source macro pack;
- local companion app;
- manually registered add-in on a test Windows machine.

## Production Auth/Billing Path

Current state:

- local email/account state;
- local trial state;
- local API-key/BYO-key settings;
- checkout URL placeholder;
- masked settings output.
- masked Supabase environment readiness;
- initial Supabase SQL migration for profiles, entitlements, trials, runs, and model routes.
- stdlib Supabase REST adapter for table checks and future run logging.

Production target:

```text
Companion UI
  -> Supabase Auth or equivalent
  -> entitlement service
  -> payment provider checkout
  -> signed short-lived bridge token
  -> local extension unlock
```

Do not store raw provider API keys in app logs. Prefer:

- OS keychain for local secrets;
- environment variable references for developer mode;
- encrypted server-side storage only when absolutely required;
- BYO-key mode where requests go directly through the user's selected provider route.

## Heavy Model Strategy

Do not bundle GenCAD/AI Model 4 weights into the base extension installer.

Supported production modes:

- local lightweight deterministic macro mode;
- BYO API key mode;
- cloud/server inference mode;
- lazy downloadable model pack;
- separate local model service;
- cached conversion outputs.

All model paths must converge into the same gate:

```text
operation plan -> validator -> macro/code preview -> user approval -> target CAD
```

## Release Checklist

- Build add-in DLL on Windows.
- Register add-in in SolidWorks.
- Verify connect/disconnect lifecycle.
- Verify toolbar/task pane.
- Generate SolidWorks coverage checklist with `solidworks-coverage`.
- Start local companion and generate brake-disc preview from SolidWorks.
- Runtime-test `.bas` macro in SolidWorks.
- Replace SolidWorks helper placeholders with verified API calls.
- Add approval gate for execution.
- Package installer/uninstaller.
- Sign binaries.
- Verify current SolidWorks/Dassault distribution rules.
