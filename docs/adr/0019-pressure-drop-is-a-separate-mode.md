# 0019. Pressure drop is a separate mode, not part of the main output

- Status: Accepted
- Date: 2026-10-16 (Ш12)
- Source: engineer answer Ш12 of 2026-10-16 ([log](../engineer-answers.md#answers-of-2026-10-16-sheet-шаблон)); PR #16

## Context
The first UI showed areas and losses in one table.

## Decision
The engineer's order: 1) metal area for all fittings, 2) insulation, 3) price per fitting (the user enters their own prices), 4) aerodynamics apart, maybe its own tab where the user enters the flow.

## Consequences
The single table with losses was removed from the UI on 2026-10-19 ([0027](0027-pressure-losses-hidden-in-the-ui.md)); splitting it into modes comes after insulation and price.
