# 0096. Import from PDF

Status: Accepted
Date: 2026-11-24
Source: Nikita (2026-11-24, acquaintances' feedback 2026-11-12: import Excel and PDF); details chosen by the agent overnight, to be reviewed

## Context
Specs often travel as PDF. The Excel import (ADR 0061) reads .xlsx / .csv in the browser with no dependency. pdf.js would add about a megabyte and a worker; the dependency rule asks to avoid that.

## Decision
- `src/lib/import/pdf.ts`, no dependency, browser only (the file is never uploaded): objects found by scanning `n g obj` (so a broken xref does not matter) plus object streams; FlateDecode through `DecompressionStream('deflate')`; the page tree in order with inherited resources; content streams run as text operators (Tf, Td, TD, Tm, T*, Tj, TJ, ', ", Tc, Tw, Tz, TL, Ts, q / Q / cm, Form XObjects) with each font's ToUnicode CMap (bfchar, bfrange) and widths (`/Widths`, `/W`); simple fonts without ToUnicode use WinAnsi and Differences glyph names (uniXXXX, afii Cyrillic).
- Layout (`layoutTable`): pieces on one baseline (within half a font size) form a line; pieces closer than a fifth of the font size join into one cell. Columns come from the drawn vertical table borders that cross at least a third of the body lines (a cell goes where its middle is, so «###» overflow and centred headers stay in their column); without borders, from the merged x ranges of the lines with three or more cells. A header wrapped over several lines right above the body is joined into one row (a hyphen-broken word and stacked letters join without a space); section lines («Вентиляція», «ПВ1») right above the body stay rows.
- The result is the same `Table` as .xlsx, so the mapping, preview and kinds are shared. All pages, one after another.
- `alignSizes` (mapping): on a tie of the ±1 column shift, the offset with numbers under «A» wins (the engineer's PDF prints a narrow quantity column as «###»).
- A PDF with no text (a scan) is `import.pdfNoText` with an explanation; not a PDF is `import.notPdf`. The button is now «Імпорт з Excel / PDF».

## Consequences
Checked on PDFs printed by LibreOffice from the engineer's order (66 of 66 rows recognised, as from the .xlsx; quantity lost where the PDF shows «###») and the Kyiv spec (63 ok against 61 from .xlsx; multi-line names come apart into extra rows), and a Chrome-printed table (Type0 / Identity-H fonts, no borders). Not supported: scans (no OCR), encrypted PDFs, filters other than Flate on content streams, vertical writing. TODO(confirm): thresholds (a fifth of the font size for words, a third of the body lines for a border, two font sizes for a header line) were tuned on these files only; real AutoCAD exports were not available.
