// cad/cad-settings-v2.jsx — expanded Settings: Account, API key (4 states),
// CAD connections (3 apps), Appearance. Exported to window.SETTINGS2.

const _s2 = React.createElement;
const S2I = window.CADIcons;

// ---------- API KEY field (states: empty | saving | connected | error) ----------
// BYO ANY provider (founder): paste any key, we auto-detect the vendor from its
// prefix (manual override available) and let the backend pick a smart default
// model. The model dropdown is populated live from the vendor's /models list.
const KEY_PROVIDERS = [
  { id: 'anthropic', name: 'Claude (Anthropic)', ph: 'sk-ant-...' },
  { id: 'openai',    name: 'OpenAI',             ph: 'sk-... / sk-proj-...' },
  { id: 'gemini',    name: 'Google Gemini',      ph: 'AIza...' },
  { id: 'groq',      name: 'Groq',               ph: 'gsk_...' },
];
function _providerFromKey(k) {
  k = (k || '').trim();
  if (k.startsWith('sk-ant-')) return 'anthropic';
  if (k.startsWith('gsk_')) return 'groq';
  if (k.startsWith('AIza')) return 'gemini';
  if (k.startsWith('sk-')) return 'openai';   // sk- / sk-proj- (after sk-ant-)
  return null;
}
const _provName = (id) => (KEY_PROVIDERS.find((p) => p.id === id) || {}).name || id;
const _provPh = (id) => (KEY_PROVIDERS.find((p) => p.id === id) || {}).ph || 'paste your key...';

