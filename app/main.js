/**
 * ORYND Extension — Electron main process.
 *
 * A lightweight tray app: starts the in-process bridge (no Python needed),
 * watches for running CAD apps, installs add-ins on demand, and auto-updates.
 * Closing the window hides to tray; quit from the tray menu.
 */
const { app, BrowserWindow, Tray, Menu, ipcMain, nativeImage } = require('electron')
const path = require('node:path')
const { startBridge } = require('./bridge')
const { detectRunningCad, supportedCad } = require('./cad_detect')
const { installAddin } = require('./addin_installer')
const { initUpdater } = require('./updater')

const BRIDGE_PORT = 8765

let mainWindow = null
let tray = null
let bridgeServer = null
let updater = null
let lastRunningCad = []

// Single-instance lock — re-launching focuses the existing window.
if (!app.requestSingleInstanceLock()) {
  app.quit()
} else {
  app.on('second-instance', () => showWindow())
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 380,
    height: 560,
    resizable: false,
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
  // Minimal 16x16 indigo square; replaced by real asset in packaged build.
  const png = path.join(__dirname, 'assets', 'tray.png')
  const img = nativeImage.createFromPath(png)
  return img.isEmpty() ? nativeImage.createEmpty() : img
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
  ipcMain.handle('cad:install', (_e, cad) =>
    installAddin(cad, { isPackaged: app.isPackaged, resourcesPath: process.resourcesPath }),
  )
  ipcMain.handle('updater:check', () => updater && updater.check())
  ipcMain.handle('updater:install', () => updater && updater.install())
  ipcMain.handle('bridge:status', () => ({
    running: !!bridgeServer && bridgeServer.listening,
    port: BRIDGE_PORT,
  }))
  ipcMain.handle('window:hide', () => mainWindow && mainWindow.hide())
}

app.whenReady().then(() => {
  bridgeServer = startBridge(BRIDGE_PORT, path.join(__dirname, 'renderer'))
  registerIpc()
  createWindow()
  createTray()
  watchCad()

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
