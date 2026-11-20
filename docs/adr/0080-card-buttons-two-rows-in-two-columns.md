# 0080. Card buttons in two rows in the two-column layout

Status: Accepted
Date: 2026-11-20
Source: owner, 2026-11-20 (screenshot: in two columns the buttons should be fold and move in the top row, clone, change kind and remove in the second)

## Context
In the two-column card layout (ADR 0047, from 1280 px) an open card is half the width, and its six header buttons wrapped wherever the width ran out.

## Decision
When the card is half width (`half`, from `xl`), the header buttons stand in two fixed rows, aligned right: «Згорнути», ↑, ↓ on top; «Клонувати», «⋯», «Видалити» below. In one-column mode and below `xl` they stay one wrapping row as before.

## Consequences
The order of the buttons is unchanged, only the line break is fixed. Folded tiles keep their own two rows (ADR 0077).
