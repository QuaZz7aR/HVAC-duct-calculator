# 0078. Sticky results header between sm and lg

Status: Accepted
Date: 2026-11-20
Source: owner, 2026-11-20 (no fixed header at 640–1024 px)

## Context
ADR 0075 left the header unfixed between `sm` and `lg`, where the table scrolls sideways in its own box.

## Decision
Between `sm` and `lg` the table box is capped at 80 % of the screen height and scrolls both ways; the header sticks to the top of that box. From `lg` nothing changes (header sticks to the screen).

## Consequences
At those widths a long table scrolls inside its box; the page scroll continues once the box reaches its end.
