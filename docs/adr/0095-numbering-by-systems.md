# 0095. Numbering by systems

Status: Accepted
Date: 2026-11-24
Source: Nikita (2026-11-24, from the acquaintances' feedback: custom numbering); details chosen by the agent overnight, to be reviewed

## Context
The «Позиція» field (ADR 0049) is free text; the import writes «система-№» (ПВ1-1, ПВ1-2, ADR 0061). Typing positions by hand for a list built in the app is slow.

## Decision
- A «Нумерація» button beside «Видалити всі» (the sticky view bar on desktop, the heading on the phone) opens a panel under it: a system field (prefilled with the first system found in the positions), a choice «лише порожні позиції» (default) / «усі позиції заново», a preview «Зміниться N: П1-1, П1-2, …» and «Пронумерувати». Nothing changes before the button.
- `numberBySystems(rows, system, scope)` in `form/order.ts`: the system of a position is the part before its last «-number» (`systemOf`). «Лише порожні» gives the rows without a position the typed system, numbered after the largest number that system already has. «Усі заново» numbers each system 1, 2, 3 in list order; rows without a system take the typed one; with no typed system they keep their position. The row order never changes.
- Separator «-», as in the import.

## Consequences
Positions are still plain text: the user can edit any one afterwards. No undo beyond editing (TODO(confirm): whether an undo is wanted).
