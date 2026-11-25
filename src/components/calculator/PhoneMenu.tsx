import { useRef, useState, type ReactNode } from "react";
import { useI18n } from "@/components/i18n";
import { useDismiss } from "./useDismiss";

/** Phone header: one «☰» button opens a panel with the less frequent actions (import, export, language, theme), so the header is the mode switch and this button only (ADR 0106). */
export function PhoneMenu({ children }: { children: ReactNode }) {
  const { dict } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useDismiss(ref, open, () => setOpen(false));
  // language and theme (inner role=group) stretch to the menu width, their options share it evenly
  const label = open ? dict.menu.close : dict.menu.open;
  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} aria-haspopup="true" aria-label={label} title={label} className="grid h-9 w-10 place-items-center rounded-md border border-line bg-panel text-accent hover:bg-accent-soft focus-visible:outline-2 focus-visible:outline-accent">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true" className="h-5 w-5">
          {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
        </svg>
      </button>
      {open && (
        <div role="group" aria-label={dict.menu.open} className="absolute right-0 top-full z-40 mt-2 flex w-max max-w-[calc(100vw-2rem)] flex-col items-stretch gap-2 [&_[role=group]>button]:flex-1 [&_[role=group]>button]:justify-center rounded-lg border border-line bg-panel p-3 shadow-xl shadow-black/30">
          {children}
        </div>
      )}
    </div>
  );
}
