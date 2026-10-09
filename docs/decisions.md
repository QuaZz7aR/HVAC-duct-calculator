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
- **Form prefills** (not core defaults): allowance 50 mm (what the fixtures use) and elbow angle 90, `TODO(confirm)` in `form/fields.ts`.

## Known deviations from the Excel
Deliberate; the Excel is a reference, not the truth. Both are rect elbows.
- **Allowance counted twice.** Excel (`M8`) adds the connection allowance once, our fixtures twice. Confirmed by the engineer: x2 for rect elbows too, so the Excel is wrong here and our value is right. Area is +9.6 % (350x150) and +13.7 % (400x200) against the Excel.
- **Centerline from geometry, not area.** Excel derives the rect elbow length for friction from its area (`J8 = M8 / perimeter`, includes allowance and waste factor); our `centerlineLength` is pure geometry. Friction differs by about +33 % in the Excel's favour of the larger length. Still `TODO(confirm)`: the engineer was not asked about `J8`.

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

### `TODO(confirm)` after the answers
- Closed: the rect elbow allowance deviation (it had no code `TODO(confirm)`, only the note above). No register row closes completely; the thickness row now carries the confirmed simplification.
- Still open: rect elbow `innerRadius`, rect elbow centerline deviation, coefficients meaning and thresholds, thickness thresholds, cap and reducer centerline, `rectToRoundReducer` slant, reducer `Pd` velocity, `thicknessSize`, and the form prefills.

## `TODO(confirm)` register
Find them all with `grep -rn "TODO(confirm)" src`.
| Where | What is unconfirmed |
|---|---|
| `calc/config.ts` thickness | Band thresholds and thicknesses are Excel placeholders; the rect table is keyed by the larger side, the Excel used the equivalent diameter (the engineer confirmed that the equivalent diameter was a simplification, so the rect key stays our choice; the thresholds remain placeholders). |
| `calc/config.ts` wasteFactor | Factors 1.15 / 1.2 / 1.1 and their thresholds came from websites; what they cover is open question 3. Rect is keyed by equivalent diameter, thickness by larger side. |
| `calc/sheet-area.ts` | Cap centerline is 0. Reducer centerline is the axial length (no fixture covers it). `rectToRoundReducer` slant ignores height. Rect elbow `innerRadius` is the inner radius (open question 1). |
| `calc/thickness.ts` `thicknessSize` | Reducers are sized by the larger side over both ends, rect-to-round by its rect end (Excel convention); unconfirmed against handbooks. |
| `form/fields.ts` | Prefilled allowance 50 mm and angle 90 in the form: UI convenience only, the core has no default for allowance. |
| `calc/section.ts` | Reducer friction by the larger end's diameter and mean-velocity `Pd` for the local loss (open question 4). Caps have no friction because their centerline is 0. |

## Deferred
- `npm audit`: 5 high findings, one chain (`braces` <- `micromatch` <- `fast-glob` <- `@next/eslint-plugin-next` <- `eslint-config-next`), dev tooling only, nothing ships to the browser or the server. No non-breaking fix exists: `npm audit fix --force` would downgrade `eslint-config-next` to 14.2.35 (Next 16 here). Wait for a `eslint-config-next` release that updates `fast-glob`/`micromatch`; do not run `npm audit fix`.
- eslint 9 -> 10: blocked upstream. `eslint-config-next` 16.3.8 itself allows `eslint >=9`, but the plugins it bundles (`eslint-plugin-react` 7.37.5, `eslint-plugin-import` 2.32.0, `eslint-plugin-jsx-a11y` 6.10.2, all at their latest releases) declare peers only up to `^9`. Retry when those publish eslint 10 support; do not force it with overrides.
- Share the equivalent-diameter helper between `aero.ts` (m) and `waste-factor.ts` (mm).
- Converting m2 per thickness to a count of standard sheets: needs the sheet size and a nesting allowance, neither is in the Excel; ask the owner (TODO(confirm) when added to config).
- Next features: Vercel deploy (owner's account), XLSX export (format can follow the engineer's spec).
- UI: Russian/English dictionaries, no list persistence, no per-system grouping.
- Tees, crosses, branch-ins, offsets, adapters, insulation: out of v1, see `CLAUDE.md`.
