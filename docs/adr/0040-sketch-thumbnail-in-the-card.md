# 0040. Sketch thumbnail in the card

- Status: Accepted
- Date: 2026-11-07
- Source: engineer via owner, 2026-11-06 ("изометрию по миниатюрной версии, по клику показывается большая"); owner, 2026-11-07 ("развернуть все оставляем, раскрывается прямо в карточке")

## Context
Each card opened its isometric sketch (ADR 0033) with a text button «Показати схему» under the fields (ADR 0029, 0032). The engineer suggested showing a small preview instead, so the kind is recognisable at a glance, with the full sketch one click away.

## Decision
- The card header starts with a thumbnail of the isometric sketch (`FittingSketch` with `thumb`: same drawing, letters hidden, fills an 80 x 56 px box, 96 x 64 px from `sm`). The text button is gone.
- A click on the thumbnail opens the full sketch inside the card, below the fields, as before; a second click, or a click on the large sketch, closes it. The thumbnail keeps the accent border while the sketch is open.
- The side panel's «Показати / Сховати всі схеми» still opens and closes all large sketches. Folded tiles show no thumbnail.

## Consequences
This replaces the per-card button of ADR 0029 / 0032 only; the beta start state (sketches open, ADR 0030) is unchanged. `dict.sketch.show` / `hide` are now the thumbnail's label and tooltip.
