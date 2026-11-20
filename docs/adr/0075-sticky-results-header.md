# 0075. The results table header stays on screen

Status: Accepted
Date: 2026-11-20
Source: owner, 2026-11-20 (long imported lists: the column titles scroll away)

## Context
With an imported spec the results table is long, and once the header scrolls off the screen the numbers lose their column names.

## Decision
The results table's `<thead>` is `sticky top-0` on the panel background with a line under it. A horizontal scroll box would hold the sticky header inside itself, so the wrapper scrolls sideways only below `lg`; from `lg` the table fits and the wrapper does not clip. The phone view (blocks of label: value, ADR 0058) has no header and is unchanged. The sheet list and insulation list are short and stay as they are.

## Consequences
Between `sm` and `lg` the header does not stick (the table may need its own sideways scroll there).
