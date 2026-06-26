// cad/cad-auth.jsx — sign-in gate, account chip + dropdown menu.
// Same dark theme/tokens/components. Exported to window.AUTH.

const _uh = React.createElement;
const UI = window.CADIcons;
const UC = window.CAD;

// ---------- Google glyph (brand 4-color) ----------
function GoogleGlyph({ size = 18 }) {
  return _uh('svg', { width: size, height: size, viewBox: '0 0 48 48' },
    _uh('path', { fill: '#FFC107', d: 'M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z' }),
    _uh('path', { fill: '#FF3D00', d: 'M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 16.3 4 9.7 8.3 6.3 14.7z' }),
    _uh('path', { fill: '#4CAF50', d: 'M24 44c5.5 0 10.5-2.1 14.3-5.5l-6.6-5.6C29.6 34.6 26.9 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.6 39.6 16.2 44 24 44z' }),
    _uh('path', { fill: '#1976D2', d: 'M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.6 5.6C39.9 36.7 44 31 44 24c0-1.3-.1-2.3-.4-3.5z' }),
  );
}

// ---------- SIGN-IN / LOGGED-OUT GATE ----------
function SignInScreen({ subtext, light, onSignIn } = {}) {
  return _uh('div', { className: 'tp' + (light ? ' light' : ''), style: { width: '100%', height: '100%' } },
    _uh('div', { className: 'tp-shell' },
      _uh('div', { className: 'tp-onb' },
        _uh('div', { className: 'tp-onb-grid' }),
        _uh('div', { className: 'tp-onb-glow' }),
        _uh('div', { className: 'tp-onb-inner', style: { justifyContent: 'center', alignItems: 'center', textAlign: 'center' } },
          _uh('div', { className: 'tp-auth-col' },
            _uh('div', { className: 'tp-onb-logo' },
              _uh('img', { src: 'cad/brand/orynd-orbit-white.png', alt: 'ORYND', style: { width: 30, height: 'auto' } })),
            _uh('h2', { className: 'tp-auth-h' }, 'Sign in to ', _uh('span', { className: 'em' }, 'ORYND')),
            _uh('p', { className: 'tp-auth-sub' },
              subtext || 'Your CAD copilot for SolidWorks. Sign in to sync parts, recipes, and your subscription.'),
            _uh('div', { className: 'tp-auth-btns' },
              _uh('button', { className: 'tp-oauth-btn', onClick: onSignIn || undefined },
                _uh(GoogleGlyph, { size: 18 }), 'Continue with Google'),
              _uh('button', { className: 'tp-oauth-btn', onClick: onSignIn || undefined },
                _uh(UI.Mail || UI.File, { size: 17 }), 'Continue with email'),
            ),
            _uh('div', { className: 'tp-auth-foot' },
              _uh(UI.Info, { size: 13 }),
              'You\u2019ll finish signing in in your browser.'),
            _uh('button', { className: 'tp-auth-why' }, 'Why sign in?'),
          ),
        ),
      ),
    ),
  );
}

// ---------- ACCOUNT CHIP (header) ----------
function AccountChip({ initials = 'SF', open = false, onClick }) {
  return _uh('button', { className: 'tp-acctchip' + (open ? ' open' : ''), onClick, title: 'Account' },
    _uh('span', { className: 'av' }, initials),
  );
}

// ---------- ACCOUNT DROPDOWN MENU ----------
function AccountMenu({ email = 'savelij@orynd.ai', plan = 'Pro · trial', onClose }) {
  return _uh('div', { className: 'tp-acctmenu' },
    _uh('div', { className: 'tp-acctmenu-head' },
      _uh('span', { className: 'av' }, 'SF'),
      _uh('div', { className: 'who' },
        _uh('div', { className: 'e' }, email),
        _uh('div', { className: 'pl' }, _uh('span', { className: 'tp-plan-badge', style: { fontSize: 9, padding: '2px 7px' } }, plan)),
      ),
    ),
    _uh('div', { className: 'tp-acctmenu-sep' }),
    _uh('button', { className: 'tp-acctmenu-item' }, _uh(UI.Spark, { size: 15 }), 'Manage subscription', _uh('span', { className: 'ext' }, _uh(UI.Arrow, { size: 13 }))),
    _uh('button', { className: 'tp-acctmenu-item' }, _uh(UI.Settings, { size: 15 }), 'Settings'),
    _uh('div', { className: 'tp-acctmenu-sep' }),
    _uh('button', { className: 'tp-acctmenu-item danger' }, _uh(UI.Plug, { size: 15 }), 'Sign out'),
  );
}

// ---------- header variant with the account chip + (optional) open menu ----------
function HeaderWithUser({ connection = 'connected', menuOpen = false }) {
  return _uh('div', { style: { position: 'relative' } },
    _uh('div', { className: 'tp-head' },
      _uh('div', { className: 'tp-logo' },
        _uh('div', { className: 'tp-mark' }, _uh('img', { src: 'cad/brand/orynd-orbit-white.png', alt: 'ORYND', style: { width: 16, height: 'auto', display: 'block' } })),
        _uh('span', { className: 'tp-name' }, _uh('b', null, 'ORYND'), ' CAD Bridge'),
      ),
      _uh('div', { className: 'tp-head-spacer' }),
      connection === 'offline'
        ? _uh('span', { className: 'tp-chip is-off' }, _uh('span', { className: 'dot' }), 'Offline')
        : _uh('span', { className: 'tp-chip is-ok is-live' }, _uh('span', { className: 'dot' }), 'Connected'),
      _uh(AccountChip, { open: menuOpen }),
    ),
    menuOpen && _uh(AccountMenu, {}),
  );
}

window.AUTH = { GoogleGlyph, SignInScreen, AccountChip, AccountMenu, HeaderWithUser };
