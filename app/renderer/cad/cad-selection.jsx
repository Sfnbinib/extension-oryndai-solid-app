// cad-selection.jsx — selection-as-context, chat continuity, cheap deterministic
// edits vs. model escalation, clarification, and reusable macro recipes.
// Components merge into window.CAD; new scenarios extend window.SCENARIOS.

const _xh = React.createElement;
const XI = window.CADIcons;
const XC = window.CAD;

// ---------- chat session header (continuing project thread) ----------
function ChatSessionHeader({ project, doc, selectionCount }) {
  return _xh('div', { className: 'tp-session' },
    _xh('span', { className: 'ic' }, _xh(XI.Layers, { size: 16 })),
    _xh('div', { className: 'tp-session-main' },
      _xh('div', { className: 'tp-session-title' }, project),
      _xh('div', { className: 'tp-session-doc' }, doc),
    ),
    selectionCount ? _xh('span', { className: 'tp-pill run' }, _xh('span', { className: 'd' }), selectionCount + ' selected') : null,
  );
}

// ---------- selection context chip (sits in composer) ----------
const SEL_ICON = { face: XI.Circle, feature: XI.Cube, edge: XI.Ruler, body: XI.Cube, component: XI.Layers };
function SelectionChip({ kind = 'face', name, owner }) {
  return _xh('div', { className: 'tp-selchip' },
    _xh('span', { className: 'ic' }, _xh(SEL_ICON[kind] || XI.Cube, { size: 14 })),
    _xh('span', { className: 'lab' }, kind.charAt(0).toUpperCase() + kind.slice(1) + ' ', _xh('b', null, name), owner ? '  ·  ' + owner : ''),
    _xh('button', { className: 'x', title: 'Detach' }, _xh(XI.X, { size: 12 })),
  );
}

// ---------- selection inspector ----------
function SelectionInspector({ rows }) {
  return _xh(XC.Card, { icon: XI.Search, title: 'Selection', meta: 'ATTACHED', accent: true },
    _xh('div', { className: 'tp-inspect' },
      rows.map((r, i) => _xh('div', { className: 'tp-inspect-row', key: i },
        _xh('span', { className: 'tp-inspect-k' }, r[0]),
        _xh('span', { className: 'tp-inspect-v', dangerouslySetInnerHTML: { __html: r[1] } }),
      ))),
  );
}

// ---------- contextual cheap-edit suggestions ----------
function ContextSuggestions({ items }) {
  return _xh('div', { className: 'tp-ctxsug' },
    items.map((s, i) => _xh('button', { className: 'tp-ctxchip', key: i },
      _xh('span', { className: 'ic' }, _xh(s.icon || XI.Bolt, { size: 13 })), s.label)));
}

// ---------- routing badge ----------
function RouteBadge({ mode = 'cheap' }) {
  return mode === 'cheap'
    ? _xh('span', { className: 'tp-route-badge cheap' }, _xh(XI.Bolt, { size: 13 }), 'Deterministic edit', _xh('span', { className: 'sub' }, '· no model call'))
    : _xh('span', { className: 'tp-route-badge model' }, _xh(XI.Brain, { size: 13 }), 'Model route', _xh('span', { className: 'sub' }, '· ORYND Cloud'));
}

// ---------- clarification popover ----------
function ClarificationPopover({ title, message, choices }) {
  return _xh('div', { className: 'tp-clarify' },
    _xh('div', { className: 'tp-clarify-head' }, _xh('span', { className: 'ic' }, _xh(XI.Info, { size: 15 })), _xh('span', { className: 'tp-clarify-title' }, title)),
    _xh('div', { className: 'tp-clarify-msg' }, message),
    _xh('div', { className: 'tp-choices' },
      choices.map((c, i) => _xh('button', { className: 'tp-choice' + (c.decide ? ' decide' : ''), key: i }, c.label || c))),
    _xh('div', { className: 'tp-clarify-free' }, _xh(XI.Edit, { size: 13 }), 'Or describe it yourself…'),
  );
}

