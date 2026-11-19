# 0061. Import of a spec table from Excel

Status: Accepted
Date: 2026-11-19
Source: owner (Nikita), 2026-11-19, after the engineer's acquaintances asked to load their ready-made spec tables; samples: three engineer orders and three supplier offers from 2026-11-12, a flat spec from 2021

## Context
Engineers already keep their specs in Excel. Two layouts were seen: the engineer's template (system, number, note, a code column КВ / ПО / КККр, then A, B, a, b, l, R, α, length in metres, quantity; in one real file the header is one cell off its data) and a flat list where the name holds code and sizes («КО 90 Д150», «ППК Д200/400х200»), systems are heading rows, lengths are in mm, with totals rows and parts the site does not compute (утки, адаптери, короби).

## Decision
- «Імпорт з Excel» in the page header opens a dialog. Formats: .xlsx (first sheet, cached values of formulas) and .csv / .tsv. PDF is deferred. The file is read in the browser only and never sent anywhere.
- No dependency: `src/lib/import/xlsx.ts` reads the ZIP directory by hand and inflates entries with the platform `DecompressionStream('deflate-raw')`; the sheet XML is read with regular expressions, so the same code runs in Node tests. Old .xls is not supported (the message says to save as .xlsx).
- Mapping (`mapping.ts` `guessMapping`): the header row is the one among the first 30 that names most columns; columns are matched by header text (uk / ru / en); the size columns move together by one cell when that puts numbers under them; code, system, number and name columns are found by content left of the sizes. The length unit is m when the header says so or every length is at most 30, else mm. The user can change every column, the header row and the unit; the mapping is remembered in `localStorage` per header text (a per-browser convenience like the language, ADR 0039; no list persistence, which stays out of scope). Metres go to mm through `calc/units.ts` `mToMm`.
- Kinds (`recognize.ts`): the code column wins (Excel codes, this site's uk and en designations, Latin look-alike letters); otherwise a code as the first word of the name, otherwise a family word in the first four words («відвід», «тройник», «заглушка», «врезка»...) resolved to round or rect by the sizes in the name (Д150 / Ø150 = round, 400х200 = rect). A name with «утка», «адаптер», «короб», «зонт», «дифузор» and similar is never matched by a word inside it.
- Sizes go to the fields of the kind (A = width or diameter, B = height, a / b = small end or branch, l = allowance, R = radius, α = angle, L = length). A column the kind has no field for is ignored (an elbow's «Довжина» is a computed value in the template; a tap's l is the ring width, its L the stub length). Empty columns are filled from the name (a rect-to-round part is keyed by its rect end in any order). An angle in the name counts only for elbows.
- Every row of the file is shown: recognised, not recognised (highlighted, a kind can be chosen by hand, the sizes are read again for it, default «skip»), or a service row (empty, heading, total). Nothing is dropped silently; the dialog shows the three counts.
- The rows replace the list (default, since the beta page opens with sample rows) or go after it, in file order. «Позиція» = system + number from the file («ПВ1П-7»); without a number column the rows of each system are counted («ПВ1-1»); without both it stays empty (list number). Missing fields take the kind's prefills (a cap without a length the form default rim of 50 mm); a radius from the file is the user's value, else the size-based suggestion. The quantity is taken as it is (also 0, which the card then flags).

## Consequences
- New code in `src/lib/import/` (plain TS, tested with synthetic tables shaped like the samples); `ImportDialog.tsx`; `useCalculator.importRows`; strings in `dict.import`.
- Not done: PDF, several sheets (only the first), a column for insulation or thickness, units other than m / mm, saving the import anywhere.
