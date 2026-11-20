# 0063. Help in the import dialog

Status: Accepted
Date: 2026-11-20
Source: owner (Nikita), 2026-11-20: "сделать в нем подсказки как на остальном сайте"

## Context
The import dialog (ADR 0061) guesses the header row, the columns and the length unit, which confused the owner at first (a wrong header row came back from the remembered mapping). The rest of the site explains its less obvious inputs with «i» buttons (ADR 0046).

## Decision
The dialog uses the same `Info` button, texts in `dict.import.info` (uk + en): the file (first sheet, .xls, formulas), the header row, the columns, the sizes (on the A column: mm, sizes from the name), the system (positions system-number), the length unit, «Скинути до автопідбору» (what is remembered), the preview (how kinds are recognised, yellow rows, skipped rows) and «Куди додати». The «Довідка» dialog gets a sixth step on the import.

## Consequences
Texts describe the behaviour of `src/lib/import/`; a change there updates them.
