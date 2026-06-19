"""ORYND AI Model 4 adapter for the external CAD extension.

This bridges existing ORYND AI Model 4 primitive/CoreOps output into the
external extension's OperationPlan contract.
"""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Any

from .schema import Operation, OperationPlan


@dataclass(frozen=True)
class AIModel4AdapterResult:
    ok: bool
    operation_plan: OperationPlan
    source_coreops: dict[str, Any]
    notes: list[str]

    def to_dict(self) -> dict[str, Any]:
        return {
            "ok": self.ok,
            "operation_plan": self.operation_plan.to_dict(),
            "source_coreops": self.source_coreops,
            "notes": list(self.notes),
        }


def primitives_to_operation_plan(ai_model_4_doc: dict[str, Any], *, name: str = "ai_model_4_part") -> AIModel4AdapterResult:
    """Translate AI Model 4 primitive document into external OperationPlan."""
    try:
        from orynd_core.agents.ai_model_4.cad_translator import translate_to_cad_coreops

        coreops = translate_to_cad_coreops(ai_model_4_doc)
    except ModuleNotFoundError:
        coreops = _translate_primitives_to_coreops_local(ai_model_4_doc)
    plan, notes = coreops_to_operation_plan(coreops, name=name, prompt="AI Model 4 primitive reconstruction")
    return AIModel4AdapterResult(ok=bool(plan.operations), operation_plan=plan, source_coreops=coreops, notes=notes)


def _translate_primitives_to_coreops_local(ai_model_4_doc: dict[str, Any]) -> dict[str, Any]:
    """Small standalone fallback for the external repo.

    The full ORYND workspace has a richer AI Model 4 translator. The standalone
    extension still needs to handle basic primitive smoke tests without pulling
    the whole app into the release repository.
    """
    operations: list[dict[str, Any]] = []
    notes: list[str] = []
    bodies: list[str] = []
    for index, item in enumerate(ai_model_4_doc.get("operations", []) or [], start=1):
        op = item.get("op") or item.get("type")
        params = item.get("params", {}) or {}
        transform = item.get("transform", {}) or {}
        if op == "box":
            size = params.get("size") or item.get("size") or [1, 1, 1]
            center = transform.get("center") or item.get("center") or [0, 0, 0]
            width = float(size[0]) if len(size) > 0 else 1.0
            height = float(size[1]) if len(size) > 1 else 1.0
            depth = float(size[2]) if len(size) > 2 else 1.0
            sketch_id = f"sketch{index}"
            body_id = f"body{index}"
            operations.append(
                {
                    "op": "CreateSketch",
                    "id": sketch_id,
                    "plane": "XY",
                    "offset": 0.0,
                    "shapes": [
                        {
                            "type": "rect",
                            "center": {"x": float(center[0]) if len(center) > 0 else 0, "y": float(center[1]) if len(center) > 1 else 0},
                            "width": width,
                            "height": height,
                        }
                    ],
                }
            )
            operations.append({"op": "Extrude", "id": body_id, "sketch_ref": sketch_id, "height": depth})
            bodies.append(body_id)
        elif op == "cylinder":
            radius = float(params.get("radius", item.get("radius", 1)))
            depth = float(params.get("height", params.get("depth", item.get("depth", 1))))
            center = transform.get("center") or item.get("center") or [0, 0, 0]
            sketch_id = f"sketch{index}"
            body_id = f"body{index}"
            operations.append(
                {
                    "op": "CreateSketch",
                    "id": sketch_id,
                    "plane": "XY",
                    "offset": 0.0,
                    "shapes": [
                        {
                            "type": "circle",
                            "center": {"x": float(center[0]) if len(center) > 0 else 0, "y": float(center[1]) if len(center) > 1 else 0},
                            "radius": radius,
                        }
                    ],
                }
            )
            operations.append({"op": "Extrude", "id": body_id, "sketch_ref": sketch_id, "height": depth})
            bodies.append(body_id)
        else:
            notes.append(f"Unsupported primitive {op!r}")
    if len(bodies) > 1:
        operations.append({"op": "Boolean", "id": f"body{len(bodies) + 1}", "operation": "union", "body_refs": bodies})
    return {
        "units": "mm",
        "operations": operations,
        "meta": {
            "translation_notes": notes,
            "bodies_built": len(bodies),
            "source_op_count": len(ai_model_4_doc.get("operations", []) or []),
            "skipped_count": len(notes),
        },
    }


