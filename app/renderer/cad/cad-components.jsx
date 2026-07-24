// cad-components.jsx — ORYND CAD Bridge component inventory.
// All message/card types from the spec, as composable React components.
// Exported to window.CAD. Depends on window.CADIcons.

const I = window.CADIcons;
const h = React.createElement;

// ---------- HEADER ----------
// Header — when `user` prop provided, replaces settings gear with AccountChip + dropdown menu.
function Header({ connection = 'connected', route = 'ORYND', onSettings, onBell, onSignOut, user, hasUnread, credits, onNewChat }) {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const menuRef = React.useRef(null);
  React.useEffect(() => {
    if (!menuOpen) return;
    const close = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [menuOpen]);

  const chips = {
    connected: h('span', { className: 'tp-chip is-ok is-live' }, h('span', { className: 'dot' }), 'Connected'),
    offline:   h('span', { className: 'tp-chip is-off' }, h('span', { className: 'dot' }), 'Offline'),
  };
  return h('div', { style: { position: 'relative' }, ref: menuRef },
    h('div', { className: 'tp-head' },
      h('div', { className: 'tp-logo' },
        h('div', { className: 'tp-mark' }, h('img', { src: 'cad/brand/orynd-orbit-white.png', alt: 'ORYND', style: { width: 16, height: 'auto', display: 'block' } })),
        h('span', { className: 'tp-name' }, h('b', null, 'ORYND'), ' CAD Bridge'),
      ),
      h('div', { className: 'tp-head-spacer' }),
      // New chat — the only way to leave a chat you're in. Without it the F1
      // onboarding sits on the one and only screen forever and every later request
      // piles on top of it.
      onNewChat && h('button', {
        className: 'tp-chip', title: 'Start a new chat — the current one stays saved',
        onClick: onNewChat, style: { cursor: 'pointer' },
      }, h(I.Plus, { size: 13 }), 'New chat'),
      // Builds left — always visible so the user knows where they stand before
      // hitting the paywall (founder: "где количество запросов?"). The number is
      // Supabase's, fetched by cad-app; Pro passes the string 'Unlimited' since
      // its cap is never shown. Hidden only when we have no answer at all.
      credits != null && credits !== '' && h('span', {
        className: 'tp-chip' + (credits === 0 ? ' is-off' : ''),
        title: credits === 0
          ? 'No builds left — upgrade at oryndai.com'
          : (credits === 'Unlimited' ? 'Unlimited builds on Pro' : 'Builds left on your plan'),
      }, credits === 'Unlimited'
          ? 'Unlimited'
          : credits + (credits === 1 ? ' build left' : ' builds left')),
      chips[connection === 'offline' ? 'offline' : 'connected'],
      h('span', { className: 'tp-bell-wrap' },
        h('button', { className: 'tp-icon-btn', title: 'Notifications', onClick: onBell || undefined }, h(I.Bell, { size: 16 })),
        hasUnread && h('span', { className: 'tp-bell-dot' }),
      ),
      user
        ? h('button', { className: 'tp-acctchip' + (menuOpen ? ' open' : ''), title: 'Account', onClick: () => setMenuOpen(o => !o) },
            h('span', { className: 'av' }, user.initials || 'U'))
        : h('button', { className: 'tp-icon-btn', title: 'Settings', onClick: onSettings || undefined }, h(I.Settings, { size: 16 })),
    ),
    user && menuOpen && h('div', { className: 'tp-acctmenu' },
      h('div', { className: 'tp-acctmenu-head' },
        h('span', { className: 'av' }, user.initials || 'U'),
        h('div', { className: 'who' },
          h('div', { className: 'e' }, user.email || ''),
          h('div', { className: 'pl' }, h('span', { className: 'tp-plan-badge', style: { fontSize: 9, padding: '2px 7px' } }, user.plan || 'Free')),
        ),
      ),
      h('div', { className: 'tp-acctmenu-sep' }),
      h('button', { className: 'tp-acctmenu-item', onClick: () => { setMenuOpen(false); window.orynd && window.orynd.openExternal('https://oryndai.com/account#billing'); } },
        h(I.Spark, { size: 15 }), 'Manage subscription', h('span', { className: 'ext' }, h(I.Arrow, { size: 13 }))),
      h('button', { className: 'tp-acctmenu-item', onClick: () => { setMenuOpen(false); onSettings && onSettings(); } },
        h(I.Settings, { size: 15 }), 'Settings'),
      h('div', { className: 'tp-acctmenu-sep' }),
      h('button', { className: 'tp-acctmenu-item danger', onClick: () => { setMenuOpen(false); onSignOut && onSignOut(); } },
        h(I.Plug, { size: 15 }), 'Sign out'),
    ),
  );
}

// ---------- COMPACT PHASE STATUS ----------
// A narrow task pane can't show a 9-dot timeline without clipping — so we show
// the current phase name, a step counter, and a slim progress bar instead.
const TL_STEPS = ['Understanding', 'Searching', 'Planning', 'Validating', 'Preview', 'Approval', 'Executing', 'Exporting', 'Done'];
function Timeline({ active = 0, failedAt = -1 }) {
  const total = TL_STEPS.length;
  const failed = failedAt >= 0;
  const done = !failed && active >= total - 1;
  const idx = failed ? failedAt : Math.min(active, total - 1);
  const pct = failed ? ((failedAt + 1) / total) * 100 : done ? 100 : ((active + 0.5) / total) * 100;
  const label = failed ? 'Failed · ' + TL_STEPS[idx] : TL_STEPS[idx];
  return h('div', { className: 'tp-status' + (done ? ' done' : '') + (failed ? ' fail' : '') },
    h('span', { className: 'tp-status-dot' }),
    h('span', { className: 'tp-status-label' }, label),
    h('span', { className: 'tp-status-meta' },
      h('span', { className: 'tp-status-track' }, h('i', { style: { width: pct + '%' } })),
      h('span', { className: 'tp-status-count' }, (idx + 1) + ' / ' + total),
    ),
  );
}

// ---------- MESSAGES ----------
function UserMsg({ text, files = [] }) {
  return h('div', { className: 'tp-user' },
    h('div', { className: 'tp-user-bubble' }, text),
    files.length > 0 && h('div', { className: 'tp-user-files' },
      files.map((f, i) => h('span', { className: 'tp-file-chip', key: i },
        h(f.kind === 'image' ? I.Image : f.kind === 'mesh' ? I.Mesh : I.Sketch, { size: 12 }), f.name)),
    ),
  );
}

// Inline **bold** / `code` within one line of text → an array of strings/spans.
function _inlineSpans(line, keyPrefix) {
  const parts = line.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).filter((s) => s !== '');
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return h('strong', { key: keyPrefix + '-b' + i }, part.slice(2, -2));
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return h('code', { key: keyPrefix + '-c' + i, className: 'tp-inline-code' }, part.slice(1, -1));
    }
    return part;
  });
}

