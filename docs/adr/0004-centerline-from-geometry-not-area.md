# 0004. Centerline length from geometry, not from area

- Status: Accepted (deviation from the Excel, confirmed 2026-10-16)
- Date: 2026-10-07; confirmed 2026-10-16 (Ш2)
- Source: project decision; engineer answer Ш2 of 2026-10-16 ([log](../engineer-answers.md#answers-of-2026-10-16-sheet-шаблон)); PR #16

## Context
Excel derives the rect elbow length for friction from its area (`J8 = M8 / perimeter`, includes allowance and waste factor).

## Decision
Our `centerlineLength` is pure geometry. It is never derived from area and never affected by allowance or waste factor.

## Consequences
- Friction differs by about +33 % in the Excel's favour of the larger length.
- Confirmed (2026-10-16, Ш2): the engineer did not know then how to get the rect elbow axis length and derived it from the area; a length along the axis is fine once checked against his and handbook formulas. That check is the +33 % above.
