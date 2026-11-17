# 0046. In-app help: «i» explanations and a short how-to

- Status: Accepted
- Date: 2026-11-17
- Source: feedback from the engineer's acquaintances (2026-11-12: guides and help text); plan approved by the owner, 2026-11-17

## Context
New users did not know what several inputs and columns mean (allowance count, seam allowance, order margin, max piece length, actual area vs metal consumption) or where to start.

## Decision
- An «i» button (`Info.tsx`) after the label of the less obvious inputs (settings, allowance, allowance count, elbow radius, length, max piece length, quantity, insulation) and after the headers of the result, metal list and insulation list columns. It opens on tap or click, never on hover, so a phone behaves like a desktop; a second tap, a tap outside, Escape or a scroll close it. The text is fixed-positioned and clamped to the viewport, so a horizontally scrolling table does not clip it.
- A «Довідка» / «Help» button in the header opens a native modal `<dialog>` (`HelpDialog.tsx`) with five steps: add fittings, enter sizes, check settings, read results, set prices. Full screen on a phone.
- All texts are in `dict.help` in both dictionaries (`fields` by field key, `settings`, `columns`, `guide`). No change to calculations, fitting names or existing labels.
- GIFs or video are deferred.

## Consequences
- A new input or column that needs explaining adds a `dict.help` entry in both languages; a test checks the two dictionaries have the same keys and that field explanations name existing fields.
- Help texts that quote numbers (300 mm, R = d₁, R = 0.5 a₁) must change with `config` if those defaults change.
