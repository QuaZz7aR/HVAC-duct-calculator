# Engineer answers

The log of what the spreadsheet author answered, as relayed by the owner, and the Excel template bugs we found. Decisions taken from these answers are ADRs in `docs/adr/` (index in `docs/decisions.md`); this file is the source they cite. Add a new dated section when new answers arrive.

## Answers of 2026-10-07
Relayed by the owner (2026-10-07, paraphrased; the engineer wrote the Excel for himself years ago). Source questions are numbered as in the owner's message to the engineer.

Settled:
- **Allowance** is extra wall length added at manufacture so there is room to attach flanges. For rect elbows it counts x2, like round elbows (supports the deviation, [ADR 0003](adr/0003-allowance-counted-twice-on-rect-elbows.md)).
- **Reducer length** (Q2): 150 mm is the minimum, 300 mm the optimum, longer is a special case. The Excel's `0,3` clamp was an example length, not a rule; our default 300 / floor 150 / no silent clamp stands ([ADR 0005](adr/0005-reducer-length-default-and-floor.md)).
- **Thickness** (Q3): rect by equivalent diameter was a simplification; he did not work out how to handle such cases. Our larger-side key is a project choice ([ADR 0007](adr/0007-engineer-thickness-table.md)).
- **Flexible duct roughness** (Q8): steel roughness 0.1 mm is a deliberate simplification (rare element), as in the `flexible-d200` fixture note ([ADR 0006](adr/0006-flexible-duct-roughness.md)).
- **ППКр** (Q4): the formula is wrong, the branch length `G` is missing from the second term (the parameter has to be derived). Cross-fittings were out of v1 then; when they are added the area comes from geometry, not from the Excel (done 2026-10-16, [ADR 0021](adr/0021-tees-and-crosses.md)).
- **Summary row 46** (Q7): a leftover of something moved elsewhere. Row 30 and the `#REF!` totals were not answered.

Informs but does not settle:
- **Cutting coefficients 1.15 / 1.2 / 1.1** (Q1): taken from other websites as a safety margin. Their source is known, what they physically cover is not (open question 3 of the `CLAUDE.md` list as of 2026-10-07; see [ADR 0016](adr/0016-waste-factor-for-elbows-only.md)).
- **ПККр** (Q5): he said the errors "average out"; our check did not confirm it (the ratio to geometry varies from x0.77 to x2.13).
- **Пвр collar** (Q6): "possibly a mistake", he cannot say, wrote the formulas long ago.

No answer yet: how he works with the Excel (what he adds by hand per item, where he errs most, where the specification goes next), whether the totals work in his real file, rect elbow radius inner or center (open question 1, answered 2026-10-16), tees and crosses opening subtraction (open question 2, answered 2026-10-16), which velocity `zeta` of a reducer refers to (open question 4, answered 2026-10-16).

### `TODO(confirm)` after the answers (2026-10-07)
- Closed: the rect elbow allowance deviation (it had no code `TODO(confirm)`, only the note). No register row closes completely; the thickness row now carries the confirmed simplification.
- Still open then: rect elbow `innerRadius`, rect elbow centerline deviation, coefficients meaning and thresholds, thickness thresholds, cap and reducer centerline, `rectToRoundReducer` slant, reducer `Pd` velocity, `thicknessSize`, and the form prefills. The current state is the register in `docs/decisions.md`.

## Answers of 2026-10-16 (sheet «Шаблон»)
Relayed by the owner; the numbering is the engineer questionnaire's. Full text: the project report `engineer-answers-2026-10-16.md`.

Confirmed:
- **Rect elbow radius is inner** (Ш1). His construction is an annular sector: area of the big circle minus the small one of the inner radius, cut by the angle. Our `perimeter x (arc on the axis + 2 x allowance)` with `center = innerRadius + width / 2` is the same geometry. Closes the former open question 1 (numbers in this section refer to the CLAUDE.md list as of 2026-10-07). [ADR 0017](adr/0017-rect-elbow-radius-is-inner.md).
- **Axis length by geometry** is fine (Ш2), see the deviation in [ADR 0004](adr/0004-centerline-from-geometry-not-area.md).
- **`zeta` refers to the mean velocity** of a reducer (Ш6). Closes open question 4. [ADR 0018](adr/0018-reducer-zeta-at-the-mean-velocity.md).
- **Tees and crosses subtract the branch opening, in every fitting** (Ш7). Closes open question 2. Implemented 2026-10-16, [ADR 0021](adr/0021-tees-and-crosses.md).
- **Branch-ins (Квр, Пвр, ПККр) by geometry** (Ш8, Ш9): he does not remember the formulas and trusts whichever are correct and pass our checks. Standalone collars (Квр, Пвр) were then done as taps ([ADR 0026](adr/0026-branch-in-taps.md)); ПККр is a cross, done with the crosses.
- **Adapter is not needed now** (Ш10).
- **Thickness** (Ш11): 0.55 mm below 400 mm, 0.7 mm from 400 mm, rect by the larger side. Confirms the table thresholds. A side 2.5-3x the other could be given 0.7 mm, but better warn (done, [ADR 0020](adr/0020-input-warnings.md)).
- **Coefficients for elbows only** (Ш4, [ADR 0016](adr/0016-waste-factor-for-elbows-only.md)) and **pressure drop as a separate mode** (Ш12, [ADR 0019](adr/0019-pressure-drop-is-a-separate-mode.md)) were decided from this round.

