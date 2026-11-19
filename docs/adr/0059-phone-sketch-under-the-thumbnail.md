# 0059. Phone: the open sketch sits under the thumbnail

Status: Accepted
Date: 2026-11-19
Source: owner (Nikita), 2026-11-19

## Context
On a phone the card's inputs stack in a tall column, so the sketch opened from the header thumbnail (ADR 0040) appeared far below, at the bottom of the card.

## Decision
Below 640 px the open isometric sketch is shown right under the card header (thumbnail and buttons), above the inputs; from 640 px up it stays below the inputs. One `sketch` element in `FittingCard`, placed in one of two spots by `sm:` classes.

## Consequences
No change in the sketch itself or in the open / closed state.
