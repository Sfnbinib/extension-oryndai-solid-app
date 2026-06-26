// cad/cad-notifications.jsx — in-chat ThinkingMessage + full notifications pane.
// Exported to window.NOTIF.

const _nh = React.createElement;
const NI = window.CADIcons;
const NC = window.CAD;

// ============================================================
// IN-CHAT THINKING BUBBLE (caramelising-onions style)
// Labels come from real THINK_STAGES / THINK_VARIANTS in cad-thinking.jsx
// ============================================================
function ThinkingMessage({ stageIndex = 0 }) {
  const stages = window.THINK ? window.THINK.THINK_STAGES : [];
  const variants = window.THINK ? window.THINK.THINK_VARIANTS : {};
  const [vi, setVi] = React.useState(0);
  const [ai, setAi] = React.useState(stageIndex);
  React.useEffect(() => {
    const v = setInterval(() => setVi(x => x + 1), 1500);
    return () => clearInterval(v);
  }, []);
  const stage = stages[ai] || { id: 'understanding', label: 'Understanding' };
  const vList = variants[stage.id] || [stage.label];
  const label = vList[vi % vList.length];
  return _nh('div', { className: 'tk-msg' },
    _nh('div', { className: 'tm-icon' }, _nh(NI.Spark, { size: 13 })),
    _nh('div', { className: 'tm-body' },
      _nh('div', { className: 'tm-label' },
        _nh('span', { className: 'spin-ring' }),
        _nh('span', { className: 'tm-text', key: label }, label),
        _nh('span', { className: 'tm-ellipsis' }, _nh('i'), _nh('i'), _nh('i')),
      ),
      stages.length > 0 && _nh('div', { className: 'tm-stages' },
        stages.map((s, i) => _nh('span', { className: 'tm-seg ' + (i < ai ? 'done' : i === ai ? 'active' : ''), key: s.id })),
      ),
    ),
  );
}

// ============================================================
// NOTIFICATIONS DATA
// ============================================================
const NOTIFS = [
  {
    id: 'build-done', kind: 'ok', icon: NI.CheckCircle, title: 'Build complete',
    body: 'brake_disc.step exported — 2.4 MB. Part is open in SolidWorks.',
    time: 'now', unread: true,
    actions: [{ label: 'Open in CAD', primary: true }, { label: 'Show file' }],
  },
  {
    id: 'approval', kind: 'accent', icon: NI.Shield, title: 'Approval required',
    body: 'Spur gear plan is validated and ready. Review the macro before it runs.',
    time: '3m', unread: true,
    actions: [{ label: 'Review now', primary: true }],
  },
  {
    id: 'cad-disconnect', kind: 'danger', icon: NI.Plug, title: 'SolidWorks disconnected',
    body: 'The bridge lost connection. Your plan and macro are preserved.',
    time: '12m', unread: true,
    actions: [{ label: 'Reconnect', primary: true }],
  },
  {
    id: 'val-warn', kind: 'warn', icon: NI.Alert, title: 'Validation warning',
    body: 'Vane geometry is not in the runtime command set — part will export as solid disc.',
    time: '18m', unread: false,
    actions: [{ label: 'View details' }],
  },
  {
    id: 'export-ready', kind: 'ok', icon: NI.Download, title: 'Export ready',
    body: 'brake_disc_v2.step saved to your Downloads folder.',
    time: '1h', unread: false,
    actions: [{ label: 'Open folder' }],
  },
  {
    id: 'build-fail', kind: 'danger', icon: NI.XCircle, title: 'Build failed',
    body: 'Extrude depth is 0 mm — thickness was not resolved. Fix and regenerate.',
    time: '2h', unread: false,
    actions: [{ label: 'View errors', primary: true }, { label: 'Regenerate' }],
  },
  {
    id: 'cad-reconnect', kind: 'ok', icon: NI.Plug, title: 'SolidWorks reconnected',
    body: 'Bridge is live again. Queued plan is ready to run.',
    time: '2h', unread: false,
    actions: [{ label: 'Continue' }],
  },
  {
    id: 'trial-end', kind: 'accent', icon: NI.Clock, title: 'Trial ends in 4 hours',
    body: 'Keep unlimited builds, recipes, and un-watermarked exports.',
    time: 'Yesterday', unread: false,
    actions: [{ label: 'Upgrade to Pro', primary: true }],
  },
  {
    id: 'quota', kind: 'warn', icon: NI.Alert, title: 'Daily limit reached',
    body: '3 demo builds used. Upgrade for unlimited runs.',
    time: 'Yesterday', unread: false,
    actions: [{ label: 'Start one-day trial', primary: true }],
  },
  {
    id: 'session', kind: 'neutral', icon: NI.Lock, title: 'Session expired',
    body: 'Sign in again to keep your library in sync.',
    time: '2d ago', unread: false,
    actions: [{ label: 'Sign in', primary: true }],
  },
];

