# Install ORYND Add-In for AutoCAD

**Platform:** Mac and Windows (AutoLISP loader works on both)  
**Official docs:** https://help.autodesk.com/view/OARX/2024/ENU/?guid=GUID-C9B05270-4A3C-4B33-9B55-DEE0A2C0DDE5

---

## Step 1 — Start the ORYND Bridge

**Mac:**
```bash
python bridge/bridge.py
```

**Windows:**
```bash
python bridge\bridge.py
```

You should see:
```
ORYND Bridge running on http://127.0.0.1:8765
```

Leave this terminal open while using AutoCAD.

---

## Option A — AutoLISP loader (Mac + Windows, quickest)

This is the simplest method and works on both platforms.

1. Launch **AutoCAD**.
2. In the command bar, type `APPLOAD` and press Enter.
3. In the Load/Unload Applications dialog, click **Browse**.
4. Navigate to `autocad_addin/ORYNDAutoCADPlugin/orynd_loader.lsp`.
5. Click **Load**, then **Close**.
6. Type `ORYND` in the command bar → AutoCAD opens `http://127.0.0.1:8765` in your browser.

To load automatically on startup, add the .lsp path to **Startup Suite** in the APPLOAD dialog.

---

## Option B — Full .NET plugin (Windows only)

Provides an embedded task pane inside AutoCAD (no browser required).

**Requires:** AutoCAD 2019+ (R24.0+), .NET Framework 4.8, Visual Studio.

1. Open `autocad_addin/ORYNDAutoCADPlugin/Contents/Windows/ORYNDAutoCAD.cs` in Visual Studio.
2. Add AutoCAD API references (from your AutoCAD installation, typically  
   `C:\Program Files\Autodesk\AutoCAD <version>\acmgd.dll` and `accoremgd.dll`).
3. Build → Release.
4. Copy the output DLL to:  
   `%APPDATA%\Autodesk\ApplicationPlugins\ORYNDAutoCADPlugin\Contents\Windows\`
5. Copy `PackageContents.xml` to:  
   `%APPDATA%\Autodesk\ApplicationPlugins\ORYNDAutoCADPlugin\`
6. Restart AutoCAD.
7. Type `ORYND` in the command bar → task pane opens.

---

## Verify

1. Confirm bridge is running: open `http://127.0.0.1:8765/cloud-design` in a browser.
2. In AutoCAD, run the `ORYND` command.
3. Type a prompt and press **Generate**.

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `ORYND` command not found | Run APPLOAD again and load the .lsp file |
| Browser opens blank page | Make sure bridge is running on port 8765 |
| .NET plugin not loading | Check AutoCAD version (R24.0+ required) and DLL references |
| Mac task pane not available | Use Option A (LISP loader) — task pane is Windows only |
