// cad-dashboard.jsx — Library, Runs/history, and the wide companion dashboard.
// Answers "is there more than chat?" — a parts/macro library + run history,
// in-pane and as a full desktop surface. Exported to window.DASH.

const _dh = React.createElement;
const DI = window.CADIcons;

// ---------- shared data ----------
const PARTS = [
  { name: 'Ventilated brake disc', type: 'Rotor',   dims: 'Ø320 · 26 mm',  status: 'done',   time: '2h ago',    uses: 112, icon: DI.Circle },
  { name: 'Spur gear · 24T m2',    type: 'Gear',    dims: 'Ø52 · 12 mm',   status: 'review', time: '5h ago',    uses: 6,   icon: DI.Settings },
  { name: 'M3 mounting bracket',   type: 'Bracket', dims: '80×60×24 mm',   status: 'done',   time: 'Yesterday', icon: DI.Cube },
  { name: 'Flange · 4-bolt',       type: 'Flange',  dims: 'Ø80 · PCD 60',  status: 'done',   time: 'Yesterday', icon: DI.Circle },
  { name: 'F1 front wing',         type: 'Surface', dims: 'approx · GenCAD',status: 'draft',  time: '2d ago',    icon: DI.Layers },
  { name: 'Hex standoff M4',       type: 'Fastener',dims: 'Ø8 · 20 mm',    status: 'done',   time: '3d ago',    icon: DI.Cube },
];

const RUNS = [
  { day: 'Today', items: [
    { title: 'Ventilated brake disc', sub: 'Create · STEP exported', status: 'done',   dur: '41s',  at: '14:32' },
    { title: 'Spur gear · 24T m2',    sub: 'Create · needs review',  status: 'review', dur: '1m18s',at: '11:05' },
    { title: 'Flange · 4-bolt',       sub: 'Modify · STEP exported', status: 'done',   dur: '28s',  at: '09:47' },
  ] },
  { day: 'Yesterday', items: [
    { title: 'M3 mounting bracket',   sub: 'Create · STEP exported', status: 'done',   dur: '33s',  at: '17:20' },
    { title: 'Brake disc (v1)',       sub: 'Validation failed',      status: 'fail',   dur: '—',    at: '16:58' },
  ] },
];

const STATUS_COLOR = { done: 'var(--ok)', review: 'var(--warn)', fail: 'var(--danger)', draft: 'var(--ink-3)', run: 'var(--accent)' };
const STATUS_LABEL = { done: 'Done', review: 'Review', fail: 'Failed', draft: 'Draft', run: 'Running' };

// ---------- pane tab bar ----------
function PaneTabs({ active = 'chat', onTab }) {
  // No count badge on Library — there's no real library backend yet (PARTS is mock
  // data for the dashboard gallery only; the live Library view is an empty state).
  const tabs = [['chat', 'Chat', DI.Spark], ['overview', 'Overview', DI.Layers], ['library', 'Library', DI.Cube], ['runs', 'Runs', DI.Clock]];
  return _dh('div', { className: 'tp-tabs' },
    tabs.map(([id, label, ic, count]) =>
      _dh('button', { key: id, className: 'tp-tab' + (id === active ? ' active' : ''), onClick: onTab ? () => onTab(id) : undefined },
        _dh('span', { className: 'ic' }, _dh(ic, { size: 14 })), label,
        count != null && _dh('span', { className: 'count' }, count))));
}

// ---------- shared automation/library card (Run / Remix, ref-style) ----------
function libCard(p, i) {
  return _dh('div', { className: 'tp-libcard', key: i },
    _dh('div', { className: 'tp-libcard-top' },
      _dh('span', { className: 'thumb' }, _dh(p.icon, { size: 17 })),
      _dh('div', { className: 'tp-libcard-main' },
        _dh('div', { className: 'tp-libcard-name' }, p.name),
        _dh('div', { className: 'tp-libcard-meta' }, p.time + ' · ' + (p.uses != null ? p.uses + ' uses' : p.dims)),
      ),
      _dh('button', { className: 'tp-libcard-menu', title: 'More' }, _dh(DI.Dots, { size: 15 })),
    ),
    _dh('div', { className: 'tp-libcard-acts' },
      _dh('button', { className: 'tp-runbtn' }, _dh(DI.Play, { size: 13 }), 'Run'),
      _dh('button', { className: 'tp-remixbtn' }, _dh(DI.Refresh, { size: 13 }), 'Remix'),
    ),
  );
}

