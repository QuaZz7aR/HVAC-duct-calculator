# 0014. Results-table headers in the Excel wording

- Status: Accepted (loss columns hidden since 2026-10-19, [0027](0027-pressure-losses-hidden-in-the-ui.md))
- Date: 2026-10-09
- Source: owner decision; PR #12

## Context
"Тертя" / "Місцеві" were unclear next to the Excel.

## Decision
- Headers take the Excel column wording: "Товщина металу, мм", "Площа, м²", "Сума площі, м²", "Падіння тиску на тертя, Па", "Місцеве падіння тиску, Па", "Загальне падіння тиску, Па".
- Two deliberate deviations: the unit is written м² (Excel: м2), and per-piece columns keep the "(шт.)" mark so they are not confused with the totals.
- "Довжина по осі" and "Швидкість" have no Excel equivalent and are unchanged.
- Fitting names and designations are NOT changed (owner decision).

## Consequences
Do not rename fittings unasked.
