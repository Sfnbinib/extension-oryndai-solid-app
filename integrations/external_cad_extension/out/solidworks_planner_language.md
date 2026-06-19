# SolidWorks Planner Command Language

## document

| Command | Runtime status | API hint | Purpose |
| --- | --- | --- | --- |
| `new_part` | `scaffolded_vba` | `ISldWorks.NewPart` | Create a new part document. |
| `new_assembly` | `planned_not_implemented` | `ISldWorks.NewAssembly` | Create a new assembly document. |
| `open_document` | `planned_not_implemented` | `ISldWorks.OpenDoc6` | Open an existing CAD document. |
| `save_document` | `scaffolded_vba` | `IModelDoc2.SaveAs3` | Save current document. |
| `set_units` | `planned_not_implemented` | `IModelDocExtension.SetUserPreference*` | Set document units. |
| `rebuild` | `planned_not_implemented` | `IModelDoc2.ForceRebuild3` | Rebuild model. |

## selection

| Command | Runtime status | API hint | Purpose |
| --- | --- | --- | --- |
| `select_plane` | `scaffolded_vba` | `IModelDocExtension.SelectByID2` | Select standard/named plane. |
| `select_face` | `planned_not_implemented` | `IModelDocExtension.SelectByRay` | Select face by name, ray, or coordinates. |
| `select_edge` | `planned_not_implemented` | `IModelDocExtension.SelectByRay` | Select edge by name or ray. |
| `select_feature` | `planned_not_implemented` | `IModelDocExtension.SelectByID2` | Select feature by name. |
| `clear_selection` | `planned_not_implemented` | `IModelDoc2.ClearSelection2` | Clear active selection. |

## sketch

| Command | Runtime status | API hint | Purpose |
| --- | --- | --- | --- |
| `create_sketch` | `scaffolded_vba` | `ISketchManager.InsertSketch` | Start sketch on selected plane/face. |
| `close_sketch` | `planned_not_implemented` | `ISketchManager.InsertSketch` | Exit current sketch. |

## sketch_geometry

| Command | Runtime status | API hint | Purpose |
| --- | --- | --- | --- |
| `sketch_line` | `planned_not_implemented` | `ISketchManager.CreateLine` | Create line segment. |
| `sketch_centerline` | `planned_not_implemented` | `ISketchManager.CreateCenterLine` | Create construction centerline. |
| `sketch_circle` | `scaffolded_vba` | `ISketchManager.CreateCircleByRadius` | Create sketch circle. |
| `sketch_rectangle` | `scaffolded_vba` | `ISketchManager.CreateCenterRectangle` | Create centered rectangle. |
| `sketch_arc` | `planned_not_implemented` | `ISketchManager.CreateArc` | Create arc. |
| `sketch_ellipse` | `planned_not_implemented` | `ISketchManager.CreateEllipse` | Create ellipse. |
| `sketch_spline` | `planned_not_implemented` | `ISketchManager.CreateSpline` | Create spline through points. |
| `sketch_slot` | `planned_not_implemented` | `ISketchManager.CreateSketchSlot` | Create straight/arc slot. |
| `sketch_polygon` | `planned_not_implemented` | `ISketchManager.CreatePolygon` | Create regular polygon. |
| `sketch_text` | `planned_not_implemented` | `ISketchManager.CreateText` | Create text for emboss/engrave. |

## sketch_edit

| Command | Runtime status | API hint | Purpose |
| --- | --- | --- | --- |
| `offset_entities` | `planned_not_implemented` | `ISketchManager.SketchOffset2` | Offset sketch entities. |
| `trim_entities` | `planned_not_implemented` | `ISketchManager.SketchTrim` | Trim sketch entities. |
| `convert_entities` | `planned_not_implemented` | `ISketchManager.SketchUseEdge3` | Project selected edges into sketch. |

## sketch_relation

| Command | Runtime status | API hint | Purpose |
| --- | --- | --- | --- |
| `add_relation` | `planned_not_implemented` | `ISketchRelationManager.AddRelation` | Add sketch relation. |

