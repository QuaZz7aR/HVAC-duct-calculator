# 0104. Compact side rail, «Нагору» as a floating button

Status: Accepted
Date: 2026-11-25
Source: owner (Nikita), 2026-11-25: the rail is almost full and «Нагору» does not belong there.

## Context
The desktop rail holds the seven kind groups, «Нагору», and at the bottom import, export, mode, theme, help and language. At 900 px of height the last items were cut off and the rail scrolled.

## Decision
- «Нагору» leaves the rail. On desktop it is a round button at the bottom right of the screen, shown after 300 px of scroll (`ToTopButton` in `KindPalette.tsx`), like the phone's button in `PhoneActions`.
- Rail items are tighter: smaller gaps and padding (`railItemClass`, `railBox`), icons 20 px instead of 24 px, group glyphs slightly smaller.
- The import item says «Імпорт» / «Import» (`dict.import.short`); the full «Імпорт з Excel / PDF» stays in its `title` and in the phone header.

## Consequences
The whole rail fits a 1440 x 900 screen with room to spare. The phone layout is unchanged.
