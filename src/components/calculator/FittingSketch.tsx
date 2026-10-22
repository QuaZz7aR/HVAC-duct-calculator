import type { FittingKind } from "@/lib/form/fields";
import { uk as dict } from "@/lib/i18n/uk";
import { kindTitle } from "./format";
import { sketchSpecs } from "./sketch-spec";

export type SketchView = "side" | "profile";

const body = "fill-zinc-100 stroke-zinc-500 dark:fill-zinc-800 dark:stroke-zinc-400";
const hidden = "fill-none stroke-zinc-400 dark:stroke-zinc-500";
const dim = "stroke-blue-600 dark:stroke-blue-400";
const txt = "fill-blue-700 dark:fill-blue-300";

/** Horizontal dimension line with end ticks; the label sits below it (or above), never on the drawing. */
function DimH({ x1, x2, y, label, above = false }: { x1: number; x2: number; y: number; label: string; above?: boolean }) {
  return (
    <g>
      <g className={dim} strokeWidth={1.2}>
        <line x1={x1} y1={y} x2={x2} y2={y} />
        <line x1={x1} y1={y - 4} x2={x1} y2={y + 4} />
        <line x1={x2} y1={y - 4} x2={x2} y2={y + 4} />
      </g>
      <text x={(x1 + x2) / 2} y={above ? y - 8 : y + 18} textAnchor="middle" fontSize={15} fontWeight={600} className={txt}>{label}</text>
    </g>
  );
}

/** Vertical dimension line; the label sits beside it, on the side away from the drawing. */
function DimV({ x, y1, y2, label, side }: { x: number; y1: number; y2: number; label: string; side: "left" | "right" }) {
  return (
    <g>
      <g className={dim} strokeWidth={1.2}>
        <line x1={x} y1={y1} x2={x} y2={y2} />
        <line x1={x - 4} y1={y1} x2={x + 4} y2={y1} />
        <line x1={x - 4} y1={y2} x2={x + 4} y2={y2} />
      </g>
      <text x={side === "left" ? x - 9 : x + 9} y={(y1 + y2) / 2 + 5} textAnchor={side === "left" ? "end" : "start"} fontSize={15} fontWeight={600} className={txt}>{label}</text>
    </g>
  );
}

function Text({ x, y, children, anchor = "middle" }: { x: number; y: number; children: string; anchor?: "start" | "middle" | "end" }) {
  return <text x={x} y={y} textAnchor={anchor} fontSize={15} fontWeight={600} className={txt}>{children}</text>;
}

/** Elbow: centre C, bend over 90 degrees, the radius line ends on the centre line (round) or the inner edge (rect). */
function Elbow({ round, main }: { round: boolean; main: string }) {
  const cx = 70, cy = 124, inner = 34, outer = 74;
  const r = round ? (inner + outer) / 2 : inner;
  const k = Math.SQRT1_2;
  return (
    <>
      <path d={`M ${cx + inner} ${cy} L ${cx + outer} ${cy} A ${outer} ${outer} 0 0 0 ${cx} ${cy - outer} L ${cx} ${cy - inner} A ${inner} ${inner} 0 0 1 ${cx + inner} ${cy} Z`} className={body} strokeWidth={1.6} />
      <g className={dim} strokeWidth={1.4}>
        <line x1={cx} y1={cy} x2={cx + r * k} y2={cy - r * k} />
        <circle cx={cx} cy={cy} r={2.5} className="fill-blue-600 dark:fill-blue-400" />
        <circle cx={cx + r * k} cy={cy - r * k} r={2.5} className="fill-blue-600 dark:fill-blue-400" />
        {/* the angle, drawn outside the body */}
        <path d={`M ${cx + 88} ${cy} A 88 88 0 0 0 ${cx} ${cy - 88}`} fill="none" />
      </g>
      <Text x={cx - 8} y={cy - 28} anchor="end">R</Text>
      <Text x={cx + 100 * k + 6} y={cy - 100 * k + 4} anchor="start">α</Text>
      <DimH x1={cx + inner} x2={cx + outer} y={cy + 16} label={main} />
    </>
  );
}

