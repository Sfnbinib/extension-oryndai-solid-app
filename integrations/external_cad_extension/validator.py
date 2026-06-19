"""Static plan and macro validator."""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from typing import Any

from .catalog import COMMAND_CATALOG, UNSAFE_MACRO_TOKENS
from .schema import Operation, OperationPlan, is_non_negative_number


@dataclass
class ValidationReport:
    ok: bool
    errors: list[str] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        return {
            "ok": self.ok,
            "errors": list(self.errors),
            "warnings": list(self.warnings),
        }


def validate_plan(plan: OperationPlan) -> ValidationReport:
    errors: list[str] = []
    warnings: list[str] = []
    previous_ops: dict[str, Operation] = {}
    active_sketch = False
    active_profiles: list[dict[str, Any]] = []
    has_solid = False
    body_profiles: list[dict[str, Any]] = []
    if plan.units != "mm":
        errors.append(f"Unsupported units {plan.units!r}; only 'mm' is allowed.")
    if not plan.assumptions:
        errors.append("Plan must include explicit assumptions.")
    if not plan.operations:
        errors.append("Plan must include at least one operation.")

    seen_ids: set[str] = set()
    for idx, op in enumerate(plan.operations):
        path = f"operations[{idx}]"
        if op.command not in COMMAND_CATALOG:
            errors.append(f"{path}: command {op.command!r} is not in the allowed catalog.")
            continue
        if not op.id:
            errors.append(f"{path}: id is required.")
        if op.id in seen_ids:
            errors.append(f"{path}: duplicate id {op.id!r}.")
        seen_ids.add(op.id)

        spec = COMMAND_CATALOG[op.command]
        missing = spec.required_args() - set(op.args)
        for name in sorted(missing):
            errors.append(f"{path} {op.command}: missing required arg {name!r}.")

        for arg_spec in spec.args:
            if arg_spec.name not in op.args:
                continue
            value = op.args[arg_spec.name]
            _validate_arg(path, op.command, arg_spec.name, arg_spec.kind, value, errors)
            if arg_spec.kind in {"number", "int"} and isinstance(value, (int, float)):
                if arg_spec.min_value is not None and value < arg_spec.min_value:
                    errors.append(f"{path} {op.command}.{arg_spec.name}: {value} < {arg_spec.min_value}.")
                if arg_spec.max_value is not None and value > arg_spec.max_value:
                    errors.append(f"{path} {op.command}.{arg_spec.name}: {value} > {arg_spec.max_value}.")
            if arg_spec.choices and isinstance(value, str) and value not in arg_spec.choices:
                errors.append(
                    f"{path} {op.command}.{arg_spec.name}: {value!r} not in {list(arg_spec.choices)}."
                )

        if op.command == "export":
            filename = str(op.args.get("filename", ""))
            if "/" in filename or "\\" in filename or ".." in filename:
                errors.append(f"{path} export.filename must be a simple visible filename, got {filename!r}.")
        _validate_operation_order(
            path=path,
            op=op,
            active_sketch=active_sketch,
            has_profile=bool(active_profiles),
            has_solid=has_solid,
            errors=errors,
        )
        _validate_geometry(
            path=path,
            op=op,
            body_profiles=body_profiles,
            previous_ops=previous_ops,
            errors=errors,
            warnings=warnings,
        )

        if op.command == "sketch":
            active_sketch = True
            active_profiles = []
        elif op.command in {"circle", "rectangle", "line"}:
            active_profiles.extend(_profile_from_operation(op))
        elif op.command in {"extrude", "revolve"}:
            if active_profiles:
                body_profiles = list(active_profiles)
            has_solid = True
            active_sketch = False
            active_profiles = []
        elif op.command == "cut":
            active_sketch = False
            active_profiles = []

        previous_ops[op.id] = op

    return ValidationReport(ok=not errors, errors=errors, warnings=warnings)


def _validate_operation_order(
    *,
    path: str,
    op: Operation,
    active_sketch: bool,
    has_profile: bool,
    has_solid: bool,
    errors: list[str],
) -> None:
    if op.command in {"circle", "rectangle", "line"} and not active_sketch:
        errors.append(f"{path} {op.command}: requires an active sketch before sketch geometry.")
    if op.command in {"extrude", "revolve"}:
        if not active_sketch:
            errors.append(f"{path} {op.command}: requires an active sketch.")
        if not has_profile:
            errors.append(f"{path} {op.command}: requires sketch geometry before feature creation.")
    if op.command in {"cut", "hole", "fillet", "chamfer"} and not has_solid:
        errors.append(f"{path} {op.command}: requires a solid body created by an earlier feature.")
    if op.command == "export" and not has_solid:
        errors.append(f"{path} export: requires a solid body before export.")


def _validate_geometry(
    *,
    path: str,
    op: Operation,
    body_profiles: list[dict[str, Any]],
    previous_ops: dict[str, Operation],
    errors: list[str],
    warnings: list[str],
) -> None:
    if op.command == "hole" and body_profiles:
        center = op.args.get("center", {})
        diameter = op.args.get("diameter", 0)
        if _is_point2(center) and isinstance(diameter, (int, float)) and not isinstance(diameter, bool):
            if not any(_hole_fits_profile(center, float(diameter), profile) for profile in body_profiles):
                errors.append(
                    f"{path} hole: center {center!r} with diameter {diameter!r} does not fit inside known solid profile."
                )

    if op.command != "pattern":
        return

    target_ref = op.args.get("target_ref")
    if target_ref not in previous_ops:
        errors.append(f"{path} pattern target_ref {target_ref!r} must reference an earlier operation id.")
        return

    if op.args.get("pattern_type") != "circular":
        return

    if "radius" not in op.args:
        errors.append(f"{path} circular pattern requires radius.")
        return

    target = previous_ops[target_ref]
    radius = op.args.get("radius")
    if not isinstance(radius, (int, float)) or isinstance(radius, bool):
        return

    if target.command == "hole":
        center = target.args.get("center", {})
        if _is_point2(center):
            target_radius = (float(center["x"]) ** 2 + float(center["y"]) ** 2) ** 0.5
            if abs(target_radius - float(radius)) > 0.5:
                errors.append(
                    f"{path} circular pattern radius {radius!r} does not match target hole radius "
                    f"{target_radius:.3f} mm."
                )
    elif target.command in {"circle", "rectangle", "line"}:
        warnings.append(
            f"{path} pattern target_ref {target_ref!r} references sketch geometry; runtime add-in must map it to a feature."
        )


