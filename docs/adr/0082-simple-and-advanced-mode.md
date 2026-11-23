# 0082. Simple and advanced interface modes

Status: Accepted
Date: 2026-11-23
Source: engineer's UI advice (reports/ui-engineer-advice-2026-10-22); owner, 2026-11-23 (composition shown with screenshots; "Простий" by default)

## Context
The page shows every setting at once: thickness table, seam allowance, order margin, sheet size, allowances, insulation and prices. A first-time user needs only sizes, quantity and the metal area.

## Decision
- Two modes, «Простий / Розширений» (Simple / Advanced), a two-button switch in the page header with an «i» explanation. Remembered in `localStorage` (`mode`) like the language; a first visit opens the simple mode (`form/mode.ts` `defaultMode`, `toMode`).
- The simple mode hides: the «Параметри розрахунку» block; the card fields allowance, allowance count, insulation and max piece length; the insulation column in the results and the insulation list; prices and costs; the seam / margin fields in «Разом» and the thickness table / sheet size fields in the metal list. It keeps positions, sizes, radius, angle, quantity, metal area and consumption, area to order and sheet count.
- Hidden parts carry the class `adv-only`; `ModeProvider` (`src/components/mode.tsx`) sets `<html data-mode>` and `globals.css` hides `[data-mode="simple"] .adv-only`.
- Hidden values are kept and still count (a chosen insulation, a margin of 25 %); switching never changes a number.

## Consequences
The server renders the simple mode; a stored «advanced» appears after hydration. A new advanced-only control just needs the `adv-only` class.