def coreops_to_operation_plan(coreops: dict[str, Any], *, name: str, prompt: str) -> tuple[OperationPlan, list[str]]:
    operations: list[Operation] = []
    notes: list[str] = []
    sketch_shapes: dict[str, list[dict[str, Any]]] = {}

    for raw in coreops.get("operations", []):
        op = raw.get("op")
        if op == "CreateSketch":
            sketch_id = str(raw.get("id", "sketch"))
            shapes = list(raw.get("shapes", []) or [])
            sketch_shapes[sketch_id] = shapes
            plane = {"XY": "Top", "XZ": "Front", "YZ": "Right"}.get(raw.get("plane", "XY"), "Top")
            operations.append(Operation("sketch", sketch_id, {"plane": plane}, f"Create sketch from CoreOps {sketch_id}"))
            for idx, shape in enumerate(shapes):
                shape_type = shape.get("type")
                if shape_type == "circle":
                    operations.append(
                        Operation(
                            "circle",
                            f"{sketch_id}_circle_{idx + 1}",
                            {
                                "center": shape.get("center", {"x": 0, "y": 0}),
                                "radius": shape.get("radius", 1),
                            },
                            "Create circle recovered from AI Model 4/CoreOps",
                        )
                    )
                elif shape_type == "rect":
                    operations.append(
                        Operation(
                            "rectangle",
                            f"{sketch_id}_rect_{idx + 1}",
                            {
                                "center": shape.get("center", {"x": 0, "y": 0}),
                                "width": shape.get("width", 1),
                                "height": shape.get("height", 1),
                            },
                            "Create rectangle recovered from AI Model 4/CoreOps",
                        )
                    )
                else:
                    notes.append(f"CreateSketch {sketch_id}: unsupported shape {shape_type!r}")
        elif op == "Extrude":
            operations.append(
                Operation(
                    "extrude",
                    str(raw.get("id", "extrude")),
                    {"depth": raw.get("height", 1), "symmetric": bool(raw.get("symmetric", False))},
                    f"Extrude CoreOps sketch {raw.get('sketch_ref')}",
                )
            )
        elif op == "CutHole":
            operations.append(
                Operation(
                    "hole",
                    str(raw.get("id", "hole")),
                    {
                        "center": raw.get("center", {"x": 0, "y": 0}),
                        "diameter": float(raw.get("radius", 1)) * 2,
                        "through_all": bool(raw.get("through", True)),
                        "depth": raw.get("depth", 0),
                    },
                    "Cut hole recovered from CoreOps",
                )
            )
        elif op == "Fillet":
            operations.append(
                Operation("fillet", str(raw.get("id", "fillet")), {"radius": raw.get("radius", 1)}, "Fillet recovered from CoreOps")
            )
        elif op == "Chamfer":
            operations.append(
                Operation("chamfer", str(raw.get("id", "chamfer")), {"distance": raw.get("distance", 1)}, "Chamfer recovered from CoreOps")
            )
        elif op == "Boolean":
            notes.append("Boolean union is represented implicitly in the generated macro preview.")
        else:
            notes.append(f"Unsupported CoreOps operation {op!r}")

    has_geometry = any(op.command in {"circle", "rectangle", "extrude", "hole", "fillet", "chamfer"} for op in operations)
    if has_geometry:
        operations.append(
            Operation("export", "export_step", {"format": "STEP", "filename": f"{name}.step"}, "Export AI Model 4 reconstruction")
        )
    else:
        notes.append("No supported AI Model 4/CoreOps geometry could be converted into macro operations.")
    meta = coreops.get("meta", {}) or {}
    notes.extend(str(item) for item in meta.get("translation_notes", []) if item)
    plan = OperationPlan(
        name=name,
        prompt=prompt,
        source="orynd_ai_model_4_adapter",
        operations=operations,
        assumptions=[
            "AI Model 4/CoreOps reconstruction is limited to supported primitive mappings in this prototype.",
            "Non-axis-aligned or unsupported primitives are skipped with notes.",
            "Result must pass macro validation before user-approved SolidWorks execution.",
        ],
        warnings=notes,
        mesh_context=f"source_op_count={meta.get('source_op_count', 0)} bodies_built={meta.get('bodies_built', 0)}",
    )
    return plan, notes


async def mesh_file_to_operation_plan(mesh_path: str | Path, *, session_id: str = "external_cad_mesh") -> AIModel4AdapterResult:
    """Run existing ORYND AI Model 4 dual-pass pipeline on a mesh file.

    This is a real adapter to ORYND's existing pipeline. It can still degrade if
    the mesh pipeline extracts unsupported primitives; notes explain that case.
    """
    from orynd_core.agents.ai_model_4 import run_dual_pass_to_cad

    result = await run_dual_pass_to_cad(str(mesh_path), session_id=session_id)
    coreops = result.cad_coreops or {"units": "mm", "operations": [], "meta": {}}
    plan, notes = coreops_to_operation_plan(coreops, name=Path(mesh_path).stem[:48] or "mesh_part", prompt=f"Mesh reconstruction from {mesh_path}")
    notes.extend(result.translation_notes or [])
    return AIModel4AdapterResult(ok=bool(plan.operations), operation_plan=plan, source_coreops=coreops, notes=notes)