def _profile_from_operation(op: Operation) -> list[dict[str, Any]]:
    if op.command == "circle":
        center = op.args.get("center", {})
        radius = op.args.get("radius")
        if _is_point2(center) and isinstance(radius, (int, float)) and not isinstance(radius, bool):
            return [{"type": "circle", "center": dict(center), "radius": float(radius)}]
    if op.command == "rectangle":
        center = op.args.get("center", {})
        width = op.args.get("width")
        height = op.args.get("height")
        if (
            _is_point2(center)
            and isinstance(width, (int, float))
            and not isinstance(width, bool)
            and isinstance(height, (int, float))
            and not isinstance(height, bool)
        ):
            return [{"type": "rectangle", "center": dict(center), "width": float(width), "height": float(height)}]
    return []


def _is_point2(value: Any) -> bool:
    return (
        isinstance(value, dict)
        and isinstance(value.get("x"), (int, float))
        and not isinstance(value.get("x"), bool)
        and isinstance(value.get("y"), (int, float))
        and not isinstance(value.get("y"), bool)
    )


def _hole_fits_profile(center: dict[str, Any], diameter: float, profile: dict[str, Any]) -> bool:
    hole_radius = diameter / 2.0
    if profile.get("type") == "circle":
        profile_center = profile["center"]
        dx = float(center["x"]) - float(profile_center["x"])
        dy = float(center["y"]) - float(profile_center["y"])
        return (dx * dx + dy * dy) ** 0.5 + hole_radius <= float(profile["radius"]) + 1e-6
    if profile.get("type") == "rectangle":
        profile_center = profile["center"]
        dx = abs(float(center["x"]) - float(profile_center["x"]))
        dy = abs(float(center["y"]) - float(profile_center["y"]))
        return dx + hole_radius <= float(profile["width"]) / 2.0 + 1e-6 and dy + hole_radius <= float(
            profile["height"]
        ) / 2.0 + 1e-6
    return True


def _validate_arg(
    path: str,
    command: str,
    name: str,
    kind: str,
    value: Any,
    errors: list[str],
) -> None:
    prefix = f"{path} {command}.{name}"
    if kind == "number":
        if not is_non_negative_number(value):
            errors.append(f"{prefix}: expected non-negative number, got {value!r}.")
    elif kind == "int":
        if not isinstance(value, int) or isinstance(value, bool):
            errors.append(f"{prefix}: expected int, got {value!r}.")
    elif kind == "bool":
        if not isinstance(value, bool):
            errors.append(f"{prefix}: expected bool, got {value!r}.")
    elif kind == "str":
        if not isinstance(value, str) or not value:
            errors.append(f"{prefix}: expected non-empty string, got {value!r}.")
    elif kind == "point2":
        if not isinstance(value, dict):
            errors.append(f"{prefix}: expected point dict, got {value!r}.")
            return
        for axis in ("x", "y"):
            if axis not in value or not isinstance(value[axis], (int, float)) or isinstance(value[axis], bool):
                errors.append(f"{prefix}.{axis}: expected number, got {value.get(axis)!r}.")
    elif kind == "point3":
        if not isinstance(value, dict):
            errors.append(f"{prefix}: expected point dict, got {value!r}.")
            return
        for axis in ("x", "y", "z"):
            if axis in value and (not isinstance(value[axis], (int, float)) or isinstance(value[axis], bool)):
                errors.append(f"{prefix}.{axis}: expected number, got {value.get(axis)!r}.")


def validate_macro_text(macro_code: str) -> ValidationReport:
    errors: list[str] = []
    warnings: list[str] = []
    for token in UNSAFE_MACRO_TOKENS:
        if token.lower() in macro_code.lower():
            errors.append(f"Macro contains unsafe token: {token}")

    allowed_calls = {spec.target_macro_call for spec in COMMAND_CATALOG.values()}
    helper_defs = {f"Private Sub {call}" for call in allowed_calls}
    for match in re.finditer(r"^\s*(ORYND_[A-Za-z0-9_]+)\b", macro_code, flags=re.MULTILINE):
        call = match.group(1)
        if call not in allowed_calls:
            errors.append(f"Macro contains non-catalog ORYND helper call: {call}")

    for call in allowed_calls:
        if f"Sub {call}" not in macro_code:
            warnings.append(f"Macro helper {call} is not defined in emitted file.")
    if helper_defs and not any(defn in macro_code for defn in helper_defs):
        errors.append("Macro helper definitions are missing.")
    return ValidationReport(ok=not errors, errors=errors, warnings=warnings)


def validate_generation(plan: OperationPlan, macro_code: str) -> ValidationReport:
    plan_report = validate_plan(plan)
    macro_report = validate_macro_text(macro_code)
    return ValidationReport(
        ok=plan_report.ok and macro_report.ok,
        errors=plan_report.errors + macro_report.errors,
        warnings=plan_report.warnings + macro_report.warnings,
    )
