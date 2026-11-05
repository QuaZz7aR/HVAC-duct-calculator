"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useSyncExternalStore, type ReactNode } from "react";
import { defaultLang, dictionaries, toLang, type Dictionary, type Lang } from "@/lib/i18n";

const storageKey = "lang";
const changeEvent = "lang-change";

interface I18n {
  lang: Lang;
  dict: Dictionary;
  /** Number in the page locale with a fixed count of decimals. */
  fmt: (n: number, digits?: number) => string;
  setLang: (lang: Lang) => void;
}

const makeFmt = (locale: string) => (n: number, digits = 3) =>
  n.toLocaleString(locale, { minimumFractionDigits: digits, maximumFractionDigits: digits });

// without a provider (component tests) the page is Ukrainian
export const I18nContext = createContext<I18n>({ lang: defaultLang, dict: dictionaries.uk, fmt: makeFmt(dictionaries.uk.locale), setLang: () => {} });

// fallback when storage is blocked: the choice lasts until the page is reloaded
let memoryLang: Lang = defaultLang;

function readLang(): Lang {
  try {
    const stored = localStorage.getItem(storageKey);
    return stored === null ? memoryLang : toLang(stored);
  } catch {
    return memoryLang;
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

/** Holds the chosen language; remembered in this browser (localStorage), Ukrainian until the user picks another. */
export function I18nProvider({ children }: { children: ReactNode }) {
  const lang = useSyncExternalStore(subscribe, readLang, () => defaultLang);
  const setLang = useCallback((next: Lang) => {
    memoryLang = next;
    try {
      localStorage.setItem(storageKey, next);
    } catch {
      // storage blocked: memoryLang still switches the page
    }
    window.dispatchEvent(new Event(changeEvent));
  }, []);
  const value = useMemo(() => {
    const dict = dictionaries[lang];
    return { lang, dict, fmt: makeFmt(dict.locale), setLang };
  }, [lang, setLang]);

  useEffect(() => {
    document.documentElement.lang = lang;
    // the layout's metadata title is Ukrainian and Next may put it back after hydration, so keep the tab title in step
    const title = value.dict.appTitle;
    const sync = () => {
      if (document.title !== title) document.title = title;
    };
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(document.head, { subtree: true, childList: true, characterData: true });
    return () => observer.disconnect();
  }, [lang, value.dict.appTitle]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export const useI18n = () => useContext(I18nContext);