// ---------- plan diff + cheap-edit preview ----------
function PlanDiffCard({ feature, op, rows }) {
  return _xh(XC.Card, { icon: XI.Code, title: 'Plan diff', meta: feature },
    _xh('div', { style: { marginBottom: 9 } }, _xh(RouteBadge, { mode: 'cheap' })),
    _xh('div', { className: 'tp-diff' },
      rows.map((r, i) => _xh('div', { className: 'tp-diff-row ' + r[0], key: i },
        _xh('span', { className: 'sign' }, r[0] === 'add' ? '+' : r[0] === 'del' ? '−' : ''),
        _xh('span', { dangerouslySetInnerHTML: { __html: r[1] } }),
      ))),
    _xh('div', { style: { display: 'flex', gap: 7, marginTop: 11 } },
      _xh('button', { className: 'tp-btn primary sm' }, _xh(XI.Play, { size: 13 }), 'Approve & Run'),
      _xh('button', { className: 'tp-btn ghost sm' }, 'Cancel'),
    ),
  );
}

// ---------- macro recipe card (parameterized, reusable, multi-instance) ----------
function MacroRecipeCard({ name, params, instances, validation }) {
  return _xh(XC.Card, { icon: XI.Cube, title: name, meta: 'RECIPE · v3', accent: true },
    _xh('div', { className: 'tp-sub' }, 'Parameters'),
    _xh('div', { className: 'tp-recipe-params' },
      params.map((p, i) => _xh('div', { className: 'tp-param', key: i },
        _xh('div', { className: 'k' }, p[0]),
        _xh('div', { className: 'v' }, p[1], p[2] && _xh('small', null, ' ' + p[2])),
      ))),
    _xh('div', { className: 'tp-sub' }, 'Instances · ' + instances.length),
    _xh('div', { className: 'tp-instances' },
      instances.map((ins, i) => _xh('div', { className: 'tp-instance', key: i },
        _xh('span', { className: 'ic' }, _xh(XI.Circle, { size: 13 })), ins.name,
        _xh('span', { className: 'side' }, ins.side)))),
    validation && _xh('div', { className: 'tp-note assume', style: { marginTop: 10 } },
      _xh('span', { className: 'ic' }, _xh(XI.CheckCircle, { size: 13, style: { color: 'var(--ok)' } })), _xh('span', null, validation)),
    _xh('div', { className: 'tp-recipe-acts', style: { marginTop: 11 } },
      _xh('button', { className: 'tp-btn primary sm' }, _xh(XI.Plus, { size: 13 }), 'Insert into assembly'),
      _xh('button', { className: 'tp-btn sm' }, _xh(XI.Edit, { size: 13 }), 'Edit params'),
      _xh('button', { className: 'tp-btn sm' }, _xh(XI.Copy, { size: 13 }), 'Duplicate'),
    ),
  );
}

Object.assign(window.CAD = window.CAD || {}, {
  ChatSessionHeader, SelectionChip, SelectionInspector, ContextSuggestions,
  RouteBadge, ClarificationPopover, PlanDiffCard, MacroRecipeCard,
});

// ============================================================
//  NEW SCENARIOS — selection / continuity / cheap edits
// ============================================================
const SESSION = { t: 'session', project: 'Brake disc project', doc: 'brake_disc.SLDPRT · mm', selectionCount: 1 };