// ---------- LIBRARY (in-pane) ----------
function LibraryPane({ connection = 'connected', route = 'ORYND' }) {
  return _dh('div', { className: 'tp', style: { width: '100%', height: '100%' } },
    _dh('div', { className: 'tp-shell' },
      _dh(window.CAD.Header, { connection, route }),
      _dh(PaneTabs, { active: 'library' }),
      _dh('div', { className: 'tp-toolbar' },
        _dh('div', { className: 'tp-search' }, _dh(DI.Search, { size: 14 }),
          _dh('input', { placeholder: 'Search parts & macros…', readOnly: true })),
        _dh('button', { className: 'tp-filter' }, _dh(DI.Layers, { size: 12 }), 'All'),
      ),
      _dh('div', { className: 'tp-body', style: { paddingTop: 10 } },
        _dh('div', { className: 'tp-lib' }, PARTS.map(libCard)),
      ),
      _dh('div', { className: 'tp-composer', style: { paddingTop: 11 } },
        _dh('button', { className: 'tp-btn primary block' }, _dh(DI.Plus, { size: 15 }), 'New part from prompt')),
    ),
  );
}

// ---------- RUNS / HISTORY (in-pane) ----------
function RunsPane({ connection = 'connected', route = 'ORYND' }) {
  return _dh('div', { className: 'tp', style: { width: '100%', height: '100%' } },
    _dh('div', { className: 'tp-shell' },
      _dh(window.CAD.Header, { connection, route }),
      _dh(PaneTabs, { active: 'runs' }),
      _dh('div', { className: 'tp-body', style: { paddingTop: 6 } },
        _dh('div', { className: 'tp-runs' },
          RUNS.map((g, gi) => _dh(React.Fragment, { key: gi },
            _dh('div', { className: 'tp-day-label' }, g.day),
            g.items.map((r, i) => _dh('div', { className: 'tp-run', key: i },
              _dh('span', { className: 'tp-run-sdot', style: { background: STATUS_COLOR[r.status] } }),
              _dh('div', { className: 'tp-run-main' },
                _dh('div', { className: 'tp-run-title' }, r.title),
                _dh('div', { className: 'tp-run-sub' }, r.sub + ' · ' + r.at),
              ),
              _dh('span', { className: 'tp-run-dur' }, r.dur),
            )),
          )),
        ),
      ),
    ),
  );
}

// ---------- WIDE COMPANION DASHBOARD ----------
function NavItem({ icon, label, active, badge }) {
  return _dh('button', { className: 'dash-navitem' + (active ? ' active' : '') },
    _dh('span', { className: 'ic' }, _dh(icon, { size: 17 })), label,
    badge != null && _dh('span', { className: 'badge' }, badge));
}

