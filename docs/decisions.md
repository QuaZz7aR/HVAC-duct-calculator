# Decisions and open items

Companion to `CLAUDE.md`: why the core looks the way it does, and what is still unconfirmed. Update it in the same PR as the change it describes.

## Decisions
- **The Excel is a reference, not the truth.** Fixtures with `basis: 'excel'` follow the spreadsheet author's convention; where the Excel is wrong we compute the correct value and document it.
- **`rectReducer`** uses exact per-face geometry; `developedLength` is the area-equivalent length. **`rectToRoundReducer`** is a project approximation (slant from width only).
- **Waste factor** is applied to elbows only, via `metalArea = sheetArea * wasteFactor`. `sheetArea` stays pure geometry.
- **Tables are versioned** (`version` in `ThicknessTable`, `WasteFactorTable`); bump it on any row change. Rows are bands: `fromMm` up to the next row, first row starts at 0. `ThicknessTable.bandStart` says whether a band holds sizes `>= fromMm` (`inclusive`, the engineer's table) or `> fromMm` (`exclusive`, norm tables that list upper limits, the ДБН table).
- **Air** (`airAtConditions`): ideal gas density, Sutherland viscosity. The constants 273 and 9.8 are the Excel's roundings, kept so the aero fixtures match.
- **Validation** is Zod 4 in `src/lib/validation/`, outside the core. It reports stable error codes, not text. A reducer length below the floor is an error, never clamped.
- **`assembleSection`** throws on non-positive flow and negative local coefficient; the validation layer reports the same cases as codes.
- **Reducer section pressure drop**: friction by the mean of the end hydraulic diameters (engineer, 2026-10-19; it replaced the larger end taken from the Excel), velocity is the mean of both ends, local loss at that velocity.

- **Sheet list** (`sheetList`) groups `metalArea * quantity` by thickness and returns m2. The order list (`calc/sheet-count.ts`, `orderList`) adds the order area and the whole sheets per thickness (see "Answers of 2026-10-19"). The Excel has no grouping and no sheet count (thickness and area per row), so grouping is ours. `thicknessSize`: for reducers the larger size over both ends (max of diameters, per-side max of width/height; the Excel uses the first-given C/D end, same result when the ends are ordered), rect end for rect-to-round. Quantity must be a positive integer. `sheetListItemSchema` / `sheetListSchema` (`validation/`) validate `{ fitting, quantity }` at the boundary: fitting errors keep their codes with the path under `fitting`, a bad quantity is `quantity.invalid` (one code for non-positive, fractional and non-finite values). `form/calculate.ts` validates fitting and quantity with `sheetListItemSchema` (the leading `fitting` path segment is stripped so issues map to form fields as before).

- **UI** (first version): one client page (later split into small components under `src/components/calculator/` with state in the `useCalculator` hook, no behaviour change), all calculation in the browser over the pure core, no backend, no persistence, no new dependencies. Language is Ukrainian; all strings are in `src/lib/i18n/uk.ts`, fitting names use the Excel designations. Form fields are raw text (decimal comma accepted); text is parsed in `form/calculate.ts`, validated by the existing Zod schemas, and errors are shown as the dictionary message for the stable code. Fitting and quantity (positive integer, code `quantity.invalid`) are validated by `sheetListItemSchema`; flow, zeta and air are still checked in `form/`. Empty zeta means 0; empty reducer length means the config default. The page total of pressure drop is the plain sum of quantity times section loss, valid for one serial path only (labelled so). Rows with errors are left out of totals and counted. Fonts are the system stack (no Google Fonts, no network at build).
- **Results-table headers** take the Excel column wording: "Товщина металу, мм", "Площа, м²", "Сума площі, м²", "Падіння тиску на тертя, Па", "Місцеве падіння тиску, Па", "Загальне падіння тиску, Па". Reason: "Тертя" / "Місцеві" were unclear next to the Excel. Two deliberate deviations: the unit is written м² (Excel: м2), and per-piece columns keep the "(шт.)" mark so they are not confused with the totals. "Довжина по осі" and "Швидкість" have no Excel equivalent and are unchanged. Fitting names and designations are NOT changed (owner decision).
- **Web analytics** is Vercel Web Analytics: the `@vercel/analytics` package (the only runtime dependency besides Next, React, Zod) and one `<Analytics />` in the root layout. It is cookie-free page-view counting only; the component sends no custom events, so calculator inputs never leave the browser (keep it that way). The script is a no-op in dev; data is collected only after the owner turns on Web Analytics in the Vercel project. The Vercel Hobby plan is for non-commercial use: moving to a paid service (see the commercial plan) requires the Pro plan.
- **Input warnings** (`calc/warnings.ts`, thresholds in `config.warnings`): non-blocking advice for a valid fitting, never an error and never a change of the typed sizes (engineer, 2026-10-16: warn, do not auto-scale). Rect aspect ratio >= 3 -> warning (engineer: a side 2.5-3x the other is not done in practice); > 6.3 -> strong warning that replaces the plain one (ДБН В.2.5-67:2013, додаток Ц limit); any cross-section dimension > 2000 mm -> warning that the thickness must be justified by calculation (same appendix); elbow inner radius > 2 x width (rect) or diameter (round, inner = center - D/2) -> warning, threshold is `TODO(confirm)`. `calculate` attaches `warnings` to every row that calculated; the UI shows them under the row card (amber, strong in red). Rows with errors show only the errors.
- **Cutting coefficients 1.15 / 1.2 / 1.1 stay for elbows only** (Ш4, decided 2026-10-16). The engineer says they are a flange allowance for all fittings but is not sure he used them everywhere, and gave no values for other kinds. Neither the СП nor ДБН В.2.5-67:2013 has such a coefficient, so there is no source to take values from, and a general coefficient would count the flange allowance twice (`allowance` already covers it). Other kinds keep `default: 1.0`. Revisit only with values and a source. Since 2026-10-19 the user can add a seam allowance to the other kinds, see below.
- **Reducer friction and local loss** (Ш6, decided 2026-10-16): `zeta` at the mean velocity of both ends (engineer confirmed). Friction was by the larger end's diameter (our choice); changed to the mean diameter on 2026-10-19, see below.
- **Pressure drop is a separate mode, not part of the main output** (Ш12, decided 2026-10-16). The engineer's order: 1) metal area for all fittings, 2) insulation, 3) price per fitting (the user enters their own prices), 4) aerodynamics apart, maybe its own tab where the user enters the flow. The single table with losses was removed from the UI on 2026-10-19 (see "Pressure losses hidden in the UI"); splitting it into modes comes after insulation and price.
- **Form prefills** (not core defaults): allowance 50 mm (what the fixtures use) and elbow angle 90, `TODO(confirm)` in `form/fields.ts`.

## Known deviations from the Excel
Deliberate; the Excel is a reference, not the truth. Both are rect elbows.
- **Allowance counted twice.** Excel (`M8`) adds the connection allowance once, our fixtures twice. Confirmed by the engineer: x2 for rect elbows too, so the Excel is wrong here and our value is right. Area is +9.6 % (350x150) and +13.7 % (400x200) against the Excel.
- **Centerline from geometry, not area.** Excel derives the rect elbow length for friction from its area (`J8 = M8 / perimeter`, includes allowance and waste factor); our `centerlineLength` is pure geometry. Friction differs by about +33 % in the Excel's favour of the larger length. Confirmed (2026-10-16, Ш2): the engineer did not know then how to get the rect elbow axis length and derived it from the area; a length along the axis is fine once checked against his and handbook formulas. That check is the +33 % above.

## Engineer answers
Relayed by the owner (2026-10-07, paraphrased; the engineer wrote the Excel for himself years ago). Source questions are numbered as in the owner's message to the engineer.

Settled:
- **Allowance** is extra wall length added at manufacture so there is room to attach flanges. For rect elbows it counts x2, like round elbows (supports the deviation above).
- **Reducer length** (Q2): 150 mm is the minimum, 300 mm the optimum, longer is a special case. The Excel's `0,3` clamp was an example length, not a rule; our default 300 / floor 150 / no silent clamp stands.
- **Thickness** (Q3): rect by equivalent diameter was a simplification; he did not work out how to handle such cases. Our larger-side key is a project choice.
- **Flexible duct roughness** (Q8): steel roughness 0.1 mm is a deliberate simplification (rare element), as in the `flexible-d200` fixture note.
- **ППКр** (Q4): the formula is wrong, the branch length `G` is missing from the second term (the parameter has to be derived). Cross-fittings are out of v1; when they are added the area comes from geometry, not from the Excel.
- **Summary row 46** (Q7): a leftover of something moved elsewhere. Row 30 and the `#REF!` totals were not answered.

Informs but does not settle:
- **Cutting coefficients 1.15 / 1.2 / 1.1** (Q1): taken from other websites as a safety margin. Their source is known, what they physically cover is not (open question 3).
- **ПККр** (Q5): he said the errors "average out"; our check did not confirm it (the ratio to geometry varies from x0.77 to x2.13).
- **Пвр collar** (Q6): "possibly a mistake", he cannot say, wrote the formulas long ago.

No answer yet: how he works with the Excel (what he adds by hand per item, where he errs most, where the specification goes next), whether the totals work in his real file, rect elbow radius inner or center (open question 1), tees and crosses opening subtraction (open question 2), which velocity `zeta` of a reducer refers to (open question 4).

### Answers of 2026-10-16 (sheet «Шаблон»)
Relayed by the owner; the numbering is the engineer questionnaire's. Full text: the project report `engineer-answers-2026-10-16.md`.

Confirmed:
- **Rect elbow radius is inner** (Ш1). His construction is an annular sector: area of the big circle minus the small one of the inner radius, cut by the angle. Our `perimeter x (arc on the axis + 2 x allowance)` with `center = innerRadius + width / 2` is the same geometry. Closes the former open question 1 (numbers in this section refer to the CLAUDE.md list as of 2026-10-07).
- **Axis length by geometry** is fine (Ш2), see the deviation above.
- **`zeta` refers to the mean velocity** of a reducer (Ш6). Closes open question 4.
- **Tees and crosses subtract the branch opening, in every fitting** (Ш7). Closes open question 2. Implemented 2026-10-16, see "Tees and crosses" below.
- **Branch-ins (Квр, Пвр, ПККр) by geometry** (Ш8, Ш9): he does not remember the formulas and trusts whichever are correct and pass our checks. Standalone collars (Квр, Пвр) were then done as taps, see "Branch-in taps" below; ПККр is a cross, done with the crosses.
- **Adapter is not needed now** (Ш10).
- **Thickness** (Ш11): 0.55 mm below 400 mm, 0.7 mm from 400 mm, rect by the larger side. Confirms the table thresholds. A side 2.5-3x the other could be given 0.7 mm, but better warn (done, see Input warnings).

Open:
- **Ш13** («Специфікація», totals): answered 2026-10-19, see below.
- **Sheet size** for a sheet count: answered 2026-10-19, a selectable parameter.
- **Elbow radius threshold** of the warning: the engineer expected inner radii of 50 mm, 100-150 mm for big ducts; 2 x width is preliminary.
- **Warning thresholds** of the aspect ratio (3) were chosen from his "2.5-3" and ДБН 6.3; to confirm.
- **ДБН thickness table** (ДБН В.2.5-67:2013, додаток Ц) differs from the engineer's: rect 0.5 (up to 250) / 0.7 (300-1000) / 0.9 (1250-2000), round 0.5 / 0.6 / 0.7 / 1.0 / 1.2 / 1.4 by diameter, "not more than"; no 0.55; above 2000 by calculation; fire-resistant at least 0.8. The engineer answered 2026-10-19: "do it by ДБН", see below.

### Answers of 2026-10-19 (informal, the engineer is unsure on several)
Relayed by the owner; the engineer answered in a messenger and did not remember the origin of several things. What was decided from them:
- **Seam allowance** (2.1). He does not remember what the coefficients 1.15 / 1.2 / 1.1 were for; "if it is for seams (фальц), then for all elements". His own real specification has no coefficient on straight ducts, so the coefficients stay for elbows only and every other kind gets a user-set **seam allowance** ("запас на фальц", %, default 0): `wasteFactor.default = 1 + percent / 100`, in the settings block of the UI. The user decides; nothing is added by default.
- **Reducer friction by the mean diameter** (2.2): the mean of the two end hydraulic diameters (`2ab/(a+b)` for a rect end), in `assembleSection`. Short reducers differ little from the old larger-end rule. The reducer fixtures changed (Re, lambda, friction loss).
- **Order margin** (3.1): the 20 % (AJ30, E51 in his file) is "probably the margin for ordering metal". It is the parameter `config.order.marginPercent` (default 20, `TODO(confirm)` what the 20 % really is). It never changes the computed area: totals show the computed area and, next to it, the area to order = area x (1 + margin / 100).
- **Sheet size and sheet count** (3.2): the standard sheet is a selectable parameter, 1000 x 2000, 1250 x 2500 (default) and 1500 x 3000 mm (`config.order.sheetSizes`, not from a supplier, `TODO(confirm)`). **Sheets per thickness = ceil(order area / sheet area)**, sheet area = width x height in m2; a float epsilon of 1e-9 sheets stops rounding noise from adding a sheet. No nesting or offcut model, so it is a lower estimate of what a cutting plan needs.
- **Thickness by ДБН** (3.4): `dbnThickness` is the default table (`config.ts`): round by diameter up to 200 -> 0.5, 250-450 -> 0.6, 500-800 -> 0.7, 900-1250 -> 1.0, 1400-1600 -> 1.2, 1800-2000 -> 1.4; rect by the larger side up to 250 -> 0.5, 300-1000 -> 0.7, 1250-2000 -> 0.9. The norm lists only some sizes, so a size in between takes the next larger listed one (the safe side): 201-450 -> 0.6, 1001-2000 rect -> 0.9 (`TODO(confirm)`, our rule). Above 2000 mm the thickness is by calculation: the last band is used and the `size.overLimit` warning fires. Fire-resistant ducts (at least 0.8 mm, п. 7.11.5) are not modelled. The engineer's 0.55 / 0.7 table stays as `engineerThickness`, selectable in the UI; "a custom table maybe later" is deferred. This changes the thickness of most rows against the earlier default.
- **Elbow radius** (3.3): he does not remember; the 2 x width threshold stays preliminary (`TODO(confirm)`).
- **Tees and crosses** (3.5): the flow is counted for the main duct only, confirmed (he added that there are nuances). The `TODO(confirm)` on this in `section.ts` is removed.
- **Warnings** (2.3): "some warning, need context"; the warnings stay as decided on 2026-10-16.

### Excel template bugs found (2026-10-16)
Found while checking M27-M30 (reports `check-m27-m30-2026-10-16.md`, `recheck-m27-m30-2026-10-16.md`); the engineer asked to be told of fixes. A corrected copy is `template-fixed-m27-m30-2026-10-16.xlsx` (project files; original untouched).
- **M27 (ПККр)** mixes units in one factor: `(490 mm*m + 78540 mm2) * 10^-5`. Correct: 0.4704 m2 (Excel 0.7903).
- **M28 (ППКр)**: the second term has no `G`. Correct: 1.360 m2 (Excel 0.514).
- **M29 (КККр), M30 (КПКр)**: units are fine but the opening is not subtracted. Correct: 0.2969 and 0.3758 m2, equal to the pending fixtures. M29 also mixes two values of pi.
- **M9 (КТ), M10 (КПТ), M12 (ПКТ)** do not subtract the opening either (only M11 does), and use `3.1415`. Corrected values equal `areaWithOpeningSubtracted` of the pending fixture. J9-J12 hard-code the allowance 50 instead of referring to G.
- The sheet «База» has the same wrong formulas. Pi is `3.14159265359` (M3, M4, M16, M20), `3.1415` (M7-M15), `3.14159` (M27, M29, M30).
- A30 says "round branches" for КПКр with F = 200 (typo).

### `TODO(confirm)` after the answers (2026-10-07)
- Closed: the rect elbow allowance deviation (it had no code `TODO(confirm)`, only the note above). No register row closes completely; the thickness row now carries the confirmed simplification.
- Still open: rect elbow `innerRadius`, rect elbow centerline deviation, coefficients meaning and thresholds, thickness thresholds, cap and reducer centerline, `rectToRoundReducer` slant, reducer `Pd` velocity, `thicknessSize`, and the form prefills.

## `TODO(confirm)` register
Find them all with `grep -rn "TODO(confirm)" src`.
| Where | What is unconfirmed |
|---|---|
| `calc/config.ts` thickness | Default is the ДБН table (`dbnThickness`, engineer: "do it by ДБН", 2026-10-19). Open: sizes between the listed ones take the next larger listed size (our rule); fire-resistant ducts (>= 0.8 mm) are not modelled. `engineerThickness` (0.55 / 0.7 at 400 mm, confirmed 2026-10-16) is the selectable option; its rect key is the larger side, the Excel used the equivalent diameter (a simplification the engineer acknowledged). |
| `calc/config.ts` order | Margin 20 % is "probably the margin for ordering metal" (engineer, unsure); the offered sheet sizes and the default 1250 x 2500 are not from a supplier. |
| `calc/config.ts` wasteFactor | Factors 1.15 / 1.2 / 1.1 and their thresholds came from websites. Decided: elbows only, no normative source (Ш4); what they cover stays unconfirmed. Other kinds: `default` = the user's seam allowance (0 by default). Rect is keyed by equivalent diameter, thickness by larger side. |
| `calc/sheet-area.ts` | Cap centerline is 0. Reducer centerline is the axial length (no fixture covers it). `rectToRoundReducer` slant ignores height. Rect elbow `innerRadius` is inner (confirmed 2026-10-16). |
| `calc/thickness.ts` `thicknessSize` | Reducers are sized by the larger side over both ends, rect-to-round by its rect end (Excel convention); unconfirmed against handbooks. |
| `form/fields.ts` | Prefilled allowance 50 mm and angle 90 in the form: UI convenience only, the core has no default for allowance. |
| `calc/sheet-area.ts` taps (`roundTap`, `rectTap`) | Centerline 0 (a stub off the main flow); the 100 mm length is only a form prefill. |
| `calc/sheet-area.ts` tees and crosses | Centerline of the main run is the branch size along the axis `E` (no allowance); the Excel has only the run length `E + 2 x allowance`. |
| `calc/section.ts` | Reducer friction by the mean diameter and mean-velocity `Pd`: both from the engineer (2026-10-19, 2026-10-16). Caps have no friction because their centerline is 0. |
| `calc/config.ts` elbowRadius | 1.0 D (round centre line) and 0.5 W (rect inner) are common practice, not a norm; form suggestion only. |
| `calc/config.ts` warnings | `elbowInnerRadiusFactor` 2 is preliminary; the aspect ratio threshold 3 comes from the engineer's "2.5-3". |

## Tees and crosses (2026-10-16)
Eight kinds, Excel codes КТ, КПТ, ПТ, ПКТ (tees) and КККр, КПКр, ПККр, ППКр (crosses): `roundTee`, `roundTeeRectBranch`, `rectTee`, `rectTeeRoundBranch` and `roundCross`, `roundCrossRectBranches`, `rectCross`, `rectCrossRoundBranches`. The name is the main shape first, then the branch shape. Fixtures: `__fixtures__/tees-crosses.fixtures.ts`, all from the engineer's corrected Excel.
- **Area** = main perimeter x (`E` + 2 x `allowance`) + branch perimeter x `allowance` - branch cross-section area; for a cross the collar and the cut-out are counted twice. `E` is the branch size along the main axis (`branchWidth` or `branchDiameter`). The run length is `developedLength`, shared with insulation later.
- **`allowance` is both** the extra wall at each end of the run and the collar length of a branch (the Excel's column G, "allowance or branch length"). One field, as everywhere.
- **Cut-out is the flat cross-section.** On a round main the real saddle cut is larger (about +6 % for d200 on D315, +8 % for a 300x200 branch). Known approximation, kept as in the Excel.
- **No waste factor** (default 1.0, as for every non-elbow). **Thickness** is keyed by the main duct. **Warnings** (aspect ratio, size over 2000 mm) cover the main duct and the branch; `branch.larger` warns when the branch cross-section is bigger than the main one (the area would be wrong; nothing is changed). When the cut-outs exceed the wall (e.g. a 100x100 rect tee with a 100x1000 branch, allowance 0) the area is not positive: the form layer (`calculate`) rejects that row with `input.invalid` instead of showing a negative metal area (2026-10-16).
- **Section assembly**: friction and velocity use the main duct at the given flow and the centerline `E`; the branch flow and its resistance are not modelled (confirmed by the engineer, 2026-10-19), `zeta` is typed by the user. The centerline `E` is still `TODO(confirm)` in `sheet-area.ts`.
- Excel template bugs found on the way (M9/M10/M12 and M27-M30) are in "Engineer answers" above.

## Branch-in taps (2026-10-19)
Two kinds, Excel codes Квр and Пвр: `roundTap` (`diameter`, `length`) and `rectTap` (`width`, `height`, `length`). A tap is a stand-alone short stub inserted into a cut-out of a main duct (the engineer's real specification lists them as separate lines: "Врезка Д150" 0.05 m2, "Врезка Д100" 0.02, "Врезка 300х100" 0.07). Fixtures: `__fixtures__/taps.fixtures.ts`.
- Area = perimeter x stub length (the form prefills 100 mm, the Excel's column J). No allowance, no waste factor (1.0 like every non-elbow), thickness by the tap's own size.
- The Excel "ring" term of Квр, pi(d/2+50)^2 - pi d^2/4, is not used: it contradicts the definition of `allowance`. The Пвр collar as a difference of perimeters is a formula error (see the cross-check). The engineer: use whichever formulas are correct (Ш8).
- **The cut-out in the main duct is not subtracted** (owner, 2026-10-19), unlike tees where branch and main are one fitting. Their metal differs in thickness, so the credit would belong to another line.
- Comparison with the specification: Д150 0.047 (0.05), 300x100 0.080 (0.07), Д100 0.031 (0.02; the specification implies about 65 mm of length). The figures are his rounded ones, not fixtures.
- `centerlineLength` is 0 (a stub off the main flow, `TODO(confirm)`, like the cap); no flow of its own is modelled. The 100 mm prefill is a form default only, `TODO(confirm)`. The form still asks for a flow for every row, so a tap row needs one; with an empty zeta it adds no pressure drop.

## Deferred
- `npm audit`: 5 high findings, one chain (`braces` <- `micromatch` <- `fast-glob` <- `@next/eslint-plugin-next` <- `eslint-config-next`), dev tooling only, nothing ships to the browser or the server. No non-breaking fix exists: `npm audit fix --force` would downgrade `eslint-config-next` to 14.2.35 (Next 16 here). Wait for a `eslint-config-next` release that updates `fast-glob`/`micromatch`; do not run `npm audit fix`.
- eslint 9 -> 10: blocked upstream. `eslint-config-next` 16.3.8 itself allows `eslint >=9`, but the plugins it bundles (`eslint-plugin-react` 7.37.5, `eslint-plugin-import` 2.32.0, `eslint-plugin-jsx-a11y` 6.10.2, all at their latest releases) declare peers only up to `^9`. Retry when those publish eslint 10 support; do not force it with overrides.
- Share the equivalent-diameter helper between `aero.ts` (m) and `waste-factor.ts` (mm).
- Sheet count has no nesting or offcut model (a plain ceil of area over sheet area); a cutting plan would need part shapes.
- Next features (engineer's order, 2026-10-16): insulation, price per fitting (user-entered), then aerodynamics as a separate mode. XLSX export waits for the engineer's reference files.
- A user-defined (custom) thickness table, which the engineer mentioned as a possible later step.
- Fire-resistant ducts (thickness at least 0.8 mm, ДБН п. 7.11.5) are not a mode.
- Fix the Excel template (M9/M10/M12/M27-M30 on both sheets) and tell the engineer; a copy is ready.
- UI: Russian/English dictionaries, no list persistence, no per-system grouping.
- Offsets, adapters, insulation: out of v1, see `CLAUDE.md`.
- Taps: subtracting the cut-out from the main duct (an option or a separate credit line) is not modelled; the main duct's thickness differs from the tap's, so it needs its own design.
- Tees and crosses: branch flow and the branch's own pressure drop are not modelled (see "Tees and crosses"). A hard validation of the branch against the main duct has no source; only the `branch.larger` warning exists, plus the form-layer rejection of a non-positive area.

## Pressure losses hidden in the UI (owner, 2026-10-19)
- The page shows area only: metal area per piece and total, thickness, totals, sheet list. Hidden: the air block, airflow and zeta inputs, the velocity / friction / local / total loss columns, the loss total, and the centerline length column (an aerodynamics input, not an area).
- UI only. `assembleSection`, `calculate` (still returns `pressureDrop`, `totalLoss`, `centerlineLength`, `totalPressureDrop`), the validation and all tests and fixtures are unchanged. `useCalculator` feeds `calculate` a fixed flow (1 m3/h), empty zeta and the default air, so area, thickness and the sheet list do not depend on them and no loss-input error can appear.
- The row's area never depends on the loss calculation (owner, 2026-10-19): if the losses overflow or throw (sizes from about 1e157 mm, far beyond any duct), `calculate` keeps the row, sets `lossesAvailable: false` and NaN losses, and leaves it out of `totalPressureDrop`. A row is rejected only when its metal area is not finite or not positive. The old robustness test for a 9x300 mm diameter now expects the row to stay (changed with the owner's approval); a 9x400 mm diameter, which overflows the area itself, is still an error.
- Bringing losses back (the separate aerodynamics mode, after insulation and price): re-add an air block and per-row flow / zeta inputs, drop `hiddenLossInputs` in the hook, restore the removed dictionary strings from git history (`AirParams.tsx`, `airTitle`, `flow`, `zeta`, `results.velocity|friction|local|pressureDrop|centerline`, `totals.pressureDrop*`).

## Elbow radius suggested from the size (2026-10-22)
The engineer asked for editable inputs everywhere, with defaults that scale with the part size. The form now suggests the elbow radius (`config.elbowRadius`, form layer only; the core, fixtures and validation are unchanged):
- Round elbow: centre-line radius = 1.0 x D. Rect elbow: inner radius = 0.5 x W (W = the bend-plane side), i.e. centre-line R = 1.0 x W. For W 100-300 mm this gives 50-150 mm, in line with what the engineer expected.
- The field follows the size until the user types in it; after that it is never overwritten. Clearing the field keeps it empty (so it can be retyped); "скинути до авто" hands it back. A kind change resets it. No valid size yet: the field stays empty.
- `TODO(confirm)`: common practice (round R = D in manufacturer catalogues and our fixtures; rect R/W >= 1.0 without vanes in SMACNA-style specs), not a norm. No radius rule was found in ДБН В.2.5-67:2013 or EN 1505/1506 in open sources. To ask the engineer: are R = D and inner 0.5 x W the typical values. Sources seen: Lindab Safe catalogue (BFU 90 bend, centre-line R about 1 x d), SMACNA-style project specs (R/W 1.0-1.5; 0.5 only with vanes).
- Deferred: air block back in the UI (with the aerodynamics mode; pressure kPa / atm conversion then).

## Fitting sketches (2026-10-22)
Owner idea (2026-10-19): a picture per fitting kind so users see what the part is. Each card has a "Показати схеми" button (owner chose card design 3, 2026-10-22) that opens two schematic inline SVGs side by side: the side view and the cross-section "в профіль" (`FittingSketch` with `view`, `sketch-spec.ts`), not to scale, no new dependency, dark-theme aware. Dimension labels sit beside the drawing on dimension lines, never over it; the elbow radius line runs to the centre line for the round elbow (КО) and to the inner edge for the rect one (ПО), as the field means. Labels (a short legend under each sketch names them, with the radius worded as the field has it: centre line for round elbows, inner for rect): Д / Ш × В (main or large end), д / ш × в (small end or branch), L, R, α, l. Drawn from the kind's geometry, not from the engineer's Excel sketches: replace them if he provides drawings. Fitting names are unchanged. Added `vitest.config.mts` (the `@/` alias) so components can be tested with `react-dom/server`.

## Beta start state and card look (2026-10-22)
- While the site is in beta (owner), the page opens with one example row of every fitting kind (`form/sample-rows.ts`, example sizes, not real data) and the sketches are open by default; the button still hides them. Revert to one empty row when the beta ends: `useCalculator` initial state and `nextId`.
- Look of the cards follows the mockup the owner chose: blueprint-paper neutrals and one blue accent as CSS tokens in `globals.css` (light and dark by `prefers-color-scheme`), IBM Plex Sans / Mono through `next/font/google`, outlined "Показати схеми" and "Видалити" buttons, filled primary "Додати деталь" (`styles.ts`).