// Minimal, dependency-free formatter for assistant text — founder 24.07: "хотя бы
// текстом, не сплошным". No markdown lib (the renderer loads JSX over plain HTTP
// via an in-browser Babel step — adding a bundled dependency there is its own
// project, not a same-session fix). Covers what deep_research/build replies
// actually use: paragraphs, **bold**, `code`, bullet/numbered lists, # headings.
// Anything fancier (tables) still falls back to a plain paragraph — readable,
// just not laid out — rather than breaking.
function formatAssistText(text) {
  const blocks = String(text || '').split(/\n{2,}/);
  const out = [];
  blocks.forEach((block, bi) => {
    const lines = block.split('\n').filter((l) => l.trim() !== '');
    if (!lines.length) return;
    const isBulleted = lines.every((l) => /^\s*[-*•]\s+/.test(l));
    const isNumbered = lines.every((l) => /^\s*\d+[.)]\s+/.test(l));
    if (isBulleted || isNumbered) {
      const Tag = isNumbered ? 'ol' : 'ul';
      out.push(h(Tag, { key: 'b' + bi, className: 'tp-assist-list' },
        lines.map((l, li) => h('li', { key: li },
          _inlineSpans(l.replace(/^\s*([-*•]|\d+[.)])\s+/, ''), bi + '-' + li)))));
      return;
    }
    const heading = lines.length === 1 && lines[0].match(/^(#{1,3})\s+(.*)$/);
    if (heading) {
      out.push(h('div', { key: 'h' + bi, className: 'tp-assist-heading' }, _inlineSpans(heading[2], 'h' + bi)));
      return;
    }
    // Plain paragraph — single '\n' inside one block is a soft line break, not a
    // new paragraph (matches how the model actually writes running prose).
    const withBreaks = [];
    lines.forEach((l, li) => {
      if (li > 0) withBreaks.push(h('br', { key: 'br' + bi + '-' + li }));
      withBreaks.push(..._inlineSpans(l, bi + '-' + li));
    });
    out.push(h('p', { key: 'p' + bi, className: 'tp-assist-p' }, withBreaks));
  });
  return out.length ? out : text;
}

