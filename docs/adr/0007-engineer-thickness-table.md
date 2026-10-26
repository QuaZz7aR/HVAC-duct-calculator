# 0007. Engineer's thickness table, rect keyed by the larger side

- Status: Superseded by [0025](0025-dbn-thickness-table-by-default.md) as the default; the table stays as the selectable option `engineerThickness`. The larger-side key stands.
- Date: 2026-10-08 (stage 1); thresholds confirmed 2026-10-16 (Ш11)
- Source: engineer answers Q3 of 2026-10-07 and Ш11 of 2026-10-16 ([log](../engineer-answers.md)); PR #9, #16

## Context
The Excel looks the sheet thickness up by size; for rect ducts it uses the equivalent diameter.

## Decision
- **Thickness** (Q3): rect by equivalent diameter was a simplification; the engineer did not work out how to handle such cases. Our larger-side key is a project choice.
- **Thickness** (Ш11): 0.55 mm below 400 mm, 0.7 mm from 400 mm, rect by the larger side. Confirms the table thresholds. A side 2.5-3x the other could be given 0.7 mm, but better warn (done, see [0020](0020-input-warnings.md)).

## Consequences
- The table is `engineerThickness` in `calc/config.ts`, with `bandStart: 'inclusive'` ([0008](0008-versioned-band-tables.md)).
- Since 2026-10-19 the default is the ДБН table ([0025](0025-dbn-thickness-table-by-default.md)), which changes the thickness of most rows against this table.
