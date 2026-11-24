# 0097. Video clips in the help

Status: Accepted
Date: 2026-11-24
Source: Nikita (2026-11-24: «GIF або відео в довідці»; deferred in ADR 0046); format chosen by the agent overnight

## Context
The «Довідка» dialog (ADR 0046) had six text steps. GIFs of a full-width UI are large (MBs each) and blurry; MP4 is a tenth of that.

## Decision
- One short (8-11 s) muted looping MP4 (H.264, 960 × 570, no sound, `faststart`) per step, under each step's text, in `public/help/<step>-<uk|en>.mp4` (12 files, about 1.9 MB in all). Steps: add, sizes, settings, results, price, import (`helpClips` in `HelpDialog.tsx`, in the order of `dict.help.guide.steps`).
- The clips render only while the dialog is open, so the page downloads nothing until «Довідка» is pressed; `preload="metadata"`, `playsInline` for the iPhone. With `prefers-reduced-motion` they do not autoplay and show their controls.
- The dialog is wider on desktop (`max-w-3xl`) so the UI in the clips can be read.
- Recorded from a production build with Playwright (light theme, 1280 × 760, a drawn cursor) by `scripts/record-help.cjs`; the import clip uses a made-up demo PDF, never a real spec. The language follows the interface.

## Consequences
Clips must be re-recorded when the UI changes visibly (with the README screenshots). TODO(confirm): Nikita may prefer fewer clips, a GIF format, or a voice-over video.