// Assistant summary — supports one serif-italic emphasis word via {em:'word'}
function AssistMsg({ children, em }) {
  return h('div', { className: 'tp-assist' },
    h('div', { className: 'tp-assist-mark' }, h(I.Spark, { size: 13 })),
    h('div', { className: 'tp-assist-body' },
      typeof children === 'string' ? formatAssistText(children) : children,
      em && h(React.Fragment, null, ' ', h('span', { className: 'em' }, em)),
    ),
  );
}

// ---------- AGENT STEP CARD ----------
function StepCard({ status = 'pending', title, detail }) {
  return h('div', { className: 'tp-step' },
    h('span', { className: 'tp-sdot ' + status }),
    h('div', { className: 'tp-step-main' },
      h('div', { className: 'tp-step-title' }, title),
      detail && h('div', { className: 'tp-step-detail' }, detail),
    ),
  );
}

// ---------- CARD SHELL ----------
function Card({ icon, title, meta, children, accent }) {
  return h('div', { className: 'tp-card' },
    h('div', { className: 'tp-card-head' },
      icon && h('span', { className: 'tp-card-ico', style: accent ? { color: 'var(--accent)' } : null }, h(icon, { size: 15 })),
      h('span', { className: 'tp-card-title' }, title),
      meta && h('span', { className: 'tp-card-meta' }, meta),
    ),
    h('div', { className: 'tp-card-divider' }),
    h('div', { className: 'tp-card-body', style: { paddingTop: 11 } }, children),
  );
}

// ---------- RESEARCH CARD ----------
function ResearchCard({ sources, facts, missing, confidence = 0.8, noSearch }) {
  if (noSearch) {
    return h(Card, { icon: I.Search, title: 'Research', meta: 'CONTEXT' },
      h('div', { className: 'tp-note assume' }, h('span', { className: 'ic' }, h(I.Info, { size: 13 })),
        h('span', null, h('b', null, 'No live search used.'), ' Plan built from deterministic geometry templates and stated dimensions.')),
    );
  }
  return h(Card, { icon: I.Search, title: 'Research', meta: 'WEB · ' + sources.length + ' SRC' },
    h('div', { className: 'tp-sub' }, 'Sources'),
    sources.map((s, i) => h('div', { className: 'tp-src', key: i },
      h('span', { className: 'fav' }, h(I.File, { size: 11 })), s.title, h('span', { className: 'url' }, s.url))),
    facts && h(React.Fragment, null,
      h('div', { className: 'tp-sub' }, 'Extracted'),
      facts.map((f, i) => h('div', { className: 'tp-step-detail', key: i, style: { padding: '2px 0' } }, '• ' + f)),
    ),
    h('div', { className: 'tp-sub' }, 'Confidence'),
    h('span', { className: 'tp-conf' },
      h('span', { className: 'tp-conf-bar' }, h('i', { style: { width: (confidence * 100) + '%' } })),
      Math.round(confidence * 100) + '% · ' + (confidence > 0.75 ? 'high' : 'medium')),
  );
}

// ---------- OPERATION PLAN CARD ----------
function OperationPlanCard({ ops, cmds, assumptions, warnings }) {
  return h(Card, { icon: I.Layers, title: 'Operation Plan', meta: ops.length + ' STEPS', accent: true },
    h('div', { className: 'tp-cmds', style: { marginBottom: 12 } },
      cmds.map((c, i) => h('span', { className: 'tp-cmd', key: i }, h('span', { className: 'gl' }, '◆'), c))),
    ops.map((o, i) => h('div', { className: 'tp-op', key: i },
      h('span', { className: 'tp-op-n' }, i + 1),
      h('div', { className: 'tp-op-main' },
        h('div', { className: 'tp-op-title' }, o.title),
        o.dim && h('div', { className: 'tp-op-dim' }, o.dim),
      ),
    )),
    assumptions && h(React.Fragment, null,
      h('div', { className: 'tp-sub' }, 'Assumptions'),
      assumptions.map((a, i) => h('div', { className: 'tp-note assume', key: i, style: { marginBottom: 5 } },
        h('span', { className: 'ic' }, h(I.Dot, { size: 13 })), h('span', null, a))),
    ),
    warnings && warnings.map((w, i) => h('div', { className: 'tp-note warn', key: i, style: { marginTop: 6 } },
      h('span', { className: 'ic' }, h(I.Alert, { size: 13 })), h('span', null, w))),
  );
}

