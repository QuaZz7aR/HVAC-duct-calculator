# 0064. Sections in two columns on desktop

Status: Accepted
Date: 2026-11-20
Source: owner (Nikita), 2026-11-20: "на десктопе сделаем так, что группы одинаковых деталей будут идти в две колонки"

## Context
A section of a repeated kind (ADR 0049) took the full width, so a list of many short sections was long and half empty.

## Decision
From xl (1280 px) the card grid has an even number of columns (4, from 1800 px 6) and a section spans half of it, its tiles in a grid of half as many columns (2, from 1800 px 3); two sections stand side by side, single tiles fill the remaining columns in list order. A section with an open full card keeps the full width (in the «Деталі у дві колонки» mode open cards are half width anyway, so the section is always half). Below xl nothing changes.

## Consequences
Single tiles at 1800 px and wider are 6 per row instead of 5. A tile in a row with a section stretches to the section's height.