function ApiKeyField({ initialState = 'empty', onSaveKey }) {
  const [state, setState] = React.useState(initialState);
  const [val, setVal] = React.useState('');
  const [provider, setProvider] = React.useState('anthropic');
  const [manual, setManual] = React.useState(false);   // user overrode the auto-detect
  const [models, setModels] = React.useState([]);       // live list from the vendor
  const [model, setModel] = React.useState('');          // selected/resolved model

  // Auto-detect the provider from the key prefix as the user types, unless they
  // manually picked one.
  const onKeyChange = (e) => {
    const v = e.target.value;
    setVal(v);
    if (state === 'error') setState('empty');
    if (!manual) {
      const det = _providerFromKey(v);
      if (det) setProvider(det);
    }
  };

  const save = async () => {
    if (!val.trim()) return;
    setState('saving');
    try {
      const result = onSaveKey ? await onSaveKey(val.trim(), provider, '') : { ok: false };
      if (result && result.ok) {
        setState('connected');
        setVal('');
        if (result.provider) setProvider(result.provider);
        setModels(Array.isArray(result.models) ? result.models : []);
        setModel(result.model || result.default_model || '');
      } else {
        setState('error');
      }
    } catch {
      setState('error');
    }
  };

  // Change the answer-step model without re-pasting the key (backend accepts a
  // model-only update for an already-connected provider).
  const onModelChange = async (e) => {
    const m = e.target.value;
    setModel(m);
    try { if (onSaveKey) await onSaveKey('', provider, m); } catch { /* keep UI selection */ }
  };

  const replace = () => { setState('empty'); setVal(''); setModels([]); setModel(''); setManual(false); };

  return _s2('div', { className: 'tp-set-group' },
    _s2('div', { className: 'tp-set-glabel' }, 'API KEY'),
    // Provider selector — auto-detected, override anytime.
    state !== 'connected' && _s2('div', { className: 'tp-apikey', style: { marginBottom: 8 } },
      _s2('select', {
        className: 'tp-provider-select',
        value: provider,
        onChange: (e) => { setProvider(e.target.value); setManual(true); },
        style: { width: '100%', padding: '8px 10px', borderRadius: 8, background: 'var(--glass)', color: 'var(--ink-1)', border: '1px solid var(--glass-edge)', fontFamily: 'var(--sans)', fontSize: 13 },
      }, KEY_PROVIDERS.map((p) => _s2('option', { key: p.id, value: p.id }, p.name))),
    ),
    _s2('div', { className: 'tp-apikey' },
      _s2('div', { className: 'tp-apikey-field ' + (state === 'connected' ? 'ok' : state === 'error' ? 'err' : '') },
        _s2(S2I.Lock, { size: 14, style: { color: 'var(--ink-3)', flex: '0 0 auto' } }),
        state === 'connected'
          ? _s2('input', { value: _provName(provider) + ' · key verified', readOnly: true, type: 'text' })
          : _s2('input', {
              placeholder: _provPh(provider),
              value: val,
              type: 'password',
              autoComplete: 'off',
              onChange: onKeyChange,
              onKeyDown: (e) => { if (e.key === 'Enter') save(); },
            }),
        state === 'connected'
          ? _s2('button', { className: 'tp-cadconn-btn manage', style: { height: 28 }, onClick: replace }, 'Replace')
          : _s2('button', {
              className: 'tp-apikey-done',
              disabled: state === 'saving' || !val.trim(),
              onClick: save,
            }, state === 'saving' ? 'Saving…' : 'Done'),
      ),
      // Model dropdown — populated live from the vendor; smart default preselected.
      state === 'connected' && models.length > 0 && _s2('div', { style: { padding: '9px 0 0' } },
        _s2('div', { className: 'tp-set-glabel', style: { marginBottom: 5 } }, 'MODEL'),
        _s2('select', {
          className: 'tp-model-select',
          value: model,
          onChange: onModelChange,
          style: { width: '100%', padding: '8px 10px', borderRadius: 8, background: 'var(--glass)', color: 'var(--ink-1)', border: '1px solid var(--glass-edge)', fontFamily: 'var(--sans)', fontSize: 13 },
        }, models.map((m) => _s2('option', { key: m, value: m }, m))),
      ),
      state === 'saving' && _s2('div', { className: 'tp-apikey-status saving' },
        _s2('span', { className: 'spin' }), 'Verifying key…'),
      state === 'connected' && _s2('div', { className: 'tp-apikey-status ok' },
        _s2(S2I.CheckCircle, { size: 14 }), 'Connected · ' + _provName(provider) + (model ? ' · ' + model : '')),
      state === 'error' && _s2('div', { className: 'tp-apikey-status err' },
        _s2(S2I.XCircle, { size: 14 }), 'Invalid key — check the provider and try again'),
      state === 'empty' && _s2('div', { className: 'tp-set-sub', style: { padding: '9px 0 0' } },
        'Paste any provider key — we detect the vendor automatically. It stays on this machine and travels with your requests: never stored on our servers, never on disk, never logged.'),
    ),
  );
}

// ---------- CAD connections ----------
// id = the key returned by window.orynd.detectCad() / accepted by installAddin().
const CAD_APPS = [
  { id: 'solidworks', name: 'SolidWorks', logo: 'sw',     short: 'SW' },
  { id: 'fusion360',  name: 'Fusion 360', logo: 'fusion', short: 'F'  },
  { id: 'autocad',    name: 'AutoCAD',    logo: 'acad',   short: 'A'  },
];
// detected = array of running CAD keys; onConnect(id) installs the add-in.
function CadConnections({ detected = [], onConnect } = {}) {
  return _s2('div', { className: 'tp-set-group' },
    _s2('div', { className: 'tp-set-glabel' }, 'CAD CONNECTIONS'),
    CAD_APPS.map(a => {
      const connected = detected.indexOf(a.id) !== -1;
      return _s2('div', { className: 'tp-cadconn', key: a.id },
        _s2('span', { className: 'logo ' + a.logo }, a.short),
        _s2('div', { className: 'cmain' },
          _s2('div', { className: 'cname' }, a.name),
          _s2('div', { className: 'cstat ' + (connected ? 'on' : 'off') },
            _s2('span', { className: 'd' }), connected ? 'Connected' : 'Not connected'),
        ),
        connected
          ? _s2('span', { className: 'tp-cadconn-btn manage', style: { opacity: .6 } }, 'Running')
          : _s2('button', { className: 'tp-cadconn-btn connect', onClick: () => onConnect && onConnect(a.id) }, 'Install add-in'),
      );
    }),
  );
}

