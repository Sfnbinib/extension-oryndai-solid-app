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

// Two addresses since the 18.07 split: COMPUTE (chat/search/mesh/cad/mcp) moved to the
// dop-server, MONEY (/api/billing/me) stayed on the site backend. api.oryndai.com now
// answers 404 for compute — pointing everything there leaves the panel dead.
// Override either with ORYND_BACKEND / ORYND_BILLING_BACKEND (no rebuild needed).
// TODO(prod): swap the raw IP for https://dop.oryndai.com once DNS + nginx:443 are up.
const DEFAULT_BACKEND = process.env.ORYND_BACKEND || 'http://3.86.214.175:8765'
const BILLING_BACKEND = process.env.ORYND_BILLING_BACKEND || 'https://api.oryndai.com'

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
// pair through here (in-memory only, never written to disk, never logged —
// same session-scoped convention as the /api/key relay below) lets any
// surface adopt the session set by any other surface. founder requirement
// 2026-07-14: "одна сессия... любой запрос... должен дойти".
let _session = null // { access_token, refresh_token, user } | null

// The user's own LLM key — kept HERE, in this process, on the user's own machine.
// The backend is one process shared by every install: we used to hand it the key
// to hold (POST /llm/key → its env), which meant the next user's chat ran on it,
// or overwrote it. Now the backend only CHECKS a key, and this bridge sends it
// with each /chat as X-LLM-* headers, so it never rests anywhere but here.
// In-memory only — never disk, never logged, never handed back to the renderer.
let _llm = null // { key, provider, model, verified } | null

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
      if (ev.type === 'model_ready' && ev.stl_url) {
        return { stl: ev.stl_url, step: ev.step_url || null, obj: ev.obj_url || null }
      }
    } catch { /* skip non-JSON line */ }
  }
  return null
}

// Headless save: download built artifacts into the local project folder.
// Fail-soft — a download problem never breaks the chat reply.
async function saveModelFiles(sessionId, urls) {
  if (!urls) return null
  const safe = String(sessionId || 'default').replace(/[^a-zA-Z0-9._-]/g, '_')
  const dir = path.join(PROJECT_DIR, safe)
  try {
    fs.mkdirSync(dir, { recursive: true })
  } catch {
    return null
  }
  const saved = {}
  for (const ext of ['stl', 'step', 'obj']) {
    if (!urls[ext]) continue
    saved[ext] = await download(urls[ext], path.join(dir, `part.${ext}`))
  }
  return saved.stl || saved.step || saved.obj ? { dir, ...saved } : null
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
          const files = await saveModelFiles(sessionId, extractModelUrls({ raw }))
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
        const [code, data] = await forward('POST', '/api/feedback', { message, app_version: APP_VERSION }, authFwd)
        if (code >= 200 && code < 300 && data && data.ok) return sendJson(res, 200, { ok: true })
        return sendJson(res, code, { ok: false, error: (data && (data.detail || data.error)) || 'Could not send — try again.' })
      })
      return
    }

    // MCP activity status — thin passthrough so the renderer's Key/MCP toggle and
    // activity pill can show real ✓/✗ + last-tool without touching /mcp directly.
    // mcp_url lets Settings > MCP show/copy the real connector endpoint without
    // the renderer ever hardcoding the backend host (dev overrides via ORYND_BACKEND).
    if (req.method === 'GET' && req.url === '/api/mcp-status') {
      const [code, data] = await forward('GET', '/mcp/status', null, authFwd)
      const mcp_url = DEFAULT_BACKEND.replace(/\/$/, '') + '/mcp'
      if (code === 200 && data) return sendJson(res, 200, { ...data, mcp_url })
      return sendJson(res, 200, { enabled: false, mcp_url })
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
          return sendJson(res, 200, { ok: true, cleared: true })
        }
        _session = {
          access_token: accessToken,
          refresh_token: (payload.refresh_token || '').trim(),
          user: payload.user || null,
        }
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
      req.on('data', (c) => (raw += c))
      req.on('end', () => {
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
        streamChat({
          message: payload.prompt || '',
          session_id: sessionId,
          context: { ...(payload.context || {}), ...(payload.route ? { llm_route: payload.route } : {}) },
          mode: 'auto',
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
function startBridge(port = 8765, rendererDir = null) {
  const server = createServer(rendererDir)
  server.listen(port, '127.0.0.1', () => {
    console.log(`[bridge] running on http://127.0.0.1:${port} → ${DEFAULT_BACKEND}`)
  })
  server.on('error', (e) => console.error('[bridge] error:', e.message))
  return server
}

module.exports = { startBridge, DEFAULT_BACKEND }
