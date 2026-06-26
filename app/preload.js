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
  installUpdate: () => ipcRenderer.invoke('updater:install'),
  onUpdate: (cb) => ipcRenderer.on('updater:available', (_e, info) => cb(info)),
  // window
  hide: () => ipcRenderer.invoke('window:hide'),
  reload: () => ipcRenderer.invoke('window:reload'),
  // open URL in system default browser (never inside Electron)
  openExternal: (url) => ipcRenderer.invoke('shell:openExternal', url),
  // feedback: collect recent logs (days: 1 today / 7 / 30)
  collectLogs: (days) => ipcRenderer.invoke('logs:collect', days),
})
