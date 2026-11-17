import { useRef, useState } from "react";
import { useDismiss } from "./useDismiss";
import { useI18n } from "@/components/i18n";
import { langs } from "@/lib/i18n";
import { railItemClass } from "./styles";

/** Two-button language switch (УКР / EN) in the page header. */
export function LangSwitch() {
  const { lang, dict, setLang } = useI18n();
  return (
    <div role="group" aria-label={dict.language.label} className="flex shrink-0 overflow-hidden rounded-md border border-line text-sm font-medium">
      {langs.map((l) => (
        <button
          key={l}
          type="button"
          lang={l}
          aria-pressed={lang === l}
          onClick={() => setLang(l)}
          className={`px-2.5 py-1 focus-visible:outline-2 focus-visible:outline-accent ${lang === l ? "bg-accent text-background" : "bg-panel text-accent hover:bg-accent-soft"}`}
        >
          {dict.language[l]}
        </button>
      ))}
    </div>
  );
}

/** Desktop rail: one item showing the current language; a click opens a list of languages beside the rail (more will come). */
export function LangRailButton() {
  const { lang, dict, setLang } = useI18n();
  const [open, setOpen] = useState(false);
  // the rail scrolls (overflow), so the list is fixed to the viewport beside the button instead of absolute inside the rail
  const [pos, setPos] = useState({ left: 0, bottom: 0 });
  const ref = useRef<HTMLDivElement>(null);
  useDismiss(ref, open, () => setOpen(false));
  return (
    <div ref={ref} className="relative grid">
      <button type="button" onClick={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          setPos({ left: r.right + 12, bottom: window.innerHeight - r.bottom });
          setOpen(!open);
        }} aria-expanded={open} aria-haspopup="true" className={railItemClass} title={dict.language.label}>
        <span aria-hidden="true" className="grid h-6 min-w-8 place-items-center rounded-md border-2 border-accent px-1 text-xs font-bold leading-none text-accent">{dict.language[lang]}</span>
        {dict.language.short}
      </button>
      {open && (
        <div role="group" aria-label={dict.language.label} style={pos} className="fixed z-30 w-max min-w-48 rounded-lg border border-line bg-panel p-2 shadow-xl shadow-black/30">
          <h3 className="mb-1 px-1.5 text-sm uppercase tracking-wider text-muted">{dict.language.label}</h3>
          {langs.map((l) => (
            <button
              key={l}
              type="button"
              lang={l}
              aria-pressed={lang === l}
              onClick={() => {
                setLang(l);
                setOpen(false);
              }}
              className={`grid w-full grid-cols-[3rem_1fr] items-center gap-2 rounded-md px-1.5 py-1.5 text-left hover:bg-accent-soft ${lang === l ? "text-foreground" : "text-muted"}`}
            >
              <span className="font-mono text-sm text-accent">{dict.language[l]}</span>
              <span>{languageNames[l]}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** Each language named in itself, so a reader finds theirs whatever the current language is. */
const languageNames: Record<(typeof langs)[number], string> = { uk: "Українська", en: "English" };
