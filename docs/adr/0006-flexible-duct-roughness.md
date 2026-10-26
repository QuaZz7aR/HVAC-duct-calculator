# 0006. Flexible duct uses steel roughness

- Status: Accepted
- Date: 2026-10-07
- Source: engineer answer Q8 of 2026-10-07 ([log](../engineer-answers.md#answers-of-2026-10-07)); PR #9

## Context
The Excel uses the steel roughness for flexible ducts too.

## Decision
Steel roughness 0.1 mm for flexible ducts is a deliberate simplification (rare element), as in the `flexible-d200` fixture note.

## Consequences
Flexible duct area stays out of v1 (`CLAUDE.md`); only its pressure drop uses this roughness.
