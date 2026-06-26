// cad/cad-settings-v2.jsx — expanded Settings: Account, API key (4 states),
// CAD connections (3 apps), Appearance. Exported to window.SETTINGS2.

const _s2 = React.createElement;
const S2I = window.CADIcons;

// ---------- API KEY field (states: empty | saving | connected | error) ----------
function ApiKeyField({ initialState = 'empty', onSaveKey }) {
  const [state, setState] = React.useState(initialState);
  const [val, setVal] = React.useState('');

  const save = async () => {
    if (!val.trim()) return;
    setState('saving');
    try {
      const result = onSaveKey ? await onSaveKey(val.trim()) : { ok: false };
      setState(result && result.ok ? 'connected' : 'error');
      if (result && result.ok) setVal('');
    } catch {
      setState('error');
    }
  };

  const replace = () => { setState('empty'); setVal(''); };

  const masked = 'sk-ant-••••••••••••••••••••';
  return _s2('div', { className: 'tp-set-group' },
    _s2('div', { className: 'tp-set-glabel' }, 'ANTHROPIC API KEY'),
    _s2('div', { className: 'tp-apikey' },
      _s2('div', { className: 'tp-apikey-field ' + (state === 'connected' ? 'ok' : state === 'error' ? 'err' : '') },
        _s2(S2I.Lock, { size: 14, style: { color: 'var(--ink-3)', flex: '0 0 auto' } }),
        state === 'connected'
          ? _s2('input', { value: masked, readOnly: true, type: 'text' })
          : _s2('input', {
              placeholder: 'sk-ant-...',
              value: val,
              type: 'password',
              autoComplete: 'off',
              onChange: (e) => { setVal(e.target.value); if (state === 'error') setState('empty'); },
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
      state === 'saving' && _s2('div', { className: 'tp-apikey-status saving' },
        _s2('span', { className: 'spin' }), 'Verifying key…'),
      state === 'connected' && _s2('div', { className: 'tp-apikey-status ok' },
        _s2(S2I.CheckCircle, { size: 14 }), 'Connected · key verified'),
      state === 'error' && _s2('div', { className: 'tp-apikey-status err' },
        _s2(S2I.XCircle, { size: 14 }), 'Invalid key — check and try again'),
      state === 'empty' && _s2('div', { className: 'tp-set-sub', style: { padding: '9px 0 0' } },
        'Paste your Anthropic key. It stays on your device — never sent to our servers.'),
    ),
  );
}

// ---------- CAD connections ----------
const CAD_APPS = [
  { id: 'sw',     name: 'SolidWorks',  logo: 'sw',     short: 'SW', connected: true },
  { id: 'fusion', name: 'Fusion 360',  logo: 'fusion', short: 'F',  connected: false },
  { id: 'acad',   name: 'AutoCAD',     logo: 'acad',   short: 'A',  connected: false },
];
function CadConnections() {
  return _s2('div', { className: 'tp-set-group' },
    _s2('div', { className: 'tp-set-glabel' }, 'CAD CONNECTIONS'),
    CAD_APPS.map(a => _s2('div', { className: 'tp-cadconn', key: a.id },
      _s2('span', { className: 'logo ' + a.logo }, a.short),
      _s2('div', { className: 'cmain' },
        _s2('div', { className: 'cname' }, a.name),
        _s2('div', { className: 'cstat ' + (a.connected ? 'on' : 'off') },
          _s2('span', { className: 'd' }), a.connected ? 'Connected' : 'Not connected'),
      ),
      a.connected
        ? _s2('button', { className: 'tp-cadconn-btn manage' }, 'Disconnect')
        : _s2('button', { className: 'tp-cadconn-btn connect' }, 'Connect'),
    )),
  );
}

// ---------- Appearance ----------
function Appearance({ theme = 'dark' }) {
  return _s2('div', { className: 'tp-set-group' },
    _s2('div', { className: 'tp-set-glabel' }, 'APPEARANCE'),
    _s2('div', { className: 'tp-themeseg' },
      _s2('button', { className: theme === 'dark' ? 'active' : '' }, _s2(S2I.Moon, { size: 15 }), 'Dark'),
      _s2('button', { className: theme === 'light' ? 'active' : '' }, _s2(S2I.Sun, { size: 15 }), 'Light'),
    ),
  );
}

// ---------- full Settings v2 screen ----------
function SettingsV2({ light = false, llmState = 'empty', theme = 'dark', onBack, onSignOut, onSaveKey }) {
  const C = window.CAD;
  return _s2('div', { className: 'tp' + (light ? ' light' : ''), style: { width: '100%', height: '100%' } },
    _s2('div', { className: 'tp-shell' },
      _s2('div', { className: 'tp-backbar' },
        _s2('button', { className: 'tp-back', onClick: onBack }, _s2(S2I.ChevronR, { size: 16, style: { transform: 'scaleX(-1)' } })),
        _s2('span', { className: 'bt' }, 'Settings'),
      ),
      _s2('div', { className: 'tp-settings' },
        // account hero
        _s2('div', { className: 'tp-acct' },
          _s2('span', { className: 'av' }, 'SF'),
          _s2('div', { className: 'who' },
            _s2('div', { className: 'n' }, 'Savelij F.'),
            _s2('div', { className: 'e' }, 'savelij@orynd.ai'),
          ),
          _s2('span', { className: 'tp-plan-badge' }, 'PRO · TRIAL'),
        ),
        // account actions
        _s2('div', { className: 'tp-set-group' },
          _s2('button', { className: 'tp-set-row', style: { width: '100%', background: 'none', border: 'none', cursor: 'pointer', borderBottom: '1px solid var(--glass-edge)' }, onClick: () => window.orynd && window.orynd.openExternal('https://oryndai.com/billing') },
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
        _s2(CadConnections),
        _s2(Appearance, { theme }),
      ),
    ),
  );
}

window.SETTINGS2 = { SettingsV2, ApiKeyField, CadConnections, Appearance, CAD_APPS };
