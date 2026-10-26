# 0005. Reducer length: default 300 mm, floor 150 mm, no silent clamp

- Status: Accepted
- Date: 2026-10-07
- Source: engineer answer Q2 of 2026-10-07 ([log](../engineer-answers.md#answers-of-2026-10-07)); PR #9

## Context
The Excel clamps the reducer length with `0,3`.

## Decision
150 mm is the minimum, 300 mm the optimum, longer is a special case (engineer). The Excel's `0,3` clamp was an example length, not a rule; our default 300 / floor 150 / no silent clamp stands.

## Consequences
- A reducer length below the floor is a validation error, never clamped ([0010](0010-validation-outside-the-core.md)).
- Empty reducer length in the form means the config default ([0012](0012-first-ui.md)).
