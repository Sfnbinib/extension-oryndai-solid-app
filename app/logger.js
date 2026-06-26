/**
 * LOGGER — rolling session logs for the feedback feature.
 *
 * Writes one file per day to <userData>/logs/YYYY-MM-DD.log, keeps 15 days,
 * and can collect a date range so the in-app Feedback button can attach the
 * user's recent logs (today / 7 days / 30 days). No log content leaves the
 * machine unless the user explicitly sends feedback.
 */
const fs = require('node:fs')
const path = require('node:path')

const KEEP_DAYS = 15
let dir = null

function dayStamp(d = new Date()) {
  return d.toISOString().slice(0, 10) // YYYY-MM-DD
}

function init(userDataPath) {
  dir = path.join(userDataPath, 'logs')
  try {
    fs.mkdirSync(dir, { recursive: true })
    prune()
  } catch {
    /* non-fatal */
  }
}

// Delete logs older than KEEP_DAYS.
function prune() {
  if (!dir) return
  const cutoff = Date.now() - KEEP_DAYS * 24 * 60 * 60 * 1000
  try {
    for (const f of fs.readdirSync(dir)) {
      const m = f.match(/^(\d{4}-\d{2}-\d{2})\.log$/)
      if (m && new Date(m[1]).getTime() < cutoff) fs.unlinkSync(path.join(dir, f))
    }
  } catch {
    /* non-fatal */
  }
}

function log(level, msg) {
  const line = `${new Date().toISOString()} [${level}] ${msg}\n`
  // Always mirror to console so `npm start` shows it too.
  if (level === 'error') console.error(line.trim())
  else console.log(line.trim())
  if (!dir) return
  try {
    fs.appendFileSync(path.join(dir, `${dayStamp()}.log`), line)
  } catch {
    /* non-fatal */
  }
}

/** Concatenate logs for the last `days` days (1 = today). For the feedback bundle. */
function collect(days = 7) {
  if (!dir) return ''
  const out = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
    const f = path.join(dir, `${dayStamp(d)}.log`)
    try {
      if (fs.existsSync(f)) out.push(fs.readFileSync(f, 'utf-8'))
    } catch {
      /* skip */
    }
  }
  return out.join('')
}

module.exports = {
  init,
  collect,
  info: (m) => log('info', m),
  warn: (m) => log('warn', m),
  error: (m) => log('error', m),
}
