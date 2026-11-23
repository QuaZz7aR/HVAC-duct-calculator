# 0070. A frame around single fittings

Status: Accepted (the dashed frame superseded by 0091)
Date: 2026-11-20
Source: owner (Nikita), 2026-11-20: "как-то выделить детали без групп, чтобы было легче их определить"

## Context
Folded single fittings between sections were hard to tell from the tiles of a section.

## Decision
A stretch of folded single fittings (ADR 0065) sits in a dashed frame without a tint, titled «Окремі деталі × N» / «Single fittings × N» in muted text (`dict.singlesTitle`); sections keep their solid tinted frame. The frame has no handle or buttons: its fittings move one by one.

## Consequences
Open single cards stay outside any frame, as before.
