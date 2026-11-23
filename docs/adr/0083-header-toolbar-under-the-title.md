# 0083. Header toolbar under the title

Status: Accepted
Date: 2026-11-23
Source: owner, 2026-11-23 (phone buttons looked scattered; on a 1440p screen the mode, import and «Видалити всі» buttons sat too far right)

## Context
The header put its buttons at the right edge of a page up to 1920 px wide and wrapped them unevenly on a phone; «Видалити всі» stood at the far right of the «Деталі» heading.

## Decision
The header toolbar sits left under the title on every width: the mode switch first, then import (and help and language on narrow screens). On a phone the mode switch takes its own row and the other buttons a second row. «Видалити всі» stands right after the «Деталі» heading text, not at the far edge.

## Consequences
The buttons stay near the content they belong to on wide screens.