// ---------- Appearance ----------
function Appearance({ theme = 'dark', onTheme } = {}) {
  return _s2('div', { className: 'tp-set-group' },
    _s2('div', { className: 'tp-set-glabel' }, 'APPEARANCE'),
    _s2('div', { className: 'tp-themeseg' },
      _s2('button', { className: theme === 'dark' ? 'active' : '', onClick: () => onTheme && onTheme('dark') }, _s2(S2I.Moon, { size: 15 }), 'Dark'),
      _s2('button', { className: theme === 'light' ? 'active' : '', onClick: () => onTheme && onTheme('light') }, _s2(S2I.Sun, { size: 15 }), 'Light'),
    ),
  );
}

// ---------- full Settings v2 screen ----------
function SettingsV2({ light = false, llmState = 'empty', theme = 'dark', onBack, onSignOut, onSaveKey, user, onTheme, cadDetected = [], onConnect }) {
  const C = window.CAD;
  const u = user || {};
  const nameLine = u.name || u.email || 'Signed in';
  const showEmail = u.email && u.email !== nameLine;
  const planBadge = (u.plan || 'Free').toUpperCase();
  return _s2('div', { className: 'tp' + (light ? ' light' : ''), style: { width: '100%', height: '100%' } },
    _s2('div', { className: 'tp-shell' },
      _s2('div', { className: 'tp-backbar' },
        _s2('button', { className: 'tp-back', onClick: onBack }, _s2(S2I.ChevronR, { size: 16, style: { transform: 'scaleX(-1)' } })),
        _s2('span', { className: 'bt' }, 'Settings'),
      ),
      _s2('div', { className: 'tp-settings' },
        // account hero — real session identity
        _s2('div', { className: 'tp-acct' },
          _s2('span', { className: 'av' }, u.initials || 'U'),
          _s2('div', { className: 'who' },
            _s2('div', { className: 'n' }, nameLine),
            showEmail && _s2('div', { className: 'e' }, u.email),
          ),
          _s2('span', { className: 'tp-plan-badge' }, planBadge),
        ),
        // account actions
        _s2('div', { className: 'tp-set-group' },
          _s2('button', { className: 'tp-set-row', style: { width: '100%', background: 'none', border: 'none', cursor: 'pointer', borderBottom: '1px solid var(--glass-edge)' }, onClick: () => window.orynd && window.orynd.openExternal('https://oryndai.com/account#billing') },
            _s2('span', { className: 'tp-set-ico' }, _s2(S2I.Spark, { size: 16 })),
            _s2('div', { className: 'tp-set-main', style: { textAlign: 'left' } },
              _s2('div', { className: 'tp-set-title' }, 'Manage subscription'),
              _s2('div', { className: 'tp-set-sub' }, 'Billing, plan & invoices — opens site'),
            ),
            _s2(S2I.Arrow, { size: 15, style: { color: 'var(--ink-3)' } }),
          ),
          _s2('button', { className: 'tp-set-row', style: { width: '100%', background: 'none', border: 'none', cursor: 'pointer' }, onClick: onSignOut || undefined },
            _s2('span', { className: 'tp-set-ico', style: { color: 'var(--danger)' } }, _s2(S2I.Plug, { size: 16 })),
            _s2('div', { className: 'tp-set-main', style: { textAlign: 'left' } },
              _s2('div', { className: 'tp-set-title', style: { color: 'var(--danger)' } }, 'Sign out'),
            ),
          ),
        ),
        _s2(ApiKeyField, { initialState: llmState, onSaveKey }),
        _s2(CadConnections, { detected: cadDetected, onConnect }),
        _s2(Appearance, { theme, onTheme }),
      ),
    ),
  );
}

window.SETTINGS2 = { SettingsV2, ApiKeyField, CadConnections, Appearance, CAD_APPS };
