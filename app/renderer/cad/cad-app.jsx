// cad-app.jsx — LIVE chat-first Task Pane. Real state: Chat is the default
// landing; Library & Runs are secondary tabs; the settings icon opens Settings
// with a working Back arrow. Fixed 400px column (safe 360–460).
// Exported as window.OryndApp.

const _ah = React.createElement;
const AI = window.CADIcons;

// Which Settings layout renders — 'v2' (current, single-column) or 'full'
// (sidebar + panels). Both read the same real data; flip this to preview.
const SETTINGS_VARIANT = 'full';

// Presentational chat body — state lives in OryndApp.
function ChatBody({ blocks, sending, onSend, connMode, onConnMode, keyOk, mcpOk, routes, mcpStatus,
  onboardingDone, onboardingProgress, onOnboardingSkip, onOnboardingDone }) {
  const C = window.CAD;
  const O = window.ONBOARD;
  const bodyRef = React.useRef(null);
  React.useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [blocks, sending]);

  return _ah(React.Fragment, null,
    O && !onboardingDone && _ah(O.F1OnboardingPanel, {
      progress: onboardingProgress, onSkip: onOnboardingSkip, onDone: onOnboardingDone,
    }),
    _ah('div', { className: 'tp-body', ref: bodyRef },
      // Live per-turn progress is rendered by the 'run' block (real events +
      // timer) — no fake interval-driven bubble.
      blocks.map(window.__renderBlock),
    ),
    connMode === 'mcp' && _ah('div', { style: { padding: '0 14px 8px' } }, _ah(C.McpActivityPill, { status: mcpStatus })),
    _ah(C.Composer, { route: 'ORYND', sending, onSend, connMode, onConnMode, keyOk, mcpOk, routes }),
  );
}

// Map a live /chat NDJSON event onto the running 'run' block: append/close real
// status steps, accumulate the final text, capture files + errors. Mutates the
// passed `st` accumulator; returns nothing.
function applyRunEvent(st, ev) {
  const LABEL = {
    // "Searching models" undersold the one step that IS our server's heavy work.
    search_models: 'Searching 50+ sources…', build_3d_model: 'Building model',
    deep_research: 'Researching', mesh_decompose: 'Decomposing mesh',
    select_model: 'Selecting model', fabricate: 'Fabrication plan',
    attach_apply: 'Attaching part', attach_suggest: 'Finding parts',
  };
  const titleize = (a) => LABEL[a] || String(a || 'Working').replace(/_/g, ' ');
  switch (ev.type) {
    case 'agent_call': {
      const inp = ev.input || {};
      const detail = inp.query || (inp.gear ? (inp.gear.teeth + 'T · module ' + inp.gear.module) :
        (inp.topic || (Array.isArray(inp.operations) ? inp.operations.length + ' operation(s)' : '')));
      st.steps.push({ key: 'a' + st.steps.length, agent: ev.agent, status: 'active', title: titleize(ev.agent), detail: detail || undefined });
      break;
    }
    case 'agent_result': {
      const s = [...st.steps].reverse().find((x) => x.agent === ev.agent && x.status === 'active');
      if (s) {
        s.status = 'done';
        const r = ev.result || {};
        if (typeof r.found === 'number') s.detail = r.found + ' found';
        else if (r.built && !s.detail) s.detail = 'built';
      }
      break;
    }
    case 'stage': {
      if (ev.status === 'run') st.steps.push({ key: 's' + st.steps.length, stage: ev.name, status: 'active', title: ev.name });
      else { const s = [...st.steps].reverse().find((x) => x.stage === ev.name); if (s) s.status = 'done'; }
      break;
    }
    case 'candidates':
      st.steps.push({ key: 'c' + st.steps.length, status: 'done', title: 'Found ' + (ev.candidates || []).length + ' models' });
      break;
    case 'research_ready':
      st.steps.push({ key: 'r' + st.steps.length, status: 'done', title: 'Research ready', detail: (ev.sources || []).length + ' sources' });
      break;
    case 'model_ready':
      st.steps.push({ key: 'm' + st.steps.length, status: 'done', title: 'Model ready', detail: 'STL · STEP · OBJ' });
      break;
    case 'text':
      st.text += ev.content || '';
      break;
    case 'files':
      if (ev.files && ev.files.dir) st.filesDir = ev.files.dir;
      // Absolute paths, not just the folder: STEP drives "Open in Fusion" (the
      // add-in imports by path), and all three get printed in the reply so the
      // user can drag or double-click the exact file.
      if (ev.files && ev.files.step) st.stepPath = ev.files.step;
      if (ev.files && ev.files.stl) st.stlPath = ev.files.stl;
      if (ev.files && ev.files.obj) st.objPath = ev.files.obj;
      break;
    case 'error':
      st.error = ev.message || 'error';
      break;
    default:
      break;
  }
}

// Full-pane onboarding shown after auth when no LLM provider is configured.
// Paste the key inline (reuses Settings' ApiKeyField), open full Settings, or skip.
function LlmGate({ onSettings, onSaveKey, onSkip, light }) {
  const KeyField = window.SETTINGS2 && window.SETTINGS2.ApiKeyField;
  return _ah('div', { className: 'tp' + (light ? ' light' : ''), style: { width: '100%', height: '100%' } },
    _ah('div', { className: 'tp-shell' },
      _ah('div', { className: 'tp-body', style: { alignItems: 'center', justifyContent: 'center', paddingTop: 40 } },
        _ah('div', { style: { marginBottom: 18, opacity: .7 } },
          _ah('img', { src: 'cad/brand/orynd-orbit-white.png', alt: 'ORYND', style: { width: 36, height: 'auto' } })),
        _ah('h2', { className: 'es-h' }, 'Connect your ', _ah('span', { className: 'em' }, 'AI provider')),
        _ah('p', { className: 'es-p', style: { marginTop: 10, marginBottom: 20, maxWidth: 280 } },
          'Paste any provider key to start — Claude, OpenAI, Gemini, or Groq.'),
        KeyField
          ? _ah('div', { style: { width: '100%', maxWidth: 320, marginBottom: 16 } },
              _ah(KeyField, { initialState: 'empty', onSaveKey }))
          : null,
        _ah('button', { className: 'tp-btn', onClick: onSettings },
          _ah(AI.Settings, { size: 15 }), 'More settings'),
        onSkip && _ah('button', {
          className: 'tp-auth-why', style: { marginTop: 14 }, onClick: onSkip,
        }, 'Skip for now — set it up later'),
        _ah('div', { className: 'tp-auth-foot', style: { marginTop: 14 } },
          _ah(AI.Lock, { size: 13 }), 'Your key stays on this machine — never stored on our servers or logged.'),
      ),
    ),
  );
}

