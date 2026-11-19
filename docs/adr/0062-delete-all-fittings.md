# 0062. Delete all fittings

Status: Accepted
Date: 2026-11-19
Source: owner (Nikita), 2026-11-19

## Context
The beta page opens with 19 sample rows, and after an import with «Додати в кінець» the list can be long. Removing rows one by one is slow.

## Decision
«Видалити всі» stands at the right of the «Деталі» heading while the list has rows. A tap shows «Видалити всі деталі (N)?» with «Так, видалити» and «Скасувати» in place (no browser dialog); only the second tap empties the list (`useCalculator.clearRows`). Settings and prices stay.

## Consequences
No undo; the confirmation is the safeguard.
