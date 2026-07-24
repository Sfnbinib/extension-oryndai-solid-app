/**
 * ORYND Bridge (Node, in-process) — thin HTTP proxy on 127.0.0.1:8765.
 * Self-contained: no Python needed. Forwards CAD add-in requests to the
 * ORYND backend. Holds NO ORYND algorithms.
 */
const http = require('node:http')
const https = require('node:https')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { URL } = require('node:url')
const projects = require('./projects_store')

// Two addresses since the 18.07 split: COMPUTE (chat/search/mesh/cad/mcp) moved to the
// dop-server, MONEY (/api/billing/me) stayed on the site backend. api.oryndai.com now
// answers 404 for compute — pointing everything there leaves the panel dead.
// Override either with ORYND_BACKEND / ORYND_BILLING_BACKEND (no rebuild needed).
// TODO(prod): swap the raw IP for https://dop.oryndai.com once DNS + nginx:443 are up.
const DEFAULT_BACKEND = process.env.ORYND_BACKEND || 'http://3.86.214.175:8765'
const BILLING_BACKEND = process.env.ORYND_BILLING_BACKEND || 'https://api.oryndai.com'

// PUBLIC endpoint an EXTERNAL MCP client (claude.ai / Claude Desktop) connects to.
// claude.ai refuses http remote connectors, so this MUST be https — it goes through the
// Cloudflare tunnel (mcp.oryndai.com) → Virginia. Deliberately SEPARATE from DEFAULT_BACKEND:
// the app's own calls stay on the direct backend (no need for the public host + its CDN /
// bot-check on Node fetches). Override for the local-bridge topology via ORYND_MCP_PUBLIC_URL
// (e.g. http://127.0.0.1:8765/mcp).
const MCP_PUBLIC_URL = process.env.ORYND_MCP_PUBLIC_URL || 'https://mcp.oryndai.com/mcp'

// Which build this is — attached to feedback so a bug report says what it ran on.
const APP_VERSION = (() => {
  try { return require('./package.json').version || '' } catch { return '' }
})()

// Relayed Supabase session — the ONE thing every surface (main window, Fusion/
// SolidWorks/AutoCAD embedded palette) shares is this bridge process. Each of
// those surfaces is a DIFFERENT browser engine (Electron's Chromium vs the
// host CAD's own embedded webview) hitting the same 127.0.0.1:8765 origin —
// same origin, but separate localStorage per engine, so signing in on one
// does NOT automatically show as signed-in on the other. Relaying the token
// pair through here lets any surface adopt the session set by any other surface.
// founder requirement 2026-07-14: "одна сессия... любой запрос... должен дойти".
//
// PERSISTED to userData (founder MVP requirement 2026-07-24: "не терять логин при
// перезапуске приложения"). Previously this lived in memory only, so restarting
// the app — or the bridge — dropped every surface back to the sign-in gate. It is
// the user's OWN session on the user's OWN machine — the same trust level as the
// Supabase session the renderer already keeps in localStorage — written owner-only
// (0600) and never logged. Cleared on a real sign-out. The LLM key (_llm) below is
// deliberately NOT persisted here: a raw provider key on disk needs the OS keychain,
// which is tracked separately.
let _session = null // { access_token, refresh_token, user } | null

// userData dir for session persistence — set by startBridge() from Electron's app
// path. Null when the bridge runs outside Electron (tests) → persistence no-ops.
let _userDataDir = null
function _sessionFile() {
  return _userDataDir ? path.join(_userDataDir, 'session.json') : null
}
// Best-effort: a persistence hiccup must never break the sign-in that just happened.
function persistSession(sess) {
  const f = _sessionFile()
  if (!f) return
  try {
    if (sess && sess.access_token) fs.writeFileSync(f, JSON.stringify(sess), { mode: 0o600 })
    else fs.rmSync(f, { force: true })
  } catch { /* ignore — auth still works this session, just won't survive restart */ }
}
function loadPersistedSession() {
  const f = _sessionFile()
  if (!f) return null
  try {
    const s = JSON.parse(fs.readFileSync(f, 'utf8'))
    return s && s.access_token ? s : null
  } catch { return null }
}

// The user's own LLM key — kept HERE, in this process, on the user's own machine.
// The backend is one process shared by every install: we used to hand it the key
// to hold (POST /llm/key → its env), which meant the next user's chat ran on it,
// or overwrote it. Now the backend only CHECKS a key, and this bridge sends it
// with each /chat as X-LLM-* headers, so it never rests anywhere but here.
// In-memory only — never disk, never logged, never handed back to the renderer.
let _llm = null // { key, provider, model, verified } | null

