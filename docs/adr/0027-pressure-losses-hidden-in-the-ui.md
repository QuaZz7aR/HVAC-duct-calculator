# 0027. Pressure losses hidden in the UI

- Status: Accepted (temporary, until the aerodynamics mode)
- Date: 2026-10-19
- Source: owner decision (2026-10-19); follows [0019](0019-pressure-drop-is-a-separate-mode.md); PR #22, #23

## Context
The engineer's order puts aerodynamics after metal, insulation and price ([0019](0019-pressure-drop-is-a-separate-mode.md)).

## Decision
- The page shows area only: metal area per piece and total, thickness, totals, sheet list. Hidden: the air block, airflow and zeta inputs, the velocity / friction / local / total loss columns, the loss total, and the centerline length column (an aerodynamics input, not an area).
- UI only. `assembleSection`, `calculate` (still returns `pressureDrop`, `totalLoss`, `centerlineLength`, `totalPressureDrop`), the validation and all tests and fixtures are unchanged. `useCalculator` feeds `calculate` a fixed flow (1 m3/h), empty zeta and the default air, so area, thickness and the sheet list do not depend on them and no loss-input error can appear.
- The row's area never depends on the loss calculation (owner, 2026-10-19, PR #23): if the losses overflow or throw (sizes from about 1e157 mm, far beyond any duct), `calculate` keeps the row, sets `lossesAvailable: false` and NaN losses, and leaves it out of `totalPressureDrop`. A row is rejected only when its metal area is not finite or not positive. The old robustness test for a 9x300 mm diameter now expects the row to stay (changed with the owner's approval); a 9x400 mm diameter, which overflows the area itself, is still an error.

## Consequences
Bringing losses back (the separate aerodynamics mode, after insulation and price): re-add an air block and per-row flow / zeta inputs, drop `hiddenLossInputs` in the hook, restore the removed dictionary strings from git history (`AirParams.tsx`, `airTitle`, `flow`, `zeta`, `results.velocity|friction|local|pressureDrop|centerline`, `totals.pressureDrop*`). The air block then gets the pressure kPa / atm conversion ([0028](0028-elbow-radius-suggested-from-the-size.md)).
