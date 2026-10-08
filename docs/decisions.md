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

- **Sheet list** (`sheetList`) groups `metalArea * quantity` by thickness and returns m2 only. The Excel has no grouping and no sheet count (thickness and area per row), so grouping is ours. `thicknessSize`: for reducers the larger size over both ends (max of diameters, per-side max of width/height; the Excel uses the first-given C/D end, same result when the ends are ordered), rect end for rect-to-round. Quantity must be a positive integer.

- **UI** (first version): one client component, all calculation in the browser over the pure core, no backend, no persistence, no new dependencies. Language is Ukrainian; all strings are in `src/lib/i18n/uk.ts`, fitting names use the Excel designations. Form fields are raw text (decimal comma accepted); text is parsed in `form/calculate.ts`, validated by the existing Zod schemas, and errors are shown as the dictionary message for the stable code. Quantity (positive integer) is checked in `form/` with its own code `quantity.invalid` because the sheet-list item schema is still deferred. Empty zeta means 0; empty reducer length means the config default. The page total of pressure drop is the plain sum of quantity times section loss, valid for one serial path only (labelled so). Rows with errors are left out of totals and counted. Fonts are the system stack (no Google Fonts, no network at build).
- **Form prefills** (not core defaults): allowance 50 mm (what the fixtures use) and elbow angle 90, `TODO(confirm)` in `form/fields.ts`.

## Known deviations from the Excel
Deliberate; the Excel is a reference, not the truth. Both are rect elbows and both are `TODO(confirm)` with the engineer.
- **Allowance counted twice.** Excel (`M8`) adds the connection allowance once, our fixtures twice (the engineer said x2 for elbows). Area is +9.6 % (350x150) and +13.7 % (400x200) against the Excel.
- **Centerline from geometry, not area.** Excel derives the rect elbow length for friction from its area (`J8 = M8 / perimeter`, includes allowance and waste factor); our `centerlineLength` is pure geometry. Friction differs by about +33 % in the Excel's favour of the larger length.

## `TODO(confirm)` register
Find them all with `grep -rn "TODO(confirm)" src`.
| Where | What is unconfirmed |
|---|---|
| `calc/config.ts` thickness | Band thresholds and thicknesses are Excel placeholders; the rect table is keyed by the larger side, the Excel used the equivalent diameter (the engineer called that a simplification). |
| `calc/config.ts` wasteFactor | Factors 1.15 / 1.2 / 1.1 and their thresholds came from websites; what they cover is open question 3. Rect is keyed by equivalent diameter, thickness by larger side. |
| `calc/sheet-area.ts` | Cap centerline is 0. Reducer centerline is the axial length (no fixture covers it). `rectToRoundReducer` slant ignores height. Rect elbow `innerRadius` is the inner radius (open question 1). |
| `calc/thickness.ts` `thicknessSize` | Reducers are sized by the larger side over both ends, rect-to-round by its rect end (Excel convention); unconfirmed against handbooks. |
| `form/fields.ts` | Prefilled allowance 50 mm and angle 90 in the form: UI convenience only, the core has no default for allowance. |
| `calc/section.ts` | Reducer friction by the larger end's diameter and mean-velocity `Pd` for the local loss (open question 4). Caps have no friction because their centerline is 0. |

## Deferred
- `npm audit` findings (5 high) and the eslint 9 -> 10 upgrade: postponed by the owner; do not run `npm audit fix`.
- Share the equivalent-diameter helper between `aero.ts` (m) and `waste-factor.ts` (mm).
- Converting m2 per thickness to a count of standard sheets: needs the sheet size and a nesting allowance, neither is in the Excel; ask the owner (TODO(confirm) when added to config).
- Next features: Vercel deploy (owner's account), XLSX export (format can follow the engineer's spec).
- UI: Russian/English dictionaries, no list persistence, no per-system grouping.
- Tees, crosses, branch-ins, offsets, adapters, insulation: out of v1, see `CLAUDE.md`.
