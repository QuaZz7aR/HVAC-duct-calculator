# 0049. Manual row order and position labels

Status: Accepted
Date: 2026-11-19
Source: owner (Nikita), feedback from the engineer's acquaintances: move rows in any order, own numbering such as П1, П2, В1

## Context
The list kept rows in the order they were added (a new row goes after the last row of its kind) and grouped every repeated kind into one section, wherever its rows stood. Rows were numbered 1, 2, 3 by their place in the list. Engineers number positions by system (П for supply, В for exhaust) and want the specification in their own order. The coming Excel import will bring position numbers from the file.

## Decision
- The rows array is the order. The card list, the results table and the numbers follow it. Order helpers are plain TS in `form/order.ts`: `moveTo`, `moveBy` (one step), `moveOnto` (drag and drop: the dragged row takes the target's place).
- Desktop: a «⠿» handle at the left of each card (and folded tile) starts an HTML5 drag; the whole card is the drop target. Only the handle drags, so text in the inputs can still be selected. Every card and tile also has ↑ / ↓ buttons, the only way on the phone (no long-press drag: it fights scrolling on iOS).
- Sections of a repeated kind now group only neighbouring rows of that kind (`groupRuns` in `FittingList`). Manual order wins: a row moved away from its kind leaves the section, one moved next to it joins. New rows still go after the last row of their kind (`insertIndex`), so the start state looks as before.
- `FormRow.position` (optional text): the first field of every card, «Позиція». Empty = the list number, shown as the placeholder; typed text (П1, В2) replaces the number on the card, the folded tile and the results (`positionLabel`). Free text, not validated, duplicates allowed. A clone starts with an empty position. Positions are form-only: the core and its tests do not see them.
- No «number by systems» helper yet: typing is enough to start; a prefix button can come with the import.

## Consequences
The sheet list and insulation list are sums, so the order does not change them. Order and positions are not saved across reloads (no persistence in v1). The import will fill `position` from the file.
