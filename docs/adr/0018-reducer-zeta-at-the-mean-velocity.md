# 0018. Reducer section: mean velocity, friction by the larger end

- Status: Accepted for velocity and `zeta`; the friction part is superseded by [0023](0023-reducer-friction-by-the-mean-diameter.md)
- Date: 2026-10-16 (Ш6)
- Source: engineer answer Ш6 of 2026-10-16 ([log](../engineer-answers.md#answers-of-2026-10-16-sheet-шаблон)); PR #16

## Context
It was open which velocity `zeta` of a reducer refers to, and which diameter the friction uses.

## Decision
- Velocity is the mean of both ends; `zeta` is at that mean velocity, `dp_local = zeta * Pd` (engineer confirmed).
- Friction was by the larger end's diameter (our choice, taken from the Excel).

## Consequences
On 2026-10-19 the friction changed to the mean of the end hydraulic diameters ([0023](0023-reducer-friction-by-the-mean-diameter.md)).
