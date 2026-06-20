# Runtime Events For Task Pane UI

The UI should not infer agent state from raw text. The bridge should emit
explicit events that every surface can render.

## Event Shape

```json
{
  "run_id": "uuid",
  "type": "planning",
  "title": "Building operation plan",
  "message": "Mapping rotor geometry to allowed CAD commands",
  "progress": 0.45,
  "payload": {}
}
```

## Core Event Types

- `started`
- `auth_required`
- `thinking`
- `searching`
- `research_complete`
- `image_processing`
- `mesh_processing`
- `planning`
- `plan_ready`
- `validating`
- `validation_failed`
- `preview_ready`
- `approval_required`
- `executing`
- `exporting`
- `finished`
- `failed`

## UI Rendering

Task Pane should render:

- timeline of steps;
- current active operation;
- warnings/errors;
- operation-plan preview;
- macro/code preview;
- approve/run controls;
- export result.

This is how the chat can feel alive without coupling design to model internals.

