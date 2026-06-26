// cad-app.jsx — LIVE chat-first Task Pane. Real state: Chat is the default
// landing; Library & Runs are secondary tabs; the settings icon opens Settings
// with a working Back arrow. Fixed 400px column (safe 360–460).
// Exported as window.OryndApp.

const _ah = React.createElement;
const AI = window.CADIcons;

// Presentational chat body — state lives in OryndApp.
function ChatBody({ blocks, sending, onSend }) {
  const C = window.CAD;
  const bodyRef = React.useRef(null);
  React.useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [blocks, sending]);

  return _ah(React.Fragment, null,
    _ah('div', { className: 'tp-body', ref: bodyRef },
      blocks.map(window.__renderBlock),
      sending && _ah(window.THINK.ThinkingBubble),
    ),
    _ah(C.Composer, { route: 'ORYND', sending, onSend }),
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
  const E = window.EMPTY;
  const [view, setView] = React.useState('chat'); // chat | library | runs | overview | settings
  // Real update banner: hidden until electron-updater finds a newer GitHub release.
  const [update, setUpdate] = React.useState(null); // { version } | null
  // Chat history — empty by default (no mock data). Populated as the user chats.
  const [msgs, setMsgs] = React.useState([]);
  const [sending, setSending] = React.useState(false);

  React.useEffect(() => {
    if (window.orynd && window.orynd.onUpdate) window.orynd.onUpdate((info) => setUpdate(info));
  }, []);

  const send = async (text) => {
    setView('chat');
    setMsgs((m) => [...m, { t: 'user', text }]);
    setSending(true);
    try {
      const r = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: text }),
      });
      const d = await r.json();
      const msg = (d && d.message) || (d && d.error) || 'No response from backend.';
      setMsgs((m) => [...m, { t: 'assist', text: msg }]);
    } catch (e) {
      setMsgs((m) => [...m, { t: 'assist', em: 'offline.', text: 'Bridge error: ' + e.message }]);
    } finally {
      setSending(false);
    }
  };

  const goSettings = () => setView('settings');
  const goNotifications = () => setView('notifications');
  const goChat = () => setView('chat');

  if (view === 'settings') {
    return _ah('div', { className: 'tp', style: { width: '100%', height: '100%' } },
      _ah(window.SETTINGS2.SettingsV2, { onBack: goChat }));
  }

  if (view === 'notifications') {
    return _ah(window.NOTIF.NotificationsPane, { onBack: goChat });
  }

  // Zero-state screens (no data yet) — each is a full pane with its own shell.
  if (view === 'chat' && msgs.length === 0) {
    return _ah(E.ChatEmpty, { onTab: setView, onSettings: goSettings, onSend: send, onPick: send });
  }
  if (view === 'library') {
    return _ah(E.LibraryEmpty, { onTab: setView, onSettings: goSettings, onNew: goChat });
  }
  if (view === 'runs') {
    return _ah(E.RunsEmpty, { onTab: setView, onSettings: goSettings, onStart: goChat });
  }
  if (view === 'overview') {
    return _ah(E.OverviewEmpty, { onTab: setView, onSettings: goSettings, onNew: goChat });
  }

  // Chat with messages — interactive shell.
  return _ah('div', { className: 'tp', style: { width: '100%', height: '100%' } },
    _ah('div', { className: 'tp-shell' },
      _ah(C.Header, { connection: 'connected', route: 'ORYND', onSettings: goSettings, onBell: goNotifications }),
      update && _ah(C.UpdateBanner, {
        version: update.version,
        onUpdate: () => { if (window.orynd && window.orynd.installUpdate) window.orynd.installUpdate(); },
        onDismiss: () => setUpdate(null),
      }),
      _ah(window.DASH.PaneTabs, { active: view, onTab: setView }),
      _ah(ChatBody, { blocks: msgs, sending, onSend: send }),
    ),
  );
}

window.OryndApp = OryndApp;
