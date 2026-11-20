# 0065. Folded tiles read down the columns

Status: Accepted
Date: 2026-11-20
Source: owner (Nikita), 2026-11-20: "порядок деталей - не горизонтально а вертикально, так проще читать"

## Context
Folded tiles filled the grid row by row (1 2 3 4 / 5 6 7 8), the owner reads a list top to bottom.

## Decision
Folded tiles run down the columns (CSS columns, `break-inside-avoid`): a stretch of single folded tiles between sections is one full-width block, and a folded section lays its own tiles the same way (column counts as in ADR 0064). Open cards and sections with an open card keep the grid. The order of rows, positions and results is unchanged.

## Consequences
Columns are balanced by height, so a column may hold one tile more than the next. A stretch of single tiles no longer fills the free half next to a lone section.
