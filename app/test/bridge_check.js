// Block 2 wiring check: real bridge process, stub backend, no network, no 8765.
// Proves the things node --check cannot: that the key rides the headers, that it
// never rests on the server, that a 401 reaches the chat as a sentence.
const http = require('node:http')

const STUB_PORT = 8899
const BRIDGE_PORT = 8901 // NOT 8765 — the founder's app owns that one.
process.env.ORYND_BACKEND = `http://127.0.0.1:${STUB_PORT}`

const { startBridge } = require('../bridge.js')

const seen = { chat: [], key: [], feedback: [] }
let chatMode = 'ok' // 'ok' | '401'

const stub = http.createServer((req, res) => {
  let body = ''
  req.on('data', (c) => (body += c))
  req.on('end', () => {
    const j = (() => { try { return JSON.parse(body || '{}') } catch { return {} } })()
    if (req.url === '/llm/key') {
      seen.key.push({ body: j })
      return res.end(JSON.stringify({
        ok: true, provider: 'gemini', verified: true, keys: { gemini: true },
        models: ['gemini-2.0-flash'], default_model: 'gemini-1.5-flash', model: 'gemini-2.0-flash',
      }))
    }
    if (req.url === '/llm/status') {
      // The server knows nothing about this user's key — that is the whole point.
      return res.end(JSON.stringify({
        claude_key: false, ollama_up: false, orchestrator: 'none',
        keys: { anthropic: false, openai: false, gemini: false, groq: false },
        keys_verified: {},
        routes: { ORYND: true, Claude: false, OpenAI: false, Gemini: false, Groq: false, Local: false },
      }))
    }
    if (req.url === '/chat') {
      seen.chat.push({ headers: req.headers, body: j })
      if (chatMode === '401') {
        res.writeHead(401, { 'Content-Type': 'application/json' })
        return res.end(JSON.stringify({ detail: 'Not authenticated' }))
      }
      res.writeHead(200, { 'Content-Type': 'application/x-ndjson' })
      res.write(JSON.stringify({ type: 'text', content: 'ok' }) + '\n')
      return res.end(JSON.stringify({ type: 'done', session_id: j.session_id }) + '\n')
    }
    if (req.url === '/api/feedback') {
      seen.feedback.push({ headers: req.headers, body: j })
      return res.end(JSON.stringify({ ok: true }))
    }
    res.writeHead(404); res.end('{}')
  })
})

function call(method, path, body, headers) {
  return new Promise((resolve) => {
    const data = body ? Buffer.from(JSON.stringify(body)) : null
    const req = http.request({ hostname: '127.0.0.1', port: BRIDGE_PORT, path, method,
      headers: { 'Content-Type': 'application/json', ...(headers || {}) } }, (res) => {
      let out = ''
      res.on('data', (c) => (out += c))
      res.on('end', () => resolve({ status: res.statusCode, text: out }))
    })
    req.on('error', (e) => resolve({ status: 0, text: e.message }))
    if (data) req.write(data)
    req.end()
  })
}

const results = []
const check = (name, pass, detail) => { results.push({ name, pass, detail }); }

