# 0056. A clone opens in its original's view

Status: Accepted
Date: 2026-11-19
Source: owner (Nikita), 2026-11-19

## Context
A cloned card always opened as a full card, even when its original (and the whole list) was folded to tiles.

## Decision
The copy takes the original's view: folded tile or full card, sketch open or closed (`FittingList`, `onClone` returns the new id). View state only; not saved across reloads, as before.

## Consequences
Folding all cards and cloning keeps the list compact.
