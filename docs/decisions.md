# Decisions and open items

Companion to `CLAUDE.md`: why the core looks the way it does, and what is still unconfirmed. Update it in the same PR as the change it describes.

## Decisions
- **The Excel is a reference, not the truth.** Fixtures with `basis: 'excel'` follow the spreadsheet author's convention; where the Excel is wrong we compute the correct value and document it.
- **`rectReducer`** uses exact per-face geometry; `developedLength` is the area-equivalent length. **`rectToRoundReducer`** is a project approximation (slant from width only).
- **Waste factor** is applied to elbows only, via `metalArea = sheetArea * wasteFactor`. `sheetArea` stays pure geometry.
- **Tables are versioned** (`version` in `ThicknessTable`, `WasteFactorTable`); bump it on any row change. Rows are bands: `fromMm` inclusive up to the next row, first row starts at 0.
- **Air** (`airAtConditions`): ideal gas density, Sutherland viscosity. The constants 273 and 9.8 are the Excel's roundings, kept so the aero fixtures match.
- **Validation** is Zod 4 in `src/lib/validation/`, outside the core. It reports stable error codes, not text. A reducer length below the floor is an error, never clamped.
- **`assembleSection`** throws on non-positive flow and negative local coefficient; the validation layer reports the same cases as codes.
- **Reducer section pressure drop** follows the Excel: friction by the larger end, velocity is the mean of both ends, local loss at that velocity.

- **Sheet list** (`sheetList`) groups `metalArea * quantity` by thickness and returns m2 only. The Excel has no grouping and no sheet count (thickness and area per row), so grouping is ours. `thicknessSize`: for reducers the larger size over both ends (max of diameters, per-side max of width/height; the Excel uses the first-given C/D end, same result when the ends are ordered), rect end for rect-to-round. Quantity must be a positive integer. `sheetListItemSchema` / `sheetListSchema` (`validation/`) validate `{ fitting, quantity }` at the boundary: fitting errors keep their codes with the path under `fitting`, a bad quantity is `quantity.invalid` (one code for non-positive, fractional and non-finite values). `form/calculate.ts` validates fitting and quantity with `sheetListItemSchema` (the leading `fitting` path segment is stripped so issues map to form fields as before).

- **UI** (first version): one client page (later split into small components under `src/components/calculator/` with state in the `useCalculator` hook, no behaviour change), all calculation in the browser over the pure core, no backend, no persistence, no new dependencies. Language is Ukrainian; all strings are in `src/lib/i18n/uk.ts`, fitting names use the Excel designations. Form fields are raw text (decimal comma accepted); text is parsed in `form/calculate.ts`, validated by the existing Zod schemas, and errors are shown as the dictionary message for the stable code. Fitting and quantity (positive integer, code `quantity.invalid`) are validated by `sheetListItemSchema`; flow, zeta and air are still checked in `form/`. Empty zeta means 0; empty reducer length means the config default. The page total of pressure drop is the plain sum of quantity times section loss, valid for one serial path only (labelled so). Rows with errors are left out of totals and counted. Fonts are the system stack (no Google Fonts, no network at build).
- **Results-table headers** take the Excel column wording: "Товщина металу, мм", "Площа, м²", "Сума площі, м²", "Падіння тиску на тертя, Па", "Місцеве падіння тиску, Па", "Загальне падіння тиску, Па". Reason: "Тертя" / "Місцеві" were unclear next to the Excel. Two deliberate deviations: the unit is written м² (Excel: м2), and per-piece columns keep the "(шт.)" mark so they are not confused with the totals. "Довжина по осі" and "Швидкість" have no Excel equivalent and are unchanged. Fitting names and designations are NOT changed (owner decision).
- **Web analytics** is Vercel Web Analytics: the `@vercel/analytics` package (the only runtime dependency besides Next, React, Zod) and one `<Analytics />` in the root layout. It is cookie-free page-view counting only; the component sends no custom events, so calculator inputs never leave the browser (keep it that way). The script is a no-op in dev; data is collected only after the owner turns on Web Analytics in the Vercel project. The Vercel Hobby plan is for non-commercial use: moving to a paid service (see the commercial plan) requires the Pro plan.
- **Input warnings** (`calc/warnings.ts`, thresholds in `config.warnings`): non-blocking advice for a valid fitting, never an error and never a change of the typed sizes (engineer, 2026-10-16: warn, do not auto-scale). Rect aspect ratio >= 3 -> warning (engineer: a side 2.5-3x the other is not done in practice); > 6.3 -> strong warning that replaces the plain one (ДБН В.2.5-67:2013, додаток Ц limit); any cross-section dimension > 2000 mm -> warning that the thickness must be justified by calculation (same appendix); elbow inner radius > 2 x width (rect) or diameter (round, inner = center - D/2) -> warning, threshold is `TODO(confirm)`. `calculate` attaches `warnings` to every row that calculated; the UI shows them under the row card (amber, strong in red). Rows with errors show only the errors.
- **Cutting coefficients 1.15 / 1.2 / 1.1 stay for elbows only** (Ш4, decided 2026-10-16). The engineer says they are a flange allowance for all fittings but is not sure he used them everywhere, and gave no values for other kinds. Neither the СП nor ДБН В.2.5-67:2013 has such a coefficient, so there is no source to take values from, and a general coefficient would count the flange allowance twice (`allowance` already covers it). Other kinds keep `default: 1.0`. Revisit only with values and a source.
- **Reducer friction and local loss** (Ш6, decided 2026-10-16): friction by the larger end's diameter (our choice, the engineer did not follow the question), `zeta` at the mean velocity of both ends (engineer confirmed).
- **Pressure drop is a separate mode, not part of the main output** (Ш12, decided 2026-10-16). The engineer's order: 1) metal area for all fittings, 2) insulation, 3) price per fitting (the user enters their own prices), 4) aerodynamics apart, maybe its own tab where the user enters the flow. The current single table is kept for now; splitting it into modes comes after insulation and price.
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
- **Tees and crosses subtract the branch opening, in every fitting** (Ш7). Closes open question 2. Still out of v1; the pending fixtures already follow it.
- **Branch-ins (Квр, Пвр, ПККр) by geometry** (Ш8, Ш9): he does not remember the formulas and trusts whichever are correct and pass our checks. Out of v1.
- **Adapter is not needed now** (Ш10).
- **Thickness** (Ш11): 0.55 mm below 400 mm, 0.7 mm from 400 mm, rect by the larger side. Confirms the table thresholds. A side 2.5-3x the other could be given 0.7 mm, but better warn (done, see Input warnings).

