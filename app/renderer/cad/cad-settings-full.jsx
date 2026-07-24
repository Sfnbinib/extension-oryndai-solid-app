// cad/cad-settings-full.jsx — Settings, "full" variant: category sidebar +
// content panel (General / Profile / Security / Notifications / Subscription).
// Same real data/handlers as SettingsV2 (cad-settings-v2.jsx) — just a
// different layout. Toggle which one renders via SETTINGS_VARIANT in
// cad-app.jsx. Exported to window.SETFULL.

const _f = React.createElement;
const FI = window.CADIcons;

// ---------- row primitives (interactive — the design-canvas source had
// these as static markup; here they accept the handlers they need) ----------
function Row(label, sub, value) {
  return _f('div', { className: 'tp-sf-row' },
    _f('div', { className: 'rk' },
      _f('div', { className: 'rlabel' }, label),
      sub && _f('div', { className: 'rsub' }, sub)),
    _f('div', { className: 'rv' }, value));
}
function Switch({ on, onToggle } = {}) {
  return _f('button', { className: 'tp-switch' + (on ? ' on' : ''), 'aria-pressed': !!on, onClick: onToggle }, _f('i'));
}
function Seg({ opts, active, onPick } = {}) {
  return _f('div', { className: 'tp-sf-seg' },
    opts.map((o, i) => _f('button', {
      key: o.value != null ? o.value : i,
      className: o.value === active ? 'active' : '',
      onClick: () => onPick && onPick(o.value),
    }, o.icon && _f(o.icon, { size: 14 }), o.label)));
}

// ---------- panels ----------
// General/Profile/Notifications preferences have no real backend storage yet
// (no settings-persistence endpoint exists anywhere in this app) — toggles are
// local-only so they respond instead of looking dead, but nothing here is saved.
function GeneralPanel({ theme, onTheme }) {
  const [units, setUnits] = React.useState('mm');
  const [fmt, setFmt] = React.useState('STEP');
  const [autoPrompt, setAutoPrompt] = React.useState(true);
  const [autoRun, setAutoRun] = React.useState(false);
  return _f(React.Fragment, null,
    Row('Units', 'Default measurement system for new parts',
      Seg({ opts: [{ label: 'mm', value: 'mm' }, { label: 'inch', value: 'inch' }], active: units, onPick: setUnits })),
    Row('Default export', 'Format used by the Export action',
      Seg({ opts: [{ label: 'STEP', value: 'STEP' }, { label: 'STL', value: 'STL' }, { label: 'DXF', value: 'DXF' }], active: fmt, onPick: setFmt })),
    Row('Auto-prompt idea suggestions', 'Suggest next operations while you type', Switch({ on: autoPrompt, onToggle: () => setAutoPrompt(v => !v) })),
    Row('Auto-run validated plans', 'Skip the gate when validation is clean & safe', Switch({ on: autoRun, onToggle: () => setAutoRun(v => !v) })),
    Row('Appearance', null,
      Seg({ opts: [{ label: 'Dark', value: 'dark', icon: FI.Moon }, { label: 'Light', value: 'light', icon: FI.Sun }], active: theme, onPick: onTheme })),
  );
}

function ProfilePanel({ user }) {
  const u = user || {};
  const [publicProfile, setPublicProfile] = React.useState(false);
  return _f(React.Fragment, null,
    _f('div', { className: 'tp-sf-row' },
      _f('div', { className: 'rk', style: { display: 'flex', alignItems: 'center', gap: 15 } },
        _f('span', { className: 'tp-sf-avatar' }, u.initials || 'U'),
        _f('div', null,
          _f('div', { className: 'rlabel', style: { fontSize: 16 } }, u.name || u.email || 'Signed in'),
          u.email && u.email !== u.name && _f('div', { className: 'rsub' }, u.email))),
    ),
    Row('Public profile', 'Let others see your published parts', Switch({ on: publicProfile, onToggle: () => setPublicProfile(v => !v) })),
  );
}

