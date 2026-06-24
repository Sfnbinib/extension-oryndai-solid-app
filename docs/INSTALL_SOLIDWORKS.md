# Install ORYND Add-In for SolidWorks

**Platform:** Windows only  
**Requires:** SolidWorks 2020 or later, .NET Framework 4.8, Visual Studio (to build)  
**Official docs:** https://help.solidworks.com/2023/english/api/sldworksapiprogguide/GettingStarted/Overview_of_SolidWorks_API.htm

---

## Step 1 — Start the ORYND Bridge

Open PowerShell or Command Prompt and run:

```bash
python bridge\bridge.py
```

You should see:
```
ORYND Bridge running on http://127.0.0.1:8765
```

Leave this window open while using SolidWorks.

---

## Step 2 — Build the add-in DLL

> **Prerequisites:** Visual Studio 2019+ with .NET desktop workload.

1. Open `solidworks_addin/ORYNDCadBridgeAddin/ORYNDCadBridgeAddin.csproj` in Visual Studio.
2. Set SolidWorks interop DLL paths if prompted (they live in  
   `C:\Program Files\SOLIDWORKS Corp\SOLIDWORKS\api\redist\`).
3. Build → **Release** configuration.
4. Output DLL: `bin\Release\ORYNDCadBridgeAddin.dll`.

---

## Step 3 — Register the add-in

Run the included PowerShell script **as Administrator**:

```powershell
cd solidworks_addin
.\Register-ORYNDCADBridgeAddin.ps1
```

This adds the required COM registry entries so SolidWorks can find the add-in.

---

## Step 4 — Enable in SolidWorks

1. Launch **SolidWorks**.
2. Go to **Tools → Add-Ins…**
3. Find **ORYND CAD Bridge** in the list.
4. Check both boxes (active + startup).
5. Click **OK**.

An **ORYND** task pane appears on the right side.

---

## Step 5 — Verify

1. In the ORYND task pane, type a prompt and click **Generate Preview**.
2. Open `http://127.0.0.1:8765/cloud-design` in a browser to confirm the bridge is up.

---

## Uninstall

```powershell
.\Unregister-ORYNDCADBridgeAddin.ps1
```

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Add-in not in list | Run `Register-ORYNDCADBridgeAddin.ps1` as Administrator |
| Build fails (missing DLLs) | Point project to your SolidWorks `api\redist\` folder |
| Task pane blank | Make sure bridge is running on port 8765 |