// ---------- VALIDATION CARD ----------
function ValidationCard({ result = 'valid', errors = [], warnings = [], safety = [] }) {
  const banner = {
    valid:  { cls: 'valid',  ic: I.CheckCircle, label: 'Static validation passed' },
    review: { cls: 'review', ic: I.Alert,       label: 'Needs review' },
    failed: { cls: 'failed', ic: I.XCircle,     label: 'Validation failed' },
  }[result];
  return h(Card, { icon: I.Shield, title: 'Validation', meta: result.toUpperCase() },
    h('div', { className: 'tp-vbanner ' + banner.cls }, h(banner.ic, { size: 16 }), banner.label),
    errors.length > 0 && h(React.Fragment, null,
      h('div', { className: 'tp-sub' }, 'Errors'),
      errors.map((e, i) => h('div', { className: 'tp-vrow', key: i, style: { color: 'var(--danger)' } },
        h('span', { className: 'ic' }, h(I.XCircle, { size: 13 })), e))),
    warnings.length > 0 && h(React.Fragment, null,
      h('div', { className: 'tp-sub' }, 'Warnings'),
      warnings.map((w, i) => h('div', { className: 'tp-vrow', key: i, style: { color: 'var(--warn)' } },
        h('span', { className: 'ic' }, h(I.Alert, { size: 13 })), w))),
    safety.length > 0 && h(React.Fragment, null,
      h('div', { className: 'tp-sub' }, 'Safety checks'),
      h('div', { className: 'tp-safe' }, safety.map((s, i) => h('div', { className: 'tp-safe-row', key: i },
        h('span', { className: 'ic' }, h(I.Check, { size: 12 })), s)))),
  );
}

// ---------- MACRO PREVIEW CARD ----------
function MacroCard({ filename = 'brake_disc.swp', lang = 'VBA', lines }) {
  return h(Card, { icon: I.Code, title: 'Macro Preview', meta: lang },
    h('div', { className: 'tp-note assume', style: { marginBottom: 9 } },
      h('span', { className: 'ic' }, h(I.Lock, { size: 13 })),
      h('span', null, 'Generated code ', h('b', null, 'will not run until approved.'))),
    h('div', { className: 'tp-code' },
      h('div', { className: 'tp-code-bar' },
        h(I.Code, { size: 12 }),
        h('span', { className: 'fname' }, filename),
        h('button', { className: 'mini', title: 'Copy' }, h(I.Copy, { size: 12 })),
        h('button', { className: 'mini', title: 'Download' }, h(I.Download, { size: 12 })),
      ),
      h('pre', null, lines.map((ln, i) => h('div', { key: i, dangerouslySetInnerHTML: { __html: ln || '&nbsp;' } }))),
    ),
  );
}

// ---------- APPROVAL GATE ----------
function ApprovalGate({ disabled = false, disconnected = false }) {
  return h('div', { className: 'tp-gate' },
    h('div', { className: 'tp-gate-head' },
      h('span', { className: 'ic' }, h(I.Shield, { size: 16 })),
      h('span', { className: 'tp-gate-title' }, 'Review required before CAD execution'),
    ),
    h('div', { className: 'tp-gate-body' },
      h('div', { className: 'tp-gate-line' },
        disconnected
          ? 'SolidWorks is disconnected. The validated plan and macro are preserved — reconnect to run.'
          : disabled
            ? 'Validation failed. Fix the errors above, then regenerate before this plan can run.'
            : 'Plan validated · assumptions and macro shown above · no shell, network, or delete calls detected.'),
    ),
    h('div', { className: 'tp-gate-acts' },
      disconnected
        ? h('button', { className: 'tp-btn primary' }, h(I.Plug, { size: 14 }), 'Reconnect')
        : h('button', { className: 'tp-btn primary', disabled }, h(I.Play, { size: 14 }), 'Approve & Run'),
      h('button', { className: 'tp-btn' }, h(I.Edit, { size: 14 }), 'Edit Plan'),
      h('button', { className: 'tp-btn' }, h(I.Refresh, { size: 14 }), 'Regenerate'),
      h('button', { className: 'tp-btn ghost' }, 'Cancel'),
    ),
  );
}

// ---------- EXECUTION CARD ----------
function ExecutionCard({ steps, progress = 0 }) {
  return h(Card, { icon: I.Bolt, title: 'Running in CAD', meta: Math.round(progress) + '%', accent: true },
    steps.map((s, i) => h(StepCard, { key: i, status: s.status, title: s.title, detail: s.detail })),
    h('div', { className: 'tp-prog' }, h('i', { style: { width: progress + '%' } })),
  );
}

