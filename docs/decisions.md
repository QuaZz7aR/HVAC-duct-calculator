# Decisions and open items

Companion to `CLAUDE.md`: why the core looks the way it does, and what is still unconfirmed. Update it in the same PR as the change it describes.

- **Decisions** are ADRs in `docs/adr/`, one per file (index below).
- **Engineer answers** and the Excel template bugs: `docs/engineer-answers.md`.
- **Open items**: the `TODO(confirm)` register and the deferred work, below.

## How to record a decision
- A new decision is a new file `docs/adr/NNNN-kebab-title.md` (next free number) plus one line in the index below, in the same PR as the change.
- Sections: a header with `Status`, `Date` and `Source` (engineer answer with its date and question number, owner decision, norm, PR number), then `Context`, `Decision`, `Consequences`.
- An accepted ADR is not rewritten. When a decision changes, write a new ADR and set the old one's status to `Superseded by NNNN` (or say which part is superseded); fix only links and typos in old ADRs.
- A new or resolved `TODO(confirm)` updates the register below; new deferred work goes to "Deferred".

## ADR index
| ADR | Decision | Date | Status |
|---|---|---|---|
| [0001](adr/0001-excel-is-a-reference-not-the-truth.md) | The Excel is a reference, not the truth | 2026-10-07 | Accepted |
| [0002](adr/0002-reducer-geometry.md) | Reducer geometry: exact rect reducer, approximate rect-to-round | 2026-10-07 | Accepted; the rect-to-round part is superseded by [0035](adr/0035-rect-to-round-exact-layout.md) |
| [0003](adr/0003-allowance-counted-twice-on-rect-elbows.md) | Allowance counted twice on rect elbows | 2026-10-07 | Accepted (deviation from the Excel, confirmed by the engineer) |
| [0004](adr/0004-centerline-from-geometry-not-area.md) | Centerline length from geometry, not from area | 2026-10-07 | Accepted (deviation from the Excel, confirmed 2026-10-16) |
| [0005](adr/0005-reducer-length-default-and-floor.md) | Reducer length: default 300 mm, floor 150 mm, no silent clamp | 2026-10-07 | Accepted |
| [0006](adr/0006-flexible-duct-roughness.md) | Flexible duct uses steel roughness | 2026-10-07 | Accepted |
| [0007](adr/0007-engineer-thickness-table.md) | Engineer's thickness table, rect keyed by the larger side | 2026-10-08 | Superseded by [0025](adr/0025-dbn-thickness-table-by-default.md) as the default; the table stays as the selectable option `engineerThickness`. The larger-side key stands. |
| [0008](adr/0008-versioned-band-tables.md) | Lookup tables are versioned bands | 2026-10-08 | Accepted |
| [0009](adr/0009-air-properties.md) | Air properties: ideal gas and Sutherland, Excel roundings kept | 2026-10-08 | Accepted |
| [0010](adr/0010-validation-outside-the-core.md) | Validation outside the core, stable error codes | 2026-10-08 | Accepted |
| [0011](adr/0011-sheet-list-by-thickness.md) | Sheet list grouped by thickness | 2026-10-08 | Accepted (order list added by [0024](adr/0024-order-margin-and-sheet-count.md)) |
| [0012](adr/0012-first-ui.md) | First UI: one client page over the pure core | 2026-10-08 | Accepted; the loss parts are hidden since 2026-10-19 ([0027](adr/0027-pressure-losses-hidden-in-the-ui.md)), the system-font rule is superseded by [0030](adr/0030-beta-start-state-and-card-view.md) |
| [0013](adr/0013-form-prefills.md) | Form prefills are not core defaults | 2026-10-08 | Accepted |
| [0014](adr/0014-results-table-headers.md) | Results-table headers in the Excel wording | 2026-10-09 | Accepted (loss columns hidden since 2026-10-19, [0027](adr/0027-pressure-losses-hidden-in-the-ui.md)) |
| [0015](adr/0015-vercel-web-analytics.md) | Vercel Web Analytics, page views only | 2026-10-11 | Accepted |
| [0016](adr/0016-waste-factor-for-elbows-only.md) | Cutting coefficients for elbows only | 2026-10-16 | Accepted; amended by [0022](adr/0022-seam-allowance-for-other-kinds.md) (user-set seam allowance for the other kinds) |
| [0017](adr/0017-rect-elbow-radius-is-inner.md) | Rect elbow radius is the inner radius | 2026-10-16 | Accepted |
| [0018](adr/0018-reducer-zeta-at-the-mean-velocity.md) | Reducer section: mean velocity, friction by the larger end | 2026-10-16 | Accepted for velocity and `zeta`; the friction part is superseded by [0023](adr/0023-reducer-friction-by-the-mean-diameter.md) |
| [0019](adr/0019-pressure-drop-is-a-separate-mode.md) | Pressure drop is a separate mode, not part of the main output | 2026-10-16 | Accepted |
| [0020](adr/0020-input-warnings.md) | Input warnings, never errors | 2026-10-16 | Accepted (thresholds partly `TODO(confirm)`) |
| [0021](adr/0021-tees-and-crosses.md) | Tees and crosses | 2026-10-16 | Accepted |
| [0022](adr/0022-seam-allowance-for-other-kinds.md) | User-set seam allowance for the non-elbow kinds | 2026-10-19 | Accepted |
| [0023](adr/0023-reducer-friction-by-the-mean-diameter.md) | Reducer friction by the mean diameter | 2026-10-19 | Accepted; supersedes the friction part of [0018](adr/0018-reducer-zeta-at-the-mean-velocity.md) |
| [0024](adr/0024-order-margin-and-sheet-count.md) | Order margin, sheet size and sheet count | 2026-10-19 | Accepted (values `TODO(confirm)`) |
| [0025](adr/0025-dbn-thickness-table-by-default.md) | ДБН thickness table by default | 2026-10-19 | Accepted; supersedes [0007](adr/0007-engineer-thickness-table.md) as the default |
| [0026](adr/0026-branch-in-taps.md) | Branch-in taps (Квр, Пвр) | 2026-10-19 | Accepted |
| [0027](adr/0027-pressure-losses-hidden-in-the-ui.md) | Pressure losses hidden in the UI | 2026-10-19 | Accepted (temporary, until the aerodynamics mode) |
| [0028](adr/0028-elbow-radius-suggested-from-the-size.md) | Elbow radius suggested from the size | 2026-10-22 | Accepted (values `TODO(confirm)`) |
| [0029](adr/0029-fitting-sketches.md) | Fitting sketches on each card | 2026-10-22 | Accepted; the sketch layout is amended by [0032](adr/0032-sketch-panels-and-field-alignment.md), the card shows an isometric sketch since [0033](adr/0033-isometric-sketch.md) |
| [0030](adr/0030-beta-start-state-and-card-view.md) | Beta start state, card view state and card look | 2026-10-22 | Accepted (the beta start state is temporary) |
| [0031](adr/0031-side-panel-for-adding-fittings.md) | Side panel for adding fittings | 2026-10-23 | Accepted |
| [0032](adr/0032-sketch-panels-and-field-alignment.md) | Two sketch panels and inputs aligned under wrapped labels | 2026-10-26 | Accepted; the two panels are superseded by [0033](adr/0033-isometric-sketch.md) |
| [0033](adr/0033-isometric-sketch.md) | One isometric sketch instead of two views | 2026-10-27 | Accepted |
| [0034](adr/0034-latin-size-letters.md) | Latin letters for sizes on the sketch and in the field labels | 2026-10-27 | Accepted |
| [0035](adr/0035-rect-to-round-exact-layout.md) | Rect-to-round transition: exact sheet-metal layout | 2026-10-27 | Accepted |

