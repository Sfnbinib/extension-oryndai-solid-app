# ORYND CAD Bridge MCP Server

This prototype exposes the offline CAD Bridge through a local stdio MCP server.

Run manually:

```bash
.venv/bin/python -m integrations.external_cad_extension.mcp_server
```

Claude Code local stdio example:

```bash
claude mcp add --transport stdio orynd-cad-bridge -- \
  /Users/savelijfilcagin/Cursor_Projects/ORYND_Workspace/.venv/bin/python \
  -m integrations.external_cad_extension.mcp_server
```

Available tools:

- `list_catalog`
- `run_scenario`
- `generate_macro`
- `validate_macro`
- `entitlement`
- `settings_show`
- `supabase_status`
- `supabase_check`
- `solidworks_coverage`
- `gencad_status`
- `ai4_primitives_to_plan`

Current limits:

- This server does not execute SolidWorks.
- Search/research is offline fallback unless a live adapter is added later.
- Account/subscription state is local prototype state, not Supabase/payment backend.
- Supabase status reports readiness and masked keys only, not real auth sessions yet.
- Supabase check requires a valid `.env` and applied database migration.
- SolidWorks coverage is a runtime verification checklist, not proof that SolidWorks executed the macro.
- Generated macros still require preview and user approval before any future execution.
- GenCAD tool checks external readiness only unless GenCAD repo/checkpoints are installed separately.
- AI Model 4 tool supports primitive/CoreOps mappings that the current adapter can translate.