// Derive a UI user object from a Supabase session.
// plan comes from /api/billing/me, not from here — a hardcoded default would
// tell every user the wrong thing about what they're paying for.
function userFromSession(s) {
  if (!s || !s.user) return null;
  const email = s.user.email || '';
  const meta = s.user.user_metadata || {};
  const name = meta.full_name || meta.name || email;
  const initials = (name || 'U').trim().split(/\s+/).map((p) => p[0]).slice(0, 2).join('').toUpperCase() || 'U';
  return { id: s.user.id, initials, email, name };
}

// The F1 tour lives in this one chat and nowhere else. Fixed id (not generated) so
// the user can always come back to it from the project list, exactly as founder
// described: "вся F1-история живёт КОНКРЕТНО в ЭТОМ чате".
const F1_CHAT_ID = 'cad-project-0';

// Fresh id for a new chat/project. Prefixed so a folder in Documents is
// recognisably ours next to whatever else the user keeps there.
function newChatId() {
  const rnd = (window.crypto && window.crypto.randomUUID)
    ? window.crypto.randomUUID().slice(0, 8)
    : Math.random().toString(16).slice(2, 10);
  return 'cad-' + new Date().toISOString().slice(0, 10) + '-' + rnd;
}

// Stable per-install id. The shared backend keys chat history by session_id, so
// two users must never land on the same one — an anonymous install still needs
// an id of its own rather than falling back to a shared constant.
function clientId() {
  try {
    let v = localStorage.getItem('orynd-client-id');
    if (!v) {
      v = (window.crypto && window.crypto.randomUUID)
        ? window.crypto.randomUUID()
        : String(Date.now()) + '-' + Math.random().toString(16).slice(2);
      localStorage.setItem('orynd-client-id', v);
    }
    return v;
  } catch {
    return 'local';
  }
}

// Share V1 (founder): text + link, no upload. The line the user pastes; try.html
// reads utm_source=share and carries it to register, so a shared build is traceable.
const SHARE_URL = 'https://oryndai.com/try?utm_source=share';
const shareLine = (elapsedMs) =>
  `Made this with ORYND in ${Math.max(1, Math.round((elapsedMs || 0) / 1000))}s — ${SHARE_URL}`;

