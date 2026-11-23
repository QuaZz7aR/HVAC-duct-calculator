# 0087. The add-fitting list stays above the sections

Status: Accepted
Date: 2026-11-23
Source: Nikita, bug report with a screenshot (2026-11-23)

## Context
The desktop side rail opens a group's list («Відводи» -> КВд, ПВд) inside its sticky box. A sticky element is a stacking context, so the list's `z-30` only ranked it inside the box. The box itself had no z-index, and the sections, positioned since ADR 0084 (`.section-end` is `position: relative`), come later in the page and painted over the list.

## Decision
The sticky box of `KindRail` carries `z-30` itself. The list and the rail now paint above every card and section. The other popups were checked: the card «⋯» menu (`z-30` in a card that is not a stacking context), the «i» tips (`fixed z-50`), the language menu and the phone fan and sheet (`fixed`, at the page level) are not affected.

## Consequences
Anything later placed inside the rail ranks with the rail. A future popup inside a sticky or transformed box needs the z-index on that box, not only on the popup.
