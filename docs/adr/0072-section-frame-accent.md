# 0072. Section frame in a soft accent colour

Status: Accepted
Date: 2026-11-20
Source: owner (Nikita), 2026-11-20: "обводку группы деталей сделать чуть более заметным цветом, но не выбивающимся из дизайна"

## Context
The section frame used the neutral line colour and was hard to see, in the dark theme especially.

## Decision
The section frame takes the accent colour at 35 % opacity (`border-accent/35`), the same blue as the buttons, so it stands out in both themes without a new colour. The single-fittings frame (ADR 0070) stays dashed and neutral.

## Consequences
None beyond the look.
