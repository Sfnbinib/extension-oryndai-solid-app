// cad/empty/cad-empty-states.jsx
// Zero-state / first-launch screens for every tab.
// Each is a full 400px pane (header + tabs + empty body + composer).
// Exported to window.EMPTY.

const _eh = React.createElement;
const EI = window.CADIcons;
const EC = window.CAD;
const ED = window.DASH;

// ---------- animated orbit illustration ----------
function OrbitIllo() {
  return _eh('div', { className: 'es-orbit' },
    _eh('div', { className: 'ring ring-1' }, _eh('span', { className: 'diamond' })),
    _eh('div', { className: 'ring ring-2' }),
    _eh('div', { className: 'center-dot' }),
  );
}

// ---------- CHAT — first launch, zero history ----------
function ChatEmpty({ onTab, onSettings, onSend, onPick, user, onBell, onSignOut } = {}) {
  const suggestions = [
    { icon: EI.Circle,   text: 'Create a ventilated brake disc, Ø320' },
    { icon: EI.Settings, text: 'Make a 24-tooth spur gear, module 2' },
    { icon: EI.Cube,     text: 'M3 mounting bracket, 80×60×24 mm' },
    { icon: EI.Layers,   text: 'Hex standoff M4, Ø8 · 20 mm tall' },
  ];
  return _eh('div', { className: 'tp', style: { width: '100%', height: '100%' } },
    _eh('div', { className: 'tp-shell' },
      _eh(EC.Header, { connection: 'connected', route: 'ORYND', onSettings, onBell, onSignOut, user }),
      _eh(ED.PaneTabs, { active: 'chat', onTab }),
      _eh('div', { className: 'tp-body', style: { alignItems: 'center', justifyContent: 'center', paddingTop: 32 } },
        _eh(OrbitIllo),
        _eh('div', { style: { height: 20 } }),
        _eh('h2', { className: 'es-h' }, 'Describe the part you ', _eh('span', { className: 'em' }, 'want')),
        _eh('p', { className: 'es-p', style: { marginTop: 8, marginBottom: 20 } },
          'Type a prompt, drop a sketch, or attach a photo. ORYND plans the CAD operations and waits for your approval before touching the model.'),
        _eh('div', { className: 'es-chips' },
          suggestions.map((s, i) => _eh('button', { className: 'es-chip', key: i, onClick: onPick ? () => onPick(s.text) : undefined },
            _eh('span', { className: 'ic' }, _eh(s.icon, { size: 15 })),
            s.text,
            _eh('span', { className: 'arr' }, _eh(EI.Arrow, { size: 14 })),
          ))),
        _eh('div', { style: { height: 14 } }),
        _eh('div', { className: 'es-hint' },
          _eh('span', { className: 'ic' }, _eh(EI.Image, { size: 14 })),
          'Or attach a sketch, photo, or STEP file'),
      ),
      _eh(EC.Composer, { mode: 'Create', route: 'ORYND', onSend }),
    ),
  );
}

// ---------- LIBRARY — no automations yet ----------
function LibraryEmpty({ onTab, onSettings, onNew, user, onBell, onSignOut } = {}) {
  return _eh('div', { className: 'tp', style: { width: '100%', height: '100%' } },
    _eh('div', { className: 'tp-shell' },
      _eh(EC.Header, { connection: 'connected', route: 'ORYND', onSettings, onBell, onSignOut, user }),
      _eh(ED.PaneTabs, { active: 'library', onTab }),
      _eh('div', { className: 'tp-toolbar' },
        _eh('div', { className: 'tp-search', style: { opacity: .4 } },
          _eh(EI.Search, { size: 14 }),
          _eh('input', { placeholder: 'Search parts & macros…', readOnly: true, disabled: true })),
      ),
      _eh('div', { className: 'tp-body', style: { alignItems: 'center', justifyContent: 'center', paddingTop: 18 } },
        _eh('div', { className: 'es-grid' },
          _eh('div', { className: 'es-phantom tall' }, '—'),
          _eh('div', { className: 'es-phantom' }, '—'),
          _eh('div', { className: 'es-phantom' }, '—'),
        ),
        _eh('div', { style: { height: 22 } }),
        _eh('h2', { className: 'es-h' }, 'No automations ', _eh('span', { className: 'em' }, 'yet')),
        _eh('p', { className: 'es-p', style: { marginTop: 8, marginBottom: 20 } },
          'Every part you create is saved here as a reusable recipe — run it again, remix it, or share it with your team.'),
        _eh('button', { className: 'tp-btn primary', onClick: onNew }, _eh(EI.Plus, { size: 14 }), 'Create your first part'),
      ),
      _eh('div', { className: 'tp-composer', style: { paddingTop: 11 } },
        _eh('button', { className: 'tp-btn primary block', onClick: onNew }, _eh(EI.Plus, { size: 15 }), 'New part from prompt'),
      ),
    ),
  );
}

