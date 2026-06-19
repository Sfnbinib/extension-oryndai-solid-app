# SolidWorks Command Taxonomy For ORYND CAD Bridge

This is the production expansion map. It is not a raw list of every SolidWorks
COM method; it is the controlled layer the planner should target.

Raw API inventory should be generated with:

```text
tools/solidworks_api_inventory/
```

Runtime coverage checklist:

```bash
.venv/bin/python -m integrations.external_cad_extension.cli solidworks-coverage --out integrations/external_cad_extension/out/solidworks_runtime_checklist.md
```

## Current MVP Commands

```text
sketch, circle, rectangle, extrude, revolve, cut, hole, pattern, fillet, chamfer, mate, export
```

## Next Allowlist Groups

### Document And Units

- new part;
- new assembly;
- open document;
- save as;
- set units;
- rebuild;
- evaluate mass properties.

### Sketch

- line;
- arc;
- spline;
- ellipse;
- polygon;
- slot;
- offset entities;
- trim;
- convert entities;
- construction geometry;
- constraints/relations;
- dimensions.

### Solid Features

- boss extrude;
- cut extrude;
- revolve boss;
- revolve cut;
- sweep;
- loft;
- shell;
- rib;
- draft;
- mirror;
- linear pattern;
- circular pattern;
- hole wizard;
- fillet;
- chamfer.

### Surfaces

- boundary surface;
- loft surface;
- fill surface;
- knit surface;
- thicken.

### Reference Geometry

- plane;
- axis;
- coordinate system;
- point.

### Assemblies

- insert component;
- mate coincident;
- mate concentric;
- mate distance;
- mate parallel/perpendicular;
- fix/float;
- pattern component.

### Materials And Appearance

- assign material;
- assign appearance/color;
- set custom properties.

### Import And Export

- STEP import/export;
- STL import/export;
- OBJ import/export;
- Parasolid import/export;
- IGES import/export;
- DXF/DWG sketch import.

## Mapping Rule

Raw SolidWorks APIs become callable only after they are mapped into:

```text
CommandSpec -> validator -> macro/add-in emitter -> runtime test
```

No model output should call arbitrary `SldWorks` COM methods directly.
