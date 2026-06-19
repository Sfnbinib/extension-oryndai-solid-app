"""Static plan and macro validator."""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from typing import Any

from .catalog import COMMAND_CATALOG, UNSAFE_MACRO_TOKENS
from .schema import OperationPlan, is_non_negative_number, is_positive_number


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
        if op.command == "pattern" and op.args.get("target_ref") not in seen_ids:
            warnings.append(f"{path} pattern target_ref {op.args.get('target_ref')!r} is a declaration, not a prior op id.")

    return ValidationReport(ok=not errors, errors=errors, warnings=warnings)


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