// ---------- RUNS — no history yet ----------
function RunsEmpty({ onTab, onSettings, onStart, user, onBell, onSignOut } = {}) {
  return _eh('div', { className: 'tp', style: { width: '100%', height: '100%' } },
    _eh('div', { className: 'tp-shell' },
      _eh(EC.Header, { connection: 'connected', route: 'ORYND', onSettings, onBell, onSignOut, user }),
      _eh(ED.PaneTabs, { active: 'runs', onTab }),
      _eh('div', { className: 'tp-body', style: { alignItems: 'center', justifyContent: 'center', paddingTop: 32 } },
        _eh('div', { className: 'es-grid', style: { marginBottom: 24 } },
          [72, 52, 62].map((h, i) => _eh('div', { className: 'es-phantom', key: i, style: { height: h } }, '—')),
        ),
        _eh('h2', { className: 'es-h' }, 'No runs ', _eh('span', { className: 'em' }, 'yet')),
        _eh('p', { className: 'es-p', style: { marginTop: 8, marginBottom: 20 } },
          'Every time ORYND executes a plan, it appears here — with the macro, timing, and a full validation report.'),
        _eh('button', { className: 'tp-btn primary', onClick: onStart }, _eh(EI.Spark, { size: 14 }), 'Start a chat'),
      ),
    ),
  );
}

// ---------- OVERVIEW — brand-new user, zero data ----------
function OverviewEmpty({ onTab, onSettings, onNew, user, onBell, onSignOut } = {}) {
  return _eh('div', { className: 'tp', style: { width: '100%', height: '100%' } },
    _eh('div', { className: 'tp-shell' },
      _eh(EC.Header, { connection: 'offline', route: 'ORYND', onSettings, onBell, onSignOut, user }),
      _eh(ED.PaneTabs, { active: 'overview', onTab }),
      _eh('div', { className: 'tp-vd' },
        _eh('div', { className: 'tp-vd-hero' },
          _eh('h2', null, 'Welcome to ', _eh('span', { className: 'em' }, 'ORYND')),
          _eh('p', null, 'No parts yet — let\'s build your first one.'),
        ),
        // connect CTA (offline) → opens Settings where CAD connections live
        _eh('div', { className: 'es-connrow' },
          _eh('span', { className: 'ic' }, _eh(EI.Plug, { size: 16 })),
          _eh('span', null, _eh('b', null, 'SolidWorks'), ' not connected'),
          _eh('button', { className: 'link', onClick: onSettings || undefined, style: { background: 'none', border: 'none', cursor: 'pointer' } }, 'Connect →'),
        ),
        _eh('div', { className: 'tp-vd-cta', onClick: onNew, style: onNew ? { cursor: 'pointer' } : undefined },
          _eh('span', { className: 'ci' }, _eh(EI.Spark, { size: 18 })),
          _eh('div', { className: 'cm' },
            _eh('div', { className: 'ct' }, 'New part from a prompt'),
            _eh('div', { className: 'cs' }, 'Describe it, sketch it, or drop a photo'),
          ),
          _eh('span', { className: 'carrow' }, _eh(EI.Arrow, { size: 16 })),
        ),
        // zeroed stats
        _eh('div', { className: 'tp-vd-sh' }, _eh('h3', null, 'Stats'), _eh('span', { className: 'ln' })),
        _eh('div', { className: 'es-stats' },
          [['0', 'Parts'], ['0', 'Runs'], ['—', 'Valid 1st try'], ['—', 'Median STEP']].map(([v, k], i) =>
            _eh('div', { className: 'es-stat', key: i }, _eh('div', { className: 'v' }, v), _eh('div', { className: 'k' }, k))),
        ),
        _eh('div', { className: 'tp-vd-sh' }, _eh('h3', null, 'Recent runs'), _eh('span', { className: 'ln' })),
        _eh('div', { className: 'es-grid' },
          _eh('div', { className: 'es-phantom' }, 'Your first run will appear here'),
        ),
        _eh('div', { className: 'tp-vd-sh' }, _eh('h3', null, 'Automations'), _eh('span', { className: 'ln' })),
        _eh('div', { className: 'es-grid' },
          _eh('div', { className: 'es-phantom', style: { height: 70 } }, 'No automations saved yet'),
        ),
      ),
    ),
  );
}

// ---------- NOTIFICATIONS — all caught up ----------
function NotificationsEmpty({ onBack, onSettings } = {}) {
  return _eh('div', { className: 'tp', style: { width: '100%', height: '100%' } },
    _eh('div', { className: 'tp-shell' },
      _eh(EC.Header, { connection: 'connected', route: 'ORYND', onSettings }),
      _eh('div', { className: 'tp-backbar' },
        _eh('button', { className: 'tp-back', onClick: onBack }, _eh(EI.ChevronR, { size: 16, style: { transform: 'scaleX(-1)' } })),
        _eh('span', { className: 'bt' }, 'Notifications'),
      ),
      _eh('div', { className: 'tp-body', style: { alignItems: 'center', justifyContent: 'center' } },
        _eh('div', { className: 'es-check' }, _eh(EI.Check, { size: 26 })),
        _eh('div', { style: { height: 18 } }),
        _eh('h2', { className: 'es-h' }, 'All ', _eh('span', { className: 'em' }, 'caught up')),
        _eh('p', { className: 'es-p', style: { marginTop: 8 } },
          'Alerts about build results, trial status, and CAD connection appear here.'),
      ),
    ),
  );
}

window.EMPTY = { ChatEmpty, LibraryEmpty, RunsEmpty, OverviewEmpty, NotificationsEmpty, OrbitIllo };
