/**
 * ORYND Extension — Electron main process.
 *
 * A lightweight tray app: starts the in-process bridge (no Python needed),
 * watches for running CAD apps, installs add-ins on demand, and auto-updates.
 * Closing the window hides to tray; quit from the tray menu.
 */
// Load .env before any other require so ORYND_BACKEND is set before bridge.js reads it.
require('dotenv').config()
const { app, BrowserWindow, Tray, Menu, ipcMain, nativeImage, shell, safeStorage } = require('electron')
const path = require('node:path')
const fs = require('node:fs')
const { startBridge } = require('./bridge')
const { detectRunningCad, supportedCad } = require('./cad_detect')
const { installAddin } = require('./addin_installer')
const projects = require('./projects_store')
const { initUpdater } = require('./updater')
const logger = require('./logger')

const BRIDGE_PORT = 8765

let mainWindow = null
let tray = null
let bridgeServer = null
let updater = null
let lastRunningCad = []

// Register orynd:// as the deep-link protocol for OAuth callback.
app.setAsDefaultProtocolClient('orynd')

// Single-instance lock — re-launching focuses the existing window.
if (!app.requestSingleInstanceLock()) {
  app.quit()
} else {
  app.on('second-instance', (_event, argv) => {
    const deepLink = argv.find(a => a.startsWith('orynd://'))
    if (deepLink) handleDeepLink(deepLink)
    showWindow()
  })
}

function handleDeepLink(url) {
  try {
    const parsed = new URL(url)
    if (parsed.hostname === 'auth') {
      const accessToken = parsed.searchParams.get('access_token')
      const refreshToken = parsed.searchParams.get('refresh_token')
      if (accessToken && mainWindow && !mainWindow.isDestroyed()) {
        showWindow()
        mainWindow.webContents.send('auth:token', { accessToken, refreshToken })
      }
    }
  } catch (e) {
    logger.error('deep-link parse error: ' + e.message)
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 480,
    height: 760,
    minWidth: 360,
    minHeight: 520,
    maxWidth: 960,
    resizable: true,
    show: false,
    title: 'ORYND Extension',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })
  // Load over HTTP from the local bridge (not file://) so the in-browser
  // Babel/JSX loader can fetch component sources.
  const url = `http://127.0.0.1:${BRIDGE_PORT}/`
  mainWindow.loadURL(url)
  // Bridge listen is async — retry if the window beat it to the port.
  mainWindow.webContents.on('did-fail-load', () => {
    setTimeout(() => mainWindow && mainWindow.loadURL(url), 250)
  })

  // Closing hides to tray instead of quitting.
  mainWindow.on('close', (e) => {
    if (!app.isQuitting) {
      e.preventDefault()
      mainWindow.hide()
    }
  })
}

function showWindow() {
  if (!mainWindow) createWindow()
  mainWindow.show()
  mainWindow.focus()
}

function trayIcon() {
  const png = path.join(__dirname, 'assets', 'tray.png')
  const img = nativeImage.createFromPath(png)
  if (img.isEmpty()) return nativeImage.createEmpty()
  // Template image → macOS auto-adapts to light/dark menu bar.
  if (process.platform === 'darwin') img.setTemplateImage(true)
  return img
}

function createTray() {
  tray = new Tray(trayIcon())
  tray.setToolTip('ORYND Extension')
  const menu = Menu.buildFromTemplate([
    { label: 'Open ORYND', click: showWindow },
    { label: 'Check for updates', click: () => updater && updater.check() },
    { type: 'separator' },
    { label: 'Quit', click: () => { app.isQuitting = true; app.quit() } },
  ])
  tray.setContextMenu(menu)
  tray.on('click', showWindow)
}

// Auto-show the window when a CAD app launches.
function watchCad() {
  setInterval(async () => {
    const running = await detectRunningCad()
    const newlyOpened = running.filter((c) => !lastRunningCad.includes(c))
    lastRunningCad = running
    if (newlyOpened.length > 0) showWindow()
  }, 4000)
}

