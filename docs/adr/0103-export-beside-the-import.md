# 0103. Export buttons beside the import

Status: Accepted
Date: 2026-11-24
Source: Nikita, 2026-11-24, on the #72 preview: "в превью нет экспорта". With an imported list the bar under the fittings (ADR 0102) is far down the page and was not found.

## Decision
- Desktop: an «Експорт» item in the bottom group of the rail, right after the import; it opens a list beside the rail (like «Режим», ADR 0089) with «Завантажити Excel» and «Друк / PDF» and their explanations. One item, so the rail does not grow by two.
- Phone: both buttons in the header toolbar after the import.
- The bar above the results table stays.

## Consequences
- `ExportBar` takes `variant` `bar` / `rail` / `toolbar`; `KindRail` takes `exportItems`.
