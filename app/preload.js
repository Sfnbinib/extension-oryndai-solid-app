const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('orynd', {
  // CAD
  detectCad: () => ipcRenderer.invoke('cad:detect'),
  supportedCad: () => ipcRenderer.invoke('cad:supported'),
  installAddin: (cad) => ipcRenderer.invoke('cad:install', cad),
  // bridge
  bridgeStatus: () => ipcRenderer.invoke('bridge:status'),
  // updater
  checkUpdate: () => ipcRenderer.invoke('updater:check'),
  onUpdate: (cb) => ipcRenderer.on('updater:available', (_e, info) => cb(info)),
  // window
  hide: () => ipcRenderer.invoke('window:hide'),
})