// The BYO provider key is sensitive → when persisted it is ENCRYPTED at rest via the
// OS keychain (Electron safeStorage, injected by startBridge), never plaintext.
// Founder decision 2026-07-24: persist so the key survives an app restart (no re-paste),
// same as the session. If no keychain is available (tests, or Linux without a backend)
// we simply SKIP persistence rather than downgrade to a plaintext key on disk.
let _safeStorage = null
function _keyFile() {
  return _userDataDir ? path.join(_userDataDir, 'llm-key.enc') : null
}
function persistLlm(llm) {
  const f = _keyFile()
  if (!f || !_safeStorage || !_safeStorage.isEncryptionAvailable()) return
  try {
    if (llm && llm.key) fs.writeFileSync(f, _safeStorage.encryptString(JSON.stringify(llm)), { mode: 0o600 })
    else fs.rmSync(f, { force: true })
  } catch { /* ignore — key still works this session, just won't survive restart */ }
}
function loadPersistedLlm() {
  const f = _keyFile()
  if (!f || !_safeStorage || !_safeStorage.isEncryptionAvailable()) return null
  try {
    const llm = JSON.parse(_safeStorage.decryptString(fs.readFileSync(f)))
    return llm && llm.key ? llm : null
  } catch { return null }
}

// anthropic|openai|gemini|groq → the composer route that key unlocks (/llm/status shape).
const _ROUTE_OF_PROVIDER = { anthropic: 'Claude', openai: 'OpenAI', gemini: 'Gemini', groq: 'Groq' }

/** Per-request BYO credentials for /chat. {} when the user has no key of their own. */
function llmHeaders() {
  if (!_llm || !_llm.key) return {}
  return {
    'X-LLM-Key': _llm.key,
    'X-LLM-Provider': _llm.provider || 'anthropic',
    ...(_llm.model ? { 'X-LLM-Model': _llm.model } : {}),
  }
}

// Client-side diagnostic trail — the Fusion-embedded palette is a black box we
// can't open devtools on directly. The renderer POSTs a line here at each step
// of session bootstrapping so we can `curl /api/debug-log` and see exactly
// where it stalls, instead of guessing from screenshots. Capped ring buffer,
// in-memory only, cleared on bridge restart.
const _debugLog = []
function _pushDebugLog(msg) {
  _debugLog.push(`${new Date().toISOString()} ${msg}`)
  if (_debugLog.length > 200) _debugLog.shift()
}

// Headless output: built models (STL/STEP/OBJ) are pulled from the backend to a
// local project folder even when no CAD window is open, so the files can be
// opened later in Fusion/SolidWorks on any machine.
const PROJECT_DIR = process.env.ORYND_PROJECT_DIR
  || path.join(os.homedir(), 'Documents', 'ORYND', 'projects')

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.jsx': 'text/babel; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
}

