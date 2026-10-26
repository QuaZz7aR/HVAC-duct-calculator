# 0008. Lookup tables are versioned bands

- Status: Accepted
- Date: 2026-10-08 (stage 1)
- Source: project decision; PR #5

## Context
Thickness and waste factor come from tables that will change as the engineer answers.

## Decision
**Tables are versioned** (`version` in `ThicknessTable`, `WasteFactorTable`); bump it on any row change. Rows are bands: `fromMm` up to the next row, first row starts at 0. `ThicknessTable.bandStart` says whether a band holds sizes `>= fromMm` (`inclusive`, the engineer's table) or `> fromMm` (`exclusive`, norm tables that list upper limits, the ДБН table).

## Consequences
Sheet thickness is a lookup, not a formula (`CLAUDE.md`, Domain rules).
