// cad/cad-thinking.jsx — animated "thinking / processing" status above the composer.
// Pulsing orbit indicator + rotating playful stage label + thin stage timeline.
// Exported to window.THINK.

const _th = React.createElement;
const TI = window.CADIcons;

// the canonical processing stages
const THINK_STAGES = [
  { id: 'understanding', label: 'Understanding' },
  { id: 'searching',     label: 'Searching' },
  { id: 'analyzing',     label: 'Analyzing' },
  { id: 'planning',      label: 'Planning' },
  { id: 'validating',    label: 'Validating' },
  { id: 'building',      label: 'Building' },
  { id: 'exporting',     label: 'Exporting' },
];

// playful label variants that rotate per active stage (~1.5s each)
const THINK_VARIANTS = {
  understanding: ['Reading your request', 'Parsing the intent', 'Picturing the part', 'Getting the gist'],
  searching:     ['Searching references', 'Checking standards', 'Finding the right specs', 'Digging through catalogs'],
  analyzing:     ['Analyzing geometry', 'Measuring twice', 'Crunching the constraints', 'Thinking it through'],
  planning:      ['Building the model', 'Sketching operations', 'Drawing up the plan', 'Mapping the features'],
  validating:    ['Validating the macro', 'Double-checking safety', 'Running the rules', 'Making sure it holds'],
  building:      ['Building in CAD', 'Extruding & cutting', 'Turning the handle', 'Shaping the solid'],
  exporting:     ['Exporting STEP', 'Wrapping it up', 'Packing the files', 'Almost there'],
};

// orbit indicator (pure CSS, animated)
function ThinkOrbit() {
  return _th('span', { className: 'tk-orbit' },
    _th('span', { className: 'tk-orbit-ring' }, _th('span', { className: 'tk-orbit-sat' })),
    _th('span', { className: 'tk-orbit-core' }),
  );
}

// the live status line + stage timeline. activeIndex = which stage is running.
function ThinkingState({ activeIndex = 3, variantIndex = 0 }) {
  const stage = THINK_STAGES[activeIndex] || THINK_STAGES[0];
  const variants = THINK_VARIANTS[stage.id] || [stage.label];
  const label = variants[variantIndex % variants.length];
  return _th('div', { className: 'tk' },
    _th('div', { className: 'tk-row' },
      _th(ThinkOrbit),
      _th('span', { className: 'tk-label' }, label,
        _th('span', { className: 'tk-dots' }, _th('i', null), _th('i', null), _th('i', null))),
      _th('span', { className: 'tk-stagecount' }, (activeIndex + 1) + '/' + THINK_STAGES.length),
    ),
    _th('div', { className: 'tk-timeline' },
      THINK_STAGES.map((s, i) => {
        const state = i < activeIndex ? 'done' : i === activeIndex ? 'active' : 'pending';
        return _th('div', { className: 'tk-stage ' + state, key: s.id, title: s.label },
          _th('span', { className: 'tk-seg' },
            state === 'done' && _th(TI.Check, { size: 9, stroke: 2.4 })),
          _th('span', { className: 'tk-stage-label' }, s.label),
        );
      }),
    ),
  );
}