function Side({ kind }: { kind: FittingKind }) {
  const { shape, roundMain, roundSmall } = sketchSpecs[kind];
  const main = roundMain ? dict.sketch.diameter : dict.sketch.rect;
  const small = roundSmall ? dict.sketch.smallDiameter : dict.sketch.smallRect;
  switch (shape) {
    case "straight":
    case "cap":
      return (
        <>
          <rect x={70} y={30} width={180} height={50} className={body} strokeWidth={1.6} />
          {shape === "cap" && <line x1={250} y1={30} x2={250} y2={80} className="stroke-zinc-700 dark:stroke-zinc-200" strokeWidth={5} />}
          <DimV x={60} y1={30} y2={80} label={main} side="left" />
          <DimH x1={70} x2={250} y={104} label="L" />
        </>
      );
    case "tap":
      return (
        <>
          <rect x={70} y={86} width={180} height={50} strokeDasharray="5 4" className={hidden} strokeWidth={1.4} />
          <rect x={130} y={34} width={60} height={52} className={body} strokeWidth={1.6} />
          <DimH x1={130} x2={190} y={24} label={main} above />
          <DimV x={206} y1={34} y2={86} label="l" side="right" />
        </>
      );
    case "elbow":
      return <Elbow round={roundMain} main={main} />;
    case "reducer":
      return (
        <>
          <polygon points="80,20 230,50 230,90 80,120" className={body} strokeWidth={1.6} />
          <DimV x={70} y1={20} y2={120} label={main} side="left" />
          <DimV x={244} y1={50} y2={90} label={small} side="right" />
          <DimH x1={80} x2={230} y={140} label="L" />
        </>
      );
    case "tee":
      return (
        <>
          <path d="M 70 84 H 130 V 34 H 190 V 84 H 250 V 124 H 70 Z" className={body} strokeWidth={1.6} />
          <DimH x1={130} x2={190} y={24} label={small} above />
          <DimV x={60} y1={84} y2={124} label={main} side="left" />
        </>
      );
    case "cross":
      return (
        <>
          <path d="M 70 84 H 130 V 34 H 190 V 84 H 250 V 120 H 190 V 168 H 130 V 120 H 70 Z" className={body} strokeWidth={1.6} />
          <DimH x1={130} x2={190} y={24} label={small} above />
          <DimV x={60} y1={84} y2={120} label={main} side="left" />
        </>
      );
  }
}

/** Cross-section of the main duct; tees, crosses and reducers add the branch or small end as a dashed outline with its own dimensions. */
function Profile({ kind }: { kind: FittingKind }) {
  const { shape, roundMain, roundSmall } = sketchSpecs[kind];
  const main = roundMain ? dict.sketch.diameter : dict.sketch.rect;
  const hasSmall = shape === "reducer" || shape === "tee" || shape === "cross";
  return (
    <>
      {roundMain ? (
        <>
          <circle cx={150} cy={62} r={44} className={body} strokeWidth={1.6} />
          <DimH x1={106} x2={194} y={122} label={main} />
        </>
      ) : (
        <>
          <rect x={100} y={30} width={100} height={64} className={body} strokeWidth={1.6} />
          <DimH x1={100} x2={200} y={118} label="Ш" />
          <DimV x={88} y1={30} y2={94} label="В" side="left" />
        </>
      )}
      {hasSmall && roundSmall && (
        <>
          <circle cx={150} cy={62} r={roundMain ? 26 : 22} strokeDasharray="5 4" className={hidden} strokeWidth={1.4} />
          <DimH x1={roundMain ? 124 : 128} x2={roundMain ? 176 : 172} y={150} label="д" />
        </>
      )}
      {hasSmall && !roundSmall && (
        <>
          <rect x={126} y={46} width={48} height={32} strokeDasharray="5 4" className={hidden} strokeWidth={1.4} />
          <DimH x1={126} x2={174} y={150} label="ш" />
          <DimV x={214} y1={46} y2={78} label="в" side="right" />
        </>
      )}
    </>
  );
}

/** Schematic of a fitting, side view or cross-section ("в профіль"). Not to scale; labels sit beside the drawing, never on it. */
export function FittingSketch({ kind, view = "side" }: { kind: FittingKind; view?: SketchView }) {
  const label = `${kindTitle(kind)}: ${view === "side" ? dict.sketch.sideTitle : dict.sketch.profileTitle}`;
  return (
    <svg viewBox="0 0 300 176" role="img" aria-label={label} className="h-auto w-full max-w-sm">
      <title>{label}</title>
      {view === "side" ? <Side kind={kind} /> : <Profile kind={kind} />}
    </svg>
  );
}
