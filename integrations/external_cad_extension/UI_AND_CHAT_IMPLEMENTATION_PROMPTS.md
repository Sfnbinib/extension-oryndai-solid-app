# ORYND CAD Bridge UI And Chat Implementation Prompts

This file contains copy-paste prompts for a future Codex/Claude/Codex-like
coding session. The product name is still working/TBD; use "ORYND CAD Bridge"
or "ORYND External CAD Extension" in implementation.

Do not call "Supernova plan" a product. It is only a planning folder.

## Prompt 1: Full Product Interface And Pages

```text
Ты Codex в проекте ORYND.

Рабочая директория:
`/Users/savelijfilcagin/Cursor_Projects/ORYND_Workspace`

Задача:
Спроектируй и реализуй production-ready интерфейс для ORYND CAD Bridge:
AI CAD copilot / SolidWorks-like extension / local companion.

Главная форма продукта:
1. Основной UX должен быть внутри CAD, как правый Task Pane в SolidWorks/Inventor-style workflow.
2. Web UI в репозитории нужен как companion/dev preview/fallback, но не как основной продукт.
3. Public website нужен для маркетинга, pricing, download, docs, account entry.
4. Не ломай текущий ORYND Electron workspace.
5. Все новые файлы по CAD bridge клади в:
   `/Users/savelijfilcagin/Cursor_Projects/ORYND_Workspace/integrations/external_cad_extension/`

Обязательно сначала прочитай:
`integrations/external_cad_extension/PRODUCT_FOUNDATION.md`
`integrations/external_cad_extension/UI_PRODUCTION_SPEC.md`
`integrations/external_cad_extension/SOLIDWORKS_ADDIN_UI_PLAN.md`
`integrations/external_cad_extension/STATUS_AND_GAPS.md`
`integrations/external_cad_extension/runtime_mvp.py`
`integrations/external_cad_extension/out/runtime_mvp.md`

Важная продуктовая коррекция:
Не пытайся продавать "70 SolidWorks commands" как главный результат.
MVP должен ощущаться smooth через маленькое runtime-ядро:
- create part;
- select/create sketch on plane;
- draw circle/rectangle/line;
- extrude boss;
- extrude cut/hole;
- explicit repeat/circular pattern for brake-disc holes;
- basic fillet/chamfer;
- export STEP.

Широкий список команд можно показывать только как planner language / future coverage,
а не как уже runtime-verified capability.

Цель интерфейса:
Пользователь открывает SolidWorks, видит ORYND CAD Bridge справа, пишет:
"Create a ventilated brake disc"
или прикрепляет sketch/photo/mesh.
Система показывает:
1. что она поняла;
2. какие источники/search context использовала;
3. какие assumptions сделала;
4. operation plan;
5. validation warnings/errors;
6. macro/API preview;
7. explicit approval gate;
8. execution progress in CAD;
9. export/open result.

UI должен быть похож по уровню удобства на современные CAD copilots:
правый темный task pane, компактные статусы, timeline, chat, code/plan preview,
но не копировать MecAgent визуально 1-в-1.

Design direction:
- quiet engineering tool, not a landing-page toy;
- dark task pane for CAD add-in;
- restrained palette: graphite/near-black, white/gray text, amber accent for action,
  green success, red error, blue/cyan for info/search;
- no decorative gradient blobs/orbs;
- no oversized marketing hero inside app;
- dense but readable controls;
- cards only for repeated items/messages/tool results;
- no cards inside cards;
- stable dimensions so text/statuses do not shift layout;
- code and assumptions must always be visible before execution;
- no hidden execution.

Recommended typography:
- UI font: Inter, Geist, or SF Pro fallback stack:
  `Inter, Geist, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`
- code font:
  `"SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace`
- task pane base font: 12-13px;
- message body: 13px;
- section title: 12px uppercase/medium or 14px semibold;
- landing H1 can be larger, but app/task pane must stay compact.
- letter spacing must be 0 or minimal positive for labels; no negative tracking.

Primary product surfaces to implement/spec:

