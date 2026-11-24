const base = { viewBox: "0 0 24 16", fill: "none", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true } as const;

/** Eye; crossed out while the sketches are shown (the button hides them). */
export function SketchesIcon({ crossed, className }: { crossed: boolean; className?: string }) {
  return (
    <svg {...base} strokeWidth={1.5} className={className}>
      <path d="M1.5 8S5 2 12 2s10.5 6 10.5 6S19 14 12 14 1.5 8 1.5 8z" />
      <circle cx="12" cy="8" r="2.5" />
      {crossed && <path d="M3 15L21 1" />}
    </svg>
  );
}

/** Chevrons toward each other (fold all) or away from each other (unfold all). */
export function FoldIcon({ folded, className }: { folded: boolean; className?: string }) {
  return (
    <svg {...base} strokeWidth={1.8} className={className}>
      {folded ? <path d="M6 6l6-4 6 4M6 10l6 4 6-4" /> : <path d="M6 2l6 4 6-4M6 14l6-4 6 4" />}
    </svg>
  );
}

export function UpIcon({ className }: { className?: string }) {
  return (
    <svg {...base} strokeWidth={1.8} className={className}>
      <path d="M12 14V3M6 8l6-5 6 5" />
    </svg>
  );
}

/** Two (or one) column bars: the layout the button switches to. */
export function ColumnsIcon({ two, className }: { two: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 32 20" fill="none" stroke="currentColor" strokeWidth="1.6" className={className} aria-hidden="true">
      {two ? (
        <>
          <rect x="4" y="3" width="11" height="14" rx="1.5" />
          <rect x="17" y="3" width="11" height="14" rx="1.5" />
        </>
      ) : (
        <rect x="4" y="3" width="24" height="14" rx="1.5" />
      )}
    </svg>
  );
}

const card = { viewBox: "0 0 16 16", fill: "none", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true } as const;

/** Chevron up (fold) or down (unfold): the card buttons (ADR 0098). */
export function ChevronIcon({ down, className = "h-4 w-4" }: { down?: boolean; className?: string }) {
  return (
    <svg {...card} strokeWidth={2} className={className}>
      <path d={down ? "M4 6l4 4 4-4" : "M4 10l4-4 4 4"} />
    </svg>
  );
}

/** Two overlapping sheets: clone. */
export function CloneIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg {...card} strokeWidth={1.6} className={className}>
      <rect x="5.5" y="5.5" width="8" height="8" rx="1.5" />
      <path d="M10.5 3.5v-.5a1 1 0 0 0-1-1h-6a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h.5" />
    </svg>
  );
}

/** Rubbish bin: remove. */
export function TrashIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg {...card} strokeWidth={1.6} className={className}>
      <path d="M2.5 4.5h11M6 4.5V3a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v1.5M4 4.5l.7 8.6a1 1 0 0 0 1 .9h4.6a1 1 0 0 0 1-.9l.7-8.6M6.7 7v4.5M9.3 7v4.5" />
    </svg>
  );
}
