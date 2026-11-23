# 0091. Single fittings framed like sections, in their own colour

Status: Accepted
Date: 2026-11-23
Source: Nikita (2026-11-23): a single fitting had no frame when open and a plain dashed frame when folded; mark it in either view, framed like a section in another colour

## Context
ADR 0070 put folded single fittings in a dashed «Окремі деталі» frame; open single cards had no frame at all.

## Decision
A stretch of neighbouring single fittings in the same view (all folded or all open) is one «Окремі деталі × N» block, framed like a section (border at 35 %, a faint tint, the gradient bottom edge of ADR 0084) in the colour `--single` instead of the accent. Folded singles keep the tiles down the columns (ADR 0065); open singles fill the card grid. Default colour: teal (#0f9488 light, #2dd4bf dark); amber, violet and slate were offered as alternatives, a change is one CSS variable in `globals.css`. Supersedes the dashed frame of ADR 0070.

## Consequences
Every card stands in a frame: a section or a singles block. A stretch that mixes folded and open singles splits into blocks by view.
