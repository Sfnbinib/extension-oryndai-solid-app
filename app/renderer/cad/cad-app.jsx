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

// Placeholder user — replace with real Supabase session when auth is wired.
const PLACEHOLDER_USER = { initials: 'SF', email: 'savelij@orynd.ai', plan: 'Pro · trial' };

function OryndApp() {
  const C = window.CAD;
  const E = window.EMPTY;
  // Auth gate — false shows SignInScreen. Real Supabase deep-link sets this to true.
  const [loggedIn, setLoggedIn] = React.useState(false);
  const [view, setView] = React.useState('chat'); // chat | library | runs | overview | settings | notifications
  // Real update banner: hidden until electron-updater finds a newer GitHub release.
  const [update, setUpdate] = React.useState(null);
  // Chat history — empty by default (no mock data). Populated as the user chats.
  const [msgs, setMsgs] = React.useState([]);
  const [sending, setSending] = React.useState(false);

  React.useEffect(() => {
    if (window.orynd && window.orynd.onUpdate) window.orynd.onUpdate((info) => setUpdate(info));
  }, []);

  // Auth gate — show sign-in until logged in.
  if (!loggedIn) {
    return _ah(window.AUTH.SignInScreen, { onSignIn: () => setLoggedIn(true) });
  }

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

  const goSettings      = () => setView('settings');
  const goNotifications = () => setView('notifications');
  const goChat          = () => setView('chat');
  const signOut         = () => { setLoggedIn(false); setMsgs([]); setView('chat'); };

  // Full-pane routes (no shell tabs).
  if (view === 'settings') {
    return _ah('div', { className: 'tp', style: { width: '100%', height: '100%' } },
      _ah(window.SETTINGS2.SettingsV2, { onBack: goChat, onSignOut: signOut }));
  }
  if (view === 'notifications') {
    const hasNotifs = window.NOTIF.NOTIFS && window.NOTIF.NOTIFS.length > 0;
    const notifCtx = { ...hCtx, onBack: goChat };
    return hasNotifs
      ? _ah(window.NOTIF.NotificationsPane, notifCtx)
      : _ah(window.NOTIF.NotificationsEmpty, notifCtx);
  }

  const hasUnread = window.NOTIF && window.NOTIF.NOTIFS && window.NOTIF.NOTIFS.some(n => n.unread);
  // Shared header context passed to all shells (empty states + active chat).
  const hCtx = { user: PLACEHOLDER_USER, onBell: goNotifications, onSettings: goSettings, onSignOut: signOut, hasUnread };

  // Full header props for active chat shell.
  const headerProps = { connection: 'connected', ...hCtx };

  // Zero-state screens (no data yet) — each is a full pane with its own header/tabs.
  if (view === 'chat' && msgs.length === 0) {
    return _ah(E.ChatEmpty, { onTab: setView, onSend: send, onPick: send, ...hCtx });
  }
  if (view === 'library') {
    return _ah(E.LibraryEmpty, { onTab: setView, onNew: goChat, ...hCtx });
  }
  if (view === 'runs') {
    return _ah(E.RunsEmpty, { onTab: setView, onStart: goChat, ...hCtx });
  }
  if (view === 'overview') {
    return _ah(E.OverviewEmpty, { onTab: setView, onNew: goChat, ...hCtx });
  }

  // Chat with messages — interactive shell with account chip.
  return _ah('div', { className: 'tp', style: { width: '100%', height: '100%' } },
    _ah('div', { className: 'tp-shell' },
      _ah(C.Header, headerProps),
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