## Known deviations from the Excel
Deliberate; the Excel is a reference, not the truth ([0001](adr/0001-excel-is-a-reference-not-the-truth.md)). The first two are rect elbows.
- **Allowance counted twice**: +9.6 % / +13.7 % area against the Excel, confirmed by the engineer ([0003](adr/0003-allowance-counted-twice-on-rect-elbows.md)).
- **Centerline from geometry, not area**: the Excel's friction length is about +33 % longer, confirmed Ш2 ([0004](adr/0004-centerline-from-geometry-not-area.md)).
- **Rect-to-round transition as the exact layout**: the Excel (and ВСН 353-86) take the mean perimeter x axial length, 1-14 % less on elongated rect ends ([0035](adr/0035-rect-to-round-exact-layout.md)).

## `TODO(confirm)` register
Find them all with `grep -rn "TODO(confirm)" src`.
| Where | What is unconfirmed |
|---|---|
| `calc/config.ts` thickness | Default is the ДБН table (`dbnThickness`, engineer: "do it by ДБН", 2026-10-19). Open: sizes between the listed ones take the next larger listed size (our rule); fire-resistant ducts (>= 0.8 mm) are not modelled. `engineerThickness` (0.55 / 0.7 at 400 mm, confirmed 2026-10-16) is the selectable option; its rect key is the larger side, the Excel used the equivalent diameter (a simplification the engineer acknowledged). |
| `calc/config.ts` order | Margin 20 % is "probably the margin for ordering metal" (engineer, unsure); the offered sheet sizes and the default 1250 x 2500 are not from a supplier. |
| `calc/config.ts` wasteFactor | Factors 1.15 / 1.2 / 1.1 and their thresholds came from websites. Decided: elbows only, no normative source (Ш4); what they cover stays unconfirmed. Other kinds: `default` = the user's seam allowance (0 by default). Rect is keyed by equivalent diameter, thickness by larger side. |
| `calc/sheet-area.ts` | Cap centerline is 0. Reducer centerline is the axial length (no fixture covers it). Rect elbow `innerRadius` is inner (confirmed 2026-10-16). |
| `calc/thickness.ts` `thicknessSize` | Reducers are sized by the larger side over both ends, rect-to-round by its rect end (Excel convention); unconfirmed against handbooks. |
| `form/fields.ts` | Prefilled allowance 50 mm and angle 90 in the form: UI convenience only, the core has no default for allowance. |
| `calc/sheet-area.ts` taps (`roundTap`, `rectTap`) | Centerline 0 (a stub off the main flow); the 100 mm length is only a form prefill. It matches ВСН 353-86 п. 1.5 / 2.5 ("врезку, как правило, следует выполнять высотой h = 100 мм"), a USSR norm; no Ukrainian norm with this figure was found (2026-10-27). |
| `calc/sheet-area.ts` tees and crosses | Centerline of the main run is the branch size along the axis `E` (no allowance); the Excel has only the run length `E + 2 x allowance`. |
| `calc/section.ts` | Reducer friction by the mean diameter and mean-velocity `Pd`: both from the engineer (2026-10-19, 2026-10-16). Caps have no friction because their centerline is 0. |
| `calc/config.ts` elbowRadius | 1.0 D (round centre line) and 0.5 W (rect inner) are common practice, not a norm; form suggestion only. |
| `calc/config.ts` warnings | `elbowInnerRadiusFactor` 2 is preliminary; the aspect ratio threshold 3 comes from the engineer's "2.5-3". |

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
- Tees and crosses: branch flow and the branch's own pressure drop are not modelled (see [0021](adr/0021-tees-and-crosses.md)). A hard validation of the branch against the main duct has no source; only the `branch.larger` warning exists, plus the form-layer rejection of a non-positive area.
