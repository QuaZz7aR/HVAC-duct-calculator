# 0035. Rect-to-round transition: exact sheet-metal layout

- Status: Accepted; supersedes the rect-to-round part of [0002](0002-reducer-geometry.md)
- Date: 2026-10-27
- Source: area cross-check against ВСН 353-86, ДСТУ Б Д.2.4-15:2014 and online calculators (2026-10-27, the full report is outside the repo, in the project files `reports/area-formulas-check-2026-10-27.html`; the figures that matter are repeated here); owner decision (2026-10-27); PR #35

## Context
`rectToRoundReducer` used the mean of the two end perimeters times one slant taken from the width only, `sqrt(L^2 + ((W - d) / 2)^2)`. The height was ignored, so the same part gave a different area depending on which side was typed as the width: 600x300 to d315 (L 300) was +4.5 % against the exact surface, the same part as 300x600 was -5.6 %, and 1000x500 to d500 was +12 %. The two fixtures (200x150 and 400x300, close to square) were within 0.1 %, so no test showed it. The external sources do not help: ВСН 353-86 (table 3), ДСТУ Б Д.2.4-15:2014 (п. 3.5.2) and the calculators use the mean perimeter times the axial length, which is 1-14 % low on the same parts.

## Decision
- The transition surface is the layout a sheet-metal worker cuts (triangulation): four flat triangles from each rect side to the circle point facing it, plus four cones from each rect corner to a quarter of the circle. The ends are concentric.
- Triangle area = side x `sqrt(L^2 + (other half side - d / 2)^2)` / 2. A corner cone is `r / 2 x integral over t in [0, pi/2] of sqrt(L^2 + (r - a cos t - b sin t)^2) dt` (a, b = half sides, r = d / 2). It has no elementary closed form, so it is integrated with Simpson's rule in 64 intervals; the error is far below the 1e-6 m2 of the fixtures (checked against an independent fine triangulation, agreement within 2e-9 m2).
- `developedLength` is the area-equivalent length, transition area / mean perimeter, plus the allowance at both ends, as for `rectReducer`. `sheetArea` = mean perimeter x `developedLength`, so the allowance strips are (rect perimeter + circumference) x allowance, unchanged, and insulation can reuse the same length.
- The rect-to-round fixtures become `basis: 'geometry'`; the owner applies them in this PR from the fixture patch, as usual.

## Consequences
- The area no longer depends on the order of the rect sides. Fixture values moved: 200x150 to d150 0.205697 -> 0.205856 m2 (+0.08 %, in `sheet-area.fixtures.ts` and as `metalArea` in `section.fixtures.ts`), 400x300 to d250 0.553966 -> 0.553701 (-0.05 %); three new sheet-area cases cover an elongated end in both orientations and a wide end. `__tests__/rect-to-round.test.ts` checks the formula against a fine triangle mesh, the side-order invariance and the allowance strips.
- A new deviation from the Excel (mean perimeter x axial length): 1-14 % on the parts above, listed in `docs/decisions.md`.
- The `TODO(confirm)` "slant ignores height" is closed. Eccentric (offset) transitions are not modelled.
- The reducer centerline is still the axial length (`TODO(confirm)` unchanged).
