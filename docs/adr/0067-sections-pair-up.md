# 0067. Half-width sections only in pairs

Status: Accepted
Date: 2026-11-20
Source: owner (Nikita), 2026-11-20: "если между группами есть детали без групп то распределение плиток странное"

## Context
With ADR 0064 a section always took half the width; a section followed by single tiles left the other half empty and the layout looked broken.

## Decision
Sections pair up in list order: two neighbouring runs that are both sections (folded, or any in the «Деталі у дві колонки» mode) stand side by side at half width; a section without a section right beside it takes the full width, its tiles in the full tile grid. Refines ADR 0064.

## Consequences
No empty half next to a lone section. Moving a section can change whether its neighbour is half or full width.
