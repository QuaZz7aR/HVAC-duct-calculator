# 0085. Section buttons in two rows on a phone

Status: Accepted
Date: 2026-11-23
Source: owner, 2026-11-23 ("для разделов на мобилке ... кнопки в две строки, чтобы было больше места для названия раздела")

## Context
On a phone the section title shared its row with ↑, ↓ and «Згорнути розділ» and wrapped into a narrow column.

## Decision
Below `sm` a section header keeps its buttons in a column at the right, as the folded tiles do (ADR 0077): ↑ / ↓ on top, the fold button below with the short word «Згорнути» / «Розгорнути» (the full «… розділ» stays as its accessible name and on wider screens). From `sm` up the buttons stand in one row as before.

## Consequences
The section title gets most of the phone width.
