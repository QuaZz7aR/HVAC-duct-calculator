# 0024. Order margin, sheet size and sheet count

- Status: Accepted (values `TODO(confirm)`)
- Date: 2026-10-19 (3.1, 3.2)
- Source: engineer answers 3.1 and 3.2 of 2026-10-19 ([log](../engineer-answers.md#answers-of-2026-10-19-informal-the-engineer-is-unsure-on-several)); Ш13 of 2026-10-16; PR #20

## Context
The engineer's «Специфікація» sheet multiplies totals by 1.2 (AJ30, E51 in his file); the owner wanted a sheet count.

## Decision
- **Order margin** (3.1): the 20 % is "probably the margin for ordering metal". It is the parameter `config.order.marginPercent` (default 20, `TODO(confirm)` what the 20 % really is). It never changes the computed area: totals show the computed area and, next to it, the area to order = area x (1 + margin / 100).
- **Sheet size and sheet count** (3.2): the standard sheet is a selectable parameter, 1000 x 2000, 1250 x 2500 (default) and 1500 x 3000 mm (`config.order.sheetSizes`, not from a supplier, `TODO(confirm)`). **Sheets per thickness = ceil(order area / sheet area)**, sheet area = width x height in m2; a float epsilon of 1e-9 sheets stops rounding noise from adding a sheet.

## Consequences
- No nesting or offcut model, so the sheet count is a lower estimate of what a cutting plan needs (deferred).
- `orderList` in `calc/sheet-count.ts` extends the sheet list ([0011](0011-sheet-list-by-thickness.md)).
