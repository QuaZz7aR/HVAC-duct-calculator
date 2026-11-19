# 0053. Calculation settings repeated in the results blocks

Status: Accepted
Date: 2026-11-19
Source: owner (Nikita), 2026-11-19

## Context
The seam allowance, order margin, thickness table and sheet size live in «Параметри розрахунку» at the top of the page. The user reads their effect far below, in «Разом» and «Відомість металу за товщиною», and has to scroll back up to change them.

## Decision
The same controls also appear next to the figures they change: seam allowance and order margin at the top of «Разом», thickness table and sheet size at the top of «Відомість металу за товщиною». Both places edit the one `SettingsText` state in `useCalculator`, so a change in either shows in both. The controls are shared components (`SeamField`, `MarginField`, `ThicknessTableField`, `SheetField` in `SettingsPanel.tsx`), so labels, help and options cannot drift apart. «Параметри розрахунку» stays as it is: it is the one place that lists every setting and shows the settings errors.

## Consequences
Settings errors are shown only in «Параметри розрахунку»; a bad value typed in the results blocks keeps the default, as before. No new strings, no core change.
