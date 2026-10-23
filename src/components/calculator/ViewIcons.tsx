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
