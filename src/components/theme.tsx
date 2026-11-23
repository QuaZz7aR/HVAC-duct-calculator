"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useSyncExternalStore, type ReactNode } from "react";
import { defaultTheme, resolveTheme, themeStorageKey, toTheme, type Theme } from "@/lib/form/theme";

const changeEvent = "theme-change";
const query = "(prefers-color-scheme: dark)";

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

export const ThemeContext = createContext<ThemeState>({ theme: defaultTheme, setTheme: () => {} });

// fallback when storage is blocked: the choice lasts until the page is reloaded
let memoryTheme: Theme = defaultTheme;

function readTheme(): Theme {
  try {
    const stored = localStorage.getItem(themeStorageKey);
    return stored === null ? memoryTheme : toTheme(stored);
  } catch {
    return memoryTheme;
  }
}

function subscribe(onChange: () => void) {
  window.addEventListener(changeEvent, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(changeEvent, onChange);
    window.removeEventListener("storage", onChange);
  };
}

/** Holds the colour theme (ADR 0092), remembered in this browser like the language and the mode; sets <html data-theme>. */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useSyncExternalStore(subscribe, readTheme, () => defaultTheme);
  const setTheme = useCallback((next: Theme) => {
    memoryTheme = next;
    try {
      localStorage.setItem(themeStorageKey, next);
    } catch {
      // storage blocked: memoryTheme still switches the page
    }
    window.dispatchEvent(new Event(changeEvent));
  }, []);
  // the palette in globals.css keys on data-theme; `system` follows the device, also when it changes
  useEffect(() => {
    const media = window.matchMedia(query);
    const apply = () => {
      document.documentElement.dataset.theme = resolveTheme(theme, media.matches);
    };
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [theme]);
  const value = useMemo(() => ({ theme, setTheme }), [theme, setTheme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);