// A full chat pane mid-thinking, for the canvas (driven live by an interval).
function ThinkingBlock({ activeIndex = 3 }) {
  const [open, setOpen] = React.useState(false);
  const [vi, setVi] = React.useState(0);
  const [ai, setAi] = React.useState(activeIndex);
  React.useEffect(() => {
    const v = setInterval(() => setVi(x => x + 1), 1500);
    const a = setInterval(() => setAi(x => (x < THINK_STAGES.length - 1 ? x + 1 : x), 1500 * 5));
    return () => { clearInterval(v); clearInterval(a); };
  }, []);
  const stage = THINK_STAGES[ai] || THINK_STAGES[0];
  const variants = THINK_VARIANTS[stage.id] || [stage.label];
  const currentLabel = variants[vi % variants.length];
  return _th('div', { className: 'tk-block' },
    // collapsed pill — always visible
    _th('div', { className: 'tk-pill' + (open ? ' open' : ''), onClick: () => setOpen(o => !o) },
      _th(ThinkOrbit),
      _th('span', { className: 'tk-pill-label' }, currentLabel),
      _th('span', { className: 'tk-pill-dots' }, _th('i'), _th('i'), _th('i')),
      _th('span', { className: 'chevron' }, _th(TI.Chevron, { size: 14 })),
    ),
    // expanded panel
    open && _th('div', { className: 'tk-expand' },
      _th('div', { className: 'tk-expand-inner' },
        THINK_STAGES.map((s, i) => {
          const state = i < ai ? 'done' : i === ai ? 'active' : 'pending';
          const sv = THINK_VARIANTS[s.id] || [s.label];
          // for done stages show a deterministic variant; for active show current rotating label
          const text = state === 'done' ? sv[(i * 3) % sv.length]
                     : state === 'active' ? currentLabel
                     : s.label;
          return _th('div', { className: 'tk-step-row', key: s.id },
            _th('div', { className: 'tk-step-ico ' + state },
              state === 'done'   && _th(TI.Check, { size: 11, stroke: 2.4 }),
              state === 'active' && _th('span', { className: 'tk-spin' }),
              state === 'pending' && null,
            ),
            _th('div', { className: 'tk-step-body' },
              _th('div', { className: 'tk-step-stage' }, s.label),
              _th('div', { className: 'tk-step-text' + (state === 'pending' ? ' faded' : state === 'active' ? ' active-label' : '') }, text),
            ),
          );
        }),
      ),
    ),
  );
}

// A full chat pane mid-thinking, for the canvas (driven live by an interval).
function ThinkingPane({ light = false, activeIndex = 3 }) {
  const C = window.CAD;
  const [vi, setVi] = React.useState(0);
  const [ai, setAi] = React.useState(activeIndex);
  React.useEffect(() => {
    const v = setInterval(() => setVi(x => x + 1), 1500);
    const a = setInterval(() => setAi(x => (x + 1) % THINK_STAGES.length), 1500 * 4);
    return () => { clearInterval(v); clearInterval(a); };
  }, []);
  return _th('div', { className: 'tp' + (light ? ' light' : ''), style: { width: '100%', height: '100%' } },
    _th('div', { className: 'tp-shell' },
      _th(C.Header, { connection: 'connected', route: 'ORYND' }),
      _th(window.DASH.PaneTabs, { active: 'chat' }),
      _th('div', { className: 'tp-body' },
        _th(C.UserMsg, { text: 'Create a ventilated brake disc, Ø320, for a 5×114.3 hub.', files: [{ kind: 'sketch', name: 'rotor_ref.svg' }] }),
        _th(C.AssistMsg, { em: 'working\u2026' }, 'On it — planning the operations and validating before I touch the model.'),
      ),
      _th(ThinkingState, { activeIndex: ai, variantIndex: vi }),
      _th(C.Composer, { mode: 'Create', route: 'ORYND', disabled: true }),
    ),
  );
}


// ---------- INLINE CHAT THINKING BUBBLE ----------
// Lives in tp-body, collapses like Claude's "thinking" disclosure.
// Stage labels pulled from real THINK_STAGES / THINK_VARIANTS — no hardcoded text.
function ThinkingBubble({ activeIndex = 2, done = false }) {
  const [open, setOpen] = React.useState(true);
  const [vi, setVi] = React.useState(0);
  const [ai, setAi] = React.useState(activeIndex);
  React.useEffect(() => {
    if (done) return;
    const v = setInterval(() => setVi(x => x + 1), 1400);
    const a = setInterval(() => setAi(x => (x + 1) % THINK_STAGES.length), 1400 * 4);
    return () => { clearInterval(v); clearInterval(a); };
  }, [done]);
  const stage = THINK_STAGES[ai] || THINK_STAGES[0];
  const variants = THINK_VARIANTS[stage.id] || [stage.label];
  const label = variants[vi % variants.length];
  const doneCount = done ? THINK_STAGES.length : ai;
  return _th('div', { className: 'tk-bubble' },
    _th('button', { className: 'tk-bubble-head', onClick: () => setOpen(o => !o) },
      done
        ? _th(TI.CheckCircle, { size: 14, style: { color: 'var(--ok)', flexShrink: 0 } })
        : _th('span', { className: 'tk-orbit', style: { flexShrink: 0 } },
            _th('span', { className: 'tk-orbit-ring' }, _th('span', { className: 'tk-orbit-sat' })),
            _th('span', { className: 'tk-orbit-core' }),
          ),
      _th('span', { className: 'tk-bubble-label' },
        done ? 'Thought for a moment' : label,
        !done && _th('span', { className: 'tk-dots' }, _th('i'), _th('i'), _th('i')),
      ),
      _th('span', { className: 'tk-bubble-chevron' + (open ? ' open' : '') },
        _th(TI.Chevron, { size: 13 }),
      ),
    ),
    open && _th('div', { className: 'tk-bubble-body' },
      THINK_STAGES.map((s, i) => {
        const st = i < doneCount ? 'done' : i === doneCount && !done ? 'active' : 'pending';
        const sv = THINK_VARIANTS[s.id] || [s.label];
        const sl = st === 'active' ? sv[vi % sv.length] : s.label;
        return _th('div', { className: 'tk-bubble-step ' + st, key: s.id },
          _th('span', { className: 'tk-bubble-dot' }, st === 'done' && _th(TI.Check, { size: 10, stroke: 2.5 })),
          _th('span', { className: 'tk-bubble-step-label' }, sl,
            st === 'active' && _th('span', { className: 'tk-dots' }, _th('i'), _th('i'), _th('i'))),
        );
      }),
    ),
  );
}

