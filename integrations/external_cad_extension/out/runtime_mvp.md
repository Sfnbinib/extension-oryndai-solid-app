# Runtime MVP

The first release should prove a few CAD actions work smoothly in SolidWorks.

| Command | Current status | Proof required |
| --- | --- | --- |
| `create_part` | `scaffolded_not_verified` | New part opens; ORYND custom property is written; rebuild succeeds. |
| `create_sketch_on_plane` | `scaffolded_not_verified` | Top/Front/Right plane sketch opens and closes without errors. |
| `draw_circle_rectangle_line` | `circle_rectangle_scaffolded_line_missing` | Circle, rectangle, and line appear in feature tree/sketch. |
| `extrude_boss` | `scaffolded_not_verified` | Mounting bracket base extrudes to expected thickness. |
| `extrude_cut` | `scaffolded_not_verified` | Through hole/center bore cuts expected faces. |
| `circular_pattern_or_explicit_repeat` | `pattern_placeholder_use_explicit_repeat_first` | Five brake-disc bolt holes appear at correct PCD. Can be true pattern or explicit repeated cuts for MVP. |
| `fillet_chamfer_basic` | `weak_selection_strategy` | Selected outer edges get visible fillet/chamfer without selecting random edges. |
| `export_step` | `scaffolded_not_verified` | STEP file is written and can be reopened. |

MVP examples:

- mounting bracket
- basic brake disc

Do not expand marketing claims beyond these until they run in real SolidWorks.
