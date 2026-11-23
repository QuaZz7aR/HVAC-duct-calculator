# 0088. View toggles in a sticky list header

Status: Accepted
Date: 2026-11-23
Source: Nikita (2026-11-23): move the «Вигляд» block from the side rail into a sticky header above the fittings

## Context
The desktop side rail held the add-fitting groups and, below them, the «Вигляд» block: show / hide all sketches, fold / expand all, one / two columns. The view toggles act on the list, so they belong next to it.

## Decision
From `lg` a bar with only the view toggles (`ViewBar`; the columns button from `xl`, as before), aligned left, stands under the «Деталі» heading and sticks to the top of the screen (`sticky top-2 z-20`, a panel with an accent border at 40 % and a shadow, padded 0.75 rem, so it stands out). «Видалити всі» moved into the same bar after the toggles; the heading and hint stay in place and scroll away (Nikita, 2026-11-23: buttons only, aligned left; the clear-all button there too). The phone keeps «Видалити всі» beside the heading. The rail keeps the groups, «Нагору», help and language. The bar stays below the rail (`z-30`, ADR 0087), so the add list still opens over it. Cards and sections scroll in with `lg:scroll-mt-24`, so a jump from the results lands under the bar. The phone is unchanged: its view toggles stay in the round buttons at the right edge.

## Consequences
The rail test now checks that the rail no longer has the toggles, and `ViewBar` is checked for them (an existing test changed, at the owner's request).