Open then:
- **Ш13** («Специфікація», totals): answered 2026-10-19, see below.
- **Sheet size** for a sheet count: answered 2026-10-19, a selectable parameter.
- **Elbow radius threshold** of the warning: the engineer expected inner radii of 50 mm, 100-150 mm for big ducts; 2 x width is preliminary.
- **Warning thresholds** of the aspect ratio (3) were chosen from his "2.5-3" and ДБН 6.3; to confirm.
- **ДБН thickness table** (ДБН В.2.5-67:2013, додаток Ц) differs from the engineer's: rect 0.5 (up to 250) / 0.7 (300-1000) / 0.9 (1250-2000), round 0.5 / 0.6 / 0.7 / 1.0 / 1.2 / 1.4 by diameter, "not more than"; no 0.55; above 2000 by calculation; fire-resistant at least 0.8. The engineer answered 2026-10-19: "do it by ДБН", see below.

## Answers of 2026-10-19 (informal, the engineer is unsure on several)
Relayed by the owner; the engineer answered in a messenger and did not remember the origin of several things. What was decided from them:
- **Seam allowance** (2.1): "if it is for seams (фальц), then for all elements"; user-set seam allowance for non-elbows. [ADR 0022](adr/0022-seam-allowance-for-other-kinds.md).
- **Reducer friction by the mean diameter** (2.2). [ADR 0023](adr/0023-reducer-friction-by-the-mean-diameter.md).
- **Order margin** (3.1): the 20 % (AJ30, E51 in his file) is "probably the margin for ordering metal". [ADR 0024](adr/0024-order-margin-and-sheet-count.md).
- **Sheet size and sheet count** (3.2): the standard sheet is a selectable parameter. [ADR 0024](adr/0024-order-margin-and-sheet-count.md).
- **Thickness by ДБН** (3.4): "do it by ДБН", a custom table maybe later. [ADR 0025](adr/0025-dbn-thickness-table-by-default.md).
- **Elbow radius** (3.3): he does not remember; the 2 x width threshold stays preliminary (`TODO(confirm)`, [ADR 0020](adr/0020-input-warnings.md)).
- **Tees and crosses** (3.5): the flow is counted for the main duct only, confirmed (he added that there are nuances). [ADR 0021](adr/0021-tees-and-crosses.md).
- **Warnings** (2.3): "some warning, need context"; the warnings stay as decided on 2026-10-16.

## Excel template bugs found (2026-10-16)
Found while checking M27-M30 (reports `check-m27-m30-2026-10-16.md`, `recheck-m27-m30-2026-10-16.md`); the engineer asked to be told of fixes. A corrected copy is `template-fixed-m27-m30-2026-10-16.xlsx` (project files; original untouched).
- **M27 (ПККр)** mixes units in one factor: `(490 mm*m + 78540 mm2) * 10^-5`. Correct: 0.4704 m2 (Excel 0.7903).
- **M28 (ППКр)**: the second term has no `G`. Correct: 1.360 m2 (Excel 0.514).
- **M29 (КККр), M30 (КПКр)**: units are fine but the opening is not subtracted. Correct: 0.2969 and 0.3758 m2, equal to the pending fixtures. M29 also mixes two values of pi.
- **M9 (КТ), M10 (КПТ), M12 (ПКТ)** do not subtract the opening either (only M11 does), and use `3.1415`. Corrected values equal `areaWithOpeningSubtracted` of the pending fixture. J9-J12 hard-code the allowance 50 instead of referring to G.
- The sheet «База» has the same wrong formulas. Pi is `3.14159265359` (M3, M4, M16, M20), `3.1415` (M7-M15), `3.14159` (M27, M29, M30).
- A30 says "round branches" for КПКр with F = 200 (typo).
