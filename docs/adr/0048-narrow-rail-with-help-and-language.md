# 0048. Narrow side rail with help and language

Status: Accepted
Date: 2026-11-17
Source: owner (Nikita), picked variant «В з підписами» from three mockups

## Context
On wide screens the 15rem side panel (kind groups in two columns, view buttons with long labels) took room from the cards, and «Довідка» with УКР / EN sat far in the top-right corner.

## Decision
Desktop (lg+): the rail is one 7.5rem column, each item an icon over a short label. One continuous panel of full screen height, sections split by lines: «Додати деталь» with the seven kind groups, «Вигляд» (schemes, fold, two columns), «Нагору», and at the bottom «Довідка» and УКР / EN. The page header no longer shows help and language on desktop. Phone: help and language stay in the header, now on a row below the title and subtitle (this also removed a 10 px sideways scroll at 390 px), the round buttons stay at the right edge. `HelpButton` is rendered twice (header, rail), so its dialog title id comes from `useId`. Refines ADR 0031 (the rail's layout only; how fittings are added is unchanged).

## Consequences
About 7.5rem more width for the cards. README screenshots no longer match the desktop UI.