Open:
- **Ш13** («Специфікація», totals): no answer, the owner will ask again.
- **Sheet size** for a sheet count (not asked yet).
- **Elbow radius threshold** of the warning: the engineer expected inner radii of 50 mm, 100-150 mm for big ducts; 2 x width is preliminary.
- **Warning thresholds** of the aspect ratio (3) were chosen from his "2.5-3" and ДБН 6.3; to confirm.
- **ДБН thickness table** (ДБН В.2.5-67:2013, додаток Ц) differs from the engineer's: rect 0.5 (up to 250) / 0.7 (300-1000) / 0.9 (1250-2000), round 0.5 / 0.6 / 0.7 / 1.0 / 1.2 / 1.4 by diameter, "not more than"; no 0.55; above 2000 by calculation; fire-resistant at least 0.8. Idea: keep the engineer's table and add the ДБН one as a second config table. Ask the engineer first.

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
| `calc/config.ts` thickness | Thresholds 400 mm / 0.55 / 0.7 confirmed by the engineer (2026-10-16); the table is still versioned `placeholder-1`. Open: the ДБН table as a second option. The rect table is keyed by the larger side, the Excel used the equivalent diameter (the engineer confirmed that the equivalent diameter was a simplification, so the rect key stays our choice; the thresholds remain placeholders). |
| `calc/config.ts` wasteFactor | Factors 1.15 / 1.2 / 1.1 and their thresholds came from websites. Decided: elbows only, no normative source (Ш4); what they cover stays unconfirmed. Rect is keyed by equivalent diameter, thickness by larger side. |
| `calc/sheet-area.ts` | Cap centerline is 0. Reducer centerline is the axial length (no fixture covers it). `rectToRoundReducer` slant ignores height. Rect elbow `innerRadius` is inner (confirmed 2026-10-16). |
| `calc/thickness.ts` `thicknessSize` | Reducers are sized by the larger side over both ends, rect-to-round by its rect end (Excel convention); unconfirmed against handbooks. |
| `form/fields.ts` | Prefilled allowance 50 mm and angle 90 in the form: UI convenience only, the core has no default for allowance. |
| `calc/section.ts` | Reducer friction by the larger end's diameter (our choice); mean-velocity `Pd` confirmed by the engineer. Caps have no friction because their centerline is 0. |
| `calc/config.ts` warnings | `elbowInnerRadiusFactor` 2 is preliminary; the aspect ratio threshold 3 comes from the engineer's "2.5-3". |

## Deferred
- `npm audit`: 5 high findings, one chain (`braces` <- `micromatch` <- `fast-glob` <- `@next/eslint-plugin-next` <- `eslint-config-next`), dev tooling only, nothing ships to the browser or the server. No non-breaking fix exists: `npm audit fix --force` would downgrade `eslint-config-next` to 14.2.35 (Next 16 here). Wait for a `eslint-config-next` release that updates `fast-glob`/`micromatch`; do not run `npm audit fix`.
- eslint 9 -> 10: blocked upstream. `eslint-config-next` 16.3.8 itself allows `eslint >=9`, but the plugins it bundles (`eslint-plugin-react` 7.37.5, `eslint-plugin-import` 2.32.0, `eslint-plugin-jsx-a11y` 6.10.2, all at their latest releases) declare peers only up to `^9`. Retry when those publish eslint 10 support; do not force it with overrides.
- Share the equivalent-diameter helper between `aero.ts` (m) and `waste-factor.ts` (mm).
- Converting m2 per thickness to a count of standard sheets: needs the sheet size and a nesting allowance, neither is in the Excel; ask the owner (TODO(confirm) when added to config).
- Next features (engineer's order, 2026-10-16): insulation, price per fitting (user-entered), then aerodynamics as a separate mode. XLSX export waits for the engineer's reference files.
- Optional ДБН thickness table as a second config table, after asking the engineer.
- Fix the Excel template (M9/M10/M12/M27-M30 on both sheets) and tell the engineer; a copy is ready.
- UI: Russian/English dictionaries, no list persistence, no per-system grouping.
- Tees, crosses, branch-ins, offsets, adapters, insulation: out of v1, see `CLAUDE.md`.
