# 0023. Reducer friction by the mean diameter

- Status: Accepted; supersedes the friction part of [0018](0018-reducer-zeta-at-the-mean-velocity.md)
- Date: 2026-10-19 (2.2)
- Source: engineer answer 2.2 of 2026-10-19 ([log](../engineer-answers.md#answers-of-2026-10-19-informal-the-engineer-is-unsure-on-several)); PR #20

## Context
Friction of a reducer section used the larger end's diameter, taken from the Excel.

## Decision
**Reducer section pressure drop**: friction by the mean of the two end hydraulic diameters (`2ab/(a+b)` for a rect end), in `assembleSection`. Velocity is the mean of both ends, local loss at that velocity (unchanged from [0018](0018-reducer-zeta-at-the-mean-velocity.md)).

## Consequences
- Short reducers differ little from the old larger-end rule.
- The reducer fixtures changed (Re, lambda, friction loss).
