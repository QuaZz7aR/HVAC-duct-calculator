# 0071. Sections take the full width again

Status: Accepted
Date: 2026-11-20
Source: owner (Nikita), 2026-11-20: "отменяем соседние группы деталей в две колонки, делаем в одну, как и было"

## Context
ADRs 0064, 0067 and 0069 put two folded sections side by side at half width. After trying it on the preview the owner preferred one section per row.

## Decision
Every section takes the full width, one under another, as before ADR 0064. The rest stays: tiles read down the columns (ADR 0065) in rows of equal height (ADR 0066), the single-fittings frame (ADR 0070), the glide only on a reorder (ADR 0068). The tile grid keeps 4 columns from xl and 6 from 1800 px.

## Consequences
Supersedes 0064, 0067 and 0069.
