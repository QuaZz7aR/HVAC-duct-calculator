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
| [0007](adr/0007-engineer-thickness-table.md) | Engineer's thickness table, rect keyed by the larger side | 2026-10-08 | Superseded by [0025](adr/0025-dbn-thickness-table-by-default.md) as the default, and by [0041](adr/0041-engineer-table-by-equivalent-diameter-and-allowance-count.md) for the rect key (now the equivalent diameter). |
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
| [0026](adr/0026-branch-in-taps.md) | Branch-in taps (Квр, Пвр) | 2026-10-19 | Accepted (ring part superseded by [0043](adr/0043-tap-ring-in-the-metal-consumption.md)) |
| [0027](adr/0027-pressure-losses-hidden-in-the-ui.md) | Pressure losses hidden in the UI | 2026-10-19 | Accepted (temporary, until the aerodynamics mode) |
| [0028](adr/0028-elbow-radius-suggested-from-the-size.md) | Elbow radius suggested from the size | 2026-10-22 | Accepted (values `TODO(confirm)`) |
| [0029](adr/0029-fitting-sketches.md) | Fitting sketches on each card | 2026-10-22 | Accepted; the sketch layout is amended by [0032](adr/0032-sketch-panels-and-field-alignment.md), the card shows an isometric sketch since [0033](adr/0033-isometric-sketch.md) |
| [0030](adr/0030-beta-start-state-and-card-view.md) | Beta start state, card view state and card look | 2026-10-22 | Accepted (the beta start state is temporary) |
| [0031](adr/0031-side-panel-for-adding-fittings.md) | Side panel for adding fittings | 2026-10-23 | Accepted |
| [0032](adr/0032-sketch-panels-and-field-alignment.md) | Two sketch panels and inputs aligned under wrapped labels | 2026-10-26 | Accepted; the two panels are superseded by [0033](adr/0033-isometric-sketch.md) |
| [0033](adr/0033-isometric-sketch.md) | One isometric sketch instead of two views | 2026-10-27 | Accepted |
| [0034](adr/0034-latin-size-letters.md) | Latin letters for sizes on the sketch and in the field labels | 2026-10-27 | Accepted |
| [0035](adr/0035-rect-to-round-exact-layout.md) | Rect-to-round transition: exact sheet-metal layout | 2026-10-27 | Accepted |
| [0036](adr/0036-ukrainian-fitting-codes.md) | Ukrainian fitting codes: КПв, ППв, КВд, ПВд, ККХ, КПХ, ППХ, ПКХ instead of the Excel КВ, ПВ, КО, ПО, ...Кр | 2026-10-28 | Accepted |
| [0037](adr/0037-insulation-area-beta.md) | Insulation area (beta): outer surface, sizes + 2t | 2026-11-03 | Accepted (beta) |
| [0038](adr/0038-price-per-square-metre.md) | Price: user-entered UAH per m² per thickness and material | 2026-11-03 | Accepted |
| [0039](adr/0039-english-interface.md) | English interface with a УКР / EN switch | 2026-11-05 | Accepted |
| [0040](adr/0040-sketch-thumbnail-in-the-card.md) | Sketch thumbnail in the card opens the full sketch | 2026-11-07 | Accepted |
| [0041](adr/0041-engineer-table-by-equivalent-diameter-and-allowance-count.md) | Engineer's table keys rect by the equivalent diameter; number of allowances per fitting | 2026-11-16 | Accepted; supersedes the rect key of 0007 and the fixed x2 of 0003 |
| [0042](adr/0042-metal-consumption-and-actual-area.md) | Two areas: metal consumption and actual area | 2026-11-16 | Accepted; the order no longer subtracts the tee cut-out (0021), short reducers are ordered as 300 mm (0005) |
| [0043](adr/0043-tap-ring-in-the-metal-consumption.md) | Tap ring in the metal consumption | 2026-11-16 | Accepted (actual-area part superseded by [0044](adr/0044-tap-ring-in-the-actual-area.md)) |
| [0044](adr/0044-tap-ring-in-the-actual-area.md) | Tap ring in the actual area | 2026-11-16 | Accepted |
| [0045](adr/0045-straight-piece-length.md) | Straight ducts split into shop pieces | 2026-11-16 | Accepted (defaults `TODO(confirm)`) |
| [0046](adr/0046-in-app-help.md) | In-app help: «i» explanations and a short how-to | 2026-11-17 | Accepted |
| [0047](adr/0047-wider-desktop-layout.md) | Wider desktop layout (page cap 1920 px, up to 5 tile columns, optional two-column cards) | 2026-11-17 | Accepted |
| [0048](adr/0048-narrow-rail-with-help-and-language.md) | Narrow side rail (icon over label) with help and language at its bottom | 2026-11-17 | Accepted |
| [0049](adr/0049-manual-row-order-and-positions.md) | Manual row order (drag on desktop, ↑ / ↓ everywhere), sections group neighbouring rows only, free-text position label | 2026-11-19 | Accepted |
| [0050](adr/0050-sizes-in-the-results.md) | Results rows show a size line (sketch letters) and scroll to the card on click | 2026-11-19 | Accepted |
| [0051](adr/0051-positions-in-section-titles.md) | Section titles start with their positions (1–2, or П1, П2) | 2026-11-19 | Accepted |
| [0052](adr/0052-moving-a-whole-section.md) | A section moves as a block: its own drag handle and ↑ / ↓ | 2026-11-19 | Accepted |
| [0053](adr/0053-settings-repeated-in-the-results.md) | Seam, margin, thickness table and sheet size also editable in the results blocks | 2026-11-19 | Accepted |
| [0054](adr/0054-highlight-card-after-results-jump.md) | The card is highlighted for 1.5 s after a jump from the results | 2026-11-19 | Accepted |
| [0055](adr/0055-sections-in-the-results.md) | The results table shows the list sections with their sums | 2026-11-19 | Accepted |
| [0056](adr/0056-clone-keeps-the-card-view.md) | A clone opens folded or open, as its original | 2026-11-19 | Accepted |
| [0057](adr/0057-section-highlight-after-results-jump.md) | A section is highlighted after a jump from its results title | 2026-11-19 | Accepted |
| [0058](adr/0058-phone-cards-instead-of-tables.md) | On a phone the results, sheet list and insulation list are blocks, not tables | 2026-11-19 | Accepted |
| [0059](adr/0059-phone-sketch-under-the-thumbnail.md) | On a phone the open sketch sits under the thumbnail | 2026-11-19 | Accepted |
| [0060](adr/0060-fold-button-set-apart.md) | The card's «Згорнути» button comes first and is tinted | 2026-11-19 | Accepted |
| [0061](adr/0061-import-from-excel.md) | Import of a spec table from .xlsx / .csv: column mapping, kind recognition, every row shown | 2026-11-19 | Accepted |
| [0062](adr/0062-delete-all-fittings.md) | «Видалити всі» over the list, confirmed by a second tap | 2026-11-19 | Accepted |
| [0063](adr/0063-help-in-the-import-dialog.md) | «i» help in the import dialog and an import step in «Довідка» | 2026-11-20 | Accepted |
| [0064](adr/0064-sections-in-two-columns.md) | Sections of a repeated kind in two columns from xl | 2026-11-20 | Superseded by 0071 |
| [0065](adr/0065-tiles-read-down-the-columns.md) | Folded tiles read down the columns, not along the rows | 2026-11-20 | Accepted |
| [0066](adr/0066-tiles-of-a-row-share-its-height.md) | Tiles of a row share its height (column-filled grid) | 2026-11-20 | Accepted |
| [0067](adr/0067-sections-pair-up.md) | Half-width sections only in pairs; a lone section is full width | 2026-11-20 | Superseded by 0071 |
| [0068](adr/0068-glide-only-on-reorder.md) | Cards glide only on a reorder, not on add or remove | 2026-11-20 | Accepted |
| [0069](adr/0069-open-section-full-width.md) | An open section takes the full width; only folded sections pair up | 2026-11-20 | Superseded by 0071 |
| [0070](adr/0070-single-fittings-frame.md) | Folded single fittings in a dashed «Окремі деталі» frame | 2026-11-20 | Superseded by 0091 (frame) |
| [0071](adr/0071-sections-full-width-again.md) | Sections take the full width again (reverts 0064, 0067, 0069) | 2026-11-20 | Accepted |
| [0072](adr/0072-section-frame-accent.md) | Section frame in the accent colour at 35 % | 2026-11-20 | Accepted |
| [0073](adr/0073-import-size-conflicts.md) | Import warns when the name and the size columns disagree | 2026-11-20 | Accepted |
| [0074](adr/0074-import-rows-without-sizes.md) | Imported rows without sizes are added with a warning | 2026-11-20 | Accepted |
| [0075](adr/0075-sticky-results-header.md) | Results table header stays on screen while scrolling | 2026-11-20 | Accepted |
| [0076](adr/0076-tile-buttons-two-rows.md) | Folded tile buttons in two rows below xl | 2026-11-20 | Superseded by 0077 |
| [0077](adr/0077-tile-buttons-two-rows-everywhere.md) | Folded tile buttons in two rows at every width | 2026-11-20 | Accepted |
| [0078](adr/0078-sticky-header-mid-width.md) | Sticky results header between sm and lg (table box scrolls) | 2026-11-20 | Accepted |
| [0079](adr/0079-hood-imported-as-a-cap.md) | A hood (зонт) is imported as a cap, the name wins over the code | 2026-11-20 | Accepted |
| [0080](adr/0080-card-buttons-two-rows-in-two-columns.md) | Open card buttons in two rows in the two-column layout | 2026-11-20 | Accepted |
| [0081](adr/0081-sketches-closed-by-default.md) | Full sketches closed by default (thumbnail only) | 2026-11-20 | Accepted |
| [0082](adr/0082-simple-and-advanced-mode.md) | Simple and advanced interface modes (simple by default, hidden values still count) | 2026-11-23 | Accepted |
| [0083](adr/0083-header-toolbar-under-the-title.md) | Header toolbar left under the title, «Видалити всі» beside the heading | 2026-11-23 | Accepted |
| [0084](adr/0084-section-end-and-group-separation.md) | Sections tinted with a gradient bottom edge, more space between groups | 2026-11-23 | Accepted |
| [0085](adr/0085-section-buttons-in-two-rows-on-a-phone.md) | Section buttons in two rows on a phone, short fold word | 2026-11-23 | Superseded by 0098 |
| [0086](adr/0086-warning-marks-in-the-results.md) | Red / amber ⚠ before a problem row in the results | 2026-11-23 | Accepted |
| [0087](adr/0087-add-menu-above-sections.md) | The add-fitting list paints above the sections (z-index on the sticky rail box) | 2026-11-23 | Accepted |
| [0088](adr/0088-view-toggles-in-a-sticky-list-header.md) | View toggles move from the side rail to a sticky bar above the list (desktop) | 2026-11-23 | Accepted |
| [0089](adr/0089-mode-and-import-in-the-side-rail.md) | Mode (chosen like the language) and import move to the side rail on desktop | 2026-11-23 | Accepted |
| [0090](adr/0090-inter-and-jetbrains-mono.md) | Fonts: Inter + JetBrains Mono instead of IBM Plex | 2026-11-23 | Accepted |
| [0091](adr/0091-single-fittings-framed-like-sections.md) | Single fittings (open or folded) framed like sections in their own colour | 2026-11-23 | Accepted |
| [0092](adr/0092-manual-theme-switch.md) | Manual theme switch (system / light / dark) on `<html data-theme>` | 2026-11-23 | Accepted |
| [0093](adr/0093-softer-light-theme.md) | Softer light theme: grey-blue page and cards, no pure white | 2026-11-23 | Accepted |
| [0094](adr/0094-subscript-size-indices.md) | Size indices d₁, a₂ as `<sub>` in HTML, system sans in the SVG sketch | 2026-11-24 | Accepted |
| [0102](adr/0102-export-to-excel-and-print.md) | Export: own .xlsx writer (specification, metal, insulation sheets) and print / PDF via print styles | 2026-11-24 | Accepted |
| [0103](adr/0103-export-beside-the-import.md) | Export also in the rail («Експорт» list after the import) and the phone header toolbar | 2026-11-24 | Accepted |
| [0095](adr/0095-numbering-by-systems.md) | «Нумерація»: positions «система-№», empty only or all again, preview first | 2026-11-24 | Accepted |
| [0096](adr/0096-import-from-pdf.md) | Import from PDF: own text reader, columns from table borders or text ranges | 2026-11-24 | Accepted (thresholds `TODO(confirm)`) |
| [0097](adr/0097-video-clips-in-the-help.md) | Short MP4 clip per help step, loaded only when the dialog opens | 2026-11-24 | Accepted |
| [0098](adr/0098-icon-only-card-buttons.md) | Icon-only fold, clone and remove buttons in cards and sections (text in `title` / `aria-label`) | 2026-11-24 | Accepted |
| [0099](adr/0099-pdf-clipped-cells-and-unicode-cmaps.md) | PDF import: UTF-16 CMap fonts without ToUnicode, clipped wrapped cells as one cell, Excel errors ignored in the column guess | 2026-11-24 | Accepted (cell-joining rule `TODO(confirm)`) |
| [0100](adr/0100-pdf-wrapped-rows-between-row-borders.md) | PDF import: text lines between two row borders with one full line are one row; «⚠ склеєно з N рядків» in the preview and on the card | 2026-11-24 | Accepted (joining rule `TODO(confirm)`) |
| [0101](adr/0101-project-saved-in-the-browser.md) | The project (rows, order, positions, settings, prices) is saved in `localStorage`, versioned, broken data skipped; sample rows only when nothing is saved | 2026-11-24 | Accepted |

