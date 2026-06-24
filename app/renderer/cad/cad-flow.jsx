// cad-flow.jsx — the state-machine / connection diagram.
// Shows the happy-path pipeline + error branches that drive every Task Pane
// screen. Self-contained; exported as window.FlowDiagram.

const _fh = React.createElement;

// node positions on a 1240 × 520 board
const HAPPY = [
  { id: 'idle',    label: 'Idle',          x: 30,   y: 60 },
  { id: 'under',   label: 'Understanding', x: 190,  y: 60 },
  { id: 'search',  label: 'Searching',     x: 360,  y: 60 },
  { id: 'plan',    label: 'Planning',      x: 520,  y: 60 },
  { id: 'valid',   label: 'Validating',    x: 670,  y: 60 },
  { id: 'preview', label: 'Preview',       x: 830,  y: 60 },
  { id: 'approve', label: 'Approval gate', x: 980,  y: 60 },
  { id: 'exec',    label: 'Executing',     x: 980,  y: 200 },
  { id: 'export',  label: 'Exporting',     x: 830,  y: 200 },
  { id: 'done',    label: 'Completed',     x: 670,  y: 200 },
];
const ERRORS = [
  { id: 'failval', label: 'Validation failed',     x: 640,  y: 330, from: 'valid' },
  { id: 'disc',    label: 'CAD disconnected',      x: 980,  y: 330, from: 'approve' },
  { id: 'blocked', label: 'Blocked · subscription', x: 360, y: 330, from: 'approve' },
  { id: 'input',   label: 'Needs input',           x: 190,  y: 200, from: 'under' },
];

const NODE_W = 132, NODE_H = 42;
function center(n) { return { cx: n.x + NODE_W / 2, cy: n.y + NODE_H / 2 }; }
const byId = {};
[...HAPPY, ...ERRORS].forEach(n => { byId[n.id] = n; });

// orthogonal-ish connector between two node ids
function link(fromId, toId) {
  const a = center(byId[fromId]), b = center(byId[toId]);
  return `M ${a.cx} ${a.cy} C ${(a.cx + b.cx) / 2} ${a.cy}, ${(a.cx + b.cx) / 2} ${b.cy}, ${b.cx} ${b.cy}`;
}

const HAPPY_EDGES = [
  ['idle', 'under'], ['under', 'search'], ['search', 'plan'], ['plan', 'valid'],
  ['valid', 'preview'], ['preview', 'approve'], ['approve', 'exec'],
  ['exec', 'export'], ['export', 'done'],
];
const ERR_EDGES = [['valid', 'failval'], ['approve', 'disc'], ['approve', 'blocked'], ['under', 'input']];

function Node({ n, kind }) {
  const cls = 'flow-node ' + kind;
  return _fh('div', { className: cls, style: { left: n.x, top: n.y, width: NODE_W, height: NODE_H } },
    _fh('span', { className: 'flow-dot' }),
    _fh('span', { className: 'flow-label' }, n.label),
  );
}

function FlowDiagram() {
  return _fh('div', { className: 'tp flow-wrap', style: { width: 1240, height: 520, position: 'relative', background: 'var(--surface)' } },
    _fh('style', null, FLOW_CSS),
    _fh('svg', { className: 'flow-svg', viewBox: '0 0 1240 520', preserveAspectRatio: 'none' },
      _fh('defs', null,
        _fh('marker', { id: 'fa', markerWidth: 7, markerHeight: 7, refX: 5.5, refY: 3, orient: 'auto' },
          _fh('path', { d: 'M0 0 L6 3 L0 6 z', fill: 'var(--accent)' })),
        _fh('marker', { id: 'fe', markerWidth: 7, markerHeight: 7, refX: 5.5, refY: 3, orient: 'auto' },
          _fh('path', { d: 'M0 0 L6 3 L0 6 z', fill: 'var(--danger)' })),
      ),
      HAPPY_EDGES.map(([f, t], i) => _fh('path', { key: 'h' + i, d: link(f, t), className: 'flow-edge happy', markerEnd: 'url(#fa)' })),
      ERR_EDGES.map(([f, t], i) => _fh('path', { key: 'e' + i, d: link(f, t), className: 'flow-edge err', markerEnd: 'url(#fe)' })),
    ),
    HAPPY.map(n => _fh(Node, { key: n.id, n, kind: n.id === 'approve' ? 'gate' : 'happy' })),
    ERRORS.map(n => _fh(Node, { key: n.id, n, kind: 'error' })),
    _fh('div', { className: 'flow-legend' },
      _fh('span', { className: 'flow-leg' }, _fh('i', { className: 'sw happy' }), 'Happy path'),
      _fh('span', { className: 'flow-leg' }, _fh('i', { className: 'sw gate' }), 'Human approval gate'),
      _fh('span', { className: 'flow-leg' }, _fh('i', { className: 'sw error' }), 'Error / branch state'),
    ),
  );
}

const FLOW_CSS = `
.flow-wrap { font-family: var(--sans); }
.flow-svg { position: absolute; inset: 0; width: 100%; height: 100%; }
.flow-edge { fill: none; stroke-width: 1.6; }
.flow-edge.happy { stroke: var(--accent); opacity: .55; }
.flow-edge.err { stroke: var(--danger); opacity: .5; stroke-dasharray: 4 4; }
.flow-node {
  position: absolute; display: flex; align-items: center; gap: 8px;
  padding: 0 12px; border-radius: var(--r-md);
  background: var(--raised); border: 1px solid var(--line-2);
  font-size: 12px; font-weight: 500; color: var(--ink); z-index: 2;
}
.flow-node .flow-dot { width: 7px; height: 7px; border-radius: 50%; flex: 0 0 auto; background: var(--ink-3); }
.flow-node.happy .flow-dot { background: var(--ink-2); }
.flow-node.gate { background: var(--accent-soft); border-color: var(--accent-line); }
.flow-node.gate .flow-dot { background: var(--accent); box-shadow: 0 0 0 3px var(--accent-soft); }
.flow-node.gate .flow-label { color: var(--accent); font-weight: 600; }
.flow-node.error { background: var(--danger-soft); border-color: var(--danger-line); border-style: dashed; }
.flow-node.error .flow-dot { background: var(--danger); }
.flow-node.error .flow-label { color: var(--danger); }
.flow-legend { position: absolute; left: 30px; bottom: 24px; display: flex; gap: 20px; z-index: 2; }
.flow-leg { display: flex; align-items: center; gap: 7px; font-size: 11.5px; color: var(--ink-2); }
.flow-leg .sw { width: 18px; height: 8px; border-radius: 3px; }
.flow-leg .sw.happy { background: var(--accent); opacity: .55; }
.flow-leg .sw.gate { background: var(--accent-soft); border: 1px solid var(--accent-line); }
.flow-leg .sw.error { background: var(--danger-soft); border: 1px dashed var(--danger-line); }
`;

window.FlowDiagram = FlowDiagram;
