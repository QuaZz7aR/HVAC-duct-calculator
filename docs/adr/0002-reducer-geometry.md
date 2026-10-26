# 0002. Reducer geometry: exact rect reducer, approximate rect-to-round

- Status: Accepted
- Date: 2026-10-07 (stage 0)
- Source: project decision

## Context
The Excel's reducer formulas are approximations. Stage 0 had to choose how exact the reducer geometry is.

## Decision
- **`rectReducer`** uses exact per-face geometry; `developedLength` is the area-equivalent length.
- **`rectToRoundReducer`** is a project approximation (slant from width only).

## Consequences
- `rectToRoundReducer` slant ignores height: listed as `TODO(confirm)` in `calc/sheet-area.ts` (register in `docs/decisions.md`).