// This pane runs in two different browser engines (Electron's Chromium and the CAD
// host's embedded webview); navigator.clipboard exists in one and not always the
// other, so fall back to the old selection trick before telling the user it failed.
async function copyText(text) {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch { /* blocked → try the fallback below */ }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

function OryndApp() {
  const C = window.CAD;
  const E = window.EMPTY;
  // Real Supabase session — null until checked. Drives the auth gate.
  const [session, setSession] = React.useState(null);
  const [authReady, setAuthReady] = React.useState(false); // false → still checking getSession()
  const loggedIn = !!session;
  const [view, setView] = React.useState('chat'); // chat | library | runs | overview | settings | notifications
  // null = checking, true = ready, false = no provider configured
  const [llmReady, setLlmReady] = React.useState(null);
  // Real update banner: hidden until electron-updater finds a newer GitHub release.
  const [update, setUpdate] = React.useState(null);
  // Chat history — empty by default. Populated as the user chats.
  const [msgs, setMsgs] = React.useState([]);
  // Current project. Resumed across restarts — closing the app mid-part and coming
  // back to an empty screen is how work gets lost.
  const [chatId, setChatId] = React.useState(() => {
    try {
      const v = localStorage.getItem('orynd-current-chat');
      if (v) return v;
      // First launch with the F1 tour still pending. The tour IS a chat and gets its
      // own id, so "New chat" walks away from it instead of stacking every later
      // request on top of a screen the user can't leave.
      if (localStorage.getItem('orynd-onboarding-done') !== '1') return F1_CHAT_ID;
    } catch { /* private mode */ }
    return newChatId();
  });
  const [projectList, setProjectList] = React.useState([]);
  const [sending, setSending] = React.useState(false);
  // User chose "skip for now" on the provider gate — let them into the app without a key.
  const [keySkipped, setKeySkipped] = React.useState(false);
  // Theme (dark default). Persisted; .tp.light styles exist in cad-theme.css.
  const [theme, setTheme] = React.useState(() => {
    try { return localStorage.getItem('orynd-theme') || 'dark'; } catch { return 'dark'; }
  });
  const light = theme === 'light';
  const setThemeP = (t) => { setTheme(t); try { localStorage.setItem('orynd-theme', t); } catch {} };
  // Connection mode — 'key' (chat in-pane via BYO/cloud key) or 'mcp' (an external
  // agent drives the backend over MCP; this pane becomes a viewer). Distinct from
  // the route pill (which LLM answers in key mode).
  const [connMode, setConnMode] = React.useState(() => {
    try { return localStorage.getItem('orynd-conn-mode') === 'mcp' ? 'mcp' : 'key'; } catch { return 'key'; }
  });
  const setConnModeP = (m) => { setConnMode(m); try { localStorage.setItem('orynd-conn-mode', m); } catch {} };
  // Extra /llm/status fields (routes, keys_verified) — gates the route pill + Key ✓/✗ mark.
  const [llmInfo, setLlmInfo] = React.useState(null);
  // MCP activity — polled only while in MCP mode (Feature B, cheap "is it alive" pill).
  const [mcpStatus, setMcpStatus] = React.useState(null);
  // Real CAD detection for Settings (replaces the hardcoded "SolidWorks Connected").
  const [cadDetected, setCadDetected] = React.useState([]);
  const prevCadRef = React.useRef([]);

  // F1 showcase onboarding (first launch) — see cad-onboarding-f1.jsx + release plan
  // §3. `onboardingProgress` is populated by `send()` below (exact-prompt match against
  // window.ONBOARD.F1_PARTS), not by a separate send path — the user pastes into the
  // REAL composer, this just observes.
  const [onboardingDone, setOnboardingDone] = React.useState(() => {
    try { return localStorage.getItem('orynd-onboarding-done') === '1'; } catch { return false; }
  });
  const [onboardingProgress, setOnboardingProgress] = React.useState({});
  const [assembling, setAssembling] = React.useState(false);
  // Builds left. Supabase owns the real number (via /api/credits); this cached copy
  // only survives a cold/offline start so the header isn't blank. Any answer from
  // the server wins over it — the client must never be the source of truth here.
  const [creditsMock, setCreditsMock] = React.useState(() => {
    try { return Number(localStorage.getItem('orynd-credits-mock')) || 3; } catch { return 3; }
  });
  const [billing, setBilling] = React.useState(null); // {plan, builds_left, plan_max} | null = not fetched
  const setCreditsMockP = (n) => { setCreditsMock(n); try { localStorage.setItem('orynd-credits-mock', String(n)); } catch {} };
  const finishOnboarding = () => { setOnboardingDone(true); try { localStorage.setItem('orynd-onboarding-done', '1'); } catch {} };
  const skipOnboarding = () => { setCreditsMockP(3); finishOnboarding(); };
  const completeOnboarding = async () => {
    setAssembling(true);
    await send(window.ONBOARD.ASSEMBLE_PROMPT, 'ORYND');
    setAssembling(false);
    refreshBilling(); // whatever the server charged for the flow, re-read it
    finishOnboarding();
  };
  // Share confirm — { elapsedMs } of the run the user clicked Share on, null = closed.
  const [shareModal, setShareModal] = React.useState(null);
  // Which Settings section opens (deep-link from the feedback nudge).
  const [settingsSection, setSettingsSection] = React.useState('general');
  // Successful builds this session + whether we already asked for feedback — the
  // nudge fires once, after something worked, and never again this run.
  const buildsRef = React.useRef(0);
  const askedRef = React.useRef(false);
  // Transient top toast (key-saved, CAD reconnect) — auto-clears after a few seconds.
  // A toast can ask for longer via `ttl` (the feedback nudge needs time to be read).
  const [toast, setToast] = React.useState(null);
  React.useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), toast.ttl || 4000);
    return () => clearTimeout(id);
  }, [toast]);

  React.useEffect(() => {
    if (window.orynd && window.orynd.onUpdate) window.orynd.onUpdate((info) => setUpdate(info));
  }, []);

  // Real Supabase session: read on start + subscribe to changes (sign-in, sign-out, refresh).
  // Cross-surface relay (founder requirement 2026-07-14): the main window and a CAD-
  // embedded palette (Fusion/SolidWorks/AutoCAD) are DIFFERENT browser engines hitting
  // the same bridge — separate localStorage, so a sign-in in one doesn't show in the
  // other by itself. If THIS surface has no local session, ask the bridge (/api/session)
  // whether some OTHER surface already signed in, and adopt it — one session, no
  // re-login anywhere. Every change here is also pushed back to the bridge below.
  // Diagnostic trail — see bridge.js _pushDebugLog. Temporary, while chasing the
  // Fusion-palette-stuck-on-signin issue (can't open devtools on that embedded
  // webview directly). Fire-and-forget, never throws.
  const _dlog = (msg) => {
    try {
      fetch('/api/debug-log', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ msg: '[' + (window.SB ? 'SB-ok' : 'NO-SB') + '] ' + msg }),
      }).catch(() => {});
    } catch (e) { /* ignore */ }
  };

  const relaySession = (s) => {
    // Fire-and-forget: a relay failure must never block the sign-in/out that's
    // actually happening locally. Called on every session change AND right after
    // a local session is found on mount (getSession() resolving with a session
    // does not reliably re-fire onAuthStateChange on every supabase-js version —
    // confirmed 2026-07-14: an already-logged-in main window didn't relay until
    // this explicit call was added).
    fetch('/api/session', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(s && s.access_token ? {
        access_token: s.access_token, refresh_token: s.refresh_token,
        user: s.user ? { email: s.user.email } : null,
      } : {}),
    }).catch(() => {});
  };

  React.useEffect(() => {
    _dlog('session effect start, typeof fetch=' + typeof fetch);
    if (!window.SB) { _dlog('window.SB missing — supabase-js did not load'); setAuthReady(true); return; }
    let sub = null;
    window.SB.auth.getSession()
      .then(({ data }) => {
        const local = (data && data.session) || null;
        _dlog('getSession() resolved, local session=' + (local ? local.user.email : 'none'));
        if (local) { setSession(local); relaySession(local); return; }
        _dlog('no local session, fetching /api/session from bridge');
        return fetch('/api/session')
          .then((r) => { _dlog('/api/session responded, status=' + r.status); return r.json(); })
          .then((d) => {
            const relayed = d && d.session;
            _dlog('relayed session=' + (relayed ? relayed.user && relayed.user.email : 'none'));
            if (relayed && relayed.access_token) {
              return window.SB.auth.setSession({
                access_token: relayed.access_token,
                refresh_token: relayed.refresh_token || '',
              }).then((res) => {
                _dlog('setSession() result: ' + JSON.stringify(res && res.error ? { error: res.error.message } : { ok: true }));
              }).catch((e) => _dlog('setSession() threw: ' + e.message));
            }
            setSession(null);
          })
          .catch((e) => _dlog('fetch(/api/session) FAILED: ' + e.message));
      })
      .catch((e) => { _dlog('getSession() FAILED: ' + e.message); setSession(null); })
      .finally(() => setAuthReady(true));
    const r = window.SB.auth.onAuthStateChange((_event, s) => {
      _dlog('onAuthStateChange fired, event=' + _event + ' session=' + (s ? s.user.email : 'none'));
      setSession(s || null);
      // Relay to the shared bridge session — but ASYMMETRICALLY, and this is the
      // crux of the cross-surface bug (2026-07-14): only PUSH a positive session,
      // and only CLEAR on a real user-initiated sign-out. A surface that merely
      // loads without a local session fires INITIAL_SESSION(null); the old code
      // relayed that empty state and thereby WIPED the session another surface
      // (the main window) had just set — the Fusion palette was killing its own
      // shared session ~1ms before reading it back. A no-session surface must
      // only READ the shared session, never overwrite it.
      if (s && s.access_token) {
        relaySession(s);              // SIGNED_IN / TOKEN_REFRESHED / USER_UPDATED
      } else if (_event === 'SIGNED_OUT') {
        relaySession(null);           // real sign-out → clear the shared session
      }
      // INITIAL_SESSION(null) or any other null that ISN'T a sign-out → do nothing.
    });
    sub = r && r.data && r.data.subscription;

    // Self-healing keep-alive: a surface that HAS a session re-asserts it to the
    // bridge every 10s. Without this, once the bridge session is empty (e.g. the
    // very first palette load before this fix cleared it, or a bridge restart),
    // nothing would ever repopulate it until the next sign-in — the palette would
    // stay stuck on sign-in forever. With it, any signed-in surface guarantees the
    // shared session is present within 10s, so other surfaces can always adopt it.
    const keepAlive = setInterval(() => {
      window.SB.auth.getSession().then(({ data }) => {
        const s = data && data.session;
        if (s && s.access_token) relaySession(s);
      }).catch(() => {});
    }, 10000);

    return () => { if (sub) sub.unsubscribe(); clearInterval(keepAlive); };
  }, []);

  // Deep-link auth — oryndai.com/auth/callback redirects to orynd://auth?access_token=...&refresh_token=...
  // (Google OAuth round-trip). Hand the tokens to Supabase → onAuthStateChange picks up the session.
  React.useEffect(() => {
    if (window.orynd && window.orynd.onAuth) {
      window.orynd.onAuth((data) => {
        if (data && data.accessToken && window.SB) {
          window.SB.auth.setSession({
            access_token: data.accessToken,
            refresh_token: data.refreshToken || '',
          }).catch((e) => console.error('[orynd] setSession failed:', e && e.message));
        }
      });
    }
  }, []);

  // Bearer header from the current Supabase session (empty when signed out).
  // Every backend call carries it so the backend attributes requests to the
  // real user (security rollout Ph.1: identity everywhere).
  const authHeaders = React.useCallback(() => {
    const tok = session && session.access_token;
    return tok ? { Authorization: 'Bearer ' + tok } : {};
  }, [session]);

  // The backend keeps chat history per session_id. Without this the bridge falls
  // back to a shared constant and every user's history piles into one bucket on
  // the shared server — one person's context leaking into another's answers.
  // One id per CHAT, not per user. It keys three things at once: the backend's
  // history, the folder builds are saved into, and the chat file on disk — so a
  // project is one folder with its conversation and its STEP files together.
  // It used to be per-user, which meant every build overwrote the previous part.
  const chatSessionId = React.useCallback(() => chatId, [chatId]);

  // Builds left + plan, straight from Supabase. Refetched after every turn that
  // could have spent one, so the number in the header moves for real instead of
  // being decremented optimistically on the client.
  const refreshBilling = React.useCallback(async () => {
    if (!session) return;
    try {
      const r = await fetch('/api/credits', { headers: authHeaders() });
      const d = await r.json();
      if (d && d.ok) {
        setBilling(d);
        setCreditsMockP(d.builds_left); // cache for the next offline start
      }
    } catch { /* offline → keep the cached number */ }
  }, [session, authHeaders]);

  React.useEffect(() => { refreshBilling(); }, [refreshBilling]);

  // Welcome, once per install: how many free builds this account actually has.
  // Waits for the real balance instead of announcing "3" on faith — and stays quiet
  // for a paid plan (the header already says Unlimited) or an account at zero (the
  // header already says where to upgrade).
  React.useEffect(() => {
    if (!billing || !billing.ok || billing.plan !== 'free' || !(billing.builds_left > 0)) return;
    try {
      if (localStorage.getItem('orynd-welcomed') === '1') return;
      localStorage.setItem('orynd-welcomed', '1');
    } catch { /* private mode → show it, worst case it repeats */ }
    if (window.POPUPS) setToast(window.POPUPS.toasts.T_WELCOME(billing.builds_left));
  }, [billing]);

  // Check LLM provider status after sign-in.
  React.useEffect(() => {
    if (!loggedIn) return;
    fetch('/api/llm-status', { headers: authHeaders() })
      .then((r) => r.json())
      .then((d) => { setLlmReady(!!(d && d.active)); setLlmInfo(d || null); })
      .catch(() => { setLlmReady(false); setLlmInfo(null); });
  }, [loggedIn]);

  // MCP activity poll — only while the composer is in MCP mode. Cheap "is the
  // agent actually doing something" signal (no SSE yet — see release plan §3 LATER).
  React.useEffect(() => {
    if (!loggedIn || connMode !== 'mcp') return;
    let alive = true;
    const poll = () =>
      fetch('/api/mcp-status', { headers: authHeaders() })
        .then((r) => r.json())
        .then((d) => { if (alive) setMcpStatus(d || { enabled: false }); })
        .catch(() => { if (alive) setMcpStatus({ enabled: false }); });
    poll();
    const id = setInterval(poll, 2500);
    return () => { alive = false; clearInterval(id); };
  }, [loggedIn, connMode]);

  // Online indicator — ping the backend /health (via bridge) every 30s.
  // Failure → offline badge; never throws (does not crash the app).
  const [online, setOnline] = React.useState(true);
  React.useEffect(() => {
    if (!loggedIn) return;
    let alive = true;
    const ping = () =>
      fetch('/health')
        .then((r) => r.ok)
        .catch(() => false)
        .then((ok) => { if (alive) setOnline(ok); });
    ping();
    const id = setInterval(ping, 30000);
    return () => { alive = false; clearInterval(id); };
  }, [loggedIn]);

  // Detect which CAD apps are actually running (for real Settings status).
  React.useEffect(() => {
    if (!loggedIn || !window.orynd || !window.orynd.detectCad) return;
    let alive = true;
    const scan = () => window.orynd.detectCad()
      .then((list) => {
        if (!alive) return;
        const next = Array.isArray(list) ? list : [];
        const prev = prevCadRef.current;
        const newlyDetected = next.find((id) => prev.indexOf(id) === -1);
        if (newlyDetected && window.POPUPS) {
          const apps = (window.SETTINGS2 && window.SETTINGS2.CAD_APPS) || [];
          const name = (apps.find((a) => a.id === newlyDetected) || {}).name || newlyDetected;
          setToast(window.POPUPS.toasts.T_CONNECT(name));
        }
        prevCadRef.current = next;
        setCadDetected(next);
      })
      .catch(() => {});
    scan();
    const id = setInterval(scan, 5000);
    return () => { alive = false; clearInterval(id); };
  }, [loggedIn]);

  // ---------- local projects: one folder per chat on the user's own disk ----------
  // ⚠️ These hooks MUST stay ABOVE the auth gate below. Both `if` blocks after this
  // point return early, so anything hook-shaped placed under them runs only for a
  // signed-in user — the hook count then changes at sign-in and React throws
  // "Rendered more hooks than during the previous render" into a blank white window.
  const PROJ = window.orynd && window.orynd.projectsList ? window.orynd : null;

  const refreshProjects = React.useCallback(async () => {
    if (!PROJ) return;
    try { setProjectList(await PROJ.projectsList() || []); } catch { /* fail-soft */ }
  }, [PROJ]);

  const newChat = React.useCallback(() => {
    const id = newChatId();
    try { localStorage.setItem('orynd-current-chat', id); } catch { /* private mode */ }
    setChatId(id); setMsgs([]); setView('chat');
  }, []);

  const openChat = React.useCallback(async (id) => {
    if (!PROJ) return;
    const r = await PROJ.projectLoad(id).catch(() => null);
    if (!r || !r.ok) { refreshProjects(); return; }
    try { localStorage.setItem('orynd-current-chat', id); } catch { /* private mode */ }
    setChatId(id); setMsgs(r.messages || []); setView('chat');
  }, [PROJ, refreshProjects]);

  const forgetChat = React.useCallback(async (id) => {
    if (!PROJ) return;
    await PROJ.projectForget(id).catch(() => null);
    refreshProjects();
  }, [PROJ, refreshProjects]);

  // Restore the chat we were in, and the list, once on mount.
  React.useEffect(() => {
    if (!PROJ) return;
    refreshProjects();
    PROJ.projectLoad(chatId).then((r) => {
      if (r && r.ok && (r.messages || []).length) setMsgs(r.messages);
    }).catch(() => { /* new chat, nothing saved yet */ });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist after a turn settles. Saving mid-stream would write a half-finished run
  // block every 100ms as the timer ticks.
  React.useEffect(() => {
    if (!PROJ || sending || msgs.length === 0) return;
    const settled = msgs.map((m) => (m.t === 'run' ? { ...m, running: false } : m));
    PROJ.projectSave(chatId, { messages: settled })
      .then(() => refreshProjects())
      .catch(() => { /* disk full / permissions — chat still works in memory */ });
  }, [PROJ, sending, msgs, chatId, refreshProjects]);

  // Still resolving the stored session — brief spinner to avoid a sign-in flash.
  if (!authReady) {
    return _ah('div', { className: 'tp' + (light ? ' light' : ''), style: { width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' } },
      _ah('span', { className: 'spin-ring', style: { width: 24, height: 24 } }));
  }

  // Auth gate — SignInScreen drives email/password + Google itself via window.SB;
  // the resulting session flows back through onAuthStateChange above.
  if (!loggedIn) {
    return _ah(window.AUTH.SignInScreen, { light });
  }

  // Save API key to backend, update llmReady on success. BYO any provider:
  // provider is auto-detected from the key prefix (override in Settings); model
  // is optional (backend picks a smart default). Returns the backend result,
  // which carries the live model list + resolved provider/model for the UI.
  const saveKey = async (key, provider, model) => {
    try {
      const r = await fetch('/api/key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({
          key: key || '',
          ...(provider ? { provider } : {}),
          ...(model ? { model } : {}),
        }),
      });
      const d = await r.json();
      if (d && d.ok && (key || '').trim()) {
        setLlmReady(true);
        if (window.POPUPS) setToast(window.POPUPS.toasts.T_KEY);
      }
      return d || { ok: false };
    } catch (e) {
      return { ok: false, error: e.message };
    }
  };

  // route = composer model selector (ORYND/Claude/OpenAI/Local); the backend
  // honours it for provider routing instead of always auto-picking.
  // Authorization: the Supabase JWT rides along so the backend attributes the
  // request to the real user (same identity the MCP path carries).
  const send = async (text, route, mode, attach = null) => {
    setView('chat');
    // Push the user turn + a live 'run' block; the run block updates in place
    // from real stream events, with a real elapsed timer.
    const st = { steps: [], text: '', filesDir: null, error: null };
    // The transcript shows the filename, never the base64 — a 10 MB string in React state
    // would be re-rendered on every stream event.
    const userTurn = attach ? { t: 'user', text, attachment: { kind: attach.kind, name: attach.name } } : { t: 'user', text };
    setMsgs((m) => [...m, userTurn, { t: 'run', steps: [], elapsedMs: 0, running: true }]);
    setSending(true);
    const started = Date.now();
    // Update the most recent 'run' block functionally.
    const patchRun = (patch) => setMsgs((m) => {
      let done = false;
      const out = m.slice();
      for (let i = out.length - 1; i >= 0 && !done; i--) {
        if (out[i].t === 'run') { out[i] = { ...out[i], ...patch }; done = true; }
      }
      return out;
    });
    const timer = setInterval(() => patchRun({ elapsedMs: Date.now() - started }), 100);
    try {
      const r = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({
          prompt: text, route: route || 'ORYND', session_id: chatSessionId(), mode: mode || 'auto',
          ...(attach ? { image_b64: attach.b64, image_name: attach.name } : {}),
        }),
      });
      const reader = r.body.getReader();
      const dec = new TextDecoder();
      let buf = '';
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        let nl;
        while ((nl = buf.indexOf('\n')) >= 0) {
          const line = buf.slice(0, nl).trim();
          buf = buf.slice(nl + 1);
          if (!line) continue;
          let ev; try { ev = JSON.parse(line); } catch { continue; }
          applyRunEvent(st, ev);
          patchRun({ steps: st.steps.slice(), elapsedMs: Date.now() - started });
        }
      }
    } catch (e) {
      st.error = 'Bridge error: ' + e.message;
    } finally {
      clearInterval(timer);
    }
    // Finalize: freeze the run block + append the assistant's answer. Share only
    // rides on a run that finished AND produced files — there's nothing to brag
    // about on a failed turn or a plain conversation.
    const elapsedMs = Date.now() - started;
    patchRun({
      running: false, elapsedMs, error: st.error,
      // Raw paths, not just the click handlers below — a saved chat.json can't hold
      // a function (JSON drops it silently), so a reopened project's "Open files"
      // button used to just be gone. renderBlock('run') reconstructs onOpen/
      // onOpenInFusion from THESE fields whenever the live function isn't there.
      filesDir: st.filesDir, stepPath: st.stepPath, stlPath: st.stlPath, objPath: st.objPath,
      onShare: (!st.error && st.filesDir) ? () => setShareModal({ elapsedMs }) : null,
      onOpen: st.filesDir ? () => window.orynd && window.orynd.openPath(st.filesDir) : null,
      // Only when running INSIDE the Fusion palette (window.adsk exists) — the add-in
      // imports the STEP into the active document. Standalone app has no window.adsk.
      onOpenInFusion: (st.stepPath && window.adsk && window.adsk.fusionSendData)
        ? () => window.adsk.fusionSendData('import', JSON.stringify({ action: 'import_file', path: st.stepPath }))
        : null,
    });
    let msg = st.error || st.text || 'No response from backend.';
    // Print the FULL path of every file, not just the folder. The user drags this
    // into Fusion or double-clicks it — "saved to some folder" makes them go hunting.
    const paths = [st.stepPath, st.stlPath, st.objPath].filter(Boolean);
    if (paths.length) msg += '\n\nSaved:\n' + paths.map((p) => '  ' + p).join('\n');
    else if (st.filesDir) msg += '\n\nSaved to ' + st.filesDir;
    setMsgs((m) => [...m, { t: 'assist', text: msg }]);
    setSending(false);
    // F1 onboarding: this turn's text is a plain user-pasted string — if it
    // exactly matches one of the fixed onboarding prompts and didn't error,
    // check that part off. Panel renders in ChatEmpty/ChatBody, not here.
    if (!st.error && window.ONBOARD) {
      const part = window.ONBOARD.F1_PARTS.find((p) => p.prompt === text);
      if (part) setOnboardingProgress((s) => ({ ...s, [part.id]: true }));
    }
    // Usage counter: every successful generation costs 1 credit (founder: "как
    // цифра будет меняться после каждого успешного запроса"), EXCEPT the 6
    // individual F1-onboarding prompts (free — checkmark only, no build cost)
    // and the assembly prompt itself (completeOnboarding already decrements
    // once for the whole flow — decrementing here too would double-charge it).
    const O = window.ONBOARD;
    const isOnboardingPart = O && O.F1_PARTS.some((p) => p.prompt === text);
    const isAssemblePrompt = O && text === O.ASSEMBLE_PROMPT;
    if (!st.error && !isOnboardingPart && !isAssemblePrompt) {
      // The server already spent the credit (chat.py → spend_generation). Re-read
      // rather than subtracting locally: only Supabase knows what actually got
      // charged, and a conversational turn costs nothing at all.
      refreshBilling();
    }
    // Ask for feedback only once the product has earned the right to ask: a real
    // build, finished, files on disk. Second one, once per session, dismissable.
    if (!st.error && st.filesDir) {
      buildsRef.current += 1;
      if (buildsRef.current >= 2 && !askedRef.current && window.POPUPS) {
        askedRef.current = true;
        setToast({
          ...window.POPUPS.toasts.T_FEEDBACK,
          onAction: () => { setToast(null); setSettingsSection('feedback'); setView('settings'); },
        });
      }
    }
  };

  // Feedback (founder: канал ловить баги). The bridge adds the app version and
  // forwards with the JWT; the row is written server-side. Never throws — someone
  // reporting a bug must not hit a second one.
  const sendFeedback = async (message) => {
    // Attach the last week of local logs. A bug report without them is "it broke",
    // and the whole point of writing logs to disk is that someone can read them.
    let logs = '';
    try {
      if (window.orynd && window.orynd.collectLogs) logs = (await window.orynd.collectLogs(7)) || '';
    } catch { /* no logs is not a reason to lose the report */ }
    try {
      const r = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ message, logs }),
      });
      const d = await r.json().catch(() => ({}));
      return d && d.ok ? { ok: true } : { ok: false, error: (d && d.error) || 'Could not send — try again.' };
    } catch (e) {
      return { ok: false, error: 'Offline — try again when you reconnect.' };
    }
  };

  const goSettings      = () => { setSettingsSection('general'); setView('settings'); };
  const goNotifications = () => setView('notifications');
  const goChat          = () => setView('chat');
  const signOut         = () => {
    if (window.SB) window.SB.auth.signOut().catch(() => {});
    setMsgs([]); setView('chat'); setLlmReady(null); setKeySkipped(false);
    // session → null arrives via onAuthStateChange, flipping back to the sign-in gate.
  };

  // hCtx declared before any route that uses it.
  // plan/credits come from Supabase (refreshBilling). Pro is capped at 60 internally
  // but sold as Unlimited — show the word, never the cap.
  const planName = (p) => (p ? p.charAt(0).toUpperCase() + p.slice(1) : 'Free');
  const baseUser = userFromSession(session) || { initials: 'U', email: '' };
  const user = {
    ...baseUser,
    plan: planName(billing && billing.plan),
    buildsLeft: billing ? billing.builds_left : creditsMock,
    unlimited: !!(billing && billing.plan === 'pro'),
  };
  // Live app has no real notifications backend yet — always empty (window.NOTIF.NOTIFS
  // is sample data for the component gallery only; reading it here would show every
  // released user 10 fake notifications and a permanently-lit unread dot).
  const hasUnread = false;
  // Key ✓/✗: active AND not explicitly rejected by the backend's key-validation ping.
  // MCP ✓/✗: only meaningful once we've polled — no poll happened yet in Key mode, so
  // an untried MCP starts at ✗ (honest — we haven't seen a call, not "connected").
  const keyOk = llmReady === true && !(llmInfo && llmInfo.keys_verified && llmInfo.keys_verified.anthropic === false);
  const mcpOk = !!(mcpStatus && mcpStatus.enabled === true);
  const hCtx = { user, onBell: goNotifications, onSettings: goSettings, onSignOut: signOut, onNewChat: newChat, hasUnread, connection: online ? 'connected' : 'offline', light, connMode, onConnMode: setConnModeP, keyOk, mcpOk, routes: llmInfo && llmInfo.routes, mcpStatus, cadDetected, credits: user.unlimited ? 'Unlimited' : user.buildsLeft,
    onboardingDone: onboardingDone || chatId !== F1_CHAT_ID, onboardingProgress, onOnboardingSkip: skipOnboarding, onOnboardingDone: completeOnboarding };
  const headerProps = { connection: online ? 'connected' : 'offline', ...hCtx };

  // Update-available modal: only for the dismissable prompt states. Once the
  // user has ignored it enough times (Ф8 "forced"), updater.js is already
  // auto-downloading — that case keeps the small persistent UpdateBanner
  // instead (no choice left to offer).
  const updateModal = (update && !update.forced && window.POPUPS)
    ? { ...window.POPUPS.modals.M_UPDATE, ver: 'v' + update.version }
    : null;
  // One center-modal slot, two possible occupants. Share wins while it's open —
  // the user just asked for it; the update prompt is ambient and can wait.
  const shareOpen = !!(shareModal && window.POPUPS);
  const popupOverlay = window.POPUPS && _ah(window.POPUPS.PopupHost, {
    toast, onDismissToast: () => setToast(null),
    modal: shareOpen ? window.POPUPS.modals.M_SHARE : updateModal,
    onModalPrimary: shareOpen
      ? async () => {
          const ok = await copyText(shareLine(shareModal.elapsedMs));
          setShareModal(null);
          setToast(ok ? window.POPUPS.toasts.T_SHARE : window.POPUPS.toasts.T_SHARE_FAIL);
        }
      : () => { if (window.orynd && window.orynd.installUpdate) window.orynd.installUpdate(); },
    onModalSecondary: shareOpen ? () => setShareModal(null) : () => setUpdate(null),
  });
  // Popups (toasts/update modal) can interrupt any screen — wrap every route's
  // return value with the overlay instead of tying it to one specific view.
  const withPopups = (node) => _ah(React.Fragment, null, node, popupOverlay);

  // Full-pane routes (no shell tabs).
  if (view === 'settings') {
    const llmState = llmReady === true ? 'connected' : 'empty';
    const settingsProps = {
      onBack: goChat, onSignOut: signOut, onSaveKey: saveKey, llmState,
      light, user, theme, onTheme: setThemeP, onSendFeedback: sendFeedback,
      initialSection: settingsSection,
      cadDetected, mcpToken: session && session.access_token,
      onConnect: (id) => { if (window.orynd && window.orynd.installAddin) window.orynd.installAddin(id); },
    };
    const SettingsComp = SETTINGS_VARIANT === 'full'
      ? window.SETFULL.SettingsFull
      : window.SETTINGS2.SettingsV2;
    return withPopups(_ah(SettingsComp, settingsProps));
  }
  if (view === 'notifications') {
    // No real notifications backend yet — always the empty state (see hasUnread above).
    const hasNotifs = false;
    const notifCtx = { ...hCtx, onBack: goChat };
    return withPopups(hasNotifs
      ? _ah(window.NOTIF.NotificationsPane, notifCtx)
      : _ah(window.NOTIF.NotificationsEmpty, notifCtx));
  }

  // LLM provider check — spinner while checking, gate if none configured.
  if (llmReady === null) {
    return _ah('div', { className: 'tp' + (light ? ' light' : ''), style: { width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' } },
      _ah('span', { className: 'spin-ring', style: { width: 24, height: 24 } }));
  }
  if (llmReady === false && !keySkipped) {
    // Opening Settings or Skip both dismiss the gate, so returning lands on the base
    // chat screen instead of re-trapping the user on this provider prompt.
    return withPopups(_ah(LlmGate, {
      onSettings: () => { setKeySkipped(true); goSettings(); },
      onSaveKey: saveKey,
      onSkip: () => setKeySkipped(true),
      light,
    }));
  }

  // F1 onboarding assembly — a VISIBLE distinct step (founder was explicit this must
  // not be a silent background send). Takes priority over every other chat view while
  // the auto-fired assembly prompt is in flight; the real result still lands in the
  // normal chat right after (that arrival IS the reveal — no separate custom animation).
  if (assembling && window.ONBOARD) {
    return _ah('div', { className: 'tp' + (light ? ' light' : ''), style: { width: '100%', height: '100%' } },
      _ah('div', { className: 'tp-shell' },
        _ah('div', { className: 'tp-body', style: { alignItems: 'center', justifyContent: 'center' } },
          _ah(window.ONBOARD.F1AssemblingOverlay))));
  }

  // Zero-state screens (no data yet) — each is a full pane with its own header/tabs.
  if (view === 'chat' && msgs.length === 0) {
    return withPopups(_ah(E.ChatEmpty, { onTab: setView, onSend: send, onPick: send, ...hCtx }));
  }
  if (view === 'library') {
    return withPopups(_ah(E.LibraryEmpty, { onTab: setView, onNew: goChat, ...hCtx }));
  }
  if (view === 'runs') {
    return withPopups(_ah(E.RunsEmpty, { onTab: setView, onStart: goChat, ...hCtx }));
  }
  if (view === 'overview') {
    // Saved chats live here — founder's model: Overview IS the list of chats.
    // Falls back to the zero-state until there is something to list.
    if (projectList.length === 0) {
      return withPopups(_ah(E.OverviewEmpty, { onTab: setView, onNew: newChat, ...hCtx }));
    }
    const when = (iso) => {
      if (!iso) return '';
      const d = new Date(iso); const mins = Math.round((Date.now() - d.getTime()) / 60000);
      if (mins < 1) return 'now';
      if (mins < 60) return mins + 'm';
      if (mins < 1440) return Math.round(mins / 60) + 'h';
      return d.toLocaleDateString();
    };
    return withPopups(_ah('div', { className: 'tp' + (light ? ' light' : ''), style: { width: '100%', height: '100%' } },
      _ah('div', { className: 'tp-shell' },
        _ah(C.Header, headerProps),
        _ah(window.DASH.PaneTabs, { active: view, onTab: setView }),
        _ah('div', { style: { padding: '14px 16px', overflowY: 'auto', flex: 1 } },
          _ah('div', { className: 'tp-pop-label', style: { marginBottom: 8 } },
            'Projects · saved on this machine'),
          projectList.map((p) => _ah('button', {
            className: 'tp-popitem' + (p.missing ? ' soon' : ''), key: p.id,
            style: { width: '100%' },
            onClick: p.missing ? undefined : () => openChat(p.id),
          },
            _ah('span', { className: 'pmain' },
              _ah('span', { className: 'pt' }, p.title || p.id),
              _ah('span', { className: 'ps' },
                p.missing
                  ? 'Folder was removed from Documents'
                  : (p.turns || 0) + ' messages · ' + when(p.updatedAt)),
            ),
            p.missing
              // The chat file is gone from disk. Say so and offer to drop the row,
              // rather than quietly hiding a project the user may still be looking for.
              ? _ah('span', {
                className: 'badge-soon', title: 'Remove from list',
                onClick: (e) => { e.stopPropagation(); forgetChat(p.id); },
              }, 'Remove')
              : _ah('span', {
                className: 'badge-soon', title: 'Show the project folder in Finder',
                onClick: (e) => { e.stopPropagation(); if (window.orynd) window.orynd.openPath(p.dir); },
              }, 'Files'),
          )),
          _ah('div', { style: { marginTop: 12 } },
            _ah('button', { className: 'tp-btn primary', onClick: newChat }, 'New chat')),
        ),
      ),
    ));
  }

  // Chat with messages — interactive shell with account chip.
  // Update banner only for the "forced" (already auto-installing) state —
  // the dismissable prompt is the CenterModal in popupOverlay instead.
  return withPopups(_ah('div', { className: 'tp' + (light ? ' light' : ''), style: { width: '100%', height: '100%' } },
    _ah('div', { className: 'tp-shell' },
      _ah(C.Header, headerProps),
      update && update.forced && _ah(C.UpdateBanner, {
        version: update.version,
        forced: true,
        onUpdate: () => { if (window.orynd && window.orynd.installUpdate) window.orynd.installUpdate(); },
        onDismiss: () => setUpdate(null),
      }),
      _ah(window.DASH.PaneTabs, { active: view, onTab: setView }),
      _ah(ChatBody, { blocks: msgs, sending, onSend: send, connMode, onConnMode: setConnModeP, keyOk, mcpOk, routes: llmInfo && llmInfo.routes, mcpStatus,
        onboardingDone: onboardingDone || chatId !== F1_CHAT_ID, onboardingProgress, onOnboardingSkip: skipOnboarding, onOnboardingDone: completeOnboarding }),
    ),
  ));
}

window.OryndApp = OryndApp;