## Known deviations from the Excel
Deliberate; the Excel is a reference, not the truth ([0001](adr/0001-excel-is-a-reference-not-the-truth.md)). The first two are rect elbows.
- **Allowance counted twice** by default: +9.6 % / +13.7 % area against the Excel, confirmed by the engineer ([0003](adr/0003-allowance-counted-twice-on-rect-elbows.md)); since [0041](adr/0041-engineer-table-by-equivalent-diameter-and-allowance-count.md) the user can set 1 or 0 per fitting.
- **Centerline from geometry, not area**: the Excel's friction length is about +33 % longer, confirmed Ш2 ([0004](adr/0004-centerline-from-geometry-not-area.md)).
- **Rect-to-round transition as the exact layout**: the Excel (and ВСН 353-86) take the mean perimeter x axial length, 1-14 % less on elongated rect ends ([0035](adr/0035-rect-to-round-exact-layout.md)).
- **Fitting codes**: straight ducts, elbows and crosses use Ukrainian letters (КПв, ППв, КВд, ПВд, ...Х) instead of the Excel КВ, ПВ, КО, ПО, ...Кр ([0036](adr/0036-ukrainian-fitting-codes.md)).

## `TODO(confirm)` register
Find them all with `grep -rn "TODO(confirm)" src`.
| Where | What is unconfirmed |
|---|---|
| `calc/config.ts` thickness | Default is the ДБН table (`dbnThickness`, engineer: "do it by ДБН", 2026-10-19). Open: sizes between the listed ones take the next larger listed size (our rule); fire-resistant ducts (>= 0.8 mm) are not modelled. `engineerThickness` (0.55 / 0.7 at 400 mm, confirmed 2026-10-16) is the selectable option; it keys rect by the equivalent diameter, as his template and orders (2026-11-16, [0041](adr/0041-engineer-table-by-equivalent-diameter-and-allowance-count.md)). His Пвр seems keyed by the width only: not followed, asked the owner. |
| `calc/config.ts` order | Margin 20 % is "probably the margin for ordering metal" (engineer, unsure); the offered sheet sizes and the default 1250 x 2500 are not from a supplier. |
| `calc/config.ts` wasteFactor | Factors 1.15 / 1.2 / 1.1 and their thresholds came from websites. Decided: elbows only, no normative source (Ш4); what they cover stays unconfirmed. Other kinds: `default` = the user's seam allowance (0 by default). Rect is keyed by equivalent diameter, thickness by larger side. |
| `calc/sheet-area.ts` | Cap centerline is 0. Reducer centerline is the axial length (no fixture covers it). Rect elbow `innerRadius` is inner (confirmed 2026-10-16). |
| `calc/thickness.ts` `thicknessSize` | Reducers are sized by the larger side over both ends, rect-to-round by its rect end (Excel convention); unconfirmed against handbooks. |
| `calc/branch.ts` `allowanceCount` | On tees and crosses the number of allowances counts the ends of the main run; the branch collar stays one `allowance` long ([0041](adr/0041-engineer-table-by-equivalent-diameter-and-allowance-count.md)). |
| `form/fields.ts` | Prefilled allowance 50 mm and angle 90 in the form: UI convenience only, the core has no default for allowance. |
| `calc/sheet-area.ts` taps (`roundTap`, `rectTap`) | Centerline 0 (a stub off the main flow); the 100 mm length is only a form prefill. It matches ВСН 353-86 п. 1.5 / 2.5 ("врезку, как правило, следует выполнять высотой h = 100 мм"), a USSR norm; no Ukrainian norm with this figure was found (2026-10-27). |
| `calc/config.ts` tap | Ring width 50 mm around a tap stub (Excel Квр value). Resolved 2026-11-16: the ring is part of the actual area and rect taps have it too ([0044](adr/0044-tap-ring-in-the-actual-area.md)); only the width stays unconfirmed. |
| `calc/config.ts` straightPiece | Max straight piece length prefill: round 3000 mm, rect 1250 mm, from the engineer's orders; no norm ([0045](adr/0045-straight-piece-length.md)). |
| `calc/sheet-area.ts` tees and crosses | Centerline of the main run is the branch size along the axis `E` (no allowance); the Excel has only the run length `E + 2 x allowance`. |
| `calc/section.ts` | Reducer friction by the mean diameter and mean-velocity `Pd`: both from the engineer (2026-10-19, 2026-10-16). Caps have no friction because their centerline is 0. |
| `calc/config.ts` elbowRadius | 1.0 D (round centre line) and 0.5 W (rect inner) are common practice, not a norm; form suggestion only. |
| `calc/config.ts` insulation, `calc/insulation.ts` | The six materials are the Excel's list (practice, not a norm). Insulation of elbows takes the metal cutting coefficient (as the Excel); caps take the end plate only; crosses by geometry, not the Excel's metal x 1.2. Beta, owner 2026-11-03; questions in the 2026-10-23 letter ([0037](adr/0037-insulation-area-beta.md)). |
| `calc/config.ts` warnings | `elbowInnerRadiusFactor` 2 is preliminary; the aspect ratio threshold 3 comes from the engineer's "2.5-3". |
| `form/order.ts` `numberBySystems` | Agent's overnight choices, to review: separator «-», default scope «лише порожні», no undo after «Пронумерувати» ([0095](adr/0095-numbering-by-systems.md)). |
| `import/pdf.ts` layout | Word gap 0.2 font size, border must cross a third of the body lines, header lines within 2.2 font sizes: tuned on LibreOffice and Chrome PDFs of our samples only ([0096](adr/0096-import-from-pdf.md)). |
| `import/pdf.ts` clipped cells | A clip box up to 20 font sizes high and wide is one cell; a wrapped fragment of 1-2 letters or digits joins without a space: tuned on one GridCraft PDF ([0099](adr/0099-pdf-clipped-cells-and-unicode-cmaps.md)). |
| `import/pdf.ts` wrapped rows | Lines between two row borders join when the band has exactly one full line (3+ columns), lines within two font sizes: tuned on kyiv.pdf and order.pdf ([0100](adr/0100-pdf-wrapped-rows-between-row-borders.md)). |
| `public/help/*.mp4` | Clip format and count are the agent's choice (MP4, one per step, uk + en) ([0097](adr/0097-video-clips-in-the-help.md)). |

