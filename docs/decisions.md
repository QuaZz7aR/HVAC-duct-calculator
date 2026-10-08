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

## `TODO(confirm)` register
Find them all with `grep -rn "TODO(confirm)" src`.
| Where | What is unconfirmed |
|---|---|
| `calc/config.ts` thickness | Band thresholds and thicknesses are Excel placeholders; the rect table is keyed by the larger side, the Excel used the equivalent diameter (the engineer called that a simplification). |
| `calc/config.ts` wasteFactor | Factors 1.15 / 1.2 / 1.1 and their thresholds came from websites; what they cover is open question 3. Rect is keyed by equivalent diameter, thickness by larger side. |
| `calc/sheet-area.ts` | Cap centerline is 0. Reducer centerline is the axial length (no fixture covers it). `rectToRoundReducer` slant ignores height. Rect elbow `innerRadius` is the inner radius (open question 1). |
| `calc/section.ts` | Reducer friction by the larger end's diameter and mean-velocity `Pd` for the local loss (open question 4). Caps have no friction because their centerline is 0. |

## Deferred
- `npm audit` findings (5 high) and the eslint 9 -> 10 upgrade: postponed by the owner; do not run `npm audit fix`.
- Share the equivalent-diameter helper between `aero.ts` (m) and `waste-factor.ts` (mm).
- Mapping `Fitting` -> `ThicknessSize`.
- Next feature: sheet list grouped by thickness. After that UI + Vercel and XLSX export.
- Tees, crosses, branch-ins, offsets, adapters, insulation: out of v1, see `CLAUDE.md`.
