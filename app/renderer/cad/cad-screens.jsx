// cad-screens.jsx — the missing surfaces: Settings, Onboarding, Toasts, and a
// navigable shell header (Back arrow). Glass-soft, tall-narrow task-pane proportions.
// Merges into window.CAD; new scenarios via window.SCREEN_STATES.

const _sc = React.createElement;
const SI = window.CADIcons;

// ---------- sub-screen header with Back ----------
function SubHeader({ title, em, onBack }) {
  return _sc('div', { className: 'tp-subhead' },
    _sc('button', { className: 'tp-back', title: 'Back', onClick: onBack || undefined }, _sc(SI.Chevron, { size: 17, style: { transform: 'rotate(90deg)' } })),
    _sc('span', { className: 'tp-subhead-title' }, title, em && _sc(React.Fragment, null, ' ', _sc('span', { className: 'em' }, em))),
  );
}

// ---------- toggle ----------
function Switch({ on }) { return _sc('span', { className: 'tp-switch' + (on ? ' on' : '') }); }

// ---------- SETTINGS ----------
function SettingsScreen({ onBack }) {
  return _sc('div', { className: 'tp', style: { width: '100%', height: '100%' } },
    _sc('div', { className: 'tp-shell' },
      _sc(SubHeader, { title: 'Settings', onBack }),
      _sc('div', { className: 'tp-body', style: { paddingTop: 16 } },
        _sc('div', { className: 'tp-settings' },

          // subscription
          _sc('div', null,
            _sc('div', { className: 'tp-set-grouplabel' }, 'Subscription'),
            _sc('div', { className: 'tp-plan' },
              _sc('div', { className: 'tp-plan-top' },
                _sc('span', { className: 'tp-plan-badge' }, 'Trial'),
                _sc('span', { className: 'tp-plan-name' }, 'ORYND Pro'),
                _sc('span', { className: 'tp-plan-price' }, '$20/mo'),
              ),
              _sc('div', { className: 'tp-plan-meter' }, _sc('i', { style: { width: '78%' } })),
              _sc('div', { className: 'tp-plan-meta' },
                _sc('span', null, _sc('b', null, '18 hours'), ' left'),
                _sc('span', null, 'Renews Jun 21'),
              ),
              _sc('button', { className: 'tp-btn primary block', style: { marginTop: 13 } }, _sc(SI.Spark, { size: 14 }), 'Upgrade now — keep Pro'),
            ),
          ),

          // account
          _sc('div', null,
            _sc('div', { className: 'tp-set-grouplabel' }, 'Account'),
            _sc('div', { className: 'tp-set-card' },
              _sc('div', { className: 'tp-set-row' },
                _sc('span', { className: 'tp-set-ic' }, _sc(SI.Account, { size: 17 })),
                _sc('div', { className: 'tp-set-main' }, _sc('div', { className: 'tp-set-title' }, 'Savelij F.'), _sc('div', { className: 'tp-set-sub mono' }, 'savelij@orynd.com')),
                _sc('div', { className: 'tp-set-right' }, _sc('button', { className: 'tp-btn ghost sm' }, 'Manage')),
              ),
            ),
          ),

          // model routing
          _sc('div', null,
            _sc('div', { className: 'tp-set-grouplabel' }, 'Model routing'),
            _sc('div', { className: 'tp-set-card' },
              _sc('div', { className: 'tp-set-row', style: { display: 'block' } },
                _sc('div', { style: { display: 'flex', alignItems: 'center', gap: 12 } },
                  _sc('span', { className: 'tp-set-ic' }, _sc(SI.Brain, { size: 17 })),
                  _sc('div', { className: 'tp-set-main' }, _sc('div', { className: 'tp-set-title' }, 'Default route'), _sc('div', { className: 'tp-set-sub' }, 'Where requests are planned')),
                ),
                _sc('div', { className: 'tp-seg' },
                  _sc('button', { className: 'active' }, 'ORYND Cloud'),
                  _sc('button', null, 'BYO key'),
                  _sc('button', null, 'Local'),
                ),
              ),
              _sc('div', { className: 'tp-set-row', style: { display: 'block' } },
                _sc('div', { style: { display: 'flex', alignItems: 'center', gap: 12 } },
                  _sc('span', { className: 'tp-set-ic' }, _sc(SI.Key, { size: 16 })),
                  _sc('div', { className: 'tp-set-main' }, _sc('div', { className: 'tp-set-title' }, 'Anthropic API key'), _sc('div', { className: 'tp-set-sub' }, 'Used for BYO Claude route')),
                ),
                _sc('div', { className: 'tp-keyfield' },
                  _sc('span', { className: 'key' }, 'sk-ant-•••• •••• •••• 7f3a'),
                  _sc('span', { className: 'keyok' }, _sc(SI.CheckCircle, { size: 15 })),
                  _sc('span', { className: 'keyedit' }, _sc(SI.Edit, { size: 14 })),
                ),
              ),
              _sc('div', { className: 'tp-set-row', style: { display: 'block' } },
                _sc('div', { style: { display: 'flex', alignItems: 'center', gap: 12 } },
                  _sc('span', { className: 'tp-set-ic' }, _sc(SI.Key, { size: 16 })),
                  _sc('div', { className: 'tp-set-main' }, _sc('div', { className: 'tp-set-title' }, 'OpenAI API key'), _sc('div', { className: 'tp-set-sub' }, 'Not set')),
                ),
                _sc('div', { className: 'tp-keyfield' },
                  _sc('span', { className: 'key', style: { color: 'var(--ink-3)' } }, 'sk-••••  — add a key'),
                  _sc('span', { className: 'keyedit' }, _sc(SI.Plus, { size: 14 })),
                ),
              ),
            ),
          ),

          // CAD connection
          _sc('div', null,
            _sc('div', { className: 'tp-set-grouplabel' }, 'CAD connection'),
            _sc('div', { className: 'tp-set-card' },
              _sc('div', { className: 'tp-set-row' },
                _sc('span', { className: 'tp-set-ic' }, _sc(SI.Plug, { size: 16 })),
                _sc('div', { className: 'tp-set-main' }, _sc('div', { className: 'tp-set-title' }, 'SolidWorks 2026'), _sc('div', { className: 'tp-set-sub mono' }, 'Bridge v0.9.4 · localhost:7311')),
                _sc('div', { className: 'tp-set-right' }, _sc('span', { className: 'tp-pill done' }, _sc('span', { className: 'd' }), 'Live')),
              ),
              _sc('div', { className: 'tp-set-row' },
                _sc('span', { className: 'tp-set-ic' }, _sc(SI.Shield, { size: 16 })),
                _sc('div', { className: 'tp-set-main' }, _sc('div', { className: 'tp-set-title' }, 'Require approval before run'), _sc('div', { className: 'tp-set-sub' }, 'Never execute a macro unprompted')),
                _sc('div', { className: 'tp-set-right' }, _sc(Switch, { on: true })),
              ),
            ),
          ),

          // preferences
          _sc('div', null,
            _sc('div', { className: 'tp-set-grouplabel' }, 'Preferences'),
            _sc('div', { className: 'tp-set-card' },
              _sc('div', { className: 'tp-set-row' },
                _sc('span', { className: 'tp-set-ic' }, _sc(SI.Bell, { size: 16 })),
                _sc('div', { className: 'tp-set-main' }, _sc('div', { className: 'tp-set-title' }, 'Notifications'), _sc('div', { className: 'tp-set-sub' }, 'Build done, trial, errors')),
                _sc('div', { className: 'tp-set-right' }, _sc(Switch, { on: true })),
              ),
              _sc('div', { className: 'tp-set-row' },
                _sc('span', { className: 'tp-set-ic' }, _sc(SI.Refresh, { size: 16 })),
                _sc('div', { className: 'tp-set-main' }, _sc('div', { className: 'tp-set-title' }, 'Auto-update bridge'), _sc('div', { className: 'tp-set-sub mono' }, 'v0.9.4 · up to date')),
                _sc('div', { className: 'tp-set-right' }, _sc(Switch, { on: true })),
              ),
            ),
          ),

          _sc('button', { className: 'tp-btn ghost block', style: { color: 'var(--danger)' } }, _sc(SI.Power, { size: 14 }), 'Sign out'),
        ),
      ),
    ),
  );
}

