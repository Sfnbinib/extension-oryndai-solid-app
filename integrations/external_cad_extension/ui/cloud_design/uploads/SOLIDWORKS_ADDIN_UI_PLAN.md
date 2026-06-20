# SolidWorks Add-in UI Plan

The production UI for ORYND CAD Bridge should live inside SolidWorks, not as a
standalone web dashboard.

The static/web UI in this module is only a companion prototype and dev preview.

## Real SolidWorks UI Surfaces

### 1. CommandManager Toolbar

Purpose:

- ORYND button;
- Generate from prompt;
- Validate macro;
- Open preview;
- Execute approved plan;
- Export.

Format:

```text
C# COM add-in DLL -> SolidWorks CommandManager commands
```

### 2. Task Pane

Purpose:

- account status;
- prompt input;
- image/mesh upload;
- model route/provider;
- operation-plan preview;
- validation report;
- generated macro/code preview;
- approval gate.

Possible implementations:

- WinForms UserControl;
- WPF UserControl;
- WebView2 hosted inside task pane, if we want to reuse web UI.

### 3. PropertyManagerPage

Purpose:

- structured parameters for a specific generated feature;
- brake disc dimensions;
- gear tooth count/module;
- bracket hole layout;
- execute/update feature.

### 4. Local Companion Process

Purpose:

- AI/model/search orchestration outside the SolidWorks process;
- MCP server;
- Supabase/backend calls;
- heavy model backends;
- GenCAD/AI Model 4 adapters.

This should run behind the add-in. Users should experience it as part of the
SolidWorks extension, not as the primary product UI.

## Correct Product Shape

```text
SolidWorks Add-in UI
  -> local companion process
  -> ORYND backend/auth
  -> AI/search/GenCAD/AI Model 4
  -> operation plan
  -> validator
  -> preview
  -> user approval
  -> SolidWorks API execution
```

## Current Status

Implemented:

- C# add-in scaffold;
- COM-visible Task Pane UserControl scaffold;
- local bridge client;
- registration script template;
- companion UI/dev preview.

Not implemented:

- CommandManager toolbar;
- runtime-tested task pane inside SolidWorks;
- PropertyManagerPage;
- WebView2 host;
- runtime-tested execution in SolidWorks.
