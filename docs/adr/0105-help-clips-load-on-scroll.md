# 0105. Help clips load when scrolled near

Status: Accepted
Date: 2026-11-25
Source: owner (Nikita), 2026-11-25: on the phone the «Довідка» videos take a long time to load.

## Context
The dialog rendered all six clips with `preload="metadata"` and `autoPlay`, so opening it started six downloads at once (about 1.3 MB per language), which is slow on a phone connection.

## Decision
`HelpClip` sets its `src` only when the clip comes within 200 px of the view (`IntersectionObserver`); before that it has no source and `preload="none"`. Opening the dialog loads the first one or two clips, the rest follow as the user scrolls.

## Consequences
The first clip starts sooner. The clips still show the desktop layout; phone recordings are a separate decision.
