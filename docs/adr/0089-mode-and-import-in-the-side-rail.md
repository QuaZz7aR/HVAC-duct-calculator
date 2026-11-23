# 0089. Mode and import in the side rail on desktop

Status: Accepted
Date: 2026-11-23
Source: Nikita (2026-11-23): move the mode switch and «Імпорт з Excel» to the side menu, the mode chosen like the language

## Context
ADR 0083 put a toolbar under the page title: the «Простий / Розширений» switch and «Імпорт з Excel» (help and language were already in the rail on desktop, ADR 0048).

## Decision
From `lg` the toolbar is hidden and both items sit at the bottom of the rail, above «Довідка» and «Мова»: «Імпорт з Excel» as a rail item with a file icon (`ImportButton rail`), and «Режим» as a rail item showing the current mode's first letter (П / Р) that opens a list of the two modes beside the rail with the mode explanation under it (`ModeRailButton`, built like `LangRailButton`). The phone keeps the toolbar under the title (ADR 0083). This refines ADR 0083 for desktop only.

## Consequences
The desktop header is the title and subtitle only. New strings: `dict.mode.short` («Режим» / «Mode»).
