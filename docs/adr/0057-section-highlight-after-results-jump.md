# 0057. A section is highlighted after a jump from its results title

Status: Accepted
Date: 2026-11-19
Source: owner (Nikita), 2026-11-19

## Context
A click on a section title in the results table (ADR 0055) scrolled to the section in the list without the highlight a single row gets (ADR 0054).

## Decision
The section frame (its title and all its cards) gets the same 1.5 s outline and tint once the scroll stops (`scrollToSection` in `highlightCard.ts`, sharing the code with `scrollToCard`).

## Consequences
One highlight rule for a row and a section.
