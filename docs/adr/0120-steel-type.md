# 0120. Steel type per row; the metal list and the price per steel

- Status: Accepted
- Date: 2026-11-27
- Source: the engineer's friend via the owner (2026-11-27): «в продвинутый режим добавить выбор типа стали: оцинкованная сталь, нержавейка...»

## Context
Every part was implicitly galvanized steel. Real projects mix steels (a stainless kitchen exhaust, black steel for smoke extraction), which are bought and priced separately.

## Decision
- Each card has a «Сталь» select (advanced mode only, `adv-only`): Оцинкована (default), Нержавіюча, Чорна, З полімерним покриттям (`steelTypes` in `form/steel.ts`, `FormRow.steel`, absent = galvanized, saved with the project).
- The type is a form-level attribute: the core (`calc/`) and the fixtures are unchanged. `calculate` builds one `sheetList` + `orderList` per steel, in `steelTypes` order, and tags the non-galvanized lines with `steel`; totals are the sum of all lines. `RowResult.steel` carries the row's type.
- Price per m² per steel and thickness: `priceKey(t, steel)` is `"0.5"` for galvanized (so saved prices stay valid) and `"stainless:0.5"` for the others.
- The metal list (page and the Excel export) shows a «Сталь» column only when some line is not galvanized; an all-galvanized project looks exactly as before.
- Thickness: the same table (ДБН В.2.5-67:2013 додаток Ц by default) for every steel. `TODO(confirm)`: whether stainless or black steel (e.g. smoke extraction, thicker walls) needs its own table; no source was found that sets one in the ДБН.

## Consequences
- The sheet count is per steel and thickness, so mixing steels can add a sheet compared with one list.
- Insulation, areas and the specification are unchanged by the steel type.
