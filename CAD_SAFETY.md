# CAD Safety Layer — don't crash the user's CAD

**Why:** the solid kernel (Parasolid/ACIS) crashes on degenerate geometry
(division-by-zero = zero thickness/radius/area) or on rebuild "solution conflicts"
in complex parts/assemblies after a change. We GENERATE the operations, so we can
prevent most of this class before the kernel ever computes.

Goal: never leave the user's model in a broken state; never take down their session.
No guarantee of zero crashes, but eliminate the common, preventable causes.

## Defenses (priority order)

1. **Geometry pre-flight (blocking).** Before any op reaches the kernel, reject:
   - any dimension ≤ ε (zero/near-zero radius, thickness, extrude length, area)
   - hole Ø ≥ body, bolt circle overlapping center bore, self-intersections
   - Reuse/extend `MIN_DIM_MM` filter (cad_translator) — make it BLOCK, not just skip.
   - The design already anticipates this (ValidationCard "Bolt Ø14 overlaps center bore")
     — wire that validation to actually gate execution.

2. **Build in a sandbox, then merge.** Build into a NEW temporary part/body first.
   Force a rebuild there; only if it rebuilds clean do we insert into the user's
   active document. A crash in the sandbox never touches their work.

3. **Auto-snapshot before our ops.** Save / set rollback bar before running, so a
   crash or bad result can be rolled back to the user's last good state.

4. **Per-op apply + rebuild check.** Send operations one at a time; force a rebuild
   after each. On failure, bisect in reverse order (per expert advice) to find the
   offending op, drop it, and report honestly — never leave a tangled broken rebuild.
   (We already validate each CoreOp separately and skip invalid ones.)

5. **Bound complexity.** Cap operation count (`MAX_OPERATIONS`); refuse pathological
   combinations rather than feeding them to the kernel.

## Status
- ✅ Per-op CoreOp validation (skip invalid) — exists in CADAgent / engine.
- ✅ `MIN_DIM_MM` degenerate filter — exists in cad_translator.
- ⬜ Make pre-flight BLOCKING + add overlap/oversize checks.
- ⬜ Sandbox-build-then-merge in the CAD add-ins.
- ⬜ Auto-snapshot before ops (per CAD: SW rollback / Fusion timeline / AutoCAD undo mark).
- ⬜ Per-op rebuild check + reverse-order bisect on failure.

Note: per-CAD implementation lives in the add-ins (fusion360/solidworks/autocad);
the geometry pre-flight lives in orynd_core (shared, server-side).