function SecurityPanel({ llmState, onSaveKey, onSignOut }) {
  const ApiKeyField = window.SETTINGS2 && window.SETTINGS2.ApiKeyField;
  return _f(React.Fragment, null,
    Row('Two-factor authentication', 'Not available yet', _f('span', { className: 'tp-sf-badge off' }, _f('span', { className: 'd' }), 'Off')),
    ApiKeyField && _f(ApiKeyField, { initialState: llmState, onSaveKey }),
    Row('Sign out everywhere', 'Ends every active session for this account', _f('button', { className: 'tp-btn sm danger', onClick: onSignOut }, 'Sign out all')),
  );
}

function NotificationsPanel() {
  const [prefs, setPrefs] = React.useState({ build: true, approval: true, validation: true, cad: true, billing: true, updates: false, digest: false });
  const toggle = (k) => setPrefs(p => ({ ...p, [k]: !p[k] }));
  return _f(React.Fragment, null,
    _f('div', { className: 'tp-sf-nav-label', style: { padding: '14px 2px 4px' } }, 'IN-APP'),
    Row('Build complete', 'When a part finishes and exports', Switch({ on: prefs.build, onToggle: () => toggle('build') })),
    Row('Approval required', 'When a plan is ready for your review', Switch({ on: prefs.approval, onToggle: () => toggle('approval') })),
    Row('Validation warnings', 'Non-blocking issues in a plan', Switch({ on: prefs.validation, onToggle: () => toggle('validation') })),
    Row('CAD connection', 'Connect / disconnect events', Switch({ on: prefs.cad, onToggle: () => toggle('cad') })),
    _f('div', { className: 'tp-sf-nav-label', style: { padding: '18px 2px 4px' } }, 'EMAIL'),
    Row('Trial & billing', 'Trial ending, renewals, receipts', Switch({ on: prefs.billing, onToggle: () => toggle('billing') })),
    Row('Product updates', 'New releases and skills', Switch({ on: prefs.updates, onToggle: () => toggle('updates') })),
    Row('Weekly summary', 'Your parts & runs digest', Switch({ on: prefs.digest, onToggle: () => toggle('digest') })),
  );
}

// No billing-status API exists in this app yet — show the real plan badge and
// the real billing link, but don't invent numbers (trial hours, card digits,
// invoices) that aren't backed by anything.
function SubscriptionPanel({ user }) {
  const plan = (user && user.plan) || 'Free';
  return _f(React.Fragment, null,
    Row('Plan', null, _f('span', { className: 'tp-sf-readonly' }, plan)),
    Row('Billing & invoices', 'Manage your plan on the ORYND site',
      _f('button', {
        className: 'tp-btn sm',
        onClick: () => window.orynd && window.orynd.openExternal('https://oryndai.com/account#billing'),
      }, 'Manage', _f(FI.Arrow, { size: 13 }))),
  );
}

