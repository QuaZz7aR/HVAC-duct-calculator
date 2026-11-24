import { useId, useRef, useState, type CSSProperties } from "react";
import { useI18n } from "@/components/i18n";
import { useDismiss } from "./useDismiss";
import { subs } from "./subscripts";

const popoverWidth = 288; // px, 18rem; narrower on a phone

/**
 * A small «ⓘ» button with a short explanation that opens on tap or click (no hover, so a phone works the same).
 * The text is fixed-positioned under the button and kept inside the viewport, so a scrolling table does not clip it.
 */
export function Info({ text }: { text: string }) {
  const { dict } = useI18n();
  const [pos, setPos] = useState<CSSProperties | null>(null);
  const ref = useRef<HTMLSpanElement>(null);
  const id = useId();
  const close = () => setPos(null);
  useDismiss(ref, pos !== null, close);

  const toggle = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault(); // inside a <label>: do not focus the input
    e.stopPropagation();
    if (pos) return close();
    const r = e.currentTarget.getBoundingClientRect();
    const width = Math.min(popoverWidth, window.innerWidth - 32);
    const left = Math.max(16, Math.min(r.left + r.width / 2 - width / 2, window.innerWidth - 16 - width));
    setPos({ top: r.bottom + 6, left, width });
    // the text is pinned to the viewport: close it rather than let it drift on scroll
    window.addEventListener("scroll", close, { once: true, passive: true });
  };

  return (
    <span ref={ref} className="inline whitespace-nowrap">
      {"\u2060" /* word joiner: the icon stays on the line of the last word */}
      <button
        type="button"
        className="print-hide ml-1 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full align-[-3px] text-accent hover:bg-accent-soft focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent"
        aria-label={dict.help.info}
        aria-expanded={pos !== null}
        aria-controls={pos ? id : undefined}
        onClick={toggle}
      >
        {/* drawn, not a font glyph: a letter sits off centre by the font's own metrics */}
        <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" className="block">
          <circle cx="8" cy="8" r="7.25" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="8" cy="4.9" r="1" fill="currentColor" />
          <rect x="7.25" y="6.9" width="1.5" height="5" rx="0.75" fill="currentColor" />
        </svg>
      </button>
      {pos && (
        <span
          id={id}
          role="note"
          style={pos}
          onClick={(e) => e.preventDefault()}
          className="fixed z-50 block whitespace-normal rounded-md border border-line bg-panel p-3 text-left text-sm font-normal normal-case leading-snug tracking-normal text-foreground shadow-lg"
        >
          {subs(text)}
        </span>
      )}
    </span>
  );
}