1. SolidWorks Task Pane UI
   - Header:
     - ORYND CAD Bridge logo/name;
     - CAD connection chip: Connected / Reconnect / Offline;
     - model route chip: ORYND / BYO Claude / OpenAI / Local;
     - small settings icon.
   - Chat input:
     - multiline engineering prompt;
     - attach image/sketch/mesh buttons;
     - mode selector: Create / Modify / Search / Validate / Export;
     - run button.
   - Agent status strip:
     - Understanding;
     - Searching;
     - Planning;
     - Validating;
     - Waiting for approval;
     - Executing;
     - Done/Failed.
   - Results tabs:
     - Summary;
     - Operation Plan;
     - Macro/API Preview;
     - Validation;
     - Run Log.
   - Approval gate:
     - "Review required before CAD execution";
     - assumptions visible;
     - warnings visible;
     - generated macro/code visible;
     - buttons: Approve & Run, Edit Plan, Regenerate, Cancel.
   - Target CAD area:
     - current document;
     - selected body/face if available;
     - output format: STEP/STL/SLDPRT/macro file;
     - export status.

2. Local Companion / Web Preview
   - Same state model as Task Pane.
   - Can run offline deterministic examples:
     - brake disc;
     - spur gear;
     - F1 front wing;
     - mounting bracket.
   - Shows that SolidWorks runtime is pending unless connected.
   - Should support account/settings and model key input, but mask secrets.
   - Should not require SolidWorks to preview macro, validation, and operation plan.

3. Public Website Pages
   Implement or spec these pages:
   - Home:
     - first viewport must immediately show product: AI CAD copilot inside CAD;
     - visual: real/product-like CAD task pane screenshot/mockup, not abstract gradient;
     - primary CTA: Download for Windows / Join beta;
     - secondary CTA: View demo workflows.
   - Features:
     - Text to CAD operation plan;
     - Macro/API preview;
     - Search/research agent;
     - Sketch/photo to CAD path via GenCAD adapter;
     - Mesh/STL/OBJ decomposition path via ORYND AI Model 4 adapter;
     - Validation and approval gate;
     - STEP export;
     - SolidWorks Task Pane.
   - Demo Workflows:
     - Brake disc;
     - Mounting bracket;
     - Spur gear;
     - F1 front wing;
     - each workflow shows prompt -> research/context -> plan -> preview -> approval -> CAD result.
   - Pricing:
     - Free trial;
     - BYO key mode;
     - Pro subscription;
     - Team/server mode;
     - clarify that heavy model inference may be server-side or optional.
   - Download:
     - Windows installer for SolidWorks add-in;
     - Mac note: native macOS can run companion/demo only; real SolidWorks task pane requires Windows SolidWorks, often via Parallels/VM;
     - installation steps;
     - checksums/release version.
   - Docs:
     - install guide;
     - security/approval model;
     - supported operations;
     - runtime MVP status;
     - troubleshooting connection.
   - Account:
     - sign in/sign up through existing ORYND/Supabase auth;
     - trial/subscription status;
     - BYO key settings;
     - billing redirect.
   - Blog/Community optional, only if time permits.

4. Settings / Account UI
   - Reuse existing ORYND/Supabase auth concept.
   - Do not create a separate fake auth system.
   - Settings sections:
     - Account;
     - Subscription/trial;
     - Model routing;
     - API keys;
     - Local model/Ollama;
     - SolidWorks connection;
     - Security approvals;
     - Updates.
   - API key input must:
     - never print full key after save;
     - support env var reference;
     - show masked value;
     - explain BYO key mode vs ORYND server mode.

5. Visual Mockups / Screenshots
   - Build a polished static mockup if real CAD add-in cannot run.
   - The right task pane must look like it belongs inside CAD:
     - width around 360-460px;
     - compact header;
     - scrollable chat/results area;
     - fixed bottom prompt composer.
   - Use actual product UI elements:
     - operation list;
     - validation chips;
     - macro preview;
     - approval gate.
   - Do not make a generic SaaS landing page and stop there.

State/event contract:
All UI surfaces must consume the same state events:
`idle -> understanding -> searching -> planning -> validating -> preview_ready -> waiting_approval -> executing -> exporting -> completed`
Error states:
`failed_validation`, `cad_disconnected`, `execution_failed`, `needs_user_input`, `blocked_by_subscription`.

Each event should include:
- id;
- timestamp;
- status;
- title;
- message;
- progress 0-100 optional;
- artifacts optional:
  - operation_plan;
  - macro_code;
  - validation_report;
  - sources;
  - export_path.

