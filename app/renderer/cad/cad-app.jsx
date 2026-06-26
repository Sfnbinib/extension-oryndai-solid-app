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

// Full-pane shown when no LLM provider is configured.
function LlmGate({ onSettings }) {
  return _ah('div', { className: 'tp', style: { width: '100%', height: '100%' } },
    _ah('div', { className: 'tp-shell' },
      _ah('div', { className: 'tp-body', style: { alignItems: 'center', justifyContent: 'center', paddingTop: 48 } },
        _ah('div', { style: { marginBottom: 20, opacity: .7 } },
          _ah('img', { src: 'cad/brand/orynd-orbit-white.png', alt: 'ORYND', style: { width: 36, height: 'auto' } })),
        _ah('h2', { className: 'es-h' }, 'Connect your ', _ah('span', { className: 'em' }, 'AI provider')),
        _ah('p', { className: 'es-p', style: { marginTop: 10, marginBottom: 24, maxWidth: 260 } },
          'To use ORYND, paste your Anthropic API key in Settings, or start Ollama locally.'),
        _ah('button', { className: 'tp-btn primary', onClick: onSettings },
          _ah(AI.Settings, { size: 15 }), 'Open Settings'),
        _ah('div', { className: 'tp-auth-foot', style: { marginTop: 18 } },
          _ah(AI.Lock, { size: 13 }), 'Your key stays on your device.'),
      ),
    ),
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
  // null = checking, true = ready, false = no provider configured
  const [llmReady, setLlmReady] = React.useState(null);
  // Real update banner: hidden until electron-updater finds a newer GitHub release.
  const [update, setUpdate] = React.useState(null);
  // Chat history — empty by default. Populated as the user chats.
  const [msgs, setMsgs] = React.useState([]);
  const [sending, setSending] = React.useState(false);

  React.useEffect(() => {
    if (window.orynd && window.orynd.onUpdate) window.orynd.onUpdate((info) => setUpdate(info));
  }, []);

  // Check LLM provider status after sign-in.
  React.useEffect(() => {
    if (!loggedIn) return;
    fetch('/api/llm-status')
      .then((r) => r.json())
      .then((d) => setLlmReady(!!(d && d.active)))
      .catch(() => setLlmReady(false));
  }, [loggedIn]);

  // Auth gate — show sign-in until logged in.
  if (!loggedIn) {
    return _ah(window.AUTH.SignInScreen, { onSignIn: () => setLoggedIn(true) });
  }

  // Save API key to backend, update llmReady on success.
  const saveKey = async (key) => {
    try {
      const r = await fetch('/api/key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key }),
      });
      const d = await r.json();
      if (d && d.ok) { setLlmReady(true); }
      return d || { ok: false };
    } catch (e) {
      return { ok: false, error: e.message };
    }
  };

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
  const signOut         = () => { setLoggedIn(false); setMsgs([]); setView('chat'); setLlmReady(null); };

  // hCtx declared before any route that uses it.
  const hasUnread = window.NOTIF && window.NOTIF.NOTIFS && window.NOTIF.NOTIFS.some((n) => n.unread);
  const hCtx = { user: PLACEHOLDER_USER, onBell: goNotifications, onSettings: goSettings, onSignOut: signOut, hasUnread };
  const headerProps = { connection: 'connected', ...hCtx };

  // Full-pane routes (no shell tabs).
  if (view === 'settings') {
    const llmState = llmReady === true ? 'connected' : 'empty';
    return _ah('div', { className: 'tp', style: { width: '100%', height: '100%' } },
      _ah(window.SETTINGS2.SettingsV2, { onBack: goChat, onSignOut: signOut, onSaveKey: saveKey, llmState }));
  }
  if (view === 'notifications') {
    const hasNotifs = window.NOTIF.NOTIFS && window.NOTIF.NOTIFS.length > 0;
    const notifCtx = { ...hCtx, onBack: goChat };
    return hasNotifs
      ? _ah(window.NOTIF.NotificationsPane, notifCtx)
      : _ah(window.NOTIF.NotificationsEmpty, notifCtx);
  }

  // LLM provider check — spinner while checking, gate if none configured.
  if (llmReady === null) {
    return _ah('div', { className: 'tp', style: { width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' } },
      _ah('span', { className: 'spin-ring', style: { width: 24, height: 24 } }));
  }
  if (llmReady === false) {
    return _ah(LlmGate, { onSettings: goSettings });
  }

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
