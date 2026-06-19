# CAD Object Recipes

## brake_disc

Clarifying questions:
- Outer diameter, thickness, hub bore diameter, bolt pattern count/PCD?
- Solid rotor, vented rotor, drilled, slotted, or decorative preview?

Construction strategy:
1. Sketch rotor cross-section and/or top profile.
2. Create outer rotor body with hub bore.
3. Cut center bore and bolt holes on bolt circle.
4. Pattern holes circularly.
5. Add chamfers/fillets and optional slots/vents.
6. Export STEP after validation.

Useful commands:
`create_sketch`, `sketch_circle`, `extrude_boss`, `extrude_cut`, `circular_pattern`, `fillet`, `chamfer`, `export_step`

## f1_front_wing

Clarifying questions:
- Which regulation era/year or visual style should be approximated?
- Do you need a simple visual model, manufacturable surfaces, or aerodynamic profile study?
- How many elements/flaps and endplates?

Construction strategy:
1. Ask for era/year if absent because wing shape depends strongly on regulation generation.
2. Create central reference planes and wing span envelope.
3. Sketch airfoil-like profiles for main plane and upper flap.
4. Loft or sweep surfaces/solids across span with slight angle of attack.
5. Create endplates as side profiles with cutouts.
6. Add mounting pylons, slots, and simple fastener holes.
7. Mirror symmetric geometry if needed.
8. Export STEP and keep assumptions visible.

Useful commands:
`reference_plane`, `sketch_spline`, `loft_surface`, `thicken_surface`, `extrude_boss`, `extrude_cut`, `mirror_feature`, `fillet`, `export_step`

## spur_gear

Clarifying questions:
- Module, tooth count, pressure angle, face width, bore diameter?
- Do you need true involute teeth or simplified preview teeth?

Construction strategy:
1. Compute pitch/root/outer diameters from module and tooth count.
2. Sketch base circles and one tooth profile.
3. Use circular pattern for teeth.
4. Cut bore/keyway and optional lightening holes.
5. Chamfer edges and export STEP.

Useful commands:
`create_sketch`, `sketch_circle`, `sketch_line`, `sketch_arc`, `extrude_boss`, `extrude_cut`, `circular_pattern`, `chamfer`, `export_step`

## mounting_bracket

Clarifying questions:
- Plate size, thickness, hole diameter/count, bend/flange requirements?

Construction strategy:
1. Sketch base plate rectangle.
2. Extrude thickness.
3. Cut mounting holes.
4. Add side flange or vertical tab if requested.
5. Fillet/chamfer external edges.
6. Export STEP.

Useful commands:
`create_sketch`, `sketch_rectangle`, `extrude_boss`, `simple_hole`, `linear_pattern`, `fillet`, `chamfer`, `export_step`

## engine_assembly

Clarifying questions:
- Generate from scratch, search/import existing model, or decompose a provided mesh?
- Which engine type: piston, turbine, electric motor, simplified visual assembly?

Construction strategy:
1. Prefer search/import for complex assemblies.
2. If mesh/model is found, import/decompose into components.
3. Create/insert major components: block/casing, shaft, rotors/gears/pistons, fasteners.
4. Use assembly mates to position components.
5. Generate missing simple components parametrically.
6. Export assembly STEP and run interference/mass checks if available.

Useful commands:
`open_document`, `insert_component`, `mate_concentric`, `mate_coincident`, `mate_distance`, `circular_pattern`, `measure_mass_properties`, `export_step`
