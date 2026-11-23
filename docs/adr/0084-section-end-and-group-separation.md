# 0084. Clearer sections: tint, gaps and a gradient bottom edge

Status: Accepted
Date: 2026-11-23
Source: owner, 2026-11-23 ("более явное разделение групп и окремих деталей ... нижний border группы градиентом от углов до центра")

## Context
Sections (ADR 0071, 0072) and the dashed «Окремі деталі» frames (ADR 0070) looked alike and stood close together, so the end of a section was hard to see.

## Decision
A section gets a faint accent tint and a 4 px bottom edge that is a gradient, transparent at the corners and full accent in the middle (`.section-end` in `globals.css`). Sections and «Окремі деталі» frames get extra vertical space between them. The singles frame stays dashed and untinted.

## Consequences
Pure styling; the list order and grouping are unchanged.
