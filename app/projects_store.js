/**
 * Local project store — one folder per chat, on the user's own disk.
 *
 *   ~/Documents/ORYND/projects/<id>/
 *   ├── chat.json      conversation history
 *   ├── part.stl|step  build artifacts (written by bridge.js under the same id)
 *   └── .orynd/
 *       └── meta.json  per-project metadata: builds, tools used, timestamps
 *
 * Why Documents and not userData: this is the user's work, same as a Fusion or
 * Blender project folder — visible, copyable, deletable without reinstalling the
 * app. userData holds only a lightweight index so the chat list can render without
 * scanning the disk, and can say "project not found" instead of silently losing it.
 */
const fs = require('fs')
const os = require('os')
const path = require('path')

const PROJECTS_ROOT = process.env.ORYND_PROJECT_DIR
  || path.join(os.homedir(), 'Documents', 'ORYND', 'projects')

const CHAT_FILE = 'chat.json'
const META_DIR = '.orynd'
const META_FILE = 'meta.json'
const INDEX_FILE = 'projects-index.json'

// Chat ids reach the filesystem, so they must not be able to escape the root.
const safeId = (id) => String(id || '').replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 64)

let indexPath = null // set by init() with Electron's userData path

function init(userDataDir) {
  indexPath = path.join(userDataDir, INDEX_FILE)
}

function projectDir(id) {
  return path.join(PROJECTS_ROOT, safeId(id))
}

function readJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'))
  } catch {
    return fallback
  }
}

function writeJson(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true })
  // Write-then-rename: a crash mid-write leaves the previous chat intact rather
  // than a half-written file that parses as nothing.
  const tmp = file + '.tmp'
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2))
  fs.renameSync(tmp, file)
}

// ---------- index (userData) ----------

function readIndex() {
  if (!indexPath) return []
  const idx = readJson(indexPath, [])
  return Array.isArray(idx) ? idx : []
}

function writeIndex(rows) {
  if (!indexPath) return
  try {
    writeJson(indexPath, rows)
  } catch {
    /* index is a convenience, never a blocker */
  }
}

function touchIndex(id, patch) {
  const rows = readIndex().filter((r) => r.id !== id)
  rows.unshift({ id, ...patch })
  writeIndex(rows.slice(0, 200))
}

// ---------- public API ----------

/**
 * Chat list for the UI. The index gives order and titles; the disk decides
 * whether the project is still there. A folder the user deleted shows up as
 * `missing: true` instead of vanishing without explanation.
 */
function list() {
  const rows = readIndex()
  const seen = new Set(rows.map((r) => r.id))

  // Folders created outside the app (copied in from another machine) still belong
  // in the list — the folder is the source of truth, the index is a cache.
  let onDisk = []
  try {
    onDisk = fs.readdirSync(PROJECTS_ROOT, { withFileTypes: true })
      .filter((d) => d.isDirectory() && fs.existsSync(path.join(PROJECTS_ROOT, d.name, CHAT_FILE)))
      .map((d) => d.name)
  } catch {
    onDisk = []
  }
  for (const id of onDisk) {
    if (seen.has(id)) continue
    const chat = readJson(path.join(PROJECTS_ROOT, id, CHAT_FILE), null)
    if (chat) rows.push({ id, title: chat.title || id, updatedAt: chat.updatedAt || null, turns: (chat.messages || []).length })
  }

  return rows.map((r) => ({
    ...r,
    missing: !fs.existsSync(path.join(projectDir(r.id), CHAT_FILE)),
    dir: projectDir(r.id),
  }))
}

function load(id) {
  const chat = readJson(path.join(projectDir(id), CHAT_FILE), null)
  if (!chat) return { ok: false, error: 'not found' }
  const meta = readJson(path.join(projectDir(id), META_DIR, META_FILE), {})
  return { ok: true, id, title: chat.title || id, messages: chat.messages || [], meta, dir: projectDir(id) }
}

/**
 * Save a chat. `title` is derived from the first user message when absent — a list
 * of "cad-8f21…" tells the user nothing about which project is which.
 */
function save(id, { title, messages, meta } = {}) {
  const dir = projectDir(id)
  const file = path.join(dir, CHAT_FILE)
  const prev = readJson(file, {})
  const msgs = Array.isArray(messages) ? messages : (prev.messages || [])
  const firstUser = msgs.find((m) => m && m.t === 'user' && m.text)
  const derived = firstUser ? String(firstUser.text).replace(/\s+/g, ' ').trim().slice(0, 60) : 'New chat'
  const now = new Date().toISOString()
  const chat = {
    version: 1,
    id,
    title: title || prev.title || derived,
    createdAt: prev.createdAt || now,
    updatedAt: now,
    messages: msgs,
  }
  try {
    writeJson(file, chat)
    if (meta && typeof meta === 'object') {
      const metaFile = path.join(dir, META_DIR, META_FILE)
      writeJson(metaFile, { ...readJson(metaFile, {}), ...meta, updatedAt: now })
    }
  } catch (err) {
    return { ok: false, error: err.message }
  }
  touchIndex(id, { title: chat.title, updatedAt: now, turns: msgs.length })
  return { ok: true, id, title: chat.title, dir }
}

/**
 * Drop a project from the list. The folder itself is left alone on purpose —
 * deleting a user's STEP files because they tidied their chat list is not a
 * trade this app gets to make. `forget` removes the index row; the folder stays
 * in Documents for them to delete in Finder if they want it gone.
 */
function forget(id) {
  writeIndex(readIndex().filter((r) => r.id !== id))
  return { ok: true, dir: projectDir(id) }
}

module.exports = { init, list, load, save, forget, projectDir, PROJECTS_ROOT }
