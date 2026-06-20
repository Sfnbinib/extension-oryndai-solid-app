// cad-showcase.jsx — Foundations panel + small wrappers for the component gallery.
// Exported to window.SHOW.

const _sh = React.createElement;

// dark frame that gives any standalone component the .tp token context + padding
function Frame({ w, pad = 16, children, label }) {
  return _sh('div', { className: 'tp', style: {
    width: w, background: 'var(--surface)', border: '1px solid var(--line)',
    borderRadius: 14, padding: pad, display: 'flex', flexDirection: 'column', gap: 0,
  } },
    label && _sh('div', { className: 'tp-eyebrow', style: { marginBottom: 12 } }, label),
    children,
  );
}

// ---------- FOUNDATIONS ----------
const COLORS = [
  ['--surface', 'Surface', '#1a1916'], ['--raised', 'Raised', '#221f19'],
  ['--inset', 'Inset', '#0e0d0b'], ['--line-2', 'Border', '#3b372e'],
  ['--accent', 'Accent', '#e2531a'], ['--peach', 'Peach', '#ffd7b5'],
  ['--ok', 'Success', '#57b06f'], ['--warn', 'Warning', '#dca33f'],
  ['--danger', 'Danger', '#e5604f'], ['--info', 'Info', '#5ea1d6'],
];

function Foundations() {
  return _sh('div', { className: 'tp', style: {
    width: 560, background: 'var(--surface)', border: '1px solid var(--line)',
    borderRadius: 18, padding: 28,
  } },
    _sh('div', { className: 'tp-eyebrow' }, 'ORYND CAD BRIDGE · DARK TASK PANE THEME'),
    _sh('h2', { style: { font: '600 24px/1.1 var(--sans)', margin: '10px 0 4px', letterSpacing: '-.02em' } },
      'A quiet engineering ', _sh('span', { style: { fontFamily: 'var(--serif)', fontStyle: 'italic', color: 'var(--accent)', fontWeight: 400 } }, 'instrument')),
    _sh('p', { style: { font: '13px/1.6 var(--sans)', color: 'var(--ink-3)', margin: '0 0 22px', maxWidth: 420 } },
      'Warm graphite surfaces, ORYND orange for action, semantic colors for status. Inter for UI, JetBrains Mono for labels & code, Instrument Serif for one accent word.'),

    _sh('div', { className: 'tp-eyebrow', style: { marginBottom: 11 } }, 'PALETTE'),
    _sh('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 10, marginBottom: 24 } },
      COLORS.map(([v, name, hex]) => _sh('div', { key: v },
        _sh('div', { style: { height: 46, borderRadius: 9, background: `var(${v})`, border: '1px solid var(--line-2)' } }),
        _sh('div', { style: { font: '500 11px/1.3 var(--sans)', color: 'var(--ink-2)', marginTop: 6 } }, name),
        _sh('div', { style: { font: '10px/1.3 var(--mono)', color: 'var(--ink-3)', letterSpacing: '.02em' } }, hex),
      ))),

    _sh('div', { className: 'tp-eyebrow', style: { marginBottom: 11 } }, 'TYPE'),
    _sh('div', { style: { display: 'flex', flexDirection: 'column', gap: 12 } },
      _sh('div', { style: { display: 'flex', alignItems: 'baseline', gap: 14, borderBottom: '1px solid var(--line)', paddingBottom: 12 } },
        _sh('span', { style: { font: '600 22px var(--sans)', letterSpacing: '-.02em' } }, 'Inter'),
        _sh('span', { style: { font: '13px var(--mono)', color: 'var(--ink-3)' } }, 'UI · headings 600 · body 400 · 12–13px')),
      _sh('div', { style: { display: 'flex', alignItems: 'baseline', gap: 14, borderBottom: '1px solid var(--line)', paddingBottom: 12 } },
        _sh('span', { style: { font: '10px var(--mono)', letterSpacing: '.18em', color: 'var(--ink-2)' } }, 'JETBRAINS MONO'),
        _sh('span', { style: { font: '13px var(--mono)', color: 'var(--ink-3)' } }, 'labels · stats · code · .18em')),
      _sh('div', { style: { display: 'flex', alignItems: 'baseline', gap: 14 } },
        _sh('span', { style: { font: 'italic 400 26px var(--serif)', color: 'var(--accent)' } }, 'instrument'),
        _sh('span', { style: { font: '13px var(--mono)', color: 'var(--ink-3)' } }, 'one accent word only')),
    ),
  );
}

window.SHOW = { Frame, Foundations };
