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

/** Desktop rail: one item showing the current language; a click switches to the next one. */
export function LangRailButton() {
  const { lang, dict, setLang } = useI18n();
  const next = langs[(langs.indexOf(lang) + 1) % langs.length];
  return (
    <button type="button" onClick={() => setLang(next)} className={railItemClass} aria-label={`${dict.language.label}: ${dict.language[next]}`} title={dict.language.label}>
      <span aria-hidden="true" className="grid h-6 min-w-8 place-items-center rounded-md border-2 border-accent px-1 text-xs font-bold leading-none text-accent">{dict.language[lang]}</span>
      {dict.language.short}
    </button>
  );
}