// ---------- RESULT CARD ----------
function ResultCard({ files }) {
  return h(Card, { icon: I.CheckCircle, title: 'Build complete', meta: 'DONE' },
    h('div', { className: 'tp-vbanner valid', style: { marginBottom: 11 } },
      h(I.CheckCircle, { size: 16 }), 'Part created · STEP exported'),
    h('div', { className: 'tp-sub' }, 'Generated files'),
    h('div', { className: 'tp-files' },
      files.map((f, i) => h('div', { className: 'tp-fileline' + (f.primary ? ' step-export' : ''), key: i },
        h('span', { className: 'ic' }, h(f.primary ? I.Cube : I.File, { size: 15 })),
        h('span', { className: 'fn' }, f.name),
        h('span', { className: 'fz' }, f.size),
      ))),
    h('div', { style: { display: 'flex', gap: 7, flexWrap: 'wrap', marginTop: 11 } },
      h('button', { className: 'tp-btn primary sm' }, h(I.Cube, { size: 13 }), 'Open in CAD'),
      h('button', { className: 'tp-btn sm' }, h(I.Download, { size: 13 }), 'Export'),
      h('button', { className: 'tp-btn ghost sm' }, h(I.Refresh, { size: 13 }), 'New iteration'),
    ),
  );
}

// ---------- BANNERS ----------
function Banner({ kind = 'off', title, text, action }) {
  const ic = kind === 'off' ? I.Plug : I.Lock;
  return h('div', { className: 'tp-banner ' + kind },
    h('span', { className: 'ic' }, h(ic, { size: 18 })),
    h('div', { className: 'tp-banner-main' },
      h('div', { className: 'tp-banner-title' }, title),
      h('div', { className: 'tp-banner-text' }, text),
      action && h('button', { className: 'tp-btn primary sm', style: { marginTop: 9 } }, action.icon && h(action.icon, { size: 13 }), action.label),
    ),
  );
}

// ---------- EMPTY / IDLE STATE ----------
const SUGGESTS = [
  'Create a ventilated brake disc',
  'Make a 24-tooth spur gear, module 2',
  'Build an M3 mounting bracket, 80×60×24',
];
function EmptyState() {
  return h('div', { className: 'tp-empty' },
    h('div', { className: 'tp-empty-mark' }, h(I.Cube, { size: 24 })),
    h('h3', null, 'Describe the part you ', h('span', { className: 'em' }, 'want')),
    h('p', null, 'Type an engineering request or attach a sketch, photo, or mesh. ORYND plans the CAD operations, validates the macro, and waits for your approval before touching the model.'),
    h('div', { className: 'tp-suggests' },
      SUGGESTS.map((s, i) => h('button', { className: 'tp-suggest', key: i },
        h('span', { className: 'ic' }, h(I.Arrow, { size: 14 })), s))),
  );
}

// ---------- COMPOSER ----------
// No mode bar (the agent picks the mode). A round "+" opens a ChatGPT-style
// attach menu; the route pill opens a working model dropdown.
// `pick: true` — opens the image picker and really attaches. Items without it are still
// visual-only and keep their honest "Soon" badge: File needs a STEP/STL/DXF parser the
// backend doesn't have, CAD element needs a live SolidWorks selection bridge.
const ATTACH_ITEMS = [
  { id: 'photo',     icon: I.Image,  title: 'Photo',      sub: 'Reference image → CAD', pick: true },
  { id: 'blueprint', icon: I.Image,  title: 'Blueprint',  sub: 'Engineering drawing → CAD (tags the message so the orchestrator routes it)', pick: true },
  { id: 'file',      icon: I.File,   title: 'File',       sub: 'STEP · STL · DXF · sketch', soon: true },
  { id: 'elem',      icon: I.Cube,   title: 'CAD element',sub: 'Pick a face / feature in SolidWorks', soon: true },
];

// One image per message — deliberate. Grouping ("10 photos → 3 parts") means the model has to
// work out which photo belongs to which part: real tokens, real ambiguity. Separate parts go in
// separate messages until that's designed properly.
const ATTACH_MAX_BYTES = 10 * 1024 * 1024;
// Extension has no local-model layer — it's BYOK-only (that's Workspace's job).
// Don't offer "Local model" here: an end user has no Ollama running, and it
// would silently degrade to keyword-algorithm routing with no real orchestration.
const ROUTE_ITEMS = [
  { id: 'ORYND',  title: 'ORYND Cloud',  sub: 'Best quality · hosted' },
  { id: 'Claude', title: 'BYO Claude',   sub: 'Your Anthropic key' },
  { id: 'OpenAI', title: 'BYO OpenAI',   sub: 'Your OpenAI key' },
  { id: 'Gemini', title: 'BYO Gemini',   sub: 'Your Google key' },
  { id: 'Groq',   title: 'BYO Groq',     sub: 'Your Groq key' },
];