## dimension

| Command | Runtime status | API hint | Purpose |
| --- | --- | --- | --- |
| `add_dimension` | `planned_not_implemented` | `IModelDoc2.AddDimension2` | Add driving dimension. |
| `edit_dimension` | `planned_not_implemented` | `IDimension.SystemValue` | Edit named dimension value. |
| `add_equation` | `planned_not_implemented` | `IEquationMgr.Add3` | Add equation-driven relation. |

## solid_feature

| Command | Runtime status | API hint | Purpose |
| --- | --- | --- | --- |
| `extrude_boss` | `scaffolded_vba` | `IFeatureManager.FeatureExtrusion2` | Extrude sketch into solid. |
| `extrude_cut` | `scaffolded_vba` | `IFeatureManager.FeatureCut4` | Cut sketch into solid. |
| `revolve_boss` | `placeholder_vba` | `IFeatureManager.FeatureRevolve2` | Revolve sketch into solid. |
| `revolve_cut` | `planned_not_implemented` | `IFeatureManager.FeatureRevolve2` | Revolve sketch as cut. |
| `sweep_boss` | `planned_not_implemented` | `IFeatureManager.InsertProtrusionSwept4` | Sweep profile along path. |
| `sweep_cut` | `planned_not_implemented` | `IFeatureManager.InsertCutSwept4` | Sweep cut profile along path. |
| `loft_boss` | `planned_not_implemented` | `IFeatureManager.InsertProtrusionBlend2` | Loft between profiles. |
| `loft_cut` | `planned_not_implemented` | `IFeatureManager.InsertCutBlend` | Loft cut between profiles. |
| `shell` | `planned_not_implemented` | `IFeatureManager.InsertFeatureShell` | Hollow solid body. |
| `draft` | `planned_not_implemented` | `IFeatureManager.InsertDraft` | Apply draft angle. |
| `rib` | `planned_not_implemented` | `IFeatureManager.InsertRib` | Create rib from sketch. |
| `mirror_feature` | `planned_not_implemented` | `IFeatureManager.InsertMirrorFeature` | Mirror selected features. |

## body

| Command | Runtime status | API hint | Purpose |
| --- | --- | --- | --- |
| `combine_bodies` | `planned_not_implemented` | `IFeatureManager.InsertCombineFeature` | Add/subtract/common bodies. |
| `move_copy_body` | `planned_not_implemented` | `IFeatureManager.InsertMoveCopyBody2` | Move or copy solid body. |

## hole

| Command | Runtime status | API hint | Purpose |
| --- | --- | --- | --- |
| `hole_wizard` | `planned_not_implemented` | `IFeatureManager.HoleWizard*` | Create standard hole. |
| `simple_hole` | `weak_helper_needs_face_selection_fix` | `sketch circle + FeatureCut` | Create simple round hole. |

## pattern

| Command | Runtime status | API hint | Purpose |
| --- | --- | --- | --- |
| `linear_pattern` | `planned_not_implemented` | `IFeatureManager.FeatureLinearPattern*` | Linear feature/body pattern. |
| `circular_pattern` | `planned_not_implemented` | `IFeatureManager.FeatureCircularPattern*` | Circular feature/body pattern. |
| `curve_pattern` | `planned_not_implemented` | `IFeatureManager.InsertCurveDrivenPattern` | Pattern along curve. |

## edge_feature

| Command | Runtime status | API hint | Purpose |
| --- | --- | --- | --- |
| `fillet` | `needs_selection_strategy` | `IFeatureManager.FeatureFillet3` | Apply edge fillet. |
| `chamfer` | `needs_selection_strategy` | `IFeatureManager.InsertFeatureChamfer` | Apply edge chamfer. |

## reference_geometry

| Command | Runtime status | API hint | Purpose |
| --- | --- | --- | --- |
| `reference_plane` | `planned_not_implemented` | `IFeatureManager.InsertRefPlane` | Create reference plane. |
| `reference_axis` | `planned_not_implemented` | `IFeatureManager.InsertRefAxis` | Create reference axis. |
| `coordinate_system` | `planned_not_implemented` | `IFeatureManager.InsertCoordinateSystem` | Create coordinate system. |