Object.assign(window.SCENARIOS = window.SCENARIOS || {}, {
  selection_attached: {
    connection: 'connected', route: 'ORYND', mode: 'Modify', tlActive: 0,
    session: { project: 'Brake disc project', doc: 'brake_disc.SLDPRT · mm', selectionCount: 1 },
    selection: { kind: 'face', name: 'Face<12>', owner: 'bolt_1_cut' },
    blocks: [
      { t: 'assist', text: 'Attached a face from the bolt hole. It maps to operation ', em: 'bolt_1' },
      { t: 'inspector', rows: [
        ['Kind', 'Face · cylindrical'],
        ['Feature', '<span class="mono">bolt_1_cut</span>'],
        ['Body', '<span class="mono">disc_body</span>'],
        ['Geometry', '<span class="mono">r 6.0 · center 57.5, 0</span>'],
        ['Source op', '<span class="mono">hole · Ø12 · through-all</span>'],
      ] },
      { t: 'ctxsug', items: [
        { label: 'Make Ø14', icon: XI.Ruler }, { label: 'Add fillet 2 mm', icon: XI.Bolt },
        { label: 'Create sketch here', icon: XI.Sketch }, { label: 'Mirror to other side', icon: XI.Layers },
      ] },
    ],
  },

  clarification_required: {
    connection: 'connected', route: 'ORYND', mode: 'Create', tlActive: 0,
    session: { project: 'F1 wing concept', doc: 'No active part · mm' },
    blocks: [
      { t: 'user', text: 'Make it like a 2018 F1 front wing.' },
      { t: 'assist', text: 'That spans a few eras with very different regs — let me confirm before I', em: 'plan.' },
      { t: 'routebadge', mode: 'model' },
      { t: 'clarify', title: 'Which F1 generation?', message: 'Aero regs changed a lot. This drives the planform and element count.',
        choices: [{ label: 'Latest current-style' }, { label: '2018' }, { label: '2022+ ground-effect' }, { label: 'Let ORYND choose', decide: true }] },
    ],
  },

  cheap_edit_preview: {
    connection: 'connected', route: 'ORYND', mode: 'Modify', tlActive: 5,
    session: { project: 'Brake disc project', doc: 'brake_disc.SLDPRT · mm', selectionCount: 1 },
    selection: { kind: 'feature', name: 'bolt_1_cut', owner: 'disc_body' },
    blocks: [
      { t: 'user', text: 'Make this hole 14 mm.', files: [] },
      { t: 'assist', text: 'Selected feature is linked to operation bolt_1 — patching the parameter directly, ', em: 'no replan.' },
      { t: 'diff', feature: 'bolt_1 · hole', rows: [
        ['ctx', 'operation bolt_1 · hole'],
        ['del', 'diameter: <span class="hl">12.0</span> mm'],
        ['add', 'diameter: <span class="hl">14.0</span> mm'],
        ['ctx', 'through_all: true · center 57.5, 0'],
      ] },
      { t: 'validate', result: 'valid', safety: ['Param-only patch', 'No shell / network / delete', 'Clearance to bore OK'] },
    ],
  },

  asset_saved: {
    connection: 'connected', route: 'ORYND', mode: 'Create', tlActive: 8,
    session: { project: 'Brake disc project', doc: 'brake_disc_assembly.SLDASM · mm', selectionCount: 0 },
    blocks: [
      { t: 'savedbanner' },
      { t: 'recipe', name: 'Brake disc · 320 / 5-hole', validation: 'Last validation passed with warnings · 12 operations',
        params: [['Diameter', '320', 'mm'], ['Thickness', '26', 'mm'], ['Bolt count', '5'], ['Bolt circle', '114.3', 'mm']],
        instances: [
          { name: 'front_left_disc', side: 'L' }, { name: 'front_right_disc', side: 'R' },
          { name: 'rear_left_disc', side: 'L' }, { name: 'rear_right_disc', side: 'R' },
        ] },
      { t: 'assist', text: 'Saved as a reusable recipe — one macro now drives all four instances. Edit a param once and it', em: 'propagates.' },
    ],
  },
});

window.SELECTION_STATES = [
  ['selection_attached', 'Selection attached'],
  ['cheap_edit_preview', 'Cheap edit · plan diff'],
  ['clarification_required', 'Clarification required'],
  ['asset_saved', 'Asset saved · recipe'],
];
