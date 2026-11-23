"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useSyncExternalStore, type ReactNode } from "react";
import { defaultMode, toMode, type Mode } from "@/lib/form/mode";

const storageKey = "mode";
const changeEvent = "mode-change";

interface ModeState {
  mode: Mode;
  setMode: (mode: Mode) => void;
}

export const ModeContext = createContext<ModeState>({ mode: defaultMode, setMode: () => {} });

// fallback when storage is blocked: the choice lasts until the page is reloaded
let memoryMode: Mode = defaultMode;

function readMode(): Mode {
  try {
    const stored = localStorage.getItem(storageKey);
    return stored === null ? memoryMode : toMode(stored);
  } catch {
    return memoryMode;
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

/** Holds the interface mode (ADR 0082), remembered in this browser like the language. */
export function ModeProvider({ children }: { children: ReactNode }) {
  const mode = useSyncExternalStore(subscribe, readMode, () => defaultMode);
  const setMode = useCallback((next: Mode) => {
    memoryMode = next;
    try {
      localStorage.setItem(storageKey, next);
    } catch {
      // storage blocked: memoryMode still switches the page
    }
    window.dispatchEvent(new Event(changeEvent));
  }, []);
  // hidden parts carry the `adv-only` class; the attribute hides them (globals.css)
  useEffect(() => {
    document.documentElement.dataset.mode = mode;
  }, [mode]);
  const value = useMemo(() => ({ mode, setMode }), [mode, setMode]);
  return <ModeContext.Provider value={value}>{children}</ModeContext.Provider>;
}

export const useMode = () => useContext(ModeContext);
