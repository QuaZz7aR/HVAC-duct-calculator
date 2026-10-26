# 0021. Tees and crosses

- Status: Accepted
- Date: 2026-10-16
- Source: engineer answers Q4 of 2026-10-07, Ш7 of 2026-10-16 and 3.5 of 2026-10-19 ([log](../engineer-answers.md)); PR #17, #18, #19

## Context
The Excel has eight tee and cross kinds with formula bugs (no opening subtracted in M9/M10/M12/M29/M30, unit mix in M27, missing `G` in M28, see [Excel template bugs](../engineer-answers.md#excel-template-bugs-found-2026-10-16)). The engineer: tees and crosses subtract the branch opening, in every fitting (Ш7); for ППКр the area comes from geometry, not from the Excel (Q4).

## Decision
Eight kinds, Excel codes КТ, КПТ, ПТ, ПКТ (tees) and КККр, КПКр, ПККр, ППКр (crosses): `roundTee`, `roundTeeRectBranch`, `rectTee`, `rectTeeRoundBranch` and `roundCross`, `roundCrossRectBranches`, `rectCross`, `rectCrossRoundBranches`. The name is the main shape first, then the branch shape. Fixtures: `__fixtures__/tees-crosses.fixtures.ts`, all from the engineer's corrected Excel.
- **Area** = main perimeter x (`E` + 2 x `allowance`) + branch perimeter x `allowance` - branch cross-section area; for a cross the collar and the cut-out are counted twice. `E` is the branch size along the main axis (`branchWidth` or `branchDiameter`). The run length is `developedLength`, shared with insulation later.
- **`allowance` is both** the extra wall at each end of the run and the collar length of a branch (the Excel's column G, "allowance or branch length"). One field, as everywhere.
- **Cut-out is the flat cross-section.** On a round main the real saddle cut is larger (about +6 % for d200 on D315, +8 % for a 300x200 branch). Known approximation, kept as in the Excel.
- **No waste factor** (default 1.0, as for every non-elbow). **Thickness** is keyed by the main duct.
- **Warnings** (aspect ratio, size over 2000 mm) cover the main duct and the branch; `branch.larger` warns when the branch cross-section is bigger than the main one (the area would be wrong; nothing is changed).
- When the cut-outs exceed the wall (e.g. a 100x100 rect tee with a 100x1000 branch, allowance 0) the area is not positive: the form layer (`calculate`) rejects that row with `input.invalid` instead of showing a negative metal area (2026-10-16, PR #19).
- **Section assembly**: friction and velocity use the main duct at the given flow and the centerline `E`; the branch flow and its resistance are not modelled (confirmed by the engineer, 2026-10-19, 3.5: the flow is counted for the main duct only; he added that there are nuances), `zeta` is typed by the user. The `TODO(confirm)` on this in `section.ts` is removed.

## Consequences
- The centerline `E` is still `TODO(confirm)` in `sheet-area.ts` (register in `docs/decisions.md`).
- ПККр (crosses with round branches on a rect main) is done with the crosses; standalone collars are taps ([0026](0026-branch-in-taps.md)).
- Deferred: branch flow and the branch's own pressure drop; a hard validation of the branch against the main duct has no source, only the `branch.larger` warning exists, plus the form-layer rejection of a non-positive area.
