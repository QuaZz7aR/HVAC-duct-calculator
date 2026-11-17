# 0047. Wider desktop layout

Status: Accepted
Date: 2026-11-17
Source: owner (Nikita), screenshot of a ~2500 px wide screen with large empty margins

## Context
The page (side panel + main column) was capped at `max-w-7xl` (1280 px) and centred, so wide monitors showed most of the screen empty.

## Decision
The page cap is `max-w-[120rem]` (1920 px) with `xl:px-8`. Folded card tiles get 4 columns from `2xl` (1536 px) and 5 from 1800 px. Below 1280 px nothing changes (phone layout untouched).

## Consequences
Cards, fields, settings and result tables stretch on wide screens. README screenshots (1440 px) are only slightly wider.
