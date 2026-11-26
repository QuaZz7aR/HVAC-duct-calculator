# 0115. Import fixes from the full recheck: unreadable quantity, slot adapters, flexible duct

- Status: Accepted
- Date: 2026-11-26
- Source: owner (2026-11-26: «делаем правки и подготавливаем вопросы инженеру»), after the read-only recheck `reports/full-recheck-2026-11-26.md` (project files) of every spec he uploaded

## Context
The recheck read every file through the site's own import. Three import gaps changed the result:
1. A printed PDF with a narrow quantity column shows «###» (the Excel overflow mark). The quantity was then read as missing and silently set to 1: the Чугуїв КП print lost 67 % of its area without a warning.
2. Slot adapters in the engineer's Kyiv spec («Адаптер под щелевой диффузор 3010х95х220Н, 6 перемычек ...», 6 rows, 10 % of the file) were not recognised: the word «диффузор» put them among the parts that are not ours, and three sizes in one name were not read.
3. «ГВ / Гнучкий повітропровід» (flexible duct, out of scope for v1) was read as a round straight through the word «повітропровід».

## Decision
1. A quantity cell holding an Excel error («###», «#VALUE!») is kept empty, never 1, and the row carries `quantityUnreadable` (a «⚠ кількість не читається» note in the preview); the card then asks for the quantity like any empty field.
2. An adapter or box word among the first words wins over «дифузор / диффузор» (a diffuser or a grille alone stays unrecognised). Three sizes in a name («A×B×C») are a box: the longest is its length, the other two its cross-section in their order. «N перемычек / перемичок / перегородок» in the name fills the box's partitions. The imported slot adapters now give the same areas as the hand check in `reports/box-offset-check-2026-11-26.md` (e.g. 3010×95×220, 6 partitions: 2.063 m²); they stay above the engineer's figures until the open-face question is answered.
3. A name with «гнучк / гибк / flex» or the code ГВ / ГНВ is never recognised; the row is shown as not recognised.

## Consequences
- The Kyiv spec is recognised to 98 % of its area (rows short of the 150 mm reducer floor and the box with its quantity and area swapped in the file still fail on purpose).
- The test `pdf-wrapped.test.ts` used a slot adapter as an example of an unrecognised row; its expectation changes with this decision and is applied by the owner as a patch.
