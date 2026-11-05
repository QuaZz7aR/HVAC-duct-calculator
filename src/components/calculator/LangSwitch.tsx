import { useI18n } from "@/components/i18n";
import { langs } from "@/lib/i18n";

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
