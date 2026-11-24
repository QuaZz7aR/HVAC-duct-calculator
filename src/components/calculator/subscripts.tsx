import { Fragment, type ReactNode } from "react";

const digits = "₀₁₂₃₄₅₆₇₈₉";
const run = /[₀-₉]+/g;

/**
 * Text with the size indices (d₁, a₂) as <sub> digits: Inter and JetBrains Mono have no glyphs for U+2080-2089
 * in the Google Fonts subsets, so the browser took them from a serif fallback (ADR 0094). The dictionary keeps the
 * Unicode letters (plain strings for titles, aria labels and the SVG sketch); only the HTML rendering splits them.
 */
export function subs(text: string): ReactNode {
  if (!run.test(text)) return text;
  run.lastIndex = 0;
  const out: ReactNode[] = [];
  let last = 0;
  for (const m of text.matchAll(run)) {
    if (m.index > last) out.push(text.slice(last, m.index));
    out.push(<sub key={m.index}>{[...m[0]].map((c) => digits.indexOf(c)).join("")}</sub>);
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return <Fragment>{out}</Fragment>;
}
