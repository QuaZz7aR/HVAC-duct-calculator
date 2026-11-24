# 0099. PDF import: Unicode CMap fonts and clipped, wrapped cells

Status: Accepted (cell-joining rule `TODO(confirm)`)
Date: 2026-11-24
Source: Nikita, 2026-11-24: an acquaintances' spec (Чугуїв Ліцей №5, xlsx) saved as PDF gave no rows in the import.

## Context
The PDF (producer «GridCraft PDF») had a text layer, so it was not a scan, but the import found nothing:
1. All Cyrillic is in a Type0 font `STSong-Light` with the predefined CMap `UniGB-UTF16-H` and no `ToUnicode`. The codes are UTF-16 themselves; the reader (ADR 0096) only decoded Type0 fonts through `ToUnicode`, so every Cyrillic letter was dropped and no header or kind code was left.
2. Each cell is clipped to its box (`x y w h re W n`) and its text is wrapped over several lines, centred vertically: the system «ПВ1» / «П» above, the numbers in the middle, the name below. Line grouping by baseline split one table row into three, and headers came out broken inside words («Шири на, або діам етр»).
3. Excel errors printed in the length column («#VALUE!», wrapped as «#VALU E!») made the mapping shift the size columns by one (`alignSizes`).

## Decision
- A Type0 font whose `Encoding` is a predefined `Uni…-UTF16-…` or `Uni…-UCS2-…` CMap decodes its 2-byte codes as UTF-16 when there is no `ToUnicode` entry.
- The content reader keeps the current clip box (a rectangle path ended by `W n`, saved and restored with `q` / `Q`) on every text piece. In the layout all lines of one clip box no taller and no wider than 20 font sizes (not a page, table or row clip) become one cell: one piece spanning the box at its middle height, lines joined top to bottom with a space, except that a fragment of one or two letters or digits right after a letter or digit joins without one («ПВ1» + «П» = «ПВ1П»). Neighbouring boxes never join into one word.
- Header texts are also matched with the spaces removed («Шири на» = «Ширина»).
- The column guess ignores Excel error values (#VALUE!, #DIV/0!, #N/A, #REF!, #NAME?, #NUM!, #NULL!, ###, also with spaces inside) when it measures how numeric a column is. This also applies to .xlsx.

## Consequences
- The Чугуїв PDF now imports the same 67 recognised rows, kinds, sizes and quantities as the xlsx it was saved from (checked row by row).
- A wrapped word that breaks with a fragment of three or more letters keeps a space in a body cell (only headers are matched without spaces); the rule is `TODO(confirm)` on more PDFs.
- PDFs without clipped cells (LibreOffice, Chrome, ADR 0096) are laid out as before.
- The columns this generator prints on extra pages (beyond the page width) come in as rows at the end and are skipped as service rows.
