# 0118. Saddle of a branch on a round main (option); box partitions not counted

- Status: Accepted
- Date: 2026-11-27
- Source: owner and the engineer's friend (2026-11-26/27): «если врезка идет в круглый воздуховод ... нужно расчитывать то, насколько врезка меньше воздуховода»; «по хорошему нужно считать всегда», but a user comparing with other calculators may think the area is overstated; «перемички убрать, очень опциональная вещь»; 2 allowances on every part stay the default

## Context
A branch (a tap, the collar of a tee or cross) that goes into a round duct follows its curve: its lower edge is a saddle, and the developed wall is longer by the sag of the main under each point of the branch outline. On a flat wall (a rect duct) there is none. Tables and online calculators, and the acquaintances' fresh orders, do not count it; our tee and cross consumption matches those orders to 0.0 % without it. The added area grows with the branch-to-main ratio: for a 100 mm stub Д100 in Д315 +4 %, Д150 in Д315 +9 %, Д150 in Д200 +16 %, Д200 in Д250 +23 %.

## Decision
1. `calc/saddle.ts`: `roundSaddle(R, r)` = r times the integral of the sag R − sqrt(R² − (r sin θ)²) over the branch circle (Simpson); `rectSaddle(R, along, across)` = the two walls across the main follow the arc (closed-form integral of the sag), the two walls along it are cut at the sag of their edge. A branch wider than the main is clamped to it.
2. Taps take `mainDiameter` (absent = a flat wall); rect taps: width along the main, height around it. Round-main tees and crosses (`roundTee`, `roundTeeRectBranch`, `roundCross`, `roundCrossRectBranches`) take `saddle` 0 / 1 (absent = 0); one saddle per branch, added to the actual area and the consumption. The cut-out stays the flat branch section. Insulation follows the same geometry.
3. The form: `FormRow.saddle` (a tap's «Ø магістралі», empty = flat; a tee's «Сідло на круглій магістралі» Так / Ні), advanced mode only, off by default, with an «i» explanation; saved with the project, dropped on a kind change.
4. Box partitions are no longer counted by the form (the field is gone from the card, the schema defaults `partitions` to 0; the import still reads them from the name but they are ignored). The core keeps `partitions` for its fixtures. Supersedes the partition part of [0113](0113-adapters-boxes-and-offsets-beta.md) and [0116](0116-open-face-of-a-box.md).

## Consequences
Nothing changes by default. The Kyiv slot adapters (open face, no partitions) come within −6…+3 % of the engineer (pos. 78 stays +26 %, a slip in his file). `TODO(confirm)`: the saddle cut-out on the main is still the flat section.
