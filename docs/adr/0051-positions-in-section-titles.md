# 0051. Positions in section titles

Status: Accepted
Date: 2026-11-19
Source: owner (Nikita): a section of repeated fittings did not show where it stands in the order

## Context
A section of neighbouring rows of one kind (ADR 0049) was titled only with the kind and a count («ППв — ... × 2»), so with the cards folded it was not clear which positions it holds.

## Decision
The section title starts with its positions: consecutive list numbers as a span «1–2.», anything else listed «П1, П2.» or «4, 7.» (`positionSpan` in `form/order.ts`, from `positionLabel` of each row).

## Consequences
The title follows the order and the typed positions live, like the cards.
