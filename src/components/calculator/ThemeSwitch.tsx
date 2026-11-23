import { useRef, useState } from "react";
import { useI18n } from "@/components/i18n";
import { useTheme } from "@/components/theme";
import { themes, type Theme } from "@/lib/form/theme";
import { railItemClass } from "./styles";
import { useDismiss } from "./useDismiss";

/** Monitor = follow the system, sun = light, moon = dark. */
function ThemeIcon({ theme, className = "h-4 w-4" }: { theme: Theme; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      {theme === "system" && <><rect x="3" y="4" width="18" height="12" rx="1.5" /><path d="M8 20h8M12 16v4" /></>}
      {theme === "light" && <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>}
      {theme === "dark" && <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" />}
    </svg>
  );
}

/** Phone header: three-button theme switch, like the language one (ADR 0092). */
export function ThemeSwitch() {
  const { dict } = useI18n();
  const { theme, setTheme } = useTheme();
  return (
    <div role="group" aria-label={dict.theme.label} className="flex shrink-0 overflow-hidden rounded-md border border-line text-sm font-medium">
      {themes.map((t) => (
        <button
          key={t}
          type="button"
          aria-pressed={theme === t}
          aria-label={dict.theme[t]}
          title={dict.theme[t]}
          onClick={() => setTheme(t)}
          className={`px-2.5 py-1 focus-visible:outline-2 focus-visible:outline-accent ${theme === t ? "bg-accent text-background" : "bg-panel text-accent hover:bg-accent-soft"}`}
        >
          <ThemeIcon theme={t} />
        </button>
      ))}
    </div>
  );
}

/** Desktop rail: one item showing the current theme; a click opens the three themes beside the rail, like the language item (ADR 0092). */
export function ThemeRailButton() {
  const { dict } = useI18n();
  const { theme, setTheme } = useTheme();
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
        }} aria-expanded={open} aria-haspopup="true" className={railItemClass} title={dict.theme.label}>
        <span aria-hidden="true" className="grid h-6 min-w-8 place-items-center rounded-md border-2 border-accent px-1 text-accent"><ThemeIcon theme={theme} /></span>
        {dict.theme.short}
      </button>
      {open && (
        <div role="group" aria-label={dict.theme.label} style={pos} className="fixed z-30 w-max min-w-48 rounded-lg border border-line bg-panel p-2 shadow-xl shadow-black/30">
          <h3 className="mb-1 px-1.5 text-sm uppercase tracking-wider text-muted">{dict.theme.label}</h3>
          {themes.map((t) => (
            <button
              key={t}
              type="button"
              aria-pressed={theme === t}
              onClick={() => {
                setTheme(t);
                setOpen(false);
              }}
              className={`grid w-full grid-cols-[3rem_1fr] items-center gap-2 rounded-md px-1.5 py-1.5 text-left hover:bg-accent-soft ${theme === t ? "text-foreground" : "text-muted"}`}
            >
              <span className="text-accent"><ThemeIcon theme={t} /></span>
              <span>{dict.theme[t]}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
