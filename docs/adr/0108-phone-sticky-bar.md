# 0108. Phone: one sticky bar, the list hint as an «i»

Status: Accepted
Date: 2026-11-25
Source: owner (Nikita), 2026-11-25

## Context
On the phone the hint under «Деталі» took a line, and «Нумерація», «Видалити всі» and the «☰» menu scrolled away with the page.

## Decision
- Below `lg` the mode switch, «Нумерація» (a «№» icon), «Видалити всі» (a trash icon) and «☰» form one bar that sticks to the top (`Calculator.tsx`; `compact` on `NumberSystems` and `ClearAll`, names kept in `aria-label` / `title`). Their panels (numbering, the clear confirmation) open across the bar's width under it.
- The phone hint «Щоб додати деталь…» is an «i» beside the «Деталі» heading; the desktop keeps its line.
- The page subtitle is gone from the page (still the meta description); the desktop «Як користуватися» stands right after the title.

## Consequences
The list heading on the phone has no buttons of its own. The phone help clips recorded before this change still show the old header until re-recorded.