function registerIpc() {
  ipcMain.handle('cad:detect', () => detectRunningCad())
  ipcMain.handle('cad:supported', () => supportedCad())
  ipcMain.handle('cad:install', (_e, cad) => {
    const r = installAddin(cad, { isPackaged: app.isPackaged, resourcesPath: process.resourcesPath })
    // Remember what the user connected, so the next app update refreshes exactly
    // those add-ins instead of guessing.
    if (r.ok) rememberConnectedCad(cad)
    return r
  })
  ipcMain.handle('updater:check', () => updater && updater.check())
  ipcMain.handle('updater:install', () => updater && updater.install())
  ipcMain.handle('bridge:status', () => ({
    running: !!bridgeServer && bridgeServer.listening,
    port: BRIDGE_PORT,
  }))
  ipcMain.handle('window:hide', () => mainWindow && mainWindow.hide())
  ipcMain.handle('window:reload', () => mainWindow && mainWindow.webContents.reload())
  // Open URL in system default browser — never inside Electron.
  ipcMain.handle('shell:openExternal', (_e, url) => shell.openExternal(url))
  // Open the folder holding a finished build. shell.openPath resolves to '' on
  // success and an error string otherwise — hand that back to the caller.
  ipcMain.handle('shell:openPath', (_e, p) => shell.openPath(p))
  // For the in-app Feedback button: collect recent logs (days: 1 / 7 / 30).
  ipcMain.handle('logs:collect', (_e, days) => logger.collect(days || 7))
  // Local project store — chats live on the user's disk, one folder per project.
  ipcMain.handle('projects:list', () => projects.list())
  ipcMain.handle('projects:load', (_e, id) => projects.load(id))
  ipcMain.handle('projects:save', (_e, id, data) => projects.save(id, data))
  ipcMain.handle('projects:forget', (_e, id) => projects.forget(id))
  ipcMain.handle('projects:dir', (_e, id) => projects.projectDir(id))
}

/**
 * Keep the CAD add-ins in step with the app.
 *
 * `installAddin` used to run only when the user clicked Connect. After an app
 * update that left the OLD add-in in place — the app spoke a protocol the add-in
 * didn't know, and nothing said why. We re-copy once per version for every CAD the
 * user has already connected. Reloading it inside the CAD host stays manual:
 * Fusion imports the add-in module once at startup and offers no API to reload it.
 */
const addinStampPath = () => path.join(app.getPath('userData'), 'addins-version.json')

function readAddinStamp() {
  try { return JSON.parse(fs.readFileSync(addinStampPath(), 'utf8')) } catch { return null }
}

function rememberConnectedCad(cad) {
  const prev = readAddinStamp() || {}
  const connected = Array.from(new Set([...(prev.connected || []), cad]))
  try {
    fs.writeFileSync(addinStampPath(), JSON.stringify({ version: app.getVersion(), connected }, null, 2))
  } catch (e) {
    logger.error('addin stamp write failed: ' + e.message)
  }
}

function refreshAddinsOnUpgrade() {
  const stamp = addinStampPath()
  const prev = readAddinStamp()
  if (prev && prev.version === app.getVersion()) return

  const connected = (prev && Array.isArray(prev.connected) && prev.connected.length)
    ? prev.connected
    : ['fusion360'] // first run after this feature ships: refresh the one we ship for
  for (const cad of connected) {
    const r = installAddin(cad, { isPackaged: app.isPackaged, resourcesPath: process.resourcesPath })
    logger.info(`addin refresh ${cad}: ${r.ok ? 'ok → ' + r.target : 'failed → ' + r.error}`)
  }
  try {
    fs.writeFileSync(stamp, JSON.stringify({ version: app.getVersion(), connected }, null, 2))
  } catch (e) {
    logger.error('addin stamp write failed: ' + e.message)
  }
}

// macOS delivers deep-links via open-url event.
app.on('open-url', (event, url) => {
  event.preventDefault()
  handleDeepLink(url)
})

app.whenReady().then(() => {
  logger.init(app.getPath('userData'))
  logger.info(`app start v${app.getVersion()} on ${process.platform}`)
  // Index lives in userData so it survives an app update; the chats themselves
  // live in Documents/ORYND/projects and survive a reinstall.
  projects.init(app.getPath('userData'))
  refreshAddinsOnUpgrade()
  bridgeServer = startBridge(BRIDGE_PORT, path.join(__dirname, 'renderer'), app.getPath('userData'), safeStorage)
  logger.info(`bridge started on ${BRIDGE_PORT}`)
  registerIpc()
  createWindow()
  createTray()
  watchCad()

  // DEV-ONLY: auto-reload the window when renderer files change (no rebuild needed).
  // Inert in the packaged app (app.isPackaged === true there).
  if (!app.isPackaged) {
    try {
      let reloadTimer = null
      fs.watch(path.join(__dirname, 'renderer'), { recursive: true }, (_evt, file) => {
        if (file && /\.(jsx?|css|html)$/.test(file)) {
          clearTimeout(reloadTimer)
          reloadTimer = setTimeout(() => {
            if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.reload()
          }, 200)
        }
      })
      logger.info('dev auto-reload: watching renderer/')
    } catch (e) {
      logger.error('dev auto-reload watch failed: ' + e.message)
    }
  }

  updater = initUpdater(app, (info) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('updater:available', info)
    }
  })
  // First check shortly after boot.
  setTimeout(() => updater && updater.check(), 8000)

  showWindow() // show on first run

  app.on('activate', () => showWindow())
})

app.on('window-all-closed', () => {
  // Keep running in tray; do not quit on window close.
})

app.on('before-quit', () => {
  app.isQuitting = true
  if (bridgeServer) bridgeServer.close()
})
