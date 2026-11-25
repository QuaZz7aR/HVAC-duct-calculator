# 0109. Card buttons in two rows when the card is narrow

Status: Accepted
Date: 2026-11-25
Source: owner (Nikita), 2026-11-25

## Context
In one row the six card buttons (fold, ↑, ↓, clone, «⋯», remove) squeezed the fitting name into three lines on medium widths. ADR 0080 put them in two rows only in the two-column layout from `xl`.

## Decision
The card is a container (`@container`). From `sm`, the buttons stand in two rows (fold and move on top, clone, kind and remove below) unless the card is at least 56rem wide (`@4xl`), then one row beside the name. The phone keeps one wrapping row under the title. All six are one size (36 px high, 40 / 44 px wide).

## Consequences
The two-row layout follows the card width, not the viewport or the column mode, so it also covers narrow single-column cards (tablets, small laptops). Extends ADR 0080.