// ---------- TOASTS ----------
// compact = single-line top-anchored variant (see .tp-toasts-top in cad-theme.css).
// onAction: optional — without it the action line stays what it always was, a label.
function Toast({ kind = 'accent', icon, title, text, action, onAction, dismissable = true, compact = false, onDismiss }) {
  return _sc('div', { className: 'tp-toast ' + (compact ? 'compact ' : '') + kind },
    _sc('span', { className: 'tic' }, _sc(icon, { size: compact ? 16 : 17 })),
    _sc('div', { className: 'tp-toast-main' },
      _sc('div', { className: 'tp-toast-title' }, title),
      text && _sc('div', { className: 'tp-toast-text' }, text),
      action && _sc('span', {
        className: 'tp-toast-act',
        onClick: onAction || undefined,
        role: onAction ? 'button' : undefined,
        style: onAction ? { cursor: 'pointer' } : undefined,
      }, action, ' ', _sc(SI.Arrow, { size: 13 })),
    ),
    dismissable && _sc('button', { className: 'tp-toast-x', onClick: onDismiss }, _sc(SI.X, { size: 13 })),
  );
}

// a chat pane with toasts overlaid — reuses the real shell
function ToastDemo({ toasts, scenarioKey = 'completed' }) {
  const s = window.SCENARIOS[scenarioKey];
  return _sc('div', { className: 'tp', style: { width: '100%', height: '100%' } },
    _sc('div', { className: 'tp-shell' },
      _sc(window.CAD.Header, { connection: s.connection, route: s.route }),
      s.session && _sc(window.CAD.ChatSessionHeader, { ...s.session }),
      _sc('div', { className: 'tp-body' }, (s.blocks || []).map(window.__renderBlock)),
      _sc('div', { className: 'tp-toasts' }, toasts.map((t, i) => _sc(Toast, { key: i, ...t }))),
      _sc(window.CAD.Composer, { route: s.route }),
    ),
  );
}

