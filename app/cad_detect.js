/**
 * CAD DETECT — find which CAD applications are running.
 * Mac: `ps`. Windows: `tasklist`. Used to auto-show the panel when the
 * user opens their CAD, and to know which add-in to offer.
 */
const { exec } = require('node:child_process')

// Process-name signatures per CAD per platform.
const SIGNATURES = {
  fusion360: { darwin: ['Fusion', 'Autodesk Fusion'], win32: ['Fusion360.exe', 'Fusion.exe'] },
  autocad: { darwin: ['AutoCAD'], win32: ['acad.exe'] },
  solidworks: { darwin: [], win32: ['SLDWORKS.exe'] },
}

function listProcesses() {
  return new Promise((resolve) => {
    const cmd = process.platform === 'win32' ? 'tasklist' : 'ps -ax -o comm'
    exec(cmd, { timeout: 5000, maxBuffer: 1024 * 1024 * 4 }, (err, stdout) => {
      resolve(err ? '' : stdout.toLowerCase())
    })
  })
}

/** Returns array of running CAD ids, e.g. ['fusion360']. */
async function detectRunningCad() {
  const procs = await listProcesses()
  const plat = process.platform
  const running = []
  for (const [cad, sig] of Object.entries(SIGNATURES)) {
    const names = sig[plat] || []
    if (names.some((n) => procs.includes(n.toLowerCase()))) running.push(cad)
  }
  return running
}

/** CADs installable on this platform (SolidWorks is Windows-only). */
function supportedCad() {
  if (process.platform === 'win32') return ['fusion360', 'autocad', 'solidworks']
  return ['fusion360', 'autocad'] // mac
}

module.exports = { detectRunningCad, supportedCad }
