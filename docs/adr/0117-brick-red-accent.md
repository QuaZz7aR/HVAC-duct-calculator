# 0117. Brick-red accent

Status: Accepted
Date: 2026-11-26
Source: owner (a friend asked for a red theme; brick picked of three shades: burgundy, brick, crimson)

## Context
The interface has one blue accent (ADR 0093) in both themes. A visitor asked for a red look. Red is also the colour of errors, ⚠ marks and «Видалити всі», so a red accent must not hide them.

## Decision
- A separate «Акцент» choice beside the theme: blue (default) or brick red. On desktop it is a row of colour swatches at the bottom of the rail's theme list, on the phone a swatch row in the «☰» menu under the theme switch.
- Stored in `localStorage` key `accent` (`toAccent`, `accents` in `form/theme.ts`, state in `ThemeProvider`), set on `<html data-accent="red">` before paint by `themeScript`, so there is no blue flash.
- Brick red: light `#b03a1e` (soft `#f6e3dc`), dark `#f08a6a` (soft `#3d2018`). The sketch dimension lines (Tailwind blue) follow the accent.
- With the red accent the error reds (Tailwind `red-300` … `red-900`) turn orange, so errors and the remove buttons stay distinct from the accent. The blue accent keeps the red errors.

## Consequences
More accents are one more entry in `accents`, a swatch class and a CSS block. Print uses the chosen accent too.
