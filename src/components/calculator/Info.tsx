import { useId, useRef, useState, type CSSProperties } from "react";
import { useI18n } from "@/components/i18n";
import { useDismiss } from "./useDismiss";

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
    <span ref={ref} className="inline-block align-baseline">
      <button
        type="button"
        className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full border border-current align-[-2px] text-[10px] font-semibold not-italic leading-none text-accent hover:bg-accent-soft focus-visible:outline-2 focus-visible:outline-accent"
        aria-label={dict.help.info}
        aria-expanded={pos !== null}
        aria-controls={pos ? id : undefined}
        onClick={toggle}
      >
        i
      </button>
      {pos && (
        <span
          id={id}
          role="note"
          style={pos}
          onClick={(e) => e.preventDefault()}
          className="fixed z-50 block whitespace-normal rounded-md border border-line bg-panel p-3 text-left text-sm font-normal normal-case leading-snug tracking-normal text-foreground shadow-lg"
        >
          {text}
        </span>
      )}
    </span>
  );
}