Implementation requirements:
1. Keep CAD logic decoupled from UI.
2. Do not execute generated code without explicit approval.
3. Do not put secrets in logs.
4. Show assumptions and warnings before run.
5. Add tests for UI/API state serialization where possible.
6. Update docs with exact launch commands.
7. Run local tests/validators.

Acceptance criteria:
- Task pane UI spec or scaffold exists.
- Companion preview has real CAD workflow screens, not placeholder marketing.
- Public website/page prompt/spec exists for Home, Features, Pricing, Download, Docs, Account.
- Chat/status system is implemented or fully specified.
- User can see:
  prompt -> status timeline -> operation plan -> macro preview -> validation -> approval.
- Tests pass.
- No unrelated ORYND Electron UI files are modified unless explicitly necessary.
```

## Prompt 2: Agent Chat UI, States, Fonts, And Behavior

```text
Ты Codex в проекте ORYND CAD Bridge.

Задача:
Сделай chat UI для CAD copilot уровня современных agent products:
не просто "чатик", а рабочий инженерный execution console внутри SolidWorks Task Pane
и companion/web preview.

Контекст:
Пользователь пишет engineering request:
"Create a ventilated brake disc"
"Make a 24 tooth spur gear module 2"
"Build F1 2018 front wing"
"Find/import/decompose this engine assembly"

Чат должен показывать не только ответ, а процесс:
- understanding;
- research/search;
- image/mesh adapter if used;
- operation planning;
- validation;
- macro/API preview;
- approval gate;
- CAD execution;
- export/result.

Visual target:
Темный компактный правый CAD task pane.
Похоже по полезности на MecAgent-style copilot panel, но визуально оригинально:
ORYND graphite UI, amber action accent, precise engineering typography.

Layout:
1. Header, fixed top:
   - product name/logo;
   - connection status:
     - CAD Connected;
     - CAD Offline;
     - Reconnect;
   - account/avatar button;
   - settings icon.
2. Scrollable conversation area:
   - user messages;
   - assistant reasoning summaries;
   - tool/status cards;
   - operation plan cards;
   - validation report;
   - macro/code preview;
   - result/export card.
3. Fixed bottom composer:
   - multiline prompt input;
   - attach buttons: image, sketch, mesh, STEP/STL/OBJ;
   - mode segmented control:
     - Create;
     - Modify;
     - Search;
     - Validate;
     - Export;
   - model route selector:
     - ORYND;
     - BYO Claude;
     - OpenAI;
     - Local;
   - Send/Generate button.

Message types:

1. UserMessage
   - compact bubble;
   - show attached files as small chips;
   - timestamp optional/subtle.

2. AssistantSummary
   - short answer first;
   - never hide important assumptions;
   - use direct engineering language.

3. AgentStepCard
   - icon/status dot;
   - title;
   - one-line detail;
   - status:
     - pending;
     - active;
     - done;
     - warning;
     - failed;
   - optional expandable details.

4. ResearchCard
   - sources used;
   - facts extracted;
   - missing inputs;
   - confidence label.
   - If no live search was used, clearly say "No live search used".

5. OperationPlanCard
   - numbered operation steps;
   - command chips:
     - sketch;
     - circle;
     - rectangle;
     - line;
     - extrude;
     - hole;
     - cut;
     - pattern/repeat;
     - fillet;
     - export.
   - dimensions in mm;
   - assumptions section;
   - warnings section.

6. ValidationCard
   - result:
     - Valid;
     - Needs review;
     - Failed;
   - list errors first;
   - list warnings after;
   - show blocked unsafe calls if any:
     - shell;
     - network;
     - delete;
     - filesystem unsafe;
     - hidden execution.

7. MacroPreviewCard
   - code preview with monospace font;
   - copy button;
   - download macro button;
   - collapse/expand;
   - show "Generated code will not run until approved".

8. ApprovalGateCard
   - must appear before CAD execution;
   - buttons:
     - Approve & Run;
     - Edit Plan;
     - Regenerate;
     - Cancel;
   - disabled if validation failed;
   - if CAD disconnected, show Reconnect instead of Run.

9. ExecutionCard
   - realtime steps:
     - created part;
     - selected plane;
     - sketched geometry;
     - extruded body;
     - cut holes;
     - applied fillets;
     - exported STEP;
   - progress bar;
   - logs expandable;
   - error recovery action.

