# 0088. View toggles in a sticky list header

Status: Accepted
Date: 2026-11-23
Source: Nikita (2026-11-23): move the «Вигляд» block from the side rail into a sticky header above the fittings

## Context
The desktop side rail held the add-fitting groups and, below them, the «Вигляд» block: show / hide all sketches, fold / expand all, one / two columns. The view toggles act on the list, so they belong next to it.

## Decision
From `lg` a bar with only the view toggles (`ViewBar`; the columns button from `xl`, as before), aligned left, stands under the «Деталі» heading and sticks to the top of the screen (`sticky top-4 z-20`, level with the rail top; its own background `--bar` (darker than the page in both themes, so the cards and the button hover, which uses the accent tint, do not blend with it), a 2 px accent border at 60 % and a shadow, padded 0.75 rem, so it stands out from the cards); the desktop rail takes the same `--bar` background. «Видалити всі» moved into the same bar after the toggles; the heading and hint stay in place and scroll away (Nikita, 2026-11-23: buttons only, aligned left; the clear-all button there too). The phone keeps «Видалити всі» beside the heading. The rail keeps the groups, «Нагору», help and language. The bar stays below the rail (`z-30`, ADR 0087), so the add list still opens over it. Cards and sections scroll in with `lg:scroll-mt-24`, so a jump from the results lands under the bar. The phone is unchanged: its view toggles stay in the round buttons at the right edge.

## Consequences
The rail test now checks that the rail no longer has the toggles, and `ViewBar` is checked for them (an existing test changed, at the owner's request).

Update (2026-11-23): the bar is a framed tile 68 px tall, level with the rail's «+ Додати деталь» block (top 16 px); the 16 px strip above it is painted in the page background, so cards scroll under it. Bar and rail fill `--bar` sits one step from the page background (#e1e7ee light, #0c1319 dark).
