# 0073. Warn when the name and the size columns disagree

Status: Accepted
Date: 2026-11-20
Source: owner (Nikita), 2026-11-20: sizes written in the name sometimes differ from the table columns; show it as a warning on the fitting

## Context
An imported row may carry its sizes twice: in the name («Повітропровід 550х350») and in the size columns (550, 300). The import took the columns and ignored the name silently. Two of the engineer's order files have 6 such rows each (e.g. 550х350 in the name, height 300 in the column; «l150мм» in the name, length 0,25 m in the column).

## Decision
`sizeConflicts(kind, cells, fromName)` in `import/mapping.ts` lists every field that both a column and the name fill with different values; the column value is still used. The import preview marks such a row «розміри в назві й у колонках різняться (N)» with the details in a tooltip. The form row keeps `FormRow.sizeConflicts`; the card shows one amber warning per field («Ширина: у назві деталі 400, у колонці таблиці 500. Взято значення з колонки, перевірте.»). Editing that field (`setFieldValue`) or changing the kind clears its warning. The warning never changes a value.

## Consequences
Not part of `calculate` or the results: it is a note on the imported data, not a calculation warning.
