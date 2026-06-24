/**
 * AUTO UPDATER — electron-updater + "notify 4 times, auto-install on 5th".
 *
 * On each launch we check GitHub Releases. If an update is available we count
 * how many times the user has seen the prompt without acting. Launches 1–4 →
 * notify and let them choose. Launch 5 → download + install automatically.
 *
 * Counter persists in <userData>/update_state.json.
 */
const fs = require('node:fs')
const path = require('node:path')

const AUTO_INSTALL_AFTER = 4 // prompts seen before forcing auto-install

let autoUpdater = null
try {
  autoUpdater = require('electron-updater').autoUpdater
} catch {
  autoUpdater = null // dev without dependency installed
}

function stateFile(app) {
  return path.join(app.getPath('userData'), 'update_state.json')
}

function readState(app) {
  try {
    return JSON.parse(fs.readFileSync(stateFile(app), 'utf-8'))
  } catch {
    return { prompts_seen: 0, last_version: null }
  }
}

function writeState(app, state) {
  try {
    fs.writeFileSync(stateFile(app), JSON.stringify(state))
  } catch {
    /* non-fatal */
  }
}

/**
 * @param {Electron.App} app
 * @param {(info:{version:string, forced:boolean})=>void} onPrompt
 *        called when an update is available; forced=true means auto-installing now.
 */
function initUpdater(app, onPrompt) {
  if (!autoUpdater) {
    console.log('[updater] electron-updater not available (dev)')
    return { check: () => {}, install: () => {} }
  }

  autoUpdater.autoDownload = false
  autoUpdater.autoInstallOnAppQuit = true

  autoUpdater.on('update-available', (info) => {
    const state = readState(app)
    // Reset counter if this is a different (newer) version than last seen.
    if (state.last_version !== info.version) {
      state.prompts_seen = 0
      state.last_version = info.version
    }
    state.prompts_seen += 1
    writeState(app, state)

    const forced = state.prompts_seen > AUTO_INSTALL_AFTER
    onPrompt({ version: info.version, forced })

    if (forced) {
      autoUpdater.autoDownload = true
      autoUpdater.downloadUpdate()
    }
  })

  autoUpdater.on('update-downloaded', () => {
    // Reset so we don't nag after a successful install.
    writeState(app, { prompts_seen: 0, last_version: null })
    autoUpdater.quitAndInstall()
  })

  autoUpdater.on('error', (err) => console.error('[updater]', err?.message))

  return {
    check: () => autoUpdater.checkForUpdates().catch((e) => console.error('[updater]', e.message)),
    install: () => {
      autoUpdater.autoDownload = true
      autoUpdater.downloadUpdate()
    },
  }
}

module.exports = { initUpdater }
