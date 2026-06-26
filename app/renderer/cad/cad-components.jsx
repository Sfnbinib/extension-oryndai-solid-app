// cad-components.jsx — ORYND CAD Bridge component inventory.
// All message/card types from the spec, as composable React components.
// Exported to window.CAD. Depends on window.CADIcons.

const I = window.CADIcons;
const h = React.createElement;

// ---------- HEADER ----------
function Header({ connection = 'connected', route = 'ORYND', onSettings, onBell }) {
  const chips = {
    connected: h('span', { className: 'tp-chip is-ok is-live' }, h('span', { className: 'dot' }), 'Connected'),
    offline:   h('span', { className: 'tp-chip is-off' }, h('span', { className: 'dot' }), 'Offline'),
  };
  return h('div', { className: 'tp-head' },
    h('div', { className: 'tp-logo' },
      h('div', { className: 'tp-mark' }, h('img', { src: 'cad/brand/orynd-orbit-white.png', alt: 'ORYND', style: { width: 16, height: 'auto', display: 'block' } })),
      h('span', { className: 'tp-name' }, h('b', null, 'ORYND'), ' CAD Bridge'),
    ),
    h('div', { className: 'tp-head-spacer' }),
    chips[connection === 'offline' ? 'offline' : 'connected'],
    h('span', { className: 'tp-bell-wrap' },
      h('button', { className: 'tp-icon-btn', title: 'Notifications', onClick: onBell || undefined }, h(I.Bell, { size: 16 })),
      h('span', { className: 'tp-bell-dot' }),
    ),
    h('button', { className: 'tp-icon-btn', title: 'Settings', onClick: onSettings || undefined }, h(I.Settings, { size: 16 })),
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

// Assistant summary — supports one serif-italic emphasis word via {em:'word'}
function AssistMsg({ children, em }) {
  return h('div', { className: 'tp-assist' },
    h('div', { className: 'tp-assist-mark' }, h(I.Spark, { size: 13 })),
    h('div', { className: 'tp-assist-body' },
      children,
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
const ATTACH_ITEMS = [
  { id: 'photo', icon: I.Image,  title: 'Photo',       sub: 'Reference image → CAD' },
  { id: 'file',  icon: I.File,   title: 'File',        sub: 'STEP · STL · DXF · sketch' },
  { id: 'elem',  icon: I.Cube,   title: 'CAD element', sub: 'Pick a face / feature in SolidWorks' },
];
const ROUTE_ITEMS = [
  { id: 'ORYND',  title: 'ORYND Cloud',  sub: 'Best quality · hosted' },
  { id: 'Claude', title: 'BYO Claude',   sub: 'Your Anthropic key' },
  { id: 'OpenAI', title: 'BYO OpenAI',   sub: 'Your OpenAI key' },
  { id: 'Local',  title: 'Local model',  sub: 'Offline · on this machine' },
];

function Composer({ value = '', route = 'ORYND', sending = false, disabled = false, selection = null, onSend = null }) {
  const [menu, setMenu] = React.useState(null); // 'attach' | 'route' | null
  const [activeRoute, setActiveRoute] = React.useState(route);
  const wrapRef = React.useRef(null);
  const taRef = React.useRef(null);
  const live = !!onSend; // wired (chat) vs static (gallery)
  const fire = () => {
    if (!live || sending || disabled) return;
    const v = (taRef.current && taRef.current.value || '').trim();
    if (!v) return;
    onSend(v, activeRoute);
    if (taRef.current) taRef.current.value = '';
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
      ATTACH_ITEMS.map((it) => h('button', { className: 'tp-popitem', key: it.id, onClick: () => setMenu(null) },
        h('span', { className: 'pico' }, h(it.icon, { size: 16 })),
        h('span', { className: 'pmain' }, h('span', { className: 'pt' }, it.title), h('span', { className: 'ps' }, it.sub)),
      )),
      h('div', { className: 'tp-pop-sep' }),
      h('button', { className: 'tp-popitem soon' },
        h('span', { className: 'pico' }, h(I.Layers, { size: 16 })),
        h('span', { className: 'pmain' }, h('span', { className: 'pt' }, 'Plugins'), h('span', { className: 'ps' }, 'Connect tools & libraries')),
        h('span', { className: 'badge-soon' }, 'Soon'),
      ),
    ),
    menu === 'route' && h('div', { className: 'tp-pop route' },
      h('div', { className: 'tp-pop-label' }, 'Model route'),
      ROUTE_ITEMS.map((it) => h('button', { className: 'tp-popitem', key: it.id, onClick: () => { setActiveRoute(it.id); setMenu(null); } },
        h('span', { className: 'pmain' }, h('span', { className: 'pt' }, it.title), h('span', { className: 'ps' }, it.sub)),
        activeRoute === it.id && h('span', { className: 'ptick' }, h(I.Check, { size: 15 })),
      )),
    ),
    h('div', { className: 'tp-input-wrap' },
      selection && h('div', { className: 'tp-selrow' }, h(window.CAD.SelectionChip, { ...selection })),
      h('textarea', { className: 'tp-input', rows: value ? 2 : 1, defaultValue: value, ref: taRef, placeholder: selection ? 'Edit this selection…' : 'Describe a part, or attach a reference…', readOnly: !live, onKeyDown: live ? (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); fire(); } } : undefined }),
      h('div', { className: 'tp-input-row' },
        h('button', { className: 'tp-plus' + (menu === 'attach' ? ' open' : ''), title: 'Add', onClick: () => setMenu(menu === 'attach' ? null : 'attach') }, h(I.Plus, { size: 18 })),
        h('div', { style: { flex: 1 } }),
        h('button', { className: 'tp-route' + (menu === 'route' ? ' open' : ''), onClick: () => setMenu(menu === 'route' ? null : 'route') },
          h('span', { className: 'rdot' }), activeRoute, h(I.Chevron, { size: 12 })),
        h('button', { className: 'tp-send', disabled: disabled || sending, onClick: fire }, h(I.Send, { size: 17 })),
      ),
    ),
  );
}

// ---------- UPDATE AVAILABLE BANNER ----------
function UpdateBanner({ onUpdate, onDismiss, version = '1.4.2' }) {
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
  ResultCard, Banner, EmptyState, Composer, TL_STEPS, UpdateBanner,
});