// Scenario modes — the four+one task lanes the user can steer the orchestrator
// into (mirrors the competitor's tool menu). 'auto' lets Claude decide, and is
// the default. Any other is sent as a PRIORITY hint, never a hard override.
const SCENARIO_ITEMS = [
  { id: 'auto',        short: 'Auto',        title: 'Auto',         sub: 'ORYND picks the right tool' },
  { id: 'part_finder', short: 'Part finder', title: 'Part finder',  sub: 'Find a standard purchased part' },
  { id: 'text_to_cad', short: 'Text → CAD',  title: 'Text → CAD',   sub: 'Build geometry from a description' },
  { id: 'copilot',     short: 'Copilot',     title: 'CAD Copilot',  sub: 'Act on the open document' },
  { id: 'sources',     short: 'Sources',     title: 'Sources',      sub: 'Research docs & datasheets' },
  // "чертёж" = technical blueprint (with dimensions/views), NOT a sketch/drawing —
  // founder caught the naming: "Drawing" reads as "we draw something", wrong meaning.
  { id: 'blueprint',   short: 'Blueprint',   title: 'Blueprint → 3D', sub: 'Build from an engineering drawing', soon: true },
];

function Composer({ value = '', route = 'ORYND', sending = false, disabled = false, selection = null, onSend = null,
  connMode = 'key', onConnMode = null, keyOk = false, mcpOk = false, routes = null }) {
  const [menu, setMenu] = React.useState(null); // 'attach' | 'route' | 'scenario' | null
  // Route is no longer user-picked (the picker is gone — see the composer row below).
  // Kept as a value so `onSend` keeps its shape and the backend keeps receiving the
  // 'backend decides' route; which vendor actually runs is decided by the user's key.
  const activeRoute = route;
  // Scenario mode — a PRIORITY hint sent to the orchestrator. 'auto' = Claude decides.
  const [scenario, setScenario] = React.useState('auto');
  // Attached image: { kind:'photo'|'blueprint', name, b64, size } — one at a time.
  const [attach, setAttach] = React.useState(null);
  const [attachErr, setAttachErr] = React.useState('');
  const wrapRef = React.useRef(null);
  const taRef = React.useRef(null);
  const fileRef = React.useRef(null);
  const pendingKind = React.useRef('photo');
  const live = !!onSend; // wired (chat) vs static (gallery)
  // Picking "MCP" is an intent, not a connection. The pane goes read-only only once an
  // external agent has actually attached (mcpOk) — until then this is still your composer,
  // and locking it on the click alone made the app look broken while nothing was connected.
  const mcpPicked = connMode === 'mcp';
  const isMcp = mcpPicked && mcpOk;
  const scLabel = (SCENARIO_ITEMS.find((s) => s.id === scenario) || SCENARIO_ITEMS[0]).short;

  const openPicker = (kind) => {
    pendingKind.current = kind;
    setMenu(null);
    setAttachErr('');
    if (fileRef.current) { fileRef.current.value = ''; fileRef.current.click(); }
  };
  const onFileChosen = (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    if (f.size > ATTACH_MAX_BYTES) {
      setAttachErr('Image is ' + (f.size / 1048576).toFixed(1) + ' MB — keep it under 10 MB.');
      return;
    }
    const kind = pendingKind.current;
    const rd = new FileReader();
    rd.onerror = () => setAttachErr('Could not read that file.');
    rd.onload = () => {
      // readAsDataURL gives "data:image/png;base64,AAAA…" — the backend wants the payload only.
      const s = String(rd.result || '');
      const b64 = s.slice(s.indexOf(',') + 1);
      if (!b64) { setAttachErr('That file came back empty.'); return; }
      setAttach({ kind, name: f.name, b64, size: f.size });
      // Founder's mechanism: picking Blueprint writes the @blueprint tag into the message
      // itself, so the orchestrator knows the direction even on a bare "make this".
      if (kind === 'blueprint' && taRef.current && !/@blueprint\b/.test(taRef.current.value)) {
        taRef.current.value = ('@blueprint ' + taRef.current.value).trimEnd() + ' ';
        taRef.current.focus();
      }
    };
    rd.readAsDataURL(f);
  };

  const fire = () => {
    // `mcpPicked`, not `isMcp`: in MCP mode the external agent drives this session,
    // so sending from here is off the table whether or not it has connected yet.
    // Typing stays allowed — the pane going dead on the click alone read as broken.
    if (!live || sending || disabled || mcpPicked) return;
    let v = (taRef.current && taRef.current.value || '').trim();
    if (!v && !attach) return;
    // Attached an image and said nothing — don't send an empty turn, say the obvious thing.
    if (!v && attach) {
      v = attach.kind === 'blueprint'
        ? '@blueprint Build this part from the attached engineering drawing.'
        : 'Build this part from the attached photo.';
    }
    onSend(v, activeRoute, scenario, attach);
    if (taRef.current) taRef.current.value = '';
    setAttach(null);
    setAttachErr('');
  };
  React.useEffect(() => {
    if (!menu) return;
    const close = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setMenu(null); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [menu]);

  return h('div', { className: 'tp-composer', ref: wrapRef },
    menu === 'attach' && h('div', { className: 'tp-pop attach' },
      h('div', { className: 'tp-pop-label' }, 'Add to message'),
      ATTACH_ITEMS.map((it) => {
        const usable = !!it.pick && live && !isMcp;
        return h('button', {
          className: 'tp-popitem' + (usable ? '' : ' soon'), key: it.id,
          onClick: usable ? () => openPicker(it.id) : undefined,
        },
          h('span', { className: 'pico' }, h(it.icon, { size: 16 })),
          h('span', { className: 'pmain' }, h('span', { className: 'pt' }, it.title), h('span', { className: 'ps' }, it.sub)),
          !usable && h('span', { className: 'badge-soon' }, 'Soon'),
        );
      }),
      h('div', { className: 'tp-pop-sep' }),
      h('button', { className: 'tp-popitem soon' },
        h('span', { className: 'pico' }, h(I.Layers, { size: 16 })),
        h('span', { className: 'pmain' }, h('span', { className: 'pt' }, 'Plugins'), h('span', { className: 'ps' }, 'Connect tools & libraries')),
        h('span', { className: 'badge-soon' }, 'Soon'),
      ),
    ),
    menu === 'scenario' && h('div', { className: 'tp-pop route' },
      h('div', { className: 'tp-pop-label' }, 'Scenario'),
      SCENARIO_ITEMS.map((it) => h('button', {
        className: 'tp-popitem' + (it.soon ? ' soon' : ''), key: it.id,
        onClick: it.soon ? undefined : () => { setScenario(it.id); setMenu(null); },
      },
        h('span', { className: 'pmain' }, h('span', { className: 'pt' }, it.title), h('span', { className: 'ps' }, it.sub)),
        it.soon && h('span', { className: 'badge-soon' }, 'Soon'),
        !it.soon && scenario === it.id && h('span', { className: 'ptick' }, h(I.Check, { size: 15 })),
      )),
    ),
    h('div', { className: 'tp-input-wrap' },
      selection && h('div', { className: 'tp-selrow' }, h(window.CAD.SelectionChip, { ...selection })),
      // Hidden picker — a real <input type=file> works in both engines this pane runs in
      // (Electron's Chromium and the CAD host's webview); a native dialog does not.
      h('input', {
        type: 'file', accept: 'image/*', ref: fileRef, style: { display: 'none' },
        onChange: onFileChosen,
      }),
      attach && h('div', { className: 'tp-selrow' },
        h('div', { className: 'tp-selchip' },
          h('span', { className: 'ic' }, h(I.Image, { size: 14 })),
          h('span', { className: 'lab' },
            (attach.kind === 'blueprint' ? 'Blueprint ' : 'Photo '),
            h('b', null, attach.name),
            '  ·  ' + (attach.size / 1024).toFixed(0) + ' KB'),
          h('button', {
            className: 'x', title: 'Detach', onClick: () => { setAttach(null); setAttachErr(''); },
          }, h(I.X, { size: 12 })),
        ),
      ),
      attachErr && h('div', { className: 'tp-selrow' },
        h('span', { style: { fontSize: '11.5px', color: 'var(--danger, #e5534b)' } }, attachErr)),
      h('textarea', {
        className: 'tp-input', rows: value ? 2 : 1, defaultValue: value, ref: taRef,
        placeholder: isMcp
          ? 'MCP mode — this pane mirrors your agent’s session'
          : (mcpPicked
            ? 'MCP selected — waiting for your agent to connect. You can still type here.'
            : (selection ? 'Edit this selection…' : 'Describe a part, or attach a reference…')),
        readOnly: !live || isMcp,
        onKeyDown: (live && !isMcp) ? (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); fire(); } } : undefined,
      }),
      h('div', { className: 'tp-input-row' },
        h('button', { className: 'tp-plus' + (menu === 'attach' ? ' open' : ''), title: 'Add', onClick: () => setMenu(menu === 'attach' ? null : 'attach') }, h(I.Plus, { size: 18 })),
        !isMcp && h('button', {
          className: 'tp-route' + (menu === 'scenario' ? ' open' : '') + (scenario !== 'auto' ? ' active' : ''),
          title: 'Scenario — steer the orchestrator', onClick: () => setMenu(menu === 'scenario' ? null : 'scenario'),
        }, h(I.Layers, { size: 13 }), scLabel, h(I.Chevron, { size: 12 })),
        h('div', { style: { flex: 1 } }),
        onConnMode && h('div', { className: 'tp-connseg' },
          h('button', { className: connMode === 'key' ? 'active' : '', onClick: () => onConnMode('key') },
            h('span', { className: 'cdot ' + (keyOk ? 'ok' : 'off') }), 'Key'),
          h('button', { className: connMode === 'mcp' ? 'active' : '', onClick: () => onConnMode('mcp') },
            h('span', { className: 'cdot ' + (mcpOk ? 'ok' : 'off') }), 'MCP'),
        ),
        // Model-route picker removed (founder, 22.07). Picking the vendor by hand made
        // no sense: the key already says whose it is, and choosing the model WITHIN a
        // vendor (opus vs sonnet) belongs in Settings, not on every message. The
        // "ORYND Cloud" entry was worse than useless — it advertised "Best quality ·
        // hosted" while the server holds no key, so it quietly fell through to keyword
        // search and charged a credit for it.
        mcpPicked
          ? h('div', { className: 'tp-mcp-lock', title: 'Sending is off in MCP mode' }, h(I.Lock, { size: 15 }))
          : h('button', { className: 'tp-send', disabled: disabled || sending, onClick: fire }, h(I.Send, { size: 17 })),
      ),
      isMcp && h('div', { className: 'tp-mcp-hint' }, h(I.Plug, { size: 12 }), 'Send from your MCP client — Claude or ChatGPT recommended'),
    ),
  );
}

