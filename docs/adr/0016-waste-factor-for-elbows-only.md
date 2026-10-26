# 0016. Cutting coefficients for elbows only

- Status: Accepted; amended by [0022](0022-seam-allowance-for-other-kinds.md) (user-set seam allowance for the other kinds)
- Date: 2026-10-16 (Ш4); elbows-only waste factor since 2026-10-08 (stage 1)
- Source: engineer answers Q1 of 2026-10-07 and Ш4 of 2026-10-16 ([log](../engineer-answers.md)); PR #16

## Context
The Excel multiplies elbow areas by 1.15 / 1.2 / 1.1. The engineer took them from other websites as a safety margin. He says they are a flange allowance for all fittings but is not sure he used them everywhere, and gave no values for other kinds.

## Decision
- **Waste factor** is applied to elbows only, via `metalArea = sheetArea * wasteFactor`. `sheetArea` stays pure geometry.
- **Cutting coefficients 1.15 / 1.2 / 1.1 stay for elbows only** (Ш4, decided 2026-10-16). Neither the СП nor ДБН В.2.5-67:2013 has such a coefficient, so there is no source to take values from, and a general coefficient would count the flange allowance twice (`allowance` already covers it). Other kinds keep `default: 1.0`. Revisit only with values and a source.

## Consequences
- Round elbows are keyed by diameter, rect by equivalent diameter.
- What the coefficients cover stays `TODO(confirm)` (register in `docs/decisions.md`).
- Since 2026-10-19 the user can add a seam allowance to the other kinds ([0022](0022-seam-allowance-for-other-kinds.md)).
