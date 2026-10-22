import type { FittingKind } from "@/lib/form/fields";
import { uk as dict } from "@/lib/i18n/uk";
import { kindTitle } from "./format";
import { sketchSpecs } from "./sketch-spec";

const body = "fill-zinc-100 stroke-zinc-500 dark:fill-zinc-800 dark:stroke-zinc-400";
const dim = "stroke-blue-600 dark:stroke-blue-400";
const txt = "fill-blue-700 dark:fill-blue-300";

/** Dimension line with end ticks. */
function Dim({ x1, y1, x2, y2 }: { x1: number; y1: number; x2: number; y2: number }) {
  const t = 3;
  const vertical = x1 === x2;
  return (
    <g className={dim} strokeWidth={1}>
      <line x1={x1} y1={y1} x2={x2} y2={y2} />
      {vertical ? (
        <>
          <line x1={x1 - t} y1={y1} x2={x1 + t} y2={y1} />
          <line x1={x2 - t} y1={y2} x2={x2 + t} y2={y2} />
        </>
      ) : (
        <>
          <line x1={x1} y1={y1 - t} x2={x1} y2={y1 + t} />
          <line x1={x2} y1={y2 - t} x2={x2} y2={y2 + t} />
        </>
      )}
    </g>
  );
}

function Label({ x, y, children, anchor = "middle" }: { x: number; y: number; children: string; anchor?: "start" | "middle" | "end" }) {
  return (
    <text x={x} y={y} textAnchor={anchor} fontSize={11} className={txt}>
      {children}
    </text>
  );
}

/** Schematic of a fitting with the letters of its input fields (Д, Ш × В, L, R, α, l). Not to scale. */
export function FittingSketch({ kind }: { kind: FittingKind }) {
  const { shape, roundMain, roundSmall } = sketchSpecs[kind];
  const main = roundMain ? dict.sketch.diameter : dict.sketch.rect;
  const small = roundSmall ? dict.sketch.smallDiameter : dict.sketch.smallRect;

  return (
    <svg viewBox="0 0 160 100" role="img" aria-label={kindTitle(kind)} className="h-24 w-40 shrink-0">
      <title>{kindTitle(kind)}</title>
      {(shape === "straight" || shape === "cap") && (
        <>
          <rect x={25} y={25} width={110} height={30} className={body} />
          {shape === "cap" && <line x1={135} y1={25} x2={135} y2={55} className="stroke-zinc-700 dark:stroke-zinc-200" strokeWidth={4} />}
          <Label x={80} y={44}>{main}</Label>
          <Dim x1={25} y1={72} x2={135} y2={72} />
          <Label x={80} y={90}>L</Label>
        </>
      )}
      {shape === "tap" && (
        <>
          <rect x={10} y={55} width={140} height={30} strokeDasharray="4 3" className="fill-none stroke-zinc-400 dark:stroke-zinc-600" />
          <rect x={60} y={15} width={40} height={40} className={body} />
          <Label x={80} y={39}>{main}</Label>
          <Dim x1={112} y1={15} x2={112} y2={55} />
          <Label x={118} y={39} anchor="start">l</Label>
        </>
      )}
      {shape === "elbow" && (
        <>
          <path d="M 60 80 L 90 80 A 60 60 0 0 0 30 20 L 30 50 A 30 30 0 0 1 60 80 Z" className={body} />
          <Label x={75} y={72}>{main}</Label>
          {/* radius from the bend centre: inner for a rect elbow, centre line for a round one */}
          <g className={dim} strokeWidth={1}>
            <line x1={30} y1={80} x2={roundMain ? 30 + 45 * Math.SQRT1_2 : 30 + 30 * Math.SQRT1_2} y2={roundMain ? 80 - 45 * Math.SQRT1_2 : 80 - 30 * Math.SQRT1_2} />
          </g>
          <Label x={36} y={62} anchor="start">R</Label>
          <Label x={104} y={36} anchor="start">α</Label>
        </>
      )}
      {shape === "reducer" && (
        <>
          <polygon points="25,15 125,32 125,48 25,65" className={body} />
          <Label x={30} y={44} anchor="start">{main}</Label>
          <Label x={118} y={44} anchor="end">{small}</Label>
          <Dim x1={25} y1={80} x2={125} y2={80} />
          <Label x={75} y={96}>L</Label>
        </>
      )}
      {shape === "tee" && (
        <>
          <path d="M 10 55 H 60 V 12 H 100 V 55 H 150 V 85 H 10 Z" className={body} />
          <Label x={36} y={74}>{main}</Label>
          <Label x={80} y={34}>{small}</Label>
        </>
      )}
      {shape === "cross" && (
        <>
          <path d="M 10 40 H 60 V 5 H 100 V 40 H 150 V 65 H 100 V 95 H 60 V 65 H 10 Z" className={body} />
          <Label x={36} y={57}>{main}</Label>
          <Label x={80} y={26}>{small}</Label>
          <Label x={80} y={83}>{small}</Label>
        </>
      )}
    </svg>
  );
}
