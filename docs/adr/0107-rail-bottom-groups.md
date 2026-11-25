# 0107. Rail bottom in three groups, mode highlighted

Status: Accepted
Date: 2026-11-25
Source: owner (Nikita), 2026-11-25

## Context
The bottom of the desktop rail listed import, export, mode, theme and language in one block; the mode, which changes what the page shows, read like the other items.

## Decision
Three groups divided by lines: the mode on its own, tinted (`bg-accent-soft`, a border, its letter filled with the accent); import / export; theme / language. The help dialog and the import list also keep the scroll inside at their end (`overscroll-contain`), so the page under them does not move.

## Consequences
Only `KindPalette.tsx` and `ModeRailButton` change; the phone is unchanged.
