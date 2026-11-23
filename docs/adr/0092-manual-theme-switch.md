# 0092. Manual theme switch

Status: Accepted
Date: 2026-11-23
Source: Nikita (2026-11-23): add a button to change the theme by hand

## Context
The palette followed the system only (`@media (prefers-color-scheme: dark)` in `globals.css`, Tailwind `dark:` on the same media query).

## Decision
A theme choice: «Як у системі» (default), «Світла», «Темна» (`form/theme.ts`: `themes`, `toTheme`, `resolveTheme`), remembered in `localStorage` (`theme`) like the language and the mode (`components/theme.tsx`, `ThemeProvider` / `useTheme`). The resolved palette is `<html data-theme="light|dark">`: the dark tokens and the dark section edges key on `:root[data-theme="dark"]`, and `dark:` is a custom variant on the same attribute. A small inline script in `<head>` (`themeScript`) sets the attribute before paint, so a stored theme shows without a flash; with «Як у системі» the provider follows the device when it changes. Desktop: a «Тема» rail item (monitor / sun / moon icon) opening the three choices beside the rail, like the language (`ThemeRailButton`). Phone: a three-icon switch in the header toolbar (`ThemeSwitch`).

## Consequences
No `prefers-color-scheme` media query is left in the CSS; every dark style goes through `data-theme`. New strings `dict.theme`.