function CompanionDashboard() {
  return _dh('div', { className: 'tp', style: { width: '100%', height: '100%' } },
    _dh('div', { className: 'dash' },
      // ---- sidebar ----
      _dh('aside', { className: 'dash-side' },
        _dh('div', { className: 'dash-brand' },
          _dh('div', { className: 'tp-mark' }, _dh('img', { src: 'cad/brand/orynd-orbit-white.png', alt: 'ORYND', style: { width: 18, height: 'auto', display: 'block' } })),
          _dh('span', { className: 'nm' }, _dh('b', null, 'ORYND'), ' Bridge'),
        ),
        _dh('div', { className: 'dash-navlabel' }, 'Workspace'),
        _dh('div', { className: 'dash-nav' },
          _dh(NavItem, { icon: DI.Spark, label: 'New part' }),
          _dh(NavItem, { icon: DI.Cube, label: 'Library', active: true, badge: PARTS.length }),
          _dh(NavItem, { icon: DI.Clock, label: 'Runs', badge: 5 }),
          _dh(NavItem, { icon: DI.Layers, label: 'Skills' }),
        ),
        _dh('div', { className: 'dash-navlabel' }, 'Bridge'),
        _dh('div', { className: 'dash-nav' },
          _dh(NavItem, { icon: DI.Plug, label: 'SolidWorks' }),
          _dh(NavItem, { icon: DI.Settings, label: 'Settings' }),
        ),
        _dh('div', { className: 'dash-side-foot' },
          _dh('div', { className: 'dash-account' },
            _dh('span', { className: 'av' }, 'S'),
            _dh('div', { className: 'who' }, _dh('div', { className: 'a' }, 'Savelij F.'), _dh('div', { className: 'b' }, 'PRO · trial')),
          ),
        ),
      ),
      // ---- main ----
      _dh('div', { className: 'dash-main' },
        _dh('div', { className: 'dash-head' },
          _dh('div', null,
            _dh('h1', null, 'Your ', _dh('span', { className: 'em' }, 'library')),
            _dh('p', null, 'Parts, reusable macros, and every run — all in one place.'),
          ),
          _dh('div', { className: 'dash-head-spacer' }),
          _dh('span', { className: 'tp-chip is-ok is-live', style: { height: 30 } }, _dh('span', { className: 'dot' }), 'CAD Connected'),
          _dh('button', { className: 'dash-btn-new' }, _dh(DI.Plus, { size: 15 }), 'New part'),
        ),

        // stats
        _dh('div', { className: 'dash-stats' },
          _dh('div', { className: 'dash-stat' }, _dh('div', { className: 'v' }, '6'), _dh('div', { className: 'k' }, 'Saved parts')),
          _dh('div', { className: 'dash-stat' }, _dh('div', { className: 'v' }, '23'), _dh('div', { className: 'k' }, 'Total runs')),
          _dh('div', { className: 'dash-stat' }, _dh('div', { className: 'v' }, '91', _dh('small', null, '%')), _dh('div', { className: 'k' }, 'Validated first try')),
          _dh('div', { className: 'dash-stat' }, _dh('div', { className: 'v' }, '38', _dh('small', null, 's')), _dh('div', { className: 'k' }, 'Median to STEP')),
        ),

        // recent runs table
        _dh('div', { className: 'dash-section-h' }, _dh('h2', null, 'Recent runs'), _dh('span', { className: 'ln' }), _dh('span', { className: 'link' }, 'View all →')),
        _dh('div', { className: 'dash-table' },
          _dh('div', { className: 'dash-tr head' },
            _dh('span', null, 'Part'), _dh('span', null, 'Mode'), _dh('span', null, 'Result'), _dh('span', null, 'Time'), _dh('span', null, 'Duration')),
          RUNS.flatMap(g => g.items).map((r, i) => _dh('div', { className: 'dash-tr row', key: i },
            _dh('div', { className: 'cell-name' }, _dh('span', { className: 'ic' }, _dh(DI.Cube, { size: 16 })), _dh('span', { className: 't' }, r.title)),
            _dh('span', { className: 'muted' }, r.sub.split(' · ')[0]),
            _dh('span', null, _dh('span', { className: 'tp-pill ' + r.status }, _dh('span', { className: 'd' }), STATUS_LABEL[r.status])),
            _dh('span', { className: 'muted' }, r.at),
            _dh('span', { className: 'mono' }, r.dur),
          )),
        ),

        // parts grid
        _dh('div', { className: 'dash-section-h' }, _dh('h2', null, 'Parts & macros'), _dh('span', { className: 'ln' }), _dh('span', { className: 'link' }, 'Browse skills →')),
        _dh('div', { className: 'dash-grid' },
          PARTS.map((p, i) => _dh('div', { className: 'dash-part', key: i },
            _dh('div', { className: 'canvas' }, _dh(p.icon, { size: 40, stroke: 1.3 })),
            _dh('div', { className: 'pbody' },
              _dh('div', { className: 'pname' }, p.name),
              _dh('div', { className: 'pmeta' }, p.type + ' · ' + p.dims),
              _dh('div', { className: 'pfoot' },
                _dh('span', { className: 'tp-pill ' + p.status }, _dh('span', { className: 'd' }), STATUS_LABEL[p.status]),
                _dh('span', { className: 'ts' }, p.time),
              ),
            ),
          )),
        ),
      ),
    ),
  );
}

