# 0102. Export: Excel file and print / PDF

Status: Accepted
Date: 2026-11-24
Source: Nikita, 2026-11-24: export the result after saving the project (ADR 0101), so the spec can go to a customer or the shop.

## Context
The results lived only on the page. The engineer's own XLSX layout is still not known (XLSX export was waiting for his reference files), so this export is our own layout of the page's numbers, not a copy of his template.

## Decision
- A bar under the fittings list with «Завантажити Excel» and «Друк / PDF», each with «i» help; both are disabled on an empty list.
- Excel: `src/lib/export/xlsx-writer.ts` writes a minimal .xlsx with no dependency (plain XML parts, inline strings, a bold style, number formats with 0-3 decimals, column widths, a ZIP with stored entries and CRC-32), the mirror of the import reader (ADR 0061). `calculator/export-report.ts` `reportSheets` builds the sheets from the page state: «Специфікація» (position, kind, sizes, quantity, thickness, actual area each / total, consumption each / total, insulation when any row has it, pieces; rows with errors marked «не враховано»; then the «Разом» totals and costs), «Метал» (sheet size and margin, the list by thickness with sheets and the cost when a price is typed, a total row), «Утеплювач» (only when insulation is picked). Numbers are real numbers, so the file can be summed further. File name `rozrakhunok-povitrovodiv-YYYY-MM-DD.xlsx` (English: `duct-calculation-...`). Language of the page.
- The export holds everything computed, also in the simple mode: hidden values count on the page too (ADR 0082); price columns and the insulation sheet appear only when they have content.
- Print: `window.print()`; print styles in `globals.css` hide the rail, toolbar, settings, the fittings list, the export bar and the «i» buttons (`print-hide`), drop the scroll box of the results table (`print-full`), use light colours on any theme and keep table rows whole. «Save as PDF» in the browser's print dialog gives the PDF, so no PDF library.

## Consequences
- When the engineer sends his reference files, the layout can follow them in `reportSheets` without touching the writer.
- No logo, customer or project name fields yet (deferred, together with named projects).