function NotifRow({ n }) {
  return _nh('div', { className: 'tp-notif' + (n.unread ? ' unread' : '') },
    _nh('span', { className: 'nico ' + n.kind }, _nh(n.icon, { size: 17 })),
    _nh('div', { className: 'nmain' },
      _nh('div', { className: 'ntitle' }, n.title),
      _nh('div', { className: 'nbody' }, n.body),
      n.actions && _nh('div', { className: 'nact' },
        n.actions.map((a, i) => _nh('button', { className: 'tp-btn sm' + (a.primary ? ' primary' : ''), key: i }, a.label))),
    ),
    _nh('span', { className: 'ntime' }, n.time),
  );
}

// Full notifications pane — grouped by day, with unread badge on header
function NotificationsPane({ connection = 'connected', onBack }) {
  const unreadCount = NOTIFS.filter(n => n.unread).length;
  const today = NOTIFS.filter(n => ['now','3m','12m','18m','1h','2h'].includes(n.time));
  const yesterday = NOTIFS.filter(n => n.time === 'Yesterday');
  const older = NOTIFS.filter(n => n.time === '2d ago');
  return _nh('div', { className: 'tp', style: { width: '100%', height: '100%' } },
    _nh('div', { className: 'tp-shell' },
      _nh(NC.Header, { connection }),
      _nh('div', { className: 'tp-backbar' },
        _nh('button', { className: 'tp-back', onClick: onBack || undefined }, _nh(NI.ChevronR, { size: 16, style: { transform: 'scaleX(-1)' } })),
        _nh('span', { className: 'bt' }, 'Notifications'),
        unreadCount > 0 && _nh('span', { className: 'tp-pill run', style: { marginLeft: 'auto' } }, unreadCount + ' new'),
      ),
      _nh('div', { className: 'tp-body', style: { padding: 0, gap: 0 } },
        _nh('div', { className: 'tp-notif-list' },
          _nh('div', { className: 'tp-notif-dayhead' }, 'Today'),
          today.map(n => _nh(NotifRow, { key: n.id, n })),
          yesterday.length > 0 && _nh('div', { className: 'tp-notif-dayhead' }, 'Yesterday'),
          yesterday.map(n => _nh(NotifRow, { key: n.id, n })),
          older.length > 0 && _nh('div', { className: 'tp-notif-dayhead' }, 'Earlier'),
          older.map(n => _nh(NotifRow, { key: n.id, n })),
        ),
      ),
    ),
  );
}

// Empty notifications pane (all caught up)
function NotificationsEmpty({ connection = 'connected' }) {
  return _nh('div', { className: 'tp', style: { width: '100%', height: '100%' } },
    _nh('div', { className: 'tp-shell' },
      _nh(NC.Header, { connection }),
      _nh('div', { className: 'tp-backbar' },
        _nh('button', { className: 'tp-back' }, _nh(NI.ChevronR, { size: 16, style: { transform: 'scaleX(-1)' } })),
        _nh('span', { className: 'bt' }, 'Notifications'),
      ),
      _nh('div', { className: 'tp-body' },
        _nh('div', { className: 'tp-notif-empty' },
          _nh('div', { className: 'nc' }, _nh(NI.Check, { size: 24 })),
          _nh('h3', null, 'All ', _nh('span', { className: 'em' }, 'caught up')),
          _nh('p', null, 'Build results, approval gates, connection alerts, and trial status appear here.'),
        ),
      ),
    ),
  );
}

window.NOTIF = { ThinkingMessage, NotificationsPane, NotificationsEmpty, NOTIFS, NotifRow };
