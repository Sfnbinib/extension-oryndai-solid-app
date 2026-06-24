# ORYND Extension — Test Checklist

## A. Testable NOW (local, no release/auth needed)
Run: `cd app && ORYND_BACKEND=http://3.86.214.175:8765 npm start`

- [ ] App launches; tray icon appears; window opens (no crash)
- [ ] Window loads OryndApp over http://127.0.0.1:8765 (not blank)
- [ ] Chat shows first-launch zero-state (orbit + "Describe the part you want" + 4 chips)
- [ ] Tabs switch: Chat / Overview / Library / Runs (no reload)
- [ ] Library/Runs/Overview show empty zero-states (no mock data)
- [ ] Suggestion chip → sends → switches to live chat with a reply
- [ ] Type in composer + Enter/send → user bubble + assistant reply from AWS
- [ ] Update banner is HIDDEN (no release exists yet)
- [ ] Close window → hides to tray; Quit from tray menu works
- [ ] (with a CAD app open) window auto-shows when Fusion/SolidWorks launches

## B. Needs BUILD before testable (not done yet)
- [ ] **Cut release** `git tag v0.1.0 && git push origin v0.1.0` → CI builds DMG+EXE
- [ ] Download DMG/EXE from Releases on 2nd machine; install
- [ ] **Onboarding / auth gate** (NEEDS sign-in design + wiring):
  - [ ] Logged-out → redirected to sign-in screen
  - [ ] "Continue with Google" / email → browser → Supabase login
  - [ ] Deep link `orynd://auth?token=…` returns to app; session stored
  - [ ] First run → prompt to enter API key → Connected state
  - [ ] Trial notification shown
- [ ] **Update flow**: publish v0.1.1 → banner appears → installs after 4 launches
- [ ] **MCP path** (NEEDS MCP design + backend):
  - [ ] Settings shows "Connect via MCP" + config
  - [ ] User's own Claude calls ORYND MCP tools → macro/file appears in Library/Runs
  - [ ] "MCP connected" indicator
- [ ] **Settings actions** wired: Manage subscription, Sign out, key save/test
- [ ] Real data indexing (zero the mock "Library 6" badge, etc.)
- [ ] App icon (real brand mark, not placeholder)
- [ ] Light theme + resizable/responsive window (400/560/720)

## Backend prerequisites
- [ ] AWS backend reachable: `curl http://3.86.214.175:8765/health` → {"status":"ok"}
- [ ] Supabase auth project configured (Google + email providers)
- [ ] orynd:// protocol registered by the installed app
