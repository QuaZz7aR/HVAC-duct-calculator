import { useRef, useState } from "react";
import { useI18n } from "@/components/i18n";
import { useMode } from "@/components/mode";
import { modes } from "@/lib/form/mode";
import { Info } from "./Info";
import { railItemClass } from "./styles";
import { useDismiss } from "./useDismiss";

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

/** Desktop rail: one item showing the current mode; a click opens the two modes beside the rail, like the language item (ADR 0089). */
export function ModeRailButton() {
  const { dict } = useI18n();
  const { mode, setMode } = useMode();
  const [open, setOpen] = useState(false);
  // the rail scrolls (overflow), so the list is fixed to the viewport beside the button
  const [pos, setPos] = useState({ left: 0, bottom: 0 });
  const ref = useRef<HTMLDivElement>(null);
  useDismiss(ref, open, () => setOpen(false));
  return (
    <div ref={ref} className="relative grid">
      <button type="button" onClick={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          setPos({ left: r.right + 12, bottom: window.innerHeight - r.bottom });
          setOpen(!open);
        }} aria-expanded={open} aria-haspopup="true" className={railItemClass} title={dict.mode.label}>
        <span aria-hidden="true" className="grid h-5 min-w-7 place-items-center rounded-md border-2 border-accent px-1 text-xs font-bold leading-none text-accent">{dict.mode[mode].slice(0, 1)}</span>
        {dict.mode.short}
      </button>
      {open && (
        <div role="group" aria-label={dict.mode.label} style={pos} className="fixed z-30 w-max min-w-48 max-w-72 rounded-lg border border-line bg-panel p-2 shadow-xl shadow-black/30">
          <h3 className="mb-1 px-1.5 text-sm uppercase tracking-wider text-muted">{dict.mode.label}</h3>
          {modes.map((m) => (
            <button
              key={m}
              type="button"
              aria-pressed={mode === m}
              onClick={() => {
                setMode(m);
                setOpen(false);
              }}
              className={`grid w-full grid-cols-[3rem_1fr] items-center gap-2 rounded-md px-1.5 py-1.5 text-left hover:bg-accent-soft ${mode === m ? "text-foreground" : "text-muted"}`}
            >
              <span className="font-mono text-sm text-accent">{dict.mode[m].slice(0, 1)}</span>
              <span>{dict.mode[m]}</span>
            </button>
          ))}
          <p className="mt-1 border-t border-line px-1.5 pt-2 text-xs leading-snug text-muted">{dict.mode.info}</p>
        </div>
      )}
    </div>
  );
}
