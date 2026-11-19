# 0058. Phone: result tables become blocks

Status: Accepted
Date: 2026-11-19
Source: owner (Nikita), 2026-11-19

## Context
On a 390 px phone the column headers of «Результати по позиціях», «Відомість металу за товщиною» and «Відомість утеплювача» wrap into narrow stacks and the tables scroll sideways.

## Decision
Below the `sm` breakpoint (640 px) each table row is a block with «label: value» lines; from `sm` up the tables stay as they are. Results: one block per row (name, sizes, pieces, quantity, thickness, area per piece and total; consumption only where it differs; insulation only when chosen), a list section keeps its tinted frame, title and sums, and the title jumps to the section. Sheet list: one block per thickness with the price input. Insulation list: one block per material with the price input. Same strings and the same «i» help as the column headers.

## Consequences
Two renderings of each table in the components (phone blocks and the table), both from the same data; no change in `src/lib`.