// ---------- MCP ACTIVITY PILL (cheap "is it alive" signal, no SSE yet) ----------
// Rendered above the composer while connMode==='mcp'. `status` is the raw
// /api/mcp-status payload, polled every ~2.5s by OryndApp. Three states only —
// this deliberately stays cheap; the full step-by-step card is a later SSE build.
function McpActivityPill({ status = null }) {
  if (!status || status.enabled !== true) {
    return h('div', { className: 'tp-chip is-off is-mono' }, h('span', { className: 'dot' }), 'via MCP: backend unreachable');
  }
  const recentMs = 15000;
  const active = status.last_call_ts && (Date.now() / 1000 - status.last_call_ts) < recentMs / 1000;
  if (active) {
    return h('div', { className: 'tp-chip is-ok is-live is-mono' },
      h('span', { className: 'dot' }), 'via MCP: active · last step: ' + (status.last_tool || '…'));
  }
  return h('div', { className: 'tp-chip is-mono', style: { color: 'var(--ink-3)', borderColor: 'var(--glass-edge)', background: 'rgba(255,255,255,.04)' } },
    h('span', { className: 'dot' }), 'via MCP: connected · waiting for calls');
}

// ---------- UPDATE AVAILABLE BANNER ----------
// forced=true (after AUTO_INSTALL_AFTER prompts) → the update is downloading and
// will install on quit; no "Later" / dismiss is offered.
function UpdateBanner({ onUpdate, onDismiss, version = '1.4.2', forced = false }) {
  if (forced) {
    return h('div', { className: 'tp-update' },
      h('span', { className: 'uico' }, h(I.Refresh, { size: 14 })),
      h('span', { className: 'utxt' }, h('b', null, 'Updating to v' + version), ' · installs on restart'),
    );
  }
  return h('div', { className: 'tp-update' },
    h('span', { className: 'uico' }, h(I.Refresh, { size: 14 })),
    h('span', { className: 'utxt' }, h('b', null, 'Update available'), ' · v' + version),
    h('button', { className: 'tp-update-btn', onClick: onUpdate },
      h(I.Download, { size: 12 }), 'Update'),
    h('button', { className: 'tp-update-x', title: 'Dismiss', onClick: onDismiss },
      h(I.X, { size: 12 })),
  );
}

Object.assign(window.CAD = window.CAD || {}, {
  Header, Timeline, UserMsg, AssistMsg, StepCard, Card, ResearchCard,
  OperationPlanCard, ValidationCard, MacroCard, ApprovalGate, ExecutionCard,
  ResultCard, Banner, EmptyState, Composer, TL_STEPS, UpdateBanner, McpActivityPill,
});