// ---------- VERTICAL DASHBOARD (Overview, in-pane) ----------
function VerticalDashboard({ onNewPart, onTab }) {
  const allRuns = RUNS.flatMap(g => g.items).slice(0, 4);
  return _dh('div', { className: 'tp-vd' },
    _dh('div', { className: 'tp-vd-hero' },
      _dh('h2', null, 'Welcome ', _dh('span', { className: 'em' }, 'back')),
      _dh('p', null, 'Brake disc project · 6 parts · last run 2h ago'),
    ),
    _dh('div', { className: 'tp-vd-cta', onClick: onNewPart },
      _dh('span', { className: 'ci' }, _dh(DI.Spark, { size: 18 })),
      _dh('div', { className: 'cm' },
        _dh('div', { className: 'ct' }, 'New part from a prompt'),
        _dh('div', { className: 'cs' }, 'Describe it, sketch it, or drop a photo'),
      ),
      _dh('span', { className: 'carrow' }, _dh(DI.Arrow, { size: 16 })),
    ),
    _dh('div', { className: 'tp-vd-stats' },
      _dh('div', { className: 'tp-vd-stat' }, _dh('div', { className: 'v' }, '6'), _dh('div', { className: 'k' }, 'Saved parts')),
      _dh('div', { className: 'tp-vd-stat' }, _dh('div', { className: 'v' }, '23'), _dh('div', { className: 'k' }, 'Total runs')),
      _dh('div', { className: 'tp-vd-stat' }, _dh('div', { className: 'v' }, '91', _dh('small', null, '%')), _dh('div', { className: 'k' }, 'Valid 1st try')),
      _dh('div', { className: 'tp-vd-stat' }, _dh('div', { className: 'v' }, '38', _dh('small', null, 's')), _dh('div', { className: 'k' }, 'Median STEP')),
    ),
    _dh('div', { className: 'tp-vd-sh' },
      _dh('h3', null, 'Recent runs'), _dh('span', { className: 'ln' }),
      _dh('span', { className: 'link', onClick: () => onTab && onTab('runs') }, 'All runs →')),
    _dh('div', { className: 'tp-vd-group' },
      allRuns.map((r, i) => _dh('div', { className: 'tp-vd-run', key: i },
        _dh('span', { className: 'rdot', style: { background: STATUS_COLOR[r.status] } }),
        _dh('div', { className: 'rmain' },
          _dh('div', { className: 'rt' }, r.title),
          _dh('div', { className: 'rs' }, r.sub + ' · ' + r.at),
        ),
        _dh('span', { className: 'rdur' }, r.dur),
      ))),
    _dh('div', { className: 'tp-vd-sh' },
      _dh('h3', null, 'Automations'), _dh('span', { className: 'ln' }),
      _dh('span', { className: 'link', onClick: () => onTab && onTab('library') }, 'Library →')),
    _dh('div', { className: 'tp-lib' }, PARTS.slice(0, 4).map(libCard)),
  );
}

window.DASH = { LibraryPane, RunsPane, CompanionDashboard, VerticalDashboard, PaneTabs, PARTS, RUNS, STATUS_COLOR, STATUS_LABEL, libCard };
