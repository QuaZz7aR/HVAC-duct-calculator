# 0026. Branch-in taps (Квр, Пвр)

- Status: Accepted
- Date: 2026-10-19
- Source: engineer answers Q6 of 2026-10-07 and Ш8, Ш9 of 2026-10-16 ([log](../engineer-answers.md)); owner decision on the cut-out (2026-10-19); PR #21

## Context
A tap is a stand-alone short stub inserted into a cut-out of a main duct (the engineer's real specification lists them as separate lines: "Врезка Д150" 0.05 m2, "Врезка Д100" 0.02, "Врезка 300х100" 0.07). The Excel formulas are doubtful; the engineer does not remember them and trusts whichever are correct and pass our checks (Ш8, Ш9).

## Decision
Two kinds, Excel codes Квр and Пвр: `roundTap` (`diameter`, `length`) and `rectTap` (`width`, `height`, `length`). Fixtures: `__fixtures__/taps.fixtures.ts`.
- Area = perimeter x stub length (the form prefills 100 mm, the Excel's column J). No allowance, no waste factor (1.0 like every non-elbow), thickness by the tap's own size.
- The Excel "ring" term of Квр, pi(d/2+50)^2 - pi d^2/4, is not used: it contradicts the definition of `allowance`. The Пвр collar as a difference of perimeters is a formula error (see the cross-check). The engineer: use whichever formulas are correct (Ш8).
- **The cut-out in the main duct is not subtracted** (owner, 2026-10-19), unlike tees where branch and main are one fitting. Their metal differs in thickness, so the credit would belong to another line.
- `centerlineLength` is 0 (a stub off the main flow, `TODO(confirm)`, like the cap); no flow of its own is modelled.

## Consequences
- Comparison with the specification: Д150 0.047 (0.05), 300x100 0.080 (0.07), Д100 0.031 (0.02; the specification implies about 65 mm of length). The figures are his rounded ones, not fixtures.
- The 100 mm prefill is a form default only, `TODO(confirm)`. Source found later (2026-10-27): ВСН 353-86 п. 1.5 and 2.5 give a tap height of h = 100 mm "as a rule" for round and rect ducts (a USSR norm; no Ukrainian equivalent found).
- The form still asks for a flow for every row, so a tap row needs one; with an empty zeta it adds no pressure drop. (Since 2026-10-19 the UI feeds a fixed hidden flow, [0027](0027-pressure-losses-hidden-in-the-ui.md).)
- The seam allowance of [0022](0022-seam-allowance-for-other-kinds.md) applies to taps.
- Deferred: subtracting the cut-out from the main duct (an option or a separate credit line) is not modelled; the main duct's thickness differs from the tap's, so it needs its own design.