// ---------- ONBOARDING ----------
function OnbShell({ step, total = 4, children }) {
  return _sc('div', { className: 'tp', style: { width: '100%', height: '100%' } },
    _sc('div', { className: 'tp-shell' },
      _sc('div', { className: 'tp-onb' },
        _sc('div', { className: 'tp-onb-glow' }),
        _sc('div', { className: 'tp-onb-body' },
          _sc('div', { className: 'tp-onb-steps' },
            Array.from({ length: total }).map((_, i) =>
              _sc('span', { key: i, className: 'tp-onb-pip' + (i < step ? ' done' : i === step ? ' active' : '') }))),
          children,
        ),
      ),
    ),
  );
}

function OnbSignIn() {
  return _sc(OnbShell, { step: 0 },
    _sc('div', { className: 'tp-onb-logo' }, _sc('img', { src: 'cad/brand/orynd-orbit-white.png', alt: 'ORYND', style: { width: 30, height: 'auto' } })),
    _sc('h1', null, 'Build the way ', _sc('span', { className: 'em' }, 'you'), ' think'),
    _sc('p', { className: 'lede' }, 'History-first AI CAD, right inside SolidWorks. Sign in to sync your library and runs.'),
    _sc('div', { className: 'tp-oauth' },
      _sc('button', { className: 'tp-oauth-btn primary' }, _sc(SI.Account, { size: 17 }), 'Continue with Google'),
      _sc('button', { className: 'tp-oauth-btn' }, _sc(SI.Cube, { size: 16 }), 'Continue with Apple'),
      _sc('button', { className: 'tp-oauth-btn' }, _sc(SI.Code, { size: 16 }), 'Continue with GitHub'),
    ),
    _sc('div', { className: 'tp-onb-or' }, 'or'),
    _sc('div', { className: 'tp-onb-field' }, _sc(SI.Mail, { size: 16 }), 'you@studio.com'),
    _sc('div', { className: 'tp-onb-foot' },
      _sc('button', { className: 'tp-btn primary block' }, 'Continue with email'),
      _sc('p', { className: 'tp-onb-fineprint', style: { marginTop: 12 } }, 'No card to start · your files stay local'),
    ),
  );
}

