import { useI18n } from "@/components/i18n";
import { useMode } from "@/components/mode";
import { modes } from "@/lib/form/mode";
import { Info } from "./Info";

/** Two-button switch between the simple and the advanced interface (ADR 0082). */
export function ModeSwitch() {
  const { dict } = useI18n();
  const { mode, setMode } = useMode();
  return (
    <div className="flex shrink-0 items-center">
      <div role="group" aria-label={dict.mode.label} className="flex overflow-hidden rounded-md border border-line text-sm font-medium">
        {modes.map((m) => (
          <button
            key={m}
            type="button"
            aria-pressed={mode === m}
            onClick={() => setMode(m)}
            className={`px-2.5 py-1 focus-visible:outline-2 focus-visible:outline-accent ${mode === m ? "bg-accent text-background" : "bg-panel text-accent hover:bg-accent-soft"}`}
          >
            {dict.mode[m]}
          </button>
        ))}
      </div>
      <Info text={dict.mode.info} />
    </div>
  );
}
