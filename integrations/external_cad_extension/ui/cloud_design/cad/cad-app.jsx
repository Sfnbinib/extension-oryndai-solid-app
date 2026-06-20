// cad-app.jsx — LIVE chat-first Task Pane. Real state: Chat is the default
// landing; Library & Runs are secondary tabs; the settings icon opens Settings
// with a working Back arrow. Fixed 400px column (safe 360–460).
// Exported as window.OryndApp.

const _ah = React.createElement;
const AI = window.CADIcons;

function ChatBody() {
  const C = window.CAD;
  const blocks = window.SCENARIOS.completed.blocks;
  return _ah(React.Fragment, null,
    _ah('div', { className: 'tp-body' }, blocks.map(window.__renderBlock)),
    _ah(C.Composer, { route: 'ORYND' }),
  );
}

function LibraryBody() {
  const D = window.DASH;
  return _ah(React.Fragment, null,
    _ah('div', { className: 'tp-toolbar' },
      _ah('div', { className: 'tp-search' }, _ah(AI.Search, { size: 14 }),
        _ah('input', { placeholder: 'Search parts & macros…', readOnly: true })),
      _ah('button', { className: 'tp-filter' }, _ah(AI.Layers, { size: 12 }), 'All'),
    ),
    _ah('div', { className: 'tp-body', style: { paddingTop: 10 } },
      _ah('div', { className: 'tp-lib' }, D.PARTS.map(D.libCard)),
    ),
    _ah('div', { className: 'tp-composer', style: { paddingTop: 11 } },
      _ah('button', { className: 'tp-btn primary block' }, _ah(AI.Plus, { size: 15 }), 'New part from prompt')),
  );
}

function RunsBody() {
  const D = window.DASH;
  return _ah('div', { className: 'tp-body', style: { paddingTop: 6 } },
    _ah('div', { className: 'tp-runs' },
      D.RUNS.map((g, gi) => _ah(React.Fragment, { key: gi },
        _ah('div', { className: 'tp-day-label' }, g.day),
        g.items.map((r, i) => _ah('div', { className: 'tp-run', key: i },
          _ah('span', { className: 'tp-run-sdot', style: { background: D.STATUS_COLOR[r.status] } }),
          _ah('div', { className: 'tp-run-main' },
            _ah('div', { className: 'tp-run-title' }, r.title),
            _ah('div', { className: 'tp-run-sub' }, r.sub + ' · ' + r.at),
          ),
          _ah('span', { className: 'tp-run-dur' }, r.dur),
        )),
      )),
    ),
  );
}

function OryndApp() {
  const C = window.CAD;
  const [view, setView] = React.useState('chat'); // chat | library | runs | settings

  if (view === 'settings') {
    return _ah('div', { className: 'tp', style: { width: '100%', height: '100%' } },
      window.SCREENS.settings({ onBack: () => setView('chat') }));
  }

  const body = view === 'overview' ? _ah(window.DASH.VerticalDashboard, { onNewPart: () => setView('chat'), onTab: setView })
    : view === 'library' ? _ah(LibraryBody) : view === 'runs' ? _ah(RunsBody) : _ah(ChatBody);

  return _ah('div', { className: 'tp', style: { width: '100%', height: '100%' } },
    _ah('div', { className: 'tp-shell' },
      _ah(C.Header, { connection: 'connected', route: 'ORYND', onSettings: () => setView('settings') }),
      _ah(window.DASH.PaneTabs, { active: view, onTab: setView }),
      body,
    ),
  );
}

window.OryndApp = OryndApp;
