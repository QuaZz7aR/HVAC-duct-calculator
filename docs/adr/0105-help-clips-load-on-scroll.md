# 0105. Help clips load when scrolled near, phone clips on the phone

Status: Accepted
Date: 2026-11-25
Source: owner (Nikita), 2026-11-25: on the phone the «Довідка» videos take a long time to load.

## Context
The dialog rendered all six clips with `preload="metadata"` and `autoPlay`, so opening it started six downloads at once (about 1.3 MB per language), which is slow on a phone connection.

## Decision
`HelpClip` sets its `src` only when the clip comes within 200 px of the view (`IntersectionObserver`); before that it has no source and `preload="none"`. Opening the dialog loads the first one or two clips, the rest follow as the user scrolls.

Below `lg` (the phone layout) the dialog shows phone recordings `public/help/<step>-<lang>-phone.mp4` (390 x 760, the «+» button and its fan, the header mode switch, the results as blocks), capped at 70svh and centred (owner chose them on 2026-11-25). They are recorded by `scripts/record-help.cjs <lang> <step|all> phone`; the import clip uses a made-up demo PDF.

## Consequences
The first clip starts sooner and the phone shows its own interface. Twelve more clips (about 1.8 MB) to re-record when the phone UI changes.