// Inline MCP connection panel (founder decision 2026-07-13: inline in Settings,
// not a redirect — the site has no /account#mcp page yet). Polls independently
// of the composer's activity pill (that one only polls while connMode==='mcp';
// this tab must show live status regardless of which mode the composer is in).
function McpPanel({ mcpToken }) {
  const [status, setStatus] = React.useState(null); // null=loading, else /api/mcp-status payload
  const [copied, setCopied] = React.useState(false);
  // Personal durable token — minted once via /api/mcp-token (backend stores the
  // refresh_token and renews itself on every MCP call), so this URL keeps working
  // past the 1h JWT lifetime. null=not fetched yet, false=fetch failed (falls back
  // to the short-lived mcpToken below rather than showing a dead panel).
  const [durable, setDurable] = React.useState(null);
  React.useEffect(() => {
    let alive = true;
    const poll = () => fetch('/api/mcp-status')
      .then((r) => r.json())
      .then((d) => { if (alive) setStatus(d || { enabled: false }); })
      .catch(() => { if (alive) setStatus({ enabled: false }); });
    poll();
    const id = setInterval(poll, 2500);
    return () => { alive = false; clearInterval(id); };
  }, []);
  React.useEffect(() => {
    let alive = true;
    fetch('/api/mcp-token')
      .then((r) => r.json())
      .then((d) => { if (alive) setDurable(d && d.ok ? d.token : false); })
      .catch(() => { if (alive) setDurable(false); });
    return () => { alive = false; };
  }, []);

  const enabled = !!(status && status.enabled);
  const recentMs = 15000;
  const active = enabled && status.last_call_ts && (Date.now() / 1000 - status.last_call_ts) < recentMs / 1000;
  const pillClass = !status ? 'is-mono' : !enabled ? 'is-off is-mono' : active ? 'is-ok is-live is-mono' : 'is-mono';
  const pillText = !status ? 'Checking…'
    : !enabled ? 'via MCP: backend unreachable'
    : active ? 'via MCP: active · last step: ' + (status.last_tool || '…')
    : 'via MCP: connected · waiting for calls';

  // Prefer the personal durable token (never expires); fall back to the 1h
  // Supabase JWT only while the durable mint is still loading/unavailable.
  const _tok = durable || mcpToken;
  const connectorUrl = status && status.mcp_url
    ? status.mcp_url + (_tok ? '?token=' + encodeURIComponent(_tok) : '')
    : null;
  const copy = () => {
    if (!connectorUrl || !navigator.clipboard) return;
    navigator.clipboard.writeText(connectorUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  };

  return _f(React.Fragment, null,
    _f('div', { className: 'tp-chip ' + pillClass, style: { marginBottom: 14 } }, _f('span', { className: 'dot' }), pillText),
    Row('Endpoint', 'What an external agent (Claude, ChatGPT) connects to',
      _f('span', { className: 'tp-sf-readonly', style: { fontFamily: 'var(--mono)', fontSize: 11.5 } }, (status && status.mcp_url) || '…')),
    Row('Connector URL', 'Includes your personal access token — don’t share it',
      _f('button', {
        className: 'tp-btn sm', onClick: copy, disabled: !connectorUrl,
      }, copied ? 'Copied ✓' : 'Copy connector URL', !copied && _f(FI.Copy, { size: 13 }))),
    _f('div', { className: 'tp-set-sub', style: { padding: '10px 0 0' } },
      'Paste this URL into Claude Desktop (or another MCP client) as a custom connector. Switch the composer to MCP mode to let it drive ORYND — the app becomes a live viewer.'),
  );
}

// Founder 15.07: «продукт сырой, extension сложно контролировать, нужен канал ловить
// баги». Text only — we send what the user wrote, nothing else. Says so on screen,
// because a box that quietly shipped logs would be worse than no box.
function FeedbackPanel({ onSendFeedback }) {
  const [text, setText] = React.useState('');
  const [state, setState] = React.useState('idle'); // idle | sending | sent | error
  const [err, setErr] = React.useState('');
  const send = async () => {
    const msg = text.trim();
    if (!msg || state === 'sending') return;
    setState('sending');
    const r = onSendFeedback ? await onSendFeedback(msg) : { ok: false, error: 'not wired' };
    if (r && r.ok) { setState('sent'); setText(''); }
    else { setState('error'); setErr((r && r.error) || 'Could not send — try again.'); }
  };
  return _f(React.Fragment, null,
    _f('div', { className: 'tp-sf-row', style: { display: 'block' } },
      _f('div', { className: 'rlabel', style: { marginBottom: 4 } }, 'Found a bug? Tell us'),
      _f('div', { className: 'rsub', style: { marginBottom: 10 } },
        'What broke, what you expected, what you were building. It reaches the founder directly.'),
      _f('textarea', {
        value: text,
        onChange: (e) => { setText(e.target.value); if (state !== 'idle') setState('idle'); },
        placeholder: 'The gear came out with the wrong tooth count…',
        rows: 5, maxLength: 4000,
        style: {
          width: '100%', resize: 'vertical', padding: '10px 12px', borderRadius: 8,
          background: 'var(--surface-2, rgba(255,255,255,.03))', color: 'inherit',
          border: '1px solid var(--ink-4, rgba(255,255,255,.12))', font: 'inherit', fontSize: 13,
        },
      }),
      _f('div', { style: { display: 'flex', alignItems: 'center', gap: 10, marginTop: 10 } },
        _f('button', {
          className: 'tp-btn primary sm', onClick: send, disabled: !text.trim() || state === 'sending',
        }, _f(FI.Send, { size: 14 }), state === 'sending' ? 'Sending…' : 'Send'),
        state === 'sent' && _f('span', { className: 'tp-apikey-status ok', style: { padding: 0 } },
          _f(FI.CheckCircle, { size: 14 }), 'Thanks — got it.'),
        state === 'error' && _f('span', { className: 'tp-apikey-status err', style: { padding: 0 } },
          _f(FI.XCircle, { size: 14 }), err),
      ),
      _f('div', { className: 'rsub', style: { marginTop: 10 } },
        'Sent: your message, your account, the app version, and this app’s diagnostic log '
        + 'from the last 7 days (what ran and what failed). Not your models and not your chats.'),
    ),
  );
}

const SF_NAV = [
  { id: 'general',       label: 'General',       icon: FI.Cube,    title: 'General',       sub: 'Defaults for units, exports & language', panel: GeneralPanel },
  { id: 'profile',       label: 'Profile',       icon: FI.Account, title: 'Profile',       sub: 'How you appear across ORYND',            panel: ProfilePanel },
  { id: 'security',      label: 'Security',      icon: FI.Shield,  title: 'Security',      sub: 'API key & sessions',                      panel: SecurityPanel },
  { id: 'mcp',           label: 'MCP',           icon: FI.Plug,    title: 'MCP',           sub: 'Connect an external agent over MCP',      panel: McpPanel },
  { id: 'notifications', label: 'Notifications', icon: FI.Bolt,    title: 'Notifications', sub: 'What ORYND tells you, and where',         panel: NotificationsPanel },
  { id: 'subscription',  label: 'Subscription',  icon: FI.File,    title: 'Subscription',  sub: 'Plan & billing',                          panel: SubscriptionPanel },
  { id: 'feedback',      label: 'Feedback',      icon: FI.Mail,    title: 'Feedback',      sub: 'Tell us what broke — it goes to the founder', panel: FeedbackPanel },
];

// initialSection: which category is open on mount — lets the feedback nudge land
// the user on the box itself instead of "Settings, now go find it".
function SettingsFull({ light = false, llmState = 'empty', theme = 'dark', onBack, onSignOut, onSaveKey, user, onTheme, cadDetected = [], onConnect, mcpToken, onSendFeedback, initialSection = 'general' }) {
  const [active, setActive] = React.useState(initialSection);
  const item = SF_NAV.find(n => n.id === active) || SF_NAV[0];
  const Panel = item.panel;
  const CadConnections = window.SETTINGS2 && window.SETTINGS2.CadConnections;
  return _f('div', { className: 'tp' + (light ? ' light' : ''), style: { width: '100%', height: '100%' } },
    _f('div', { className: 'tp-sf' },
      _f('nav', { className: 'tp-sf-nav' },
        _f('div', { className: 'tp-sf-nav-label' }, 'Settings'),
        SF_NAV.map(n => _f('button', {
          key: n.id, className: 'tp-sf-navitem' + (n.id === active ? ' active' : ''), onClick: () => setActive(n.id),
        }, _f('span', { className: 'ic' }, _f(n.icon, { size: 18 })), n.label)),
        _f('div', { className: 'tp-sf-nav-sep' }),
        _f('button', { className: 'tp-sf-navitem', onClick: onBack },
          _f('span', { className: 'ic' }, _f(FI.Arrow, { size: 18, style: { transform: 'scaleX(-1)' } })), 'Back to chat'),
      ),
      _f('div', { className: 'tp-sf-panel' },
        _f('div', { className: 'tp-sf-head' },
          _f('h1', null, item.title),
          _f('p', null, item.sub)),
        _f('div', { className: 'tp-sf-body' },
          _f(Panel, { theme, onTheme, user, llmState, onSaveKey, onSignOut, cadDetected, onConnect, mcpToken, onSendFeedback }),
          active === 'security' && CadConnections && _f(CadConnections, { detected: cadDetected, onConnect }),
        )),
    ),
  );
}

window.SETFULL = { SettingsFull, SF_NAV, FeedbackPanel };
