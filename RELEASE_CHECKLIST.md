# First Release Checklist

## Local

- Run tests.
- Generate all four example macros.
- Verify `.env` is absent from git.
- Verify release manifest URL and SHA256 values.

## Windows/SolidWorks

- Install SolidWorks.
- Build `ORYNDCadBridgeAddin.dll`.
- Register COM add-in with `Register-ORYNDCADBridgeAddin.ps1`.
- Open SolidWorks.
- Enable `ORYND CAD Bridge` under Add-Ins.
- Confirm the right-side Task Pane appears.
- Start the local bridge.
- Generate brake disc preview from the Task Pane.
- Import/run generated `.bas` macro only after manual review.

## GitHub Release

- Build installer: `ORYND-CAD-Bridge-Setup-x.y.z.exe`.
- Generate SHA256.
- Update `release/manifest.example.json` or `releases/stable.json`.
- Upload installer and manifest to GitHub release.
- Test download/install on a second Windows machine.

