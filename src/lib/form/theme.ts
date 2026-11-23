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

/** Runs in <head> before paint, so a stored theme shows without a flash of the other one. */
export const themeScript = `try{var t=localStorage.getItem('${themeStorageKey}');var d=t==='dark'||(t!=='light'&&matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.dataset.theme=d?'dark':'light'}catch(e){}`;
