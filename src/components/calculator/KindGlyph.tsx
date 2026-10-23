import type { FittingKind } from "@/lib/form/fields";
import { sketchSpecs } from "./sketch-spec";

/** Small pictogram of a kind for the side panel: the shape of the part, the end drawn round or rect. Decorative. */
export function KindGlyph({ kind, className }: { kind: FittingKind; className?: string }) {
  const { shape, roundMain } = sketchSpecs[kind];
  const end = roundMain ? <ellipse cx={6} cy={14} rx={2.2} ry={5} /> : <rect x={4} y={9} width={4} height={10} />;
  const parts: Record<typeof shape, React.ReactNode> = {
    straight: <><path d="M6 9h28M6 19h28" />{end}</>,
    elbow: <path d="M6 9h14a10 10 0 0 1 10 10v7M6 19h6a2 2 0 0 0 2-2" />,
    reducer: <><path d="M6 7l28 4v6L6 21z" />{end}</>,
    cap: <><path d="M6 9h24v10H6M30 6v16" />{end}</>,
    tap: <path d="M6 12h28M6 22h12M24 22h10M18 22V6M24 22V6" />,
    tee: <path d="M6 14h28M6 24h8M20 24h14M14 24V6M20 24V6" />,
    cross: <path d="M4 11h10V3M22 3v8h14M4 19h10v8M22 27v-8h14" />,
  };
  return (
    <svg viewBox="0 0 40 28" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" aria-hidden="true" className={className}>
      {parts[shape]}
    </svg>
  );
}