// ---------- REAL RUN PROGRESS (driven by live /chat events, not intervals) ----------
// steps come from actual agent_call/agent_result/stage/candidates/model_ready
// events; the timer is real wall-clock elapsed. No canned "caramelizing onions".
// onShare: only passed once a run finished and actually produced files — the button
// simply isn't there on a failed or conversational turn (cad-app decides).
// onOpen: same deal for the built files — a path printed as text is not a result,
// the user has to be able to reach the model in one click.
function RunProgress({ steps = [], elapsedMs = 0, running = true, error = null, onShare = null, onOpen = null, onOpenInFusion = null }) {
  const secs = (Math.max(0, elapsedMs) / 1000).toFixed(1);
  return _th('div', { className: 'tk-run', style: { display: 'flex', flexDirection: 'column', gap: 8, padding: '2px 0' } },
    _th('div', { className: 'tk-run-head', style: { display: 'flex', alignItems: 'center', gap: 8 } },
      running
        ? _th(ThinkOrbit)
        : _th(error ? TI.Info : TI.CheckCircle, { size: 14, style: { flexShrink: 0, color: error ? 'var(--err, #e5484d)' : 'var(--ok)' } }),
      _th('span', { className: 'tk-run-label', style: { fontSize: 12, fontWeight: 600, opacity: .85 } },
        running ? 'Working' : (error ? 'Failed' : 'Done')),
      _th('span', { className: 'tk-run-timer', style: { marginLeft: 'auto', fontSize: 11, opacity: .6, fontVariantNumeric: 'tabular-nums' } }, secs + 's'),
      onOpenInFusion && _th('button', {
        className: 'tp-btn primary', onClick: onOpenInFusion, title: 'Import the built STEP into the active Fusion document',
        style: { padding: '0 8px', height: 22, fontSize: 11 },
      }, 'Open in Fusion'),
      onOpen && _th('button', {
        className: 'tp-btn', onClick: onOpen, title: 'Open the folder with the built files',
        style: { padding: '0 8px', height: 22, fontSize: 11 },
      }, 'Open files'),
      onShare && _th('button', {
        className: 'tp-btn', onClick: onShare, title: 'Share this build',
        style: { padding: '0 8px', height: 22, fontSize: 11, gap: 5 },
      }, _th(TI.Send, { size: 12 }), 'Share'),
    ),
    steps.length > 0 && _th('div', { style: { display: 'flex', flexDirection: 'column', gap: 7 } },
      steps.map((s, j) => _th(window.CAD.StepCard, { key: s.key || j, status: s.status, title: s.title, detail: s.detail }))),
    error && _th('div', { className: 'tp-step-detail', style: { color: 'var(--err, #e5484d)' } }, error),
  );
}

window.THINK = { ThinkingState, ThinkingPane, ThinkOrbit, ThinkingBlock, ThinkingBubble, RunProgress, THINK_STAGES, THINK_VARIANTS };
