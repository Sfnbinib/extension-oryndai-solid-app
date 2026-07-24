// cad/cad-popups.jsx — transient popup notifications: a compact top toast
// (reuses window.CAD.Toast, compact=true) + a center choice modal. These sit
// on top of whichever screen is active (position:fixed — see .tp-toasts-top /
// .tp-scrim in cad-theme.css), not tied to one specific view.
// Exported to window.POPUPS.

const _ph = React.createElement;
const PI = window.CADIcons;

// ---------- center choice modal ----------
function CenterModal({ kind = 'accent', icon, title, titleEm, body, ver, primary, secondary, note, onPrimary, onSecondary }) {
  return _ph('div', { className: 'tp-modal' },
    _ph('div', { className: 'tp-modal-ic ' + kind }, _ph(icon, { size: 24 })),
    _ph('h3', null, title, titleEm && _ph(React.Fragment, null, ' ', _ph('span', { className: 'em' }, titleEm))),
    body && _ph('p', null, body),
    ver && _ph('div', { className: 'ver' }, ver),
    _ph('div', { className: 'tp-modal-acts' },
      _ph('button', { className: 'tp-btn', onClick: onSecondary }, secondary || 'Cancel'),
      _ph('button', { className: 'tp-btn primary', onClick: onPrimary }, primary.icon && _ph(primary.icon, { size: 14 }), primary.label),
    ),
    note && _ph('div', { className: 'tp-modal-note' }, note),
  );
}

// ---------- overlay host — mount once per screen; sits on top via position:fixed ----------
// toast = { kind, icon, title, text, action } | null. modal = a preset object | null.
function PopupHost({ toast, onDismissToast, modal, onModalPrimary, onModalSecondary }) {
  const Toast = window.CAD && window.CAD.Toast;
  return _ph(React.Fragment, null,
    toast && Toast && _ph('div', { className: 'tp-toasts-top' },
      _ph(Toast, { ...toast, compact: true, onDismiss: onDismissToast })),
    modal && _ph('div', { className: 'tp-scrim' },
      _ph(CenterModal, { ...modal, onPrimary: onModalPrimary, onSecondary: onModalSecondary })),
  );
}

// ============================================================
// PRESETS — data only; the caller wires onPrimary/onSecondary/onDismiss
// with real handlers when actually firing one of these.
// ============================================================

// center modals — decisions the user must respond to
const M_UPDATE = {
  kind: 'accent', icon: PI.Refresh, title: 'Update', titleEm: 'available',
  body: 'A new version of ORYND CAD Bridge is ready to install.',
  secondary: 'Cancel', primary: { label: 'Refresh & Update', icon: PI.Download },
  note: 'The pane reloads after updating — your work is saved.',
};
// Not fired anywhere yet — no billing-status/trial-expiry check exists in this
// app. Kept as ready-to-use presets for when that backend source lands.
const M_SUB_ENDED = {
  kind: 'warn', icon: PI.Clock, title: 'Your subscription has', titleEm: 'ended',
  body: 'You’re back on Free — renew anytime.',
  secondary: 'Not now', primary: { label: 'Manage plan', icon: PI.Spark },
};
const M_TRIAL_END = {
  kind: 'accent', icon: PI.Spark, title: 'Trial ends in', titleEm: '4 hours',
  body: 'Keep unlimited builds and un-watermarked exports.',
  secondary: 'Later', primary: { label: 'Upgrade to Pro', icon: PI.Spark },
};
// Share V1 (founder): a line of text + a link, nothing uploaded. Said plainly here —
// "public" is about the message you paste, not about the part you just built.
const M_SHARE = {
  kind: 'accent', icon: PI.Send, title: 'Share this', titleEm: 'build',
  body: 'This will be public: we copy one line + a link to your clipboard, and you pick where it goes. The model files stay on this machine — we upload nothing.',
  secondary: 'Cancel', primary: { label: 'Copy link', icon: PI.Copy },
};

// top toasts — passive status that slides in at the top
const T_KEY     = { kind: 'ok', icon: PI.Key || PI.Lock, title: 'API key saved', text: 'BYO route available in the composer.' };
const T_CONNECT = (name) => ({ kind: 'accent', icon: PI.Plug, title: name + ' connected', text: 'Ready to run queued plans.' });
// Not fired anywhere yet — chat doesn't stream macro/build/export events.
const T_MACRO   = { kind: 'ok', icon: PI.Code, title: 'Macro ready', text: 'Awaiting approval.' };
const T_PART    = { kind: 'ok', icon: PI.Cube, title: 'Part ready', text: 'Built in CAD.' };
const T_EXPORT  = { kind: 'ok', icon: PI.Download, title: 'Export complete', text: 'Saved to Downloads.' };
const T_SUB_END = { kind: 'warn', icon: PI.Clock, title: 'Subscription ended', text: 'Renew in Manage to keep Pro.', action: 'Manage' };
const T_SHARE   = { kind: 'ok', icon: PI.Copy, title: 'Link copied', text: 'Paste it anywhere you like.' };
// First launch (founder): "уведомление, что у меня три бесплатных запроса есть, и
// цифра будет меняться". n comes from Supabase, never hardcoded — an account that
// already spent one must not be told it has three.
// The nudge (founder: «не назойливо, легко закрыть»). Fired by cad-app after a
// build actually worked — asking mid-failure would be tone-deaf — once per app
// session, and it sits for 20s instead of the usual 4 so it can be read and used.
// `ttl` is read by cad-app's toast timer; the caller supplies onAction.
const T_FEEDBACK = {
  kind: 'accent', icon: PI.Mail, title: 'How is ORYND doing?',
  text: 'Tell us what broke or what to build next.', action: 'Send feedback', ttl: 20000,
};
const T_WELCOME = (n) => ({
  kind: 'accent', icon: PI.Spark,
  title: `You have ${n} free build${n === 1 ? '' : 's'}`,
  text: 'The counter up top drops with every part you build. Questions and edits are free.',
});
// The pane also runs inside the CAD host's own webview, where the clipboard API can
// be unavailable — say where it does work instead of failing mutely.
const T_SHARE_FAIL = { kind: 'warn', icon: PI.Alert, title: 'Could not copy', text: 'The clipboard is blocked in this pane — try from the main ORYND window.' };

window.POPUPS = {
  CenterModal, PopupHost,
  modals: { M_UPDATE, M_SUB_ENDED, M_TRIAL_END, M_SHARE },
  toasts: { T_KEY, T_CONNECT, T_MACRO, T_PART, T_EXPORT, T_SUB_END, T_SHARE, T_SHARE_FAIL, T_WELCOME, T_FEEDBACK },
};