function OnbConnect() {
  return _sc(OnbShell, { step: 1 },
    _sc('div', { className: 'tp-onb-logo' }, _sc(SI.Plug, { size: 24, stroke: 2 })),
    _sc('h1', null, 'Connect ', _sc('span', { className: 'em' }, 'SolidWorks')),
    _sc('p', { className: 'lede' }, 'ORYND talks to a local bridge add-in. We found your install — start it to continue.'),
    _sc('div', { className: 'tp-connstat ok' },
      _sc('span', { className: 'cdot' }, _sc(SI.CheckCircle, { size: 20 })),
      _sc('div', { className: 'cmain' }, _sc('div', { className: 'ctitle' }, 'SolidWorks 2026 detected'), _sc('div', { className: 'csub' }, 'C:\\…\\SLDWORKS.exe')),
    ),
    _sc('div', { className: 'tp-connstat wait' },
      _sc('span', { className: 'cdot' }, _sc(SI.Refresh, { size: 19 })),
      _sc('div', { className: 'cmain' }, _sc('div', { className: 'ctitle' }, 'Starting bridge…'), _sc('div', { className: 'csub' }, 'localhost:7311 · handshake')),
    ),
    _sc('div', { className: 'tp-onb-foot' },
      _sc('button', { className: 'tp-btn primary block' }, _sc(SI.Plug, { size: 14 }), 'Connect bridge'),
      _sc('p', { className: 'tp-onb-fineprint', style: { marginTop: 12 } }, 'Trouble? ', _sc('a', { href: '#' }, 'Install the add-in manually')),
    ),
  );
}

function OnbRoute() {
  return _sc(OnbShell, { step: 2 },
    _sc('div', { className: 'tp-onb-logo' }, _sc(SI.Brain, { size: 24, stroke: 2 })),
    _sc('h1', null, 'Choose your ', _sc('span', { className: 'em' }, 'engine')),
    _sc('p', { className: 'lede' }, 'Use ORYND Cloud for the best quality, or bring your own model key. You can change this anytime.'),
    _sc('div', { style: { display: 'flex', flexDirection: 'column', gap: 10 } },
      _sc('div', { className: 'tp-connstat ok', style: { marginBottom: 0, borderColor: 'var(--accent-line)', background: 'var(--accent-soft)' } },
        _sc('span', { className: 'cdot', style: { background: 'var(--accent-soft)', color: 'var(--accent)' } }, _sc(SI.Spark, { size: 19 })),
        _sc('div', { className: 'cmain' }, _sc('div', { className: 'ctitle' }, 'ORYND Cloud'), _sc('div', { className: 'csub', style: { fontFamily: 'var(--sans)', color: 'var(--ink-2)' } }, 'Recommended · included in trial')),
        _sc('span', { className: 'ptick', style: { color: 'var(--accent)' } }, _sc(SI.CheckCircle, { size: 18 })),
      ),
      _sc('div', { className: 'tp-keyfield', style: { marginTop: 0 } },
        _sc(SI.Key, { size: 15, style: { color: 'var(--ink-3)' } }),
        _sc('span', { className: 'key', style: { color: 'var(--ink-3)' } }, 'Paste Anthropic / OpenAI key (optional)'),
      ),
    ),
    _sc('div', { className: 'tp-onb-foot' },
      _sc('button', { className: 'tp-btn primary block' }, 'Continue'),
    ),
  );
}

