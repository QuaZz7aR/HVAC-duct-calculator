# 0100. PDF import: wrapped cell text joined between row borders

Status: Accepted (joining rule `TODO(confirm)`)
Date: 2026-11-24
Source: Nikita, 2026-11-24: importing `kyiv.pdf` showed rows like «расстоянии 500 мм друг от друга» that the xlsx of the same spec does not have; he asked to join them and to warn when a fitting was joined from several lines.

## Context
In the Kyiv spec (Excel saved as PDF, no clip boxes, so ADR 0099 does not apply) a long adapter name wraps over 3-5 lines inside one table row, centred vertically: lines above and below the line with the number, length and quantity. The reader groups text by baseline, so every wrapped line became a row of its own: 29 unknown rows instead of the xlsx's 19, and two fragments («... 2 Врезки Д150 ...») were even recognised as taps. Gluing a code-less line to the previous row (the first idea) would not work: half the wrapped lines stand above their row, and the first line carries a size («3010х95х220Н»).

## Decision
- The reader also collects horizontal lines (`HRule`: `l` segments and the top / bottom sides of `re`).
- `layoutTable` joins the text lines between two consecutive row borders that cross the line into one table row (`joinWrapped`) when exactly one line of that band is a full line (three or more drawn columns hit, or three cells without vertical borders) and the lines follow each other within two font sizes. Cells join column by column (by the vertical borders; without them by x overlap), top to bottom with a space.
- No horizontal borders, or a band with two or more full lines (a table with only an outer frame) -> nothing is joined.
- A joined row is remembered in `rowLines` (a `WeakMap` row -> number of lines, `import/xlsx.ts`); `ImportRow.joined` and `FormRow.joinedLines` carry it. The preview row and the card show «⚠ склеєно з N рядків» (en: «joined from N lines»); the card's note goes away on the first edit or a kind change, like `noSizes` (ADR 0074).

## Consequences
- Kyiv PDF now gives 61 recognised / 19 unknown rows, the same as its xlsx, and the two false taps are gone. `order.pdf`: two wrapped rect elbows (53, 57) get their system and name back (В4-53, В3-57). `chrome.pdf`, the 68-page spec PDF in uploads and the synthetic Чугуїв PDF of ADR 0099 are unchanged.
- A real fitting with no number or quantity of its own inside another row's borders would be glued to that row; it is then visible by the ⚠ mark. The rule is tuned on these files only: `TODO(confirm)` on more PDFs.
