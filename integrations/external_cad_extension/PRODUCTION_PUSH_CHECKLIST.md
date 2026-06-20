# Production Push Checklist

Date: 2026-06-20

This is the honest checkpoint before publishing ORYND CAD Bridge on the site.

## Ready For Beta Push

- offline operation plan generation;
- deterministic examples;
- macro preview;
- static validator;
- local web preview;
- Cloud Design Task Pane preview;
- Supabase config readiness checks;
- release manifest helper;
- update asset download/checksum helper;
- Windows add-in scaffold/docs;
- macOS companion packaging plan;
- AWS/backend split documented.

## Not Yet Ready For Public Production

- real Windows SolidWorks add-in build has not been proven in this session;
- real Task Pane inside SolidWorks has not been runtime-tested;
- backend auth callback is not wired to Supabase session yet;
- trial/subscription is still a contract/scaffold, not production billing logic;
- Cloud Anthropic route is not connected to deployed backend;
- GenCAD and AI Model 4 are adapter plans, not deployed workers;
- updater does not yet execute installer/restart flow;
- website Download page is not wired to stable release manifest;
- Privacy Policy and Terms drafts still need final legal/product review.

## Immediate Order

1. Finalize Task Pane visual integration.
2. Wire auth redirect and Supabase session handoff.
3. Deploy minimal backend on AWS behind HTTPS.
4. Move Anthropic default route to backend.
5. Build Windows installer and macOS companion package.
6. Publish release assets and stable manifest.
7. Connect website Download page to manifest.
8. Run end-to-end smoke test on a clean Windows/SolidWorks machine or VM.
9. Record demo.
10. Push public beta.

