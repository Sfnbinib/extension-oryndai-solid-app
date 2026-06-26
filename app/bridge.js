/**
 * ORYND Bridge (Node, in-process) — thin HTTP proxy on 127.0.0.1:8765.
 * Self-contained: no Python needed. Forwards CAD add-in requests to the
 * ORYND backend. Holds NO ORYND algorithms.
 */
const http = require('node:http')
const https = require('node:https')
const fs = require('node:fs')
const path = require('node:path')
const { URL } = require('node:url')

const DEFAULT_BACKEND = process.env.ORYND_BACKEND || 'https://api.oryndai.com'

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
  document.getElementById('status').textContent='Working…';
  try{const r=await fetch('/api/generate',{method:'POST',
    headers:{'Content-Type':'application/json'},body:JSON.stringify({prompt:p})});
    const d=await r.json();
    document.getElementById('status').textContent=d.message||d.error||JSON.stringify(d);
  }catch(e){document.getElementById('status').textContent='Bridge error: '+e.message}}
document.getElementById('prompt').addEventListener('keydown',e=>{if(e.key==='Enter')generate()});
</script></body></html>`

function forward(method, path, bodyObj) {
  return new Promise((resolve) => {
    let backend
    try {
      backend = new URL(DEFAULT_BACKEND)
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
        'Access-Control-Allow-Headers': 'Content-Type',
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

    // LLM status — asks backend if any provider is active (Claude key or Ollama).
    // Normalises the backend's {claude_key, ollama_up} into {active, provider}.
    if (req.method === 'GET' && req.url === '/api/llm-status') {
      const [code, data] = await forward('GET', '/llm/status')
      if (code === 200 && data && (data.claude_key !== undefined || data.ollama_up !== undefined)) {
        const active = !!(data.claude_key || data.ollama_up)
        const provider = data.claude_key ? 'claude' : data.ollama_up ? 'ollama' : null
        return sendJson(res, 200, { active, provider, orchestrator: data.orchestrator })
      }
      // Backend unreachable or no endpoint → report inactive
      return sendJson(res, 200, { active: false, provider: null })
    }

    // API key registration — stores key in backend process env (session-scoped, never logged).
    if (req.method === 'POST' && req.url === '/api/key') {
      let raw = ''
      req.on('data', (c) => (raw += c))
      req.on('end', async () => {
        let payload = {}
        try { payload = JSON.parse(raw || '{}') } catch { return sendJson(res, 400, { error: 'invalid JSON' }) }
        const key = (payload.key || '').trim()
        if (!key) return sendJson(res, 400, { error: 'key required' })
        const [code, data] = await forward('POST', '/llm/key', { key })
        sendJson(res, code, data && data.ok ? { ok: true } : { ok: false, error: 'backend rejected key' })
      })
      return
    }

    if (req.method === 'POST' && req.url === '/api/generate') {
      let raw = ''
      req.on('data', (c) => (raw += c))
      req.on('end', async () => {
        let payload = {}
        try {
          payload = JSON.parse(raw || '{}')
        } catch {
          return sendJson(res, 400, { error: 'invalid JSON' })
        }
        const [code, data] = await forward('POST', '/chat', {
          message: payload.prompt || '',
          session_id: payload.session_id || 'cad-bridge',
          context: payload.context || {},
          mode: 'auto',
        })
        sendJson(res, code, { message: extractMessage(data), raw: data })
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
