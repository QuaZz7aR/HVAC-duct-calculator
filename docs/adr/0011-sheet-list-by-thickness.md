# 0011. Sheet list grouped by thickness

- Status: Accepted (order list added by [0024](0024-order-margin-and-sheet-count.md))
- Date: 2026-10-08
- Source: project decision; PR #6, #7, #11, #13

## Context
The Excel has no grouping and no sheet count (thickness and area per row).

## Decision
- **Sheet list** (`sheetList`) groups `metalArea * quantity` by thickness and returns m2. The grouping is ours.
- `thicknessSize`: for reducers the larger size over both ends (max of diameters, per-side max of width/height; the Excel uses the first-given C/D end, same result when the ends are ordered), rect end for rect-to-round.
- Quantity must be a positive integer. `sheetListItemSchema` / `sheetListSchema` (`validation/`) validate `{ fitting, quantity }` at the boundary: fitting errors keep their codes with the path under `fitting`, a bad quantity is `quantity.invalid` (one code for non-positive, fractional and non-finite values).
- `form/calculate.ts` validates fitting and quantity with `sheetListItemSchema` (the leading `fitting` path segment is stripped so issues map to form fields as before).

## Consequences
- The order list (`calc/sheet-count.ts`, `orderList`) adds the order area and the whole sheets per thickness ([0024](0024-order-margin-and-sheet-count.md)).
- `thicknessSize` is `TODO(confirm)` against handbooks (register in `docs/decisions.md`).
