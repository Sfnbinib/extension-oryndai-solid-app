# Install ORYND Add-In for Autodesk Fusion

**Platform:** Mac and Windows  
**Official docs:** https://help.autodesk.com/view/fusion360/ENU/?guid=GUID-FB8BEA73-7130-4F83-9776-9C62CFFA2B6D

---

## Step 1 — Start the ORYND Bridge

Open a terminal and run:

```bash
python bridge/bridge.py
```

You should see:
```
ORYND Bridge running on http://127.0.0.1:8765
```

Leave this terminal open while using Fusion.

---

## Step 2 — Open the Add-Ins dialog in Fusion

1. Launch **Autodesk Fusion**.
2. In the toolbar, click the **Utilities** tab (or **Tools** in older versions).
3. Click **Add-Ins** → **Scripts and Add-Ins…**

   *(keyboard shortcut: **Shift + S**)*

---

## Step 3 — Add the ORYND folder

1. In the **Add-Ins** tab, click the **+** (green plus) icon next to "My Add-Ins".
2. Navigate to the `fusion360_addin/ORYNDFusion360AddIn/` folder inside this package.
3. Click **OK** / **Open**.

The add-in **ORYNDFusion360AddIn** appears in the list.

---

## Step 4 — Run the add-in

1. Select **ORYNDFusion360AddIn** in the list.
2. Check **Run on Startup** if you want it to load automatically.
3. Click **Run**.

An **ORYND** panel appears in the Fusion toolbar.

---

## Step 5 — Verify

1. Open `http://127.0.0.1:8765/cloud-design` in your browser — you should see the ORYND UI.
2. Click the **ORYND** button in the Fusion toolbar — the panel opens inside Fusion.
3. Type a prompt (e.g. *"Create a bracket 80×40×20 mm"*) and press **Generate**.

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Panel does not open | Make sure `python bridge/bridge.py` is running |
| "Connection refused" error | Check that port 8765 is not blocked by a firewall |
| Add-in not visible after restart | Enable **Run on Startup** in the Add-Ins dialog |
