# 0037. Insulation area (beta)

- Status: Accepted (beta; to be checked with the engineer)
- Date: 2026-11-03
- Source: owner, 2026-11-03 ("the engineer is unreachable for now: do insulation as a beta by the formulas we have, or a more exact one if you know it"); the engineer's Excel «Шаблон», columns O-U; the 2026-10-23 letter, section 3 (unanswered)

## Context
Insulation is the next step after metal in the engineer's order ([0019](0019-pressure-drop-is-a-separate-mode.md)). The Excel picks one material per row (column O) and puts its area in one of six columns: Ізолон 8 mm, foil rubber 10 / 13 / 30 mm, foil mineral wool 30 / 50 mm. Every formula is the metal formula with each size + 2t (t = layer thickness). Deviations inside the Excel: round elbows also grow the centre radius by 2t, caps take the end plate only, taps drop their "ring", tees do not subtract the cut-out, crosses are metal x 1.2.

## Decision
- `calc/insulation.ts`: `insulated(f, t)` turns a fitting into the outer surface of its insulation: every cross-section size + 2t, lengths, allowances and the centre line unchanged (a rect elbow's inner radius drops by t). `insulationArea(f, t, config)` = `sheetArea(insulated(f, t))`, so there is still one geometry for metal and insulation. For a smooth elbow this is the exact outer surface (Pappus), more exact than the Excel's +2t on the radius.
- Caps: the end plate of the outer size only (the Excel): the skirt sits on the duct, which carries its own insulation.
- Elbows keep the metal cutting coefficient (`wasteFactor`, as the Excel does, `TODO(confirm)`). The user's seam allowance is metal only and is not applied.
- Tees and crosses: the same rule (geometry + 2t, the outer branch cut-out subtracted), not the Excel's x 1.2 for crosses.
- Materials: `config.insulation.materials`, the six from the Excel (`iz8`, `kf10`, `kf13`, `kf30`, `mf30`, `mf50`), names in the dictionary, `TODO(confirm)`. One material per row (`FormRow.insulation`, empty = none), an unknown code is the row error `insulation.unknown`.
- Output: area per row (one piece and times quantity), `insulationList` per material in the config order, a total. No order margin and no roll count yet.
- Fixtures: `__fixtures__/insulation.fixtures.ts`, hand formulas, one case per kind group.

## Consequences
- The metal area and everything about it are unchanged.
- Open questions for the engineer (letter 2026-10-23, section 3): +2t for caps, taps and dampers; crosses by geometry; the cutting coefficient and an order margin for insulation; the material list; foil or glue as a line; one material per system or per row. The beta may change after his answers.
- No thermal calculation and no norm for the thickness: the user picks the material.