function OnbTrial() {
  return _sc(OnbShell, { step: 3 },
    _sc('div', { className: 'tp-trialcard' },
      _sc('div', { className: 'tp-onb-logo', style: { margin: '0 auto 18px' } }, _sc(SI.Spark, { size: 24, stroke: 2 })),
      _sc('div', { className: 'big' }, _sc('span', { className: 'em' }, 'One'), ' day free'),
      _sc('p', { className: 'lede', style: { marginTop: 8 } }, 'Then $20/mo. Cancel anytime — no charge during the trial.'),
    ),
    _sc('div', { className: 'tp-trialfeat' },
      _sc('div', { className: 'tp-trialfeat-row' }, _sc('span', { className: 'ic' }, _sc(SI.Check, { size: 16 })), 'Unlimited builds & STEP exports'),
      _sc('div', { className: 'tp-trialfeat-row' }, _sc('span', { className: 'ic' }, _sc(SI.Check, { size: 16 })), 'No export watermark'),
      _sc('div', { className: 'tp-trialfeat-row' }, _sc('span', { className: 'ic' }, _sc(SI.Check, { size: 16 })), 'Reusable macro recipes & history'),
      _sc('div', { className: 'tp-trialfeat-row' }, _sc('span', { className: 'ic' }, _sc(SI.Check, { size: 16 })), 'Priority ORYND Cloud routing'),
    ),
    _sc('div', { className: 'tp-onb-foot' },
      _sc('button', { className: 'tp-btn primary block' }, _sc(SI.Spark, { size: 14 }), 'Start one-day free trial'),
      _sc('p', { className: 'tp-onb-fineprint', style: { marginTop: 12 } }, 'No card required today'),
    ),
  );
}

Object.assign(window.CAD = window.CAD || {}, { SubHeader, SettingsScreen, Toast, SettingsSwitch: Switch });

window.SCREENS = {
  settings: SettingsScreen,
  onb_signin: OnbSignIn,
  onb_connect: OnbConnect,
  onb_route: OnbRoute,
  onb_trial: OnbTrial,
  toast_trial_start: () => _sc(ToastDemo, { scenarioKey: 'completed', toasts: [
    { kind: 'ok', icon: SI.Spark, title: 'Trial started', text: [_sc('span', { key: 'a', style: { fontFamily: 'var(--serif)', fontStyle: 'italic', color: 'var(--accent)' } }, 'One'), ' day of Pro unlocked — unlimited builds & un-watermarked exports.'] },
  ] }),
  toast_trial_ending: () => _sc(ToastDemo, { scenarioKey: 'preview', toasts: [
    { kind: 'warn', icon: SI.Clock, title: 'Trial ends in 4 hours', text: 'Keep recipes, history and un-watermarked STEP exports.', action: 'Upgrade to Pro' },
  ] }),
  toast_key_saved: () => _sc(ToastDemo, { scenarioKey: 'planning', toasts: [
    { kind: 'ok', icon: SI.Key, title: 'API key saved', text: 'BYO Claude route is now available in the composer.' },
  ] }),
  toast_trial_ended: () => _sc(ToastDemo, { scenarioKey: 'completed', toasts: [
    { kind: 'accent', icon: SI.Bolt, title: 'Trial ended', text: 'You\'re back on Free — 3 builds/day, watermarked exports.', action: 'Renew Pro · $20/mo' },
  ] }),
};

window.SCREEN_GROUPS = [
  { title: 'Onboarding', subtitle: 'First run · sign in → connect → engine → trial', items: [
    ['onb_signin', 'Sign in / register'], ['onb_connect', 'Connect SolidWorks'],
    ['onb_route', 'Choose engine / key'], ['onb_trial', 'Start trial'],
  ] },
  { title: 'Settings & notifications', subtitle: 'Account, subscription, routing, keys — plus on-screen toasts', items: [
    ['settings', 'Settings'],
    ['toast_trial_start', 'Toast · trial started'],
    ['toast_trial_ending', 'Toast · trial ending'],
    ['toast_key_saved', 'Toast · key saved'],
    ['toast_trial_ended', 'Toast · trial ended'],
  ] },
];
