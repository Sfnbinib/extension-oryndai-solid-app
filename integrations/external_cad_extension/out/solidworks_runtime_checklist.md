# SolidWorks Runtime Verification Checklist

Run this on Windows with SolidWorks installed.

| Command | Macro helper | Status | Runtime test |
| --- | --- | --- | --- |
| `chamfer` | `ORYND_Chamfer` | `needs_selection_strategy` | Create minimal part using chamfer; rebuild; export STEP; visually inspect feature tree. |
| `circle` | `ORYND_Circle` | `needs_solidworks_runtime` | Create minimal part using circle; rebuild; export STEP; visually inspect feature tree. |
| `cut` | `ORYND_Cut` | `needs_solidworks_runtime` | Create minimal part using cut; rebuild; export STEP; visually inspect feature tree. |
| `export` | `ORYND_Export` | `needs_solidworks_runtime` | Create minimal part using export; rebuild; export STEP; visually inspect feature tree. |
| `extrude` | `ORYND_Extrude` | `needs_solidworks_runtime` | Create minimal part using extrude; rebuild; export STEP; visually inspect feature tree. |
| `fillet` | `ORYND_Fillet` | `needs_selection_strategy` | Create minimal part using fillet; rebuild; export STEP; visually inspect feature tree. |
| `hole` | `ORYND_Hole` | `weak_helper_needs_face_selection_fix` | Create minimal part using hole; rebuild; export STEP; visually inspect feature tree. |
| `mate` | `ORYND_Mate` | `declaration_only_no_assembly_execution` | Create minimal part using mate; rebuild; export STEP; visually inspect feature tree. |
| `pattern` | `ORYND_Pattern` | `placeholder_helper_needs_real_feature_pattern` | Create minimal part using pattern; rebuild; export STEP; visually inspect feature tree. |
| `rectangle` | `ORYND_Rectangle` | `needs_solidworks_runtime` | Create minimal part using rectangle; rebuild; export STEP; visually inspect feature tree. |
| `revolve` | `ORYND_Revolve` | `needs_solidworks_runtime` | Create minimal part using revolve; rebuild; export STEP; visually inspect feature tree. |
| `sketch` | `ORYND_CreateSketch` | `needs_solidworks_runtime` | Create minimal part using sketch; rebuild; export STEP; visually inspect feature tree. |

Required example runs:

- brake_disc
- spur_gear
- f1_front_wing
- mounting_bracket

A command can move from `needs_solidworks_runtime` to `runtime_verified` only after the generated macro creates the expected feature in a real SolidWorks document.
