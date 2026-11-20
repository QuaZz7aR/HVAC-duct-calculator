# 0069. An open section takes the full width

Status: Accepted
Date: 2026-11-20
Source: owner (Nikita), 2026-11-20: a folded section beside an open one wastes space; the open section should take the full width with two columns of cards

## Context
In the «Деталі у дві колонки» mode an open section counted as half width (ADR 0067), so its open cards stood in one narrow column beside a folded section.

## Decision
Only folded sections pair up at half width, in both modes. A section with an open card takes the full width; in the two-column mode its open cards then stand two per row. Refines ADR 0067.

## Consequences
A folded section beside an open one takes the full width too (it has no folded partner).
