# 0060. The card's «Згорнути» button is set apart

Status: Accepted
Date: 2026-11-19
Source: owner (Nikita), 2026-11-19

## Context
«Згорнути» stood in one row with ↑ / ↓, «Клонувати», «⋯» and «Видалити» and looked like them, though it is the button used most often.

## Decision
«Згорнути» leaves the group and stands on its own at the end of the card header, with an accent border, a tinted background, bold text and a chevron (`foldButtonClass` in `styles.ts`). On a phone it wraps to its own line under the other buttons.

## Consequences
The folded tile keeps its own expand control; no change in behaviour.
