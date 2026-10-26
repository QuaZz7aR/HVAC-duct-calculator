# 0001. The Excel is a reference, not the truth

- Status: Accepted
- Date: 2026-10-07 (stage 0)
- Source: owner decision; PR #9

## Context
The core is checked against a practising engineer's Excel. The spreadsheet was written by him for himself years ago and has formula bugs (see [Excel template bugs](../engineer-answers.md#excel-template-bugs-found-2026-10-16)).

## Decision
The Excel is a reference, not the truth. Fixtures with `basis: 'excel'` follow the spreadsheet author's convention; where the Excel is wrong we compute the correct value and document it.

## Consequences
- Deliberate deviations from the Excel are listed in `docs/decisions.md` ("Known deviations from the Excel") and explained in their own ADRs ([0003](0003-allowance-counted-twice-on-rect-elbows.md), [0004](0004-centerline-from-geometry-not-area.md)).
- Fixtures with `basis: 'excel'` are not independently verified.