const CLOUD_DESIGN_HTML = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><title>ORYND</title>
<style>
  body{margin:0;font-family:-apple-system,sans-serif;background:#0f1117;color:#e2e8f0;
       display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh}
  h2{font-size:18px;margin-bottom:6px}p{font-size:13px;color:#64748b}
  input{width:320px;padding:10px 14px;border-radius:8px;border:1px solid #334155;
        background:#1e293b;color:#e2e8f0;font-size:14px;outline:none}
  button{margin-top:10px;padding:10px 24px;border-radius:8px;background:#6366f1;color:#fff;
         border:none;font-size:14px;cursor:pointer}button:hover{background:#4f46e5}
  #status{margin-top:14px;font-size:13px;color:#94a3b8;min-height:20px}
</style></head><body>
  <h2>ORYND CAD Bridge</h2><p>Type a prompt and press Generate</p>
  <input id="prompt" placeholder="Create a bracket 80 x 40 x 20 mm…"/>
  <button onclick="generate()">Generate</button><div id="status"></div>
<script>
async function generate(){
  const p=document.getElementById('prompt').value.trim();if(!p)return;
  const el=document.getElementById('status');el.textContent='Working…';
  try{const r=await fetch('/api/generate',{method:'POST',
    headers:{'Content-Type':'application/json'},body:JSON.stringify({prompt:p})});
    // /api/generate now streams NDJSON — read it line by line.
    const reader=r.body.getReader();const dec=new TextDecoder();let buf='',text='',status='';
    for(;;){const{done,value}=await reader.read();if(done)break;buf+=dec.decode(value,{stream:true});
      let nl;while((nl=buf.indexOf('\\n'))>=0){const line=buf.slice(0,nl).trim();buf=buf.slice(nl+1);
        if(!line)continue;try{const ev=JSON.parse(line);
          if(ev.type==='text')text+=ev.content||'';
          else if(ev.type==='agent_call')status='· '+ev.agent+'…';
          else if(ev.type==='error')text=ev.message||text;
          el.textContent=text||status;}catch(_){}}}
    el.textContent=text||'(no text)';
  }catch(e){el.textContent='Bridge error: '+e.message}}
document.getElementById('prompt').addEventListener('keydown',e=>{if(e.key==='Enter')generate()});
</script></body></html>`

function forward(method, path, bodyObj, extraHeaders, backendUrl) {
  return new Promise((resolve) => {
    let backend
    try {
      backend = new URL(backendUrl || DEFAULT_BACKEND)
    } catch {
      return resolve([502, { error: 'invalid backend url' }])
    }
    const lib = backend.protocol === 'https:' ? https : http
    const data = bodyObj ? Buffer.from(JSON.stringify(bodyObj)) : null
    const req = lib.request(
      {
        hostname: backend.hostname,
        port: backend.port || (backend.protocol === 'https:' ? 443 : 80),
        path: backend.pathname.replace(/\/$/, '') + path,
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(data ? { 'Content-Length': data.length } : {}),
          ...(extraHeaders || {}),
        },
        timeout: 60000,
      },
      (res) => {
        let chunks = ''
        res.on('data', (c) => (chunks += c))
        res.on('end', () => {
          try {
            resolve([res.statusCode || 200, JSON.parse(chunks || '{}')])
          } catch {
            resolve([res.statusCode || 200, { raw: chunks }])
          }
        })
      },
    )
    req.on('error', (e) => resolve([502, { error: e.message }]))
    req.on('timeout', () => {
      req.destroy()
      resolve([504, { error: 'backend timeout' }])
    })
    if (data) req.write(data)
    req.end()
  })
}

// Binary-safe GET from the backend → local file. Resolves saved path or null.
function download(urlPath, destFile) {
  return new Promise((resolve) => {
    let backend
    try {
      backend = new URL(DEFAULT_BACKEND)
    } catch {
      return resolve(null)
    }
    const lib = backend.protocol === 'https:' ? https : http
    const req = lib.request(
      {
        hostname: backend.hostname,
        port: backend.port || (backend.protocol === 'https:' ? 443 : 80),
        path: backend.pathname.replace(/\/$/, '') + urlPath,
        method: 'GET',
        timeout: 60000,
      },
      (res) => {
        if (res.statusCode !== 200) {
          res.resume()
          return resolve(null)
        }
        const out = fs.createWriteStream(destFile)
        res.pipe(out)
        out.on('finish', () => out.close(() => resolve(destFile)))
        out.on('error', () => resolve(null))
      },
    )
    req.on('error', () => resolve(null))
    req.on('timeout', () => { req.destroy(); resolve(null) })
    req.end()
  })
}

// Pull model_ready artifact URLs out of the /chat NDJSON stream.
function extractModelUrls(data) {
  if (!data || typeof data.raw !== 'string') return null
  for (const line of data.raw.split('\n')) {
    const t = line.trim()
    if (!t) continue
    try {
      const ev = JSON.parse(t)
      // A build ships all three (stl/step/obj); a catalog part (find_standard_part)
      // ships STEP only. Trigger on ANY artifact url so a found bearing/screw also
      // gets a downloadable file card, not just plain text.
      if (ev.type === 'model_ready' && (ev.stl_url || ev.step_url || ev.obj_url)) {
        return { stl: ev.stl_url || null, step: ev.step_url || null, obj: ev.obj_url || null }
      }
    } catch { /* skip non-JSON line */ }
  }
  return null
}

// Project folder layout, one per chat:
//   <project>/input/    what the user attached (photos, blueprints)
//   <project>/output/   what came back from the server
//   <project>/chat.json + .orynd/  written by the main process
const projectRoot = (sessionId) =>
  path.join(PROJECT_DIR, String(sessionId || 'default').replace(/[^a-zA-Z0-9._-]/g, '_'))

/**
 * File name from what the user actually asked for. `part.step` twelve times over
 * is unusable in Finder — the whole point is dragging the right file into Fusion
 * without opening each one to find out which is which.
 */
function slugFromText(text, fallback = 'part') {
  const s = String(text || '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
    .replace(/-+$/, '')
  return s || fallback
}

// Never overwrite an earlier build: the second gear becomes gear-2.step, not a
// silent replacement of the first one.
function freeName(dir, base, ext) {
  let name = `${base}.${ext}`
  let n = 2
  while (fs.existsSync(path.join(dir, name))) {
    name = `${base}-${n}.${ext}`
    n += 1
  }
  return path.join(dir, name)
}

// Headless save: download built artifacts into the project's output folder.
// Fail-soft — a download problem never breaks the chat reply.
async function saveModelFiles(sessionId, urls, promptText) {
  if (!urls) return null
  const dir = path.join(projectRoot(sessionId), 'output')
  try {
    fs.mkdirSync(dir, { recursive: true })
  } catch {
    return null
  }
  const base = slugFromText(promptText)
  const saved = {}
  for (const ext of ['stl', 'step', 'obj']) {
    if (!urls[ext]) continue
    saved[ext] = await download(urls[ext], freeName(dir, base, ext))
  }
  return saved.stl || saved.step || saved.obj ? { dir, ...saved } : null
}

// ---------- MCP artifact poll ----------
// Founder 24.07: a file built by an external Claude over MCP should land in the
// app exactly like an in-app build does — a new local chat with a clickable
// path, not just a URL that only lives on the server. Real push (SSE) would be
// the "proper" version of this and is real, separate scope; polling is enough —
// every few seconds, ask the server "anything new since <t>", download it with
// the SAME download() the /chat path already uses, and save it as a chat via
// the SAME projects_store the renderer's Overview tab already reads from. No
// new infrastructure, two existing pieces wired to a new trigger.
//
// Starts counting from the moment THIS bridge process launched — the server
// keeps a 200-entry history, but backfilling all of it on every restart would
// dump old test builds into Overview every time the app reopens. Only NEW.
let _mcpArtifactsSince = Date.now() / 1000

async function pollMcpArtifacts() {
  if (!_session || !_session.access_token) return
  const [code, data] = await forward(
    'GET', `/mcp/recent-artifacts?since=${_mcpArtifactsSince}`, null,
    { Authorization: 'Bearer ' + _session.access_token },
  )
  if (code !== 200 || !data || !Array.isArray(data.items)) return
  if (typeof data.server_ts === 'number') _mcpArtifactsSince = data.server_ts
  for (const item of data.items) {
    try {
      await saveMcpArtifactLocally(item)
    } catch { /* one bad item never blocks the rest of the batch */ }
  }
}

async function saveMcpArtifactLocally(item) {
  const art = item.artifact || {}
  const urls = { stl: art.stl_url || null, step: art.step_url || null, obj: art.obj_url || null }
  if (!urls.stl && !urls.step && !urls.obj) return
  // Own id, separate from any in-app chat — this build happened over MCP, on
  // its own server-side session, not inside a conversation this app was part of.
  const id = 'mcp-' + Math.round(item.ts) + '-' + Math.random().toString(16).slice(2, 8)
  const dir = path.join(projectRoot(id), 'output')
  try {
    fs.mkdirSync(dir, { recursive: true })
  } catch {
    return
  }
  const base = slugFromText(item.title, item.tool || 'part')
  const saved = {}
  for (const ext of ['stl', 'step', 'obj']) {
    if (!urls[ext]) continue
    saved[ext] = await download(urls[ext], freeName(dir, base, ext))
  }
  if (!saved.stl && !saved.step && !saved.obj) return
  const label = String(item.title || item.tool || 'MCP build')
  // Same 'run' block shape a normal in-app build ends its turn with — filesDir/
  // stepPath/stlPath/objPath are the raw fields renderBlock('run') now uses to
  // reconstruct working Open/Fusion buttons on load (the reload-button fix
  // above), so this renders with a working "Open files" the first time it's
  // opened, no special-cased component just for MCP builds.
  projects.save(id, {
    title: label + ' · via MCP',
    messages: [
      { t: 'user', text: label },
      {
        t: 'run', steps: [], running: false, elapsedMs: 0, error: null,
        filesDir: dir, stepPath: saved.step || null, stlPath: saved.stl || null, objPath: saved.obj || null,
      },
    ],
  })
}

/**
 * Keep the attached photo/blueprint next to the work it produced. Without this the
 * image exists only as base64 inside one HTTP request — the user could not later
 * see which drawing a part came from.
 */
function saveInputFile(sessionId, b64, name) {
  if (!b64) return null
  const dir = path.join(projectRoot(sessionId), 'input')
  try {
    fs.mkdirSync(dir, { recursive: true })
    const ext = (path.extname(name || '') || '.png').replace(/[^.a-zA-Z0-9]/g, '')
    const base = slugFromText(path.basename(name || '', ext), 'attachment')
    const file = freeName(dir, base, ext.replace(/^\./, ''))
    fs.writeFileSync(file, Buffer.from(b64, 'base64'))
    return file
  } catch {
    return null
  }
}

// What to SAY when /chat fails. The user reads this in the chat, so it names what
// they can do about it; the backend's own words are kept only when they're already
// a sentence (e.g. "No builds left — upgrade at oryndai.com"), never a JSON dump.
function httpErrorMessage(status, body) {
  let detail = ''
  try {
    const j = JSON.parse(body || '{}')
    const d = j.message || j.detail || j.error
    if (typeof d === 'string') detail = d.trim()
  } catch { /* not JSON (nginx HTML, empty body) → say it ourselves */ }
  if (status === 401 || status === 403) {
    return detail && !/authenticat|credential|token/i.test(detail)
      ? detail
      : 'Your session expired — sign out and sign in again.'
  }
  if (status === 402) return detail || 'No builds left — upgrade at oryndai.com'
  if (status === 429) return detail || 'Too many requests right now — give it a few seconds.'
  if (status >= 500) return `ORYND backend error (${status}) — try again; if it repeats, tell us via Settings › Feedback.`
  return detail || `Request failed (${status}).`
}

// Stream the backend /chat NDJSON straight through to the renderer (so it can
// show REAL per-step statuses + a live timer, not a fake spinner). While the
// stream flows we also sniff model_ready for the headless disk save, and after
// the upstream ends we append one final {"type":"files",...} line telling the UI
// where the artifacts landed. Fail-soft: any hiccup still closes the stream.
function streamChat(bodyObj, extraHeaders, sessionId, res) {
  let backend
  try {
    backend = new URL(DEFAULT_BACKEND)
  } catch {
    res.writeHead(502, { 'Content-Type': 'application/x-ndjson' })
    res.end(JSON.stringify({ type: 'error', message: 'invalid backend url' }) + '\n')
    return
  }
  const lib = backend.protocol === 'https:' ? https : http
  const data = Buffer.from(JSON.stringify(bodyObj))
  let raw = ''

  res.writeHead(200, {
    'Content-Type': 'application/x-ndjson; charset=utf-8',
    'Cache-Control': 'no-cache',
    'X-Accel-Buffering': 'no',
    'Access-Control-Allow-Origin': '*',
  })

  const upstream = lib.request(
    {
      hostname: backend.hostname,
      port: backend.port || (backend.protocol === 'https:' ? 443 : 80),
      path: backend.pathname.replace(/\/$/, '') + '/chat',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length,
        ...(extraHeaders || {}),
      },
      timeout: 120000,
    },
    (up) => {
      // A failure upstream answers with a plain JSON body, not NDJSON. Passing it
      // through verbatim put `{"detail":"Not authenticated"}` in the chat — a line
      // the UI can't read, so the user just saw silence. Turn it into a real event.
      if ((up.statusCode || 200) >= 400) {
        let body = ''
        up.on('data', (c) => (body += c))
        up.on('end', () => {
          res.write(JSON.stringify({ type: 'error', message: httpErrorMessage(up.statusCode, body) }) + '\n')
          res.end()
        })
        return
      }
      up.on('data', (chunk) => {
        raw += chunk
        res.write(chunk) // pass-through, live
      })
      up.on('end', async () => {
        // Headless: mirror built STL/STEP/OBJ to the local project folder, then
        // tell the UI where they are as a final NDJSON line.
        try {
          const files = await saveModelFiles(sessionId, extractModelUrls({ raw }), bodyObj && bodyObj.message)
          if (files && files.dir) res.write(JSON.stringify({ type: 'files', files }) + '\n')
        } catch { /* save is best-effort */ }
        res.end()
      })
    },
  )
  upstream.on('error', (e) => {
    res.write(JSON.stringify({ type: 'error', message: 'bridge error: ' + e.message }) + '\n')
    res.end()
  })
  upstream.on('timeout', () => {
    upstream.destroy()
    res.write(JSON.stringify({ type: 'error', message: 'backend timeout' }) + '\n')
    res.end()
  })
  upstream.write(data)
  upstream.end()
}

// Backend /chat streams NDJSON ({type:"text",content}, {type:"done"}, …).
// Pull a single human message out of either NDJSON or a plain JSON response.
function extractMessage(data) {
  if (data && typeof data.content === 'string' && data.content) return data.content
  if (data && typeof data.message === 'string' && data.message) return data.message
  if (data && typeof data.raw === 'string') {
    let text = ''
    let err = ''
    for (const line of data.raw.split('\n')) {
      const t = line.trim()
      if (!t) continue
      try {
        const ev = JSON.parse(t)
        if (ev.type === 'text' && ev.content) text += ev.content
        else if (ev.type === 'error' && ev.message) err = ev.message
      } catch {
        /* skip non-JSON line */
      }
    }
    return text || err || ''
  }
  return ''
}

function sendJson(res, code, obj) {
  const body = Buffer.from(JSON.stringify(obj))
  res.writeHead(code, {
    'Content-Type': 'application/json',
    'Content-Length': body.length,
    'Access-Control-Allow-Origin': '*',
  })
  res.end(body)
}

function serveFile(res, filePath) {
  fs.readFile(filePath, (err, data) => {
    if (err) return sendJson(res, 404, { error: 'not found' })
    const ext = path.extname(filePath).toLowerCase()
    res.writeHead(200, {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Content-Length': data.length,
      // No cache headers here meant browser-default (unpredictable) caching.
      // The Electron main window has fs.watch + forced webContents.reload() to
      // work around that, but a CAD-embedded palette (Fusion/SolidWorks/AutoCAD,
      // a separate browser engine) has no such push — a stale cached bundle
      // there just silently never picks up code changes on "reload" (confirmed
      // 2026-07-14: session-relay fix didn't show up in the Fusion palette after
      // reload until this was added). Always serve fresh.
      'Cache-Control': 'no-store',
    })
    res.end(data)
  })
}

function createServer(rendererDir) {
  return http.createServer(async (req, res) => {
    if (req.method === 'OPTIONS') {
      res.writeHead(204, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      })
      return res.end()
    }

    // The product UI (OryndApp) — served as the window AND the in-CAD pane.
    if (req.method === 'GET' && (req.url === '/' || req.url === '/cloud-design')) {
      if (rendererDir) return serveFile(res, path.join(rendererDir, 'index.html'))
      const body = Buffer.from(CLOUD_DESIGN_HTML)
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Content-Length': body.length })
      return res.end(body)
    }

    if (req.method === 'GET' && req.url === '/api/entitlement') {
      return sendJson(res, 200, { plan: 'trial', days_left: 1, active: true })
    }

    if (req.method === 'GET' && req.url === '/health') {
      const [code, data] = await forward('GET', '/health')
      return sendJson(res, code, data)
    }

    // Supabase JWT (if the renderer attached one) → forwarded upstream so the
    // backend can attribute every call to the real user (security rollout Ph.1).
    const authHdr = req.headers['authorization']
    const authFwd = authHdr ? { Authorization: authHdr } : undefined

    // LLM status — asks backend if any provider is active (Claude key or Ollama).
    // Normalises the backend's {claude_key, ollama_up} into {active, provider}, and
    // passes through keys/keys_verified/routes so the renderer can gate the route
    // pill and show a real Key ✓/✗ mark (Extension release plan, step 2).
    if (req.method === 'GET' && req.url === '/api/llm-status') {
      const [code, data] = await forward('GET', '/llm/status', null, authFwd)
      if (code === 200 && data && (data.claude_key !== undefined || data.ollama_up !== undefined)) {
        // The backend can only report ITS OWN env — the user's key lives in this
        // process now, so we're the ones who know it's connected and verified.
        // The key itself is never part of the answer, only that there is one.
        const mine = _llm && _llm.key ? _llm.provider : null
        const route = mine ? _ROUTE_OF_PROVIDER[mine] : null
        const active = !!(mine || data.claude_key || data.ollama_up)
        const provider = mine || (data.claude_key ? 'claude' : data.ollama_up ? 'ollama' : null)
        return sendJson(res, 200, {
          active, provider, orchestrator: data.orchestrator,
          keys: { ...(data.keys || {}), ...(mine ? { [mine]: true } : {}) },
          keys_verified: { ...(data.keys_verified || {}), ...(mine ? { [mine]: _llm.verified } : {}) },
          routes: { ...(data.routes || {}), ...(route ? { [route]: true } : {}) },
        })
      }
      // Backend unreachable or no endpoint → report inactive
      return sendJson(res, 200, { active: false, provider: null })
    }

    // Builds left + real plan. Founder 15.07: "человек не может посмотреть, сколько
    // у него токенов, и какая у него подписка". Supabase is the source of truth —
    // this only forwards the user's JWT to /api/billing/me and normalises the shape.
    // Fail-soft: the counter must never block the panel from rendering.
    if (req.method === 'GET' && req.url === '/api/credits') {
      if (!authFwd) return sendJson(res, 200, { ok: false, reason: 'no_auth' })
      const [code, data] = await forward('GET', '/api/billing/me', null, authFwd, BILLING_BACKEND)
      if (code === 200 && data) {
        const credits = Number(data.credits || 0)
        const free = Number(data.free_demos_left || 0)
        return sendJson(res, 200, {
          ok: true,
          plan: data.plan || 'free',
          // One number, as the founder asked — trial demos and paid credits are
          // both just "builds left"; the split is an internal detail.
          builds_left: credits + free,
          credits_balance: credits,
          free_demos_left: free,
          plan_max: Number(data.plan_max || 0),
        })
      }
      return sendJson(res, 200, { ok: false, reason: 'backend_unavailable' })
    }

    // Feedback (founder: «нужен канал ловить баги»). Text only — no session, no logs.
    // We only carry it: the row is written by the backend, because the insert needs
    // the Supabase service key and that key must never ship inside an installed app.
    if (req.method === 'POST' && req.url === '/api/feedback') {
      let raw = ''
      req.on('data', (c) => (raw += c))
      req.on('end', async () => {
        let payload = {}
        try { payload = JSON.parse(raw || '{}') } catch { return sendJson(res, 400, { ok: false, error: 'invalid JSON' }) }
        const message = (payload.message || '').trim()
        if (!message) return sendJson(res, 400, { ok: false, error: 'Write a message first.' })
        if (!authFwd) return sendJson(res, 401, { ok: false, error: 'Sign in to send feedback.' })
        // Local logs ride along with the report. Bounded here rather than trusting
        // the renderer — 30 days of a chatty session is megabytes of text.
        const logs = String(payload.logs || '').slice(-200000)
        const [code, data] = await forward('POST', '/api/feedback',
          { message, app_version: APP_VERSION, ...(logs ? { logs } : {}) }, authFwd)
        if (code >= 200 && code < 300 && data && data.ok) return sendJson(res, 200, { ok: true })
        return sendJson(res, code, { ok: false, error: (data && (data.detail || data.error)) || 'Could not send — try again.' })
      })
      return
    }

    // MCP activity status — thin passthrough so the renderer's Key/MCP toggle and
    // activity pill can show real ✓/✗ + last-tool without touching /mcp directly.
    // mcp_url lets Settings > MCP show/copy the real connector endpoint without
    // the renderer ever hardcoding the backend host. It is the PUBLIC https URL
    // (MCP_PUBLIC_URL) — what an external client pastes — NOT DEFAULT_BACKEND (the
    // app's own direct path); claude.ai rejects an http connector URL.
    if (req.method === 'GET' && req.url === '/api/mcp-status') {
      const [code, data] = await forward('GET', '/mcp/status', null, authFwd)
      const mcp_url = MCP_PUBLIC_URL
      if (code === 200 && data) return sendJson(res, 200, { ...data, mcp_url })
      return sendJson(res, 200, { enabled: false, mcp_url })
    }

    // Personal, durable MCP connector token — mint (or fetch the existing) one
    // for the signed-in user via backend POST /mcp/token. This is what makes
    // the URL Settings shows survive past the 1h Supabase JWT lifetime: the
    // backend stores the refresh_token and does the hourly renewal itself, so
    // the SAME pasted claude.ai connector URL just keeps working. Requires a
    // live session (both access_token AND refresh_token) — a surface with
    // neither yet (freshly opened, not signed in) gets ok:false, no crash.
    if (req.method === 'GET' && req.url === '/api/mcp-token') {
      if (!_session || !_session.access_token || !_session.refresh_token) {
        return sendJson(res, 200, { ok: false, reason: 'not_signed_in' })
      }
      const [code, data] = await forward(
        'POST', '/mcp/token', { refresh_token: _session.refresh_token },
        { Authorization: 'Bearer ' + _session.access_token },
      )
      if (code === 200 && data && data.token) {
        return sendJson(res, 200, { ok: true, token: data.token, connector_url: data.connector_url })
      }
      return sendJson(res, 200, { ok: false, reason: 'mint_failed' })
    }

    // Session relay: any surface pushes its current Supabase session here whenever
    // it changes (sign-in, sign-out, token refresh); any surface reads it back on
    // startup to hydrate if it has no local session of its own. Empty/no tokens = sign-out.
    if (req.method === 'POST' && req.url === '/api/session') {
      let raw = ''
      req.on('data', (c) => (raw += c))
      req.on('end', () => {
        let payload = {}
        try { payload = JSON.parse(raw || '{}') } catch { return sendJson(res, 400, { error: 'invalid JSON' }) }
        const accessToken = (payload.access_token || '').trim()
        if (!accessToken) {
          _session = null
          persistSession(null)
          return sendJson(res, 200, { ok: true, cleared: true })
        }
        _session = {
          access_token: accessToken,
          refresh_token: (payload.refresh_token || '').trim(),
          user: payload.user || null,
        }
        persistSession(_session)
        return sendJson(res, 200, { ok: true })
      })
      return
    }
    if (req.method === 'GET' && req.url === '/api/session') {
      return sendJson(res, 200, { session: _session })
    }

    // Diagnostic trail (see _pushDebugLog above). Not for production behavior —
    // only used while chasing the Fusion-palette-stuck-on-signin issue.
    if (req.method === 'POST' && req.url === '/api/debug-log') {
      let raw = ''
      req.on('data', (c) => (raw += c))
      req.on('end', () => {
        let payload = {}
        try { payload = JSON.parse(raw || '{}') } catch { /* ignore */ }
        _pushDebugLog(String(payload.msg || '').slice(0, 500))
        sendJson(res, 200, { ok: true })
      })
      return
    }
    if (req.method === 'GET' && req.url === '/api/debug-log') {
      return sendJson(res, 200, { log: _debugLog })
    }

    // API key registration — the backend CHECKS the key, this process KEEPS it (_llm).
    if (req.method === 'POST' && req.url === '/api/key') {
      let raw = ''
      req.on('data', (c) => (raw += c))
      req.on('end', async () => {
        let payload = {}
        try { payload = JSON.parse(raw || '{}') } catch { return sendJson(res, 400, { error: 'invalid JSON' }) }
        const key = (payload.key || '').trim()
        const model = (payload.model || '').trim()
        // Allow: a key (connect/replace) OR model-only change for a connected provider.
        if (!key && !model) return sendJson(res, 400, { error: 'key required' })
        if (!key) {
          // Model-only change — we own the key, so this stays on the machine entirely.
          if (!_llm || !_llm.key) return sendJson(res, 400, { ok: false, error: 'no key connected' })
          _llm.model = model
          persistLlm(_llm)
          return sendJson(res, 200, {
            ok: true, provider: _llm.provider, verified: _llm.verified,
            models: [], default_model: '', model,
          })
        }
        // The key rides an HTTP header on every /chat: a stray control character has
        // to fail here, visibly, rather than throw mid-request later.
        if (!/^[\x21-\x7e]+$/.test(key)) {
          return sendJson(res, 400, { ok: false, error: 'this key has characters we cannot send — re-copy it' })
        }
        // provider: anthropic (default) | openai | gemini | groq — BYO any key.
        const [code, data] = await forward('POST', '/llm/key', {
          key,
          ...(payload.provider ? { provider: payload.provider } : {}),
          ...(model ? { model } : {}),
        }, authFwd)
        // Pass through the live model list + verdict so Settings can show the
        // model dropdown and the resolved provider/model — never the key itself.
        if (data && data.ok) {
          // Vendor said yes → hold it for this session's /chat calls. A rejected key
          // leaves a previously working one alone.
          _llm = {
            key,
            provider: data.provider || payload.provider || 'anthropic',
            model: data.model || model || '',
            verified: data.verified,
          }
          persistLlm(_llm)
          sendJson(res, code, {
            ok: true,
            provider: data.provider,
            verified: data.verified,
            models: data.models || [],
            default_model: data.default_model || '',
            model: data.model || '',
          })
        } else {
          sendJson(res, code, { ok: false, error: (data && data.error) || 'backend rejected key' })
        }
      })
      return
    }

    if (req.method === 'POST' && req.url === '/api/generate') {
      let raw = ''
      let tooBig = false
      // An attached image rides in this body as base64 (~1.34x the file). The renderer caps
      // the file at 10 MB, but the bridge listens on localhost and must not trust that —
      // without a ceiling a single malformed post grows `raw` until the process dies.
      const MAX_GENERATE_BODY = 24 * 1024 * 1024
      req.on('data', (c) => {
        if (tooBig) return
        raw += c
        if (raw.length > MAX_GENERATE_BODY) {
          tooBig = true
          sendJson(res, 413, { error: 'attachment too large' })
          req.destroy()
        }
      })
      req.on('end', () => {
        if (tooBig) return
        let payload = {}
        try {
          payload = JSON.parse(raw || '{}')
        } catch {
          return sendJson(res, 400, { error: 'invalid JSON' })
        }
        // llm_route = composer model selector (ORYND/Claude/OpenAI/Local) —
        // rides in context so the backend routes providers per user choice.
        // The renderer's Supabase JWT (authFwd) is forwarded so /chat resolves
        // the real user instead of anonymous.
        // Streamed NDJSON pass-through so the UI shows real per-step statuses +
        // a live timer; headless disk-save happens inside streamChat.
        // llmHeaders() carries the user's own key (this machine's, from _llm) so the
        // shared backend runs THIS turn on it and keeps nothing afterwards.
        const sessionId = payload.session_id || 'cad-bridge'
        // Write the attachment to <project>/input/ before the turn runs, so it
        // survives even if the build itself fails — that is exactly the case where
        // the user wants to look at what they sent.
        const inputPath = saveInputFile(sessionId, payload.image_b64, payload.image_name)
        if (inputPath) _pushDebugLog(`input saved: ${inputPath}`)
        streamChat({
          message: payload.prompt || '',
          session_id: sessionId,
          context: { ...(payload.context || {}), ...(payload.route ? { llm_route: payload.route } : {}) },
          // Scenario mode from the composer selector (part_finder/text_to_cad/…),
          // 'auto' by default → backend treats it as a priority hint, not an override.
          mode: payload.mode || 'auto',
          // Attached photo/blueprint. Top-level fields, NOT inside context: the backend
          // serializes unknown context keys into the model's system note — base64 would
          // land straight in the prompt (and in the provider's logs).
          ...(payload.image_b64 ? { image_b64: payload.image_b64, image_name: payload.image_name || '' } : {}),
        }, { ...(authFwd || {}), ...llmHeaders() }, sessionId, res)
      })
      return
    }

    // Static assets for the UI (cad/*.jsx, _ds/*, brand). GET only, path-safe.
    if (req.method === 'GET' && rendererDir) {
      const rel = decodeURIComponent(req.url.split('?')[0]).replace(/^\/+/, '')
      const target = path.normalize(path.join(rendererDir, rel))
      if (target.startsWith(rendererDir)) return serveFile(res, target)
    }

    sendJson(res, 404, { error: 'not found' })
  })
}

/** Start the bridge. Returns the http.Server. rendererDir = folder with index.html + assets. */
function startBridge(port = 8765, rendererDir = null, userDataDir = null, safeStorage = null) {
  // Restore a persisted session so an app/bridge restart keeps the user signed in
  // (the renderer's /api/session fallback adopts it; an expired access_token is
  // refreshed by supabase-js via the still-valid refresh_token). The BYO LLM key is
  // restored too (encrypted at rest) so the user isn't re-pasting it every launch.
  _userDataDir = userDataDir
  _safeStorage = safeStorage
  const restored = loadPersistedSession()
  if (restored) _session = restored
  const restoredLlm = loadPersistedLlm()
  if (restoredLlm) _llm = restoredLlm
  const server = createServer(rendererDir)
  server.listen(port, '127.0.0.1', () => {
    console.log(`[bridge] running on http://127.0.0.1:${port} → ${DEFAULT_BACKEND}`)
  })
  server.on('error', (e) => console.error('[bridge] error:', e.message))
  // pollMcpArtifacts no-ops instantly when signed out, so it's safe to just always
  // run — matches the existing McpActivityPill's own always-on poll (2.5s); this
  // one is slower (8s) since it also downloads files, not just a status check.
  const mcpPollTimer = setInterval(() => { pollMcpArtifacts().catch(() => {}) }, 8000)
  server.on('close', () => clearInterval(mcpPollTimer))
  return server
}

module.exports = { startBridge, DEFAULT_BACKEND }
