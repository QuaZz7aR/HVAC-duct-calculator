import type { FittingKind } from "@/lib/form/fields";
import { sketchSpecs } from "./sketch-spec";

/** Small pictogram of a kind for the side panel: the shape of the part, the end drawn round or rect. Decorative. */
export function KindGlyph({ kind, className }: { kind: FittingKind; className?: string }) {
  const { shape, roundMain } = sketchSpecs[kind];
  // ends of a straight-like part: an ellipse (round) or a plain edge (rect)
  const end = roundMain ? <ellipse cx={6} cy={14} rx={2.2} ry={5} /> : null;
  const parts: Record<typeof shape, React.ReactNode> = {
    straight: <><path d="M6 9h28v10H6z" />{end}</>,
    // bend of a duct: inner and outer wall around the centre of the bend
    elbow: <path d="M4 15H20A3 3 0 0 0 23 12V2H33V12A13 13 0 0 1 20 25H4Z" />,
    reducer: <><path d="M6 5l28 5v8L6 23z" />{roundMain ? <ellipse cx={6} cy={14} rx={2.5} ry={9} /> : null}</>,
    cap: <><path d="M6 9h24v10H6z" /><path d="M30 5v18" strokeWidth={3} />{end}</>,
    // a short collar with its mounting flange: only the stub, no main duct
    tap: <><path d="M14 4h12v16H14z" /><path d="M10 20h20" strokeWidth={3} /></>,
    // main run with one branch
    tee: <path d="M4 16H15V4H25V16H36V26H4Z" />,
    // main run with a branch on each side
    cross: <path d="M15 2H25V10H36V18H25V26H15V18H4V10H15Z" />,
  };
  return (
    <svg viewBox="0 0 40 28" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" aria-hidden="true" className={className}>
      {parts[shape]}
    </svg>
  );
}
