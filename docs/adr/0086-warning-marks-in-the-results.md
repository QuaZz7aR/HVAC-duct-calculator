# 0086. Error and warning marks in the results

Status: Accepted
Date: 2026-11-23
Source: owner, 2026-11-23 ("если позиции не считаются либо с ошибками, значок должен дублироваться в итоговую таблицу")

## Context
A card with an error, a missing size or a warning showed it only on the card; the results row looked like the others or showed only dashes.

## Decision
The results name (table and phone blocks) starts with the same small ⚠ as the card: red when the row is not counted (validation error or no sizes from the import), amber when it is counted but has warnings (input warnings or a size conflict from the import). The mark carries an accessible name («У деталі є помилки» / «У деталі є попередження», `dict.cardHasWarnings` new).

## Consequences
Under the results, the «not counted» note lists each skipped row by position and code («1. КПв»), a click scrolls to its card. A problem row is visible from the results; a click on the name still scrolls to the card with the full message.
