# 0068. Cards glide only on a reorder

Status: Accepted
Date: 2026-11-20
Source: owner (Nikita), 2026-11-20: adding or removing a tile animated every tile of the list

## Context
The FLIP glide (ADR 0049) ran on every change of the row order and compared with places remembered at the last move, possibly long ago. In the column-filled tile grid (ADRs 0065, 0066) one added or removed tile changes the row count, so all tiles moved and glided.

## Decision
Cards glide only when the set of cards is unchanged and only their order changed (a move, a drag preview). Adding, cloning, removing or importing rows does not animate. The remembered places are dropped after each order change.

## Consequences
A clone or a new card appears in place without a glide of its neighbours.
