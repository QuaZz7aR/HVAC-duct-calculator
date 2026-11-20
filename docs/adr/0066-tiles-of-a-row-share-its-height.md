# 0066. Tiles of a row share its height

Status: Accepted
Date: 2026-11-20
Source: owner (Nikita), 2026-11-20: "меньшие плитки подогнать под бОльшие ... для симметрии"

## Context
With CSS columns (ADR 0065) every tile kept its own height, so the rows did not line up.

## Decision
The folded tiles are a grid filled column by column (`grid-flow-col`) with an explicit row count per width: `ceil(n / columns)` passed as CSS variables `--r1`, `--r2`, `--r3`, `--r4`, `--r6` and picked by breakpoint. Every tile stretches to the tallest tile of its row. Order still reads down the columns.

## Consequences
Columns are filled to the row count, so the last column may be shorter or empty (5 tiles in 4 columns: 2 + 2 + 1). ADR 0065 stays, its CSS-columns mechanism is replaced.
