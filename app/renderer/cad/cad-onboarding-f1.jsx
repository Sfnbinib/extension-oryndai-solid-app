// cad-onboarding-f1.jsx — First-launch F1 showcase onboarding.
// Founder spec (knowledge_base/00_inbox/PLAN_v1_launch_credits_share_onboarding_2026-07-14.md §3):
//   - Fixed, non-editable prompts per part — the user COPIES the text themselves
//     and pastes it into the REAL chat composer (never auto-filled into the chat)
//     to preserve the "first result must succeed" guarantee (free-typed prompts
//     could fail decompose; a proven fixed string won't).
//   - This panel only OBSERVES the real chat pipeline (cad-app.jsx `send`) — when
//     a turn's exact text matches one of F1_PARTS' prompts and it didn't error,
//     that part gets checked off here. No separate/duplicate send path.
//   - Done enables only once every part is checked; clicking it fires ONE visible
//     "Assembling…" step (handled by OryndApp, not this file) before reveal.
//   - Whole flow = 1 credit; Skip (always visible) grants all 3 (local mock only —
//     the real Supabase generation_credits table is founder-guided, not built here).
//
// PLACEHOLDER CONTENT: the part titles/prompts below are plausible placeholders
// pending the founder's real reference photos + verified prompts — not final copy.

const _oh = React.createElement;
const OI = window.CADIcons;

const F1_PARTS = [
  { id: 'wheel',   title: 'Front wheel ×4',   prompt: 'F1 front wheel rim, 13 inch, 6-spoke, center-lock hub, 30mm width' },
  { id: 'wing',    title: 'Rear wing',         prompt: 'F1 rear wing, single element, 900mm span, DRS flap gap 10mm' },
  { id: 'nose',    title: 'Nosecone',          prompt: 'F1 nosecone, 900mm length, tapered profile, front crash structure mount' },
  { id: 'sidepod', title: 'Sidepod',           prompt: 'F1 sidepod, undercut inlet 250x150mm, radiator duct, 1400mm length' },
  { id: 'floor',   title: 'Floor & diffuser',  prompt: 'F1 floor edge with diffuser, venturi tunnel, 3-strake, 900mm width' },
  { id: 'halo',    title: 'Halo',              prompt: 'F1 halo cockpit protection, titanium tube, 3-point mount, FIA profile' },
];

const ASSEMBLE_PROMPT = 'Assemble all the parts above into the full F1 car';

function PartRow({ part, done, onCopy, justCopied }) {
  return _oh('div', { className: 'ob-part' + (done ? ' done' : '') },
    _oh('div', { className: 'ob-part-ic' }, done ? _oh(OI.Check, { size: 15 }) : _oh(OI.Circle, { size: 15 })),
    _oh('div', { className: 'ob-part-main' },
      _oh('div', { className: 'ob-part-title' }, part.title),
      _oh('div', { className: 'ob-part-prompt' }, part.prompt),
    ),
    _oh('button', {
      className: 'ob-copy' + (done ? ' disabled' : ''),
      title: 'Copy prompt', disabled: done,
      onClick: () => onCopy(part),
    }, justCopied ? 'Copied ✓' : 'Copy', !justCopied && _oh(OI.Copy, { size: 13 })),
  );
}

// `progress` = { [partId]: true } for parts already generated this session.
function F1OnboardingPanel({ progress = {}, onSkip, onDone, light }) {
  const [justCopiedId, setJustCopiedId] = React.useState(null);
  const doneCount = F1_PARTS.filter((p) => progress[p.id]).length;
  const allDone = doneCount === F1_PARTS.length;

  const copy = (part) => {
    if (navigator.clipboard) navigator.clipboard.writeText(part.prompt).catch(() => {});
    setJustCopiedId(part.id);
    setTimeout(() => setJustCopiedId((c) => (c === part.id ? null : c)), 1500);
  };

  return _oh('div', { className: 'ob-panel' + (light ? ' light' : '') },
    _oh('div', { className: 'ob-head' },
      _oh('div', { className: 'ob-head-title' }, 'Build your first F1 car — ', _oh('span', { className: 'em' }, doneCount + '/' + F1_PARTS.length)),
      _oh('div', { className: 'ob-head-sub' }, 'Copy each prompt, paste it into the chat below, and send. We’ll check it off once it builds.'),
    ),
    _oh('div', { className: 'ob-list' },
      F1_PARTS.map((p) => _oh(PartRow, {
        key: p.id, part: p, done: !!progress[p.id], onCopy: copy, justCopied: justCopiedId === p.id,
      })),
    ),
    _oh('div', { className: 'ob-foot' },
      _oh('button', { className: 'tp-auth-why', onClick: onSkip }, 'Skip — I’ll build my own'),
      _oh('button', {
        className: 'tp-btn' + (allDone ? '' : ' disabled'), disabled: !allDone, onClick: onDone,
      }, 'Done — assemble the car', _oh(OI.Arrow, { size: 14 })),
    ),
  );
}

// Full-pane "visible step" while the auto-fired assembly prompt is in flight —
// founder was explicit this must NOT be a silent background action.
function F1AssemblingOverlay() {
  return _oh('div', { className: 'ob-assembling' },
    _oh('span', { className: 'spin-ring', style: { width: 28, height: 28 } }),
    _oh('div', { style: { height: 16 } }),
    _oh('h2', { className: 'es-h' }, 'Assembling your ', _oh('span', { className: 'em' }, 'F1 car'), '…'),
    _oh('p', { className: 'es-p', style: { marginTop: 8 } }, 'Putting all six parts together into one model.'),
  );
}

window.ONBOARD = { F1_PARTS, ASSEMBLE_PROMPT, F1OnboardingPanel, F1AssemblingOverlay };