10. ResultCard
   - final status;
   - generated files:
     - operation plan JSON;
     - macro/VBA;
     - validation report;
     - preview markdown;
     - STEP/export path if available;
   - buttons:
     - Open in CAD;
     - Export;
     - Save run;
     - Start new iteration.

Status timeline:
Use this exact order:
`Understanding -> Searching -> Planning -> Validating -> Preview -> Approval -> Executing -> Exporting -> Done`

State labels:
- Idle;
- Thinking;
- Searching;
- Planning CAD operations;
- Validating macro;
- Preview ready;
- Waiting for approval;
- Running in CAD;
- Exporting;
- Completed;
- Needs input;
- Failed.

Microcopy examples:
- "Understanding design intent"
- "Checking whether search context is needed"
- "Building constrained CAD operation plan"
- "Generating SolidWorks macro preview"
- "Static validation passed"
- "Waiting for your approval before CAD execution"
- "SolidWorks is disconnected"
- "Runtime verification pending"
- "No shell, network, or delete calls detected"

Typography:
- App/task pane:
  - base: 12-13px;
  - message body: 13px;
  - card title: 13px semibold;
  - metadata: 11px;
  - code: 11-12px monospace.
- Website:
  - H1: 48-72px desktop, 34-44px mobile;
  - section heading: 28-40px;
  - body: 15-17px.
- Font stack:
  UI:
  `Inter, Geist, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`
  Code:
  `"SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace`

Color tokens:
- background: #0B0D10
- surface: #11151A
- surface raised: #171C22
- border: #2A313A
- text primary: #F4F6F8
- text secondary: #A8B0BA
- text muted: #6F7A86
- accent/action: #D6A21E
- accent hover: #F0BD32
- success: #3BC27A
- warning: #E4A93D
- danger: #EF5B5B
- info/search: #5DADEC

Interaction rules:
- Never auto-run generated macro/code.
- Always show preview before execution.
- If validation fails, disable run.
- If subscription/trial blocks action, show account card with clear CTA.
- If CAD is disconnected, preserve generated result and offer reconnect.
- If user edits operation plan, revalidate before approval.
- If search used sources, show them.
- If local deterministic mode was used, say so.
- If GenCAD/AI Model 4 is not installed, show adapter unavailable, not failure.

Animation:
- subtle status dot pulse for active step;
- no distracting loading spinners everywhere;
- progress should move only when state changes;
- code preview should not jitter layout;
- message streaming should preserve scroll position unless user is reading older messages.

Engineering examples to support in chat UI:
1. Brake disc:
   - understand rotor geometry;
   - optional research;
   - show assumptions: diameter, thickness, bolt circle;
   - create disc, center bore, bolt holes, fillet, export.
2. Mounting bracket:
   - base rectangle;
   - two holes;
   - fillets;
   - export.
3. Spur gear:
   - warn that true involute geometry is not MVP unless adapter is available;
   - produce simplified gear blank or route to future gear generator.
4. F1 front wing:
   - ask for year/generation if needed;
   - show that aerodynamic surfaces are approximated unless surface/mesh adapter is enabled.

Implementation notes:
- Build the chat from serializable events, not hardcoded UI-only state.
- Use the same event payload for Task Pane, web preview, MCP, and future desktop companion.
- Add fixtures/tests for:
  - successful brake disc run;
  - validation failure;
  - CAD disconnected;
  - waiting approval;
  - subscription blocked;
  - adapter unavailable.

Acceptance criteria:
- Chat clearly shows "what the agent is doing" at every stage.
- User can inspect assumptions, plan, validation, and macro before running.
- UI looks like a serious CAD engineering tool, not a generic chatbot.
- Runtime MVP limitations are honest.
- Tests/visual smoke checks pass.
```

## Short Visual Direction For Manual Design Correction

Use this as a quick direction when adjusting the visual layer manually:

```text
Make it feel like a CAD-native engineering copilot:
compact, dark, precise, status-heavy, with visible operation plans and explicit
approval before execution. The best screen is not a huge landing hero; it is the
right-side CAD task pane showing a brake-disc prompt being transformed into a
validated operation plan and SolidWorks macro preview.
```