## surface

| Command | Runtime status | API hint | Purpose |
| --- | --- | --- | --- |
| `boundary_surface` | `planned_not_implemented` | `IFeatureManager.InsertBoundarySurface` | Create boundary surface. |
| `loft_surface` | `planned_not_implemented` | `IFeatureManager.InsertLoftRefSurface` | Create loft surface. |
| `fill_surface` | `planned_not_implemented` | `IFeatureManager.InsertFillSurface` | Fill bounded surface. |
| `knit_surface` | `planned_not_implemented` | `IFeatureManager.InsertKnitSurface` | Knit surfaces. |
| `thicken_surface` | `planned_not_implemented` | `IFeatureManager.InsertThicken` | Thicken surface into solid. |

## assembly

| Command | Runtime status | API hint | Purpose |
| --- | --- | --- | --- |
| `insert_component` | `planned_not_implemented` | `IAssemblyDoc.AddComponent5` | Insert part/component into assembly. |
| `mate_coincident` | `declaration_only_no_assembly_execution` | `IAssemblyDoc.AddMate5` | Create coincident mate. |
| `mate_concentric` | `declaration_only_no_assembly_execution` | `IAssemblyDoc.AddMate5` | Create concentric mate. |
| `mate_distance` | `declaration_only_no_assembly_execution` | `IAssemblyDoc.AddMate5` | Create distance mate. |
| `fix_component` | `planned_not_implemented` | `IAssemblyDoc.FixComponent` | Fix assembly component. |
| `component_pattern` | `planned_not_implemented` | `IAssemblyDoc.FeatureManager.*` | Pattern assembly component. |

## properties

| Command | Runtime status | API hint | Purpose |
| --- | --- | --- | --- |
| `assign_material` | `planned_not_implemented` | `IPartDoc.SetMaterialPropertyName2` | Assign material to body/part. |
| `set_appearance` | `planned_not_implemented` | `IModelDocExtension.DisplayStateSpecMaterialPropertyValues` | Set color/appearance. |
| `set_custom_property` | `scaffolded_vba` | `ICustomPropertyManager.Add3` | Set custom property. |

## analysis

| Command | Runtime status | API hint | Purpose |
| --- | --- | --- | --- |
| `measure_mass_properties` | `planned_not_implemented` | `IModelDocExtension.CreateMassProperty` | Evaluate mass properties. |
| `interference_check` | `planned_not_implemented` | `IAssemblyDoc.ToolsCheckInterference2` | Check assembly interference. |

## drawing

| Command | Runtime status | API hint | Purpose |
| --- | --- | --- | --- |
| `create_drawing` | `planned_not_implemented` | `ISldWorks.NewDocument` | Create drawing document. |
| `insert_model_view` | `planned_not_implemented` | `IDrawingDoc.CreateDrawViewFromModelView3` | Insert drawing view from model. |
| `insert_projected_view` | `planned_not_implemented` | `IDrawingDoc.CreateUnfoldedViewAt3` | Insert projected drawing view. |
| `insert_model_annotations` | `planned_not_implemented` | `IDrawingDoc.InsertModelAnnotations3` | Import dimensions/annotations. |
| `insert_bom` | `planned_not_implemented` | `IView.InsertBomTable4` | Insert BOM table. |

## export

| Command | Runtime status | API hint | Purpose |
| --- | --- | --- | --- |
| `export_step` | `scaffolded_vba` | `IModelDocExtension.SaveAs` | Export STEP. |
| `export_stl` | `scaffolded_vba` | `IModelDocExtension.SaveAs` | Export STL. |
| `export_pdf` | `planned_not_implemented` | `IModelDocExtension.SaveAs` | Export drawing PDF. |
| `export_dxf` | `planned_not_implemented` | `IModelDocExtension.SaveAs` | Export drawing/sketch DXF. |
