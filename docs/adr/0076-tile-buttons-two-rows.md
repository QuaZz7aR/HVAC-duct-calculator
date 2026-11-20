# 0076. Folded tile buttons in two rows below xl

Status: Superseded by 0077
Date: 2026-11-20
Source: owner, 2026-11-20 (on a laptop width the four buttons squeezed the name to a word per line)

## Context
A folded tile holds the drag handle, the name with the sizes and four buttons (↑, ↓, clone, delete) in one line. Below the desktop width the buttons took most of the tile.

## Decision
Below `xl` the four buttons stand in a 2 × 2 grid (↑ ↓ / ⧉ ×); from `xl` they stay in one row.

## Consequences
The tile is a little taller below `xl`; the name gets about twice the width.
