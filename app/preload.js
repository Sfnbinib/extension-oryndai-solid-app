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
  onAuth: (cb) => ipcRenderer.on('auth:token', (_e, data) => cb(data)),
  // window
  hide: () => ipcRenderer.invoke('window:hide'),
  reload: () => ipcRenderer.invoke('window:reload'),
  // open URL in system default browser (never inside Electron)
  openExternal: (url) => ipcRenderer.invoke('shell:openExternal', url),
  // reveal a finished build on disk. The model lands in a folder; telling the user
  // "Saved to <path>" and making them hunt for it in Finder is not a result.
  openPath: (p) => ipcRenderer.invoke('shell:openPath', p),
  // feedback: collect recent logs (days: 1 today / 7 / 30)
  collectLogs: (days) => ipcRenderer.invoke('logs:collect', days),
  // local projects: one folder per chat in ~/Documents/ORYND/projects
  projectsList: () => ipcRenderer.invoke('projects:list'),
  projectLoad: (id) => ipcRenderer.invoke('projects:load', id),
  projectSave: (id, data) => ipcRenderer.invoke('projects:save', id, data),
  projectForget: (id) => ipcRenderer.invoke('projects:forget', id),
  projectDir: (id) => ipcRenderer.invoke('projects:dir', id),
})
