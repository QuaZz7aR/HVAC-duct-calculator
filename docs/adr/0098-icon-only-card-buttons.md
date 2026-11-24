# 0098. Icon-only buttons in cards and sections

Status: Accepted
Date: 2026-11-24
Source: owner, 2026-11-24 ("убираем слова из кнопок внутри деталей для экономии места, оставляем только иконки")

## Context
An open card had text buttons «Згорнути», «Клонувати», «Видалити»; on a phone they wrapped into two rows. The section fold button also had text («Згорнути» / «Згорнути групу»), so ADR 0085 put the section buttons in two rows on a phone.

## Decision
Card and section buttons show icons only (`ViewIcons.tsx`): a chevron up / down for fold and unfold, two overlapping sheets for clone, a bin for remove. The folded tile uses the same clone and bin icons instead of ⧉ and ×. Every button keeps its former text as `aria-label` and `title` (dictionary strings, uk / en), so the hover tip and screen readers are unchanged. The section buttons stand in one row on a phone too.

## Consequences
On a 390 px phone the six card buttons fit one row. Supersedes the two rows of ADR 0085. Buttons outside the cards (the view bar, «Нумерація», «Видалити всі») keep their text.
