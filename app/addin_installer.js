/**
 * ADD-IN INSTALLER — copy the bundled CAD add-in into the right folder
 * so the user's CAD app picks it up. Runs once when the user enables a CAD.
 *
 * Add-in sources are bundled via electron-builder `extraResources` into
 * `<resources>/addins/<cad>_addin`. In dev they live one level up from app/.
 */
const fs = require('node:fs')
const path = require('node:path')
const os = require('node:os')

function addinsRoot(isPackaged, resourcesPath) {
  // Packaged: process.resourcesPath/addins. Dev: ../<cad>_addin
  return isPackaged ? path.join(resourcesPath, 'addins') : path.join(__dirname, '..')
}

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true })
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name)
    const d = path.join(dest, entry.name)
    if (entry.isDirectory()) copyDir(s, d)
    else fs.copyFileSync(s, d)
  }
}

// Target install folders per CAD per platform.
function fusionTarget() {
  const home = os.homedir()
  if (process.platform === 'win32') {
    return path.join(process.env.APPDATA || path.join(home, 'AppData', 'Roaming'),
      'Autodesk', 'Autodesk Fusion 360', 'API', 'AddIns', 'ORYNDFusion360AddIn')
  }
  return path.join(home, 'Library', 'Application Support',
    'Autodesk', 'Autodesk Fusion 360', 'API', 'AddIns', 'ORYNDFusion360AddIn')
}

function autocadTarget() {
  const home = os.homedir()
  if (process.platform === 'win32') {
    return path.join(process.env.APPDATA || path.join(home, 'AppData', 'Roaming'),
      'Autodesk', 'ApplicationPlugins', 'ORYNDAutoCADPlugin')
  }
  return path.join(home, 'Library', 'Application Support',
    'Autodesk', 'ApplicationPlugins', 'ORYNDAutoCADPlugin')
}

/**
 * Install add-in for `cad`. Returns {ok, target, manual?}.
 * SolidWorks needs COM DLL registration (admin) → we copy + flag manual.
 */
function installAddin(cad, { isPackaged, resourcesPath }) {
  const root = addinsRoot(isPackaged, resourcesPath)
  try {
    if (cad === 'fusion360') {
      const src = path.join(root, 'fusion360_addin', 'ORYNDFusion360AddIn')
      const target = fusionTarget()
      copyDir(src, target)
      return { ok: true, target }
    }
    if (cad === 'autocad') {
      const src = path.join(root, 'autocad_addin', 'ORYNDAutoCADPlugin')
      const target = autocadTarget()
      copyDir(src, target)
      return { ok: true, target }
    }
    if (cad === 'solidworks') {
      // Copy to userData; registration requires admin PowerShell (manual).
      const src = path.join(root, 'solidworks_addin')
      const target = path.join(os.homedir(), '.orynd', 'solidworks_addin')
      copyDir(src, target)
      return {
        ok: true,
        target,
        manual: 'Run Register-ORYNDCADBridgeAddin.ps1 as Administrator to finish.',
      }
    }
    return { ok: false, error: `unknown cad: ${cad}` }
  } catch (err) {
    return { ok: false, error: err.message }
  }
}

module.exports = { installAddin }
