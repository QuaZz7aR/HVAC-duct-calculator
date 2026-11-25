# 0106. Minimal phone header, help in plain sight

Status: Accepted
Date: 2026-11-25
Source: owner (Nikita), 2026-11-25: too many buttons and switches on the phone; the help should be where a new user sees it at once; an engineer asked for help as a round button in the right column, set apart from the list buttons; a help clip on that column.

## Context
The phone header held the mode switch, import, two export buttons, help, language and a three-icon theme switch: six rows of controls above the list. On desktop the help was one more item at the bottom of the rail.

## Decision
- Phone header: the mode switch and one «☰» menu button (`PhoneMenu`). The menu holds import, «Завантажити Excel», «Друк / PDF», language and theme.
- Phone right column: «?» (help, `HelpButton variant="round"`, accent ring) on top, «to top» under it after a scroll, then a 16 px gap, then the sketches toggle, fold all and «+».
- Desktop: a filled «Як користуватися» button at the right of the page title (`HelpButton variant="prominent"`); the help item left the rail.
- The guide on the phone gets one more step, second in the list, on the right-hand buttons (`dict.help.guide.phoneStep`) with its own clip `buttons-<lang>-phone.mp4`. All clips were re-recorded for the new header.
- The outro no longer says the data is lost on reload (the project is saved in the browser, ADR 0101).

## Consequences
The phone shows two controls above the list instead of about ten. Import and export on the phone are one tap further away.
