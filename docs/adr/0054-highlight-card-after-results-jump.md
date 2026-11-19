# 0054. The card is highlighted after a jump from the results

Status: Accepted
Date: 2026-11-19
Source: owner (Nikita), 2026-11-19

## Context
A click on a results row scrolls to its card (ADR 0050), but in a long list of similar cards it is hard to see which one it landed on.

## Decision
Once the scroll stops (`scrollend`, or after 1 s where the browser has no such event), the card gets an accent outline and a soft accent background for 1.5 s (`highlightMs`), then fades out over 0.6 s. Code: `scrollToCard` in `src/components/calculator/highlightCard.ts`, classes `highlight-card` / `highlight-fade` in `globals.css`. With reduced motion the jump is instant and the outline appears and disappears without the fade.

## Consequences
Only the results jump highlights; adding a row keeps its own short `flash-card`.