async function main() {
  await new Promise((r) => stub.listen(STUB_PORT, '127.0.0.1', r))
  const server = startBridge(BRIDGE_PORT, null)
  await new Promise((r) => setTimeout(r, 200))
  const AUTH = { Authorization: 'Bearer jwt-user-a' }

  // 1. No key of their own → nothing extra travels; the server uses its own env.
  await call('POST', '/api/generate', { prompt: 'hi', session_id: 'cad-a' }, AUTH)
  const first = seen.chat[0].headers
  check('no key → no X-LLM-* headers', !first['x-llm-key'] && !first['x-llm-provider'], Object.keys(first).filter(k => k.startsWith('x-llm')).join(',') || '(none)')

  // 2. Save a key → backend is asked to CHECK it (once), bridge keeps it.
  const saved = await call('POST', '/api/key', { key: 'AIza-user-a', provider: 'gemini' }, AUTH)
  check('/api/key ok + never echoes the key', JSON.parse(saved.text).ok === true && !saved.text.includes('AIza-user-a'), saved.text)
  check('backend saw the key exactly once (validation)', seen.key.length === 1 && seen.key[0].body.key === 'AIza-user-a', `calls=${seen.key.length}`)

  // 3. Now every /chat carries it.
  await call('POST', '/api/generate', { prompt: 'make a cube', session_id: 'cad-a', route: 'ORYND' }, AUTH)
  const h = seen.chat[1].headers
  check('X-LLM-Key rides /chat', h['x-llm-key'] === 'AIza-user-a', h['x-llm-key'])
  check('X-LLM-Provider rides /chat', h['x-llm-provider'] === 'gemini', h['x-llm-provider'])
  check('X-LLM-Model = the model the vendor confirmed', h['x-llm-model'] === 'gemini-2.0-flash', h['x-llm-model'])
  check('JWT still rides alongside', h['authorization'] === 'Bearer jwt-user-a', h['authorization'])
  check('session_id is the caller\'s, not the shared default', seen.chat[1].body.session_id === 'cad-a', seen.chat[1].body.session_id)

  // 4. Status: the server says "no keys anywhere"; the bridge knows better for ITS machine.
  const st = await call('GET', '/api/llm-status', null, AUTH)
  const sj = JSON.parse(st.text)
  check('status: local key shows as connected', sj.active === true && sj.keys.gemini === true, JSON.stringify(sj.keys))
  check('status: Gemini route unlocked by the local key', sj.routes.Gemini === true, JSON.stringify(sj.routes))
  check('status: verdict from OUR validation', sj.keys_verified.gemini === true, JSON.stringify(sj.keys_verified))
  check('status: never leaks the key value', !st.text.includes('AIza-user-a'), st.text.slice(0, 60) + '…')

  // 5. Model-only change stays local (the backend does not get asked again).
  const keysBefore = seen.key.length
  await call('POST', '/api/key', { key: '', provider: 'gemini', model: 'gemini-1.5-pro' }, AUTH)
  await call('POST', '/api/generate', { prompt: 'again', session_id: 'cad-a' }, AUTH)
  check('model-only change: no backend round-trip', seen.key.length === keysBefore, `calls=${seen.key.length}`)
  check('model-only change: new model rides next /chat', seen.chat[2].headers['x-llm-model'] === 'gemini-1.5-pro', seen.chat[2].headers['x-llm-model'])

  // 6. A failing backend must reach the chat as a sentence, not as JSON.
  chatMode = '401'
  const failed = await call('POST', '/api/generate', { prompt: 'hi', session_id: 'cad-a' }, AUTH)
  const ev = JSON.parse(failed.text.trim().split('\n')[0])
  check('401 → readable {"type":"error"} event', ev.type === 'error' && /sign in again/i.test(ev.message), failed.text.trim())
  check('401 → raw {"detail":…} never reaches the chat', !failed.text.includes('"detail"'), failed.text.trim())
  chatMode = 'ok'

  // 7. Feedback forwards with identity + version, and refuses anonymously.
  const anon = await call('POST', '/api/feedback', { message: 'gear has wrong teeth' })
  check('feedback: anonymous refused', anon.status === 401 && seen.feedback.length === 0, anon.text)
  const fb = await call('POST', '/api/feedback', { message: 'gear has wrong teeth' }, AUTH)
  check('feedback: forwarded with JWT + app_version', JSON.parse(fb.text).ok === true
    && seen.feedback[0].body.message === 'gear has wrong teeth'
    && !!seen.feedback[0].body.app_version
    && seen.feedback[0].headers['authorization'] === 'Bearer jwt-user-a',
    JSON.stringify(seen.feedback[0].body))
  const empty = await call('POST', '/api/feedback', { message: '   ' }, AUTH)
  check('feedback: empty message refused before the network', empty.status === 400 && seen.feedback.length === 1, empty.text)

  server.close(); stub.close()
  let failedN = 0
  for (const r of results) {
    if (!r.pass) failedN++
    console.log(`${r.pass ? 'PASS' : 'FAIL'}  ${r.name}${r.pass ? '' : `   → got: ${r.detail}`}`)
  }
  console.log(`\n${results.length - failedN}/${results.length} passed`)
  process.exit(failedN ? 1 : 0)
}

main()
