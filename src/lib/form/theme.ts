/** Colour theme (ADR 0092): follow the system, or a fixed light / dark picked by the user. */
export const themes = ['system', 'light', 'dark'] as const;
export type Theme = (typeof themes)[number];

export const defaultTheme: Theme = 'system';

/** A stored value back to a theme; anything unknown is the default. */
export function toTheme(value: string | null | undefined): Theme {
  return themes.find((t) => t === value) ?? defaultTheme;
}

/** The palette a theme shows: the system one for `system`. */
export function resolveTheme(theme: Theme, systemDark: boolean): 'light' | 'dark' {
  return theme === 'system' ? (systemDark ? 'dark' : 'light') : theme;
}

export const themeStorageKey = 'theme';

/** Accent colour (ADR 0118): the blue of the blueprint by default, or a brick red; works in both themes. */
export const accents = ['blue', 'red'] as const;
export type Accent = (typeof accents)[number];

export const defaultAccent: Accent = 'blue';

/** A stored value back to an accent; anything unknown is the default. */
export function toAccent(value: string | null | undefined): Accent {
  return accents.find((a) => a === value) ?? defaultAccent;
}

export const accentStorageKey = 'accent';

/** Runs in <head> before paint, so a stored theme shows without a flash of the other one. */
export const themeScript = `try{var t=localStorage.getItem('${themeStorageKey}');var d=t==='dark'||(t!=='light'&&matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.dataset.theme=d?'dark':'light';if(localStorage.getItem('${accentStorageKey}')==='red')document.documentElement.dataset.accent='red'}catch(e){}`;

/**
 * Runs before paint with the theme script (ADR 0112): the stored mode goes on `<html data-mode>` so advanced-only blocks
 * do not pop in after hydration, and a saved project with rows marks `<html data-project="rows">` so the list stays hidden
 * until React has read it (`data-loaded`); an empty or new project shows its hint at once.
 */
export const preloadScript = `try{var h=document.documentElement;if(localStorage.getItem('mode')==='advanced')h.dataset.mode='advanced';var p=JSON.parse(localStorage.getItem('project')||'null');if(p&&p.rows&&p.rows.length)h.dataset.project='rows'}catch(e){}`;