## Deferred
- `npm audit`: 5 high findings, one chain (`braces` <- `micromatch` <- `fast-glob` <- `@next/eslint-plugin-next` <- `eslint-config-next`), dev tooling only, nothing ships to the browser or the server. No non-breaking fix exists: `npm audit fix --force` would downgrade `eslint-config-next` to 14.2.35 (Next 16 here). Wait for a `eslint-config-next` release that updates `fast-glob`/`micromatch`; do not run `npm audit fix`.
- eslint 9 -> 10: blocked upstream. `eslint-config-next` 16.3.8 itself allows `eslint >=9`, but the plugins it bundles (`eslint-plugin-react` 7.37.5, `eslint-plugin-import` 2.32.0, `eslint-plugin-jsx-a11y` 6.10.2, all at their latest releases) declare peers only up to `^9`. Retry when those publish eslint 10 support; do not force it with overrides.
- Share the equivalent-diameter helper between `aero.ts` (m) and `waste-factor.ts` (mm).
- Import ([0061](adr/0061-import-from-excel.md), [0096](adr/0096-import-from-pdf.md)): scanned PDF (needs OCR), encrypted PDF, sheets other than the first, old .xls, insulation / thickness columns.
- Sheet count has no nesting or offcut model (a plain ceil of area over sheet area); a cutting plan would need part shapes.
- Next features (engineer's order, 2026-10-16): insulation (beta done, [0037](adr/0037-insulation-area-beta.md)), price (done as UAH per m² per thickness and material, [0038](adr/0038-price-per-square-metre.md); a price per fitting or per sheet, labour and a price list are deferred), then aerodynamics as a separate mode. XLSX export is in with our own layout ([0102](adr/0102-export-to-excel-and-print.md)); matching the engineer's layout waits for his reference files; project / customer name fields in the export are deferred.
- A user-defined (custom) thickness table, which the engineer mentioned as a possible later step.
- Fire-resistant ducts (thickness at least 0.8 mm, ДБН п. 7.11.5) are not a mode.
- Fix the Excel template (M9/M10/M12/M27-M30 on both sheets) and tell the engineer; a copy is ready.
- UI: Russian/English dictionaries, list saved in this browser only ([0101](adr/0101-project-saved-in-the-browser.md); named projects and sync deferred), no per-system grouping.
- Offsets, adapters: out of v1, see `CLAUDE.md`.
- Insulation: order margin, roll size and count, foil / glue lines, insulation of dampers and silencers (not in the calculator).
- Taps: subtracting the cut-out from the main duct (an option or a separate credit line) is not modelled; the main duct's thickness differs from the tap's, so it needs its own design.
- Tees and crosses: branch flow and the branch's own pressure drop are not modelled (see [0021](adr/0021-tees-and-crosses.md)). A hard validation of the branch against the main duct has no source; only the `branch.larger` warning exists, plus the form-layer rejection of a non-positive area.
