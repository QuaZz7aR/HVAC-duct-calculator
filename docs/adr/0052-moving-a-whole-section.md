# 0052. Moving a whole section

Status: Accepted
Date: 2026-11-19
Source: owner (Nikita): a section of repeated fittings could not be dragged

## Context
Manual order (ADR 0049) moved one card at a time. A section (neighbouring rows of one kind) had no handle, so moving it meant moving each card.

## Decision
A section header has its own «⠿» handle (mouse drag on desktop, finger on the phone, the same live preview and glide as a card) and ↑ / ↓ buttons. The section moves as a block, keeping its inner order: ↑ puts it before the previous run (a card or a section), ↓ after the next run; a drag puts it at the card under the pointer (`moveBlock` in `form/order.ts`; one id behaves as `moveOnto`). The drag state holds a list of ids, so a card is a block of one.

## Consequences
A section moved next to a run of the same kind merges with it, as any neighbouring rows of one kind do (ADR 0049).
