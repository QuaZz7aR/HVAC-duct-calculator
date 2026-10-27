import type { FittingKind } from "@/lib/form/fields";
import { uk as dict } from "@/lib/i18n/uk";
import { sketchSpecs } from "./sketch-spec";

const sym = dict.symbols;

// Isometric sketch of a fitting as flat drawing items. Schematic proportions, never the user's sizes.
// World axes: x along the main duct (screen right-down), y depth (screen left-down), z up.

type V3 = [number, number, number];
export type V2 = [number, number];

/** face = wall, opening = an open end, plate = a cap's end plate, ghost = the duct a tap is cut into. */
export type IsoTone = "face" | "opening" | "plate" | "ghost";

export type IsoItem =
  | { type: "face"; points: V2[]; tone: IsoTone; stroke?: false }
  | { type: "outline"; points: V2[] }
  | { type: "edge"; a: V2; b: V2; hidden: boolean }
  | { type: "dim"; a: V2; b: V2; label: string; at: V2; anchor: "start" | "middle" | "end"; ext: [V2, V2][] }
  | { type: "radius"; center: V2; to: V2; label: string; at: V2 }
  | { type: "axis"; points: V2[] };

export interface IsoDrawing {
  items: IsoItem[];
  /** x, y, width, height of the drawing with its labels, for the viewBox. */
  box: [number, number, number, number];
}

const cos30 = Math.cos(Math.PI / 6);
const view: V3 = [1, 1, 1];

/** Isometric projection, 100 px per world unit. */
function p([x, y, z]: V3): V2 {
  return [(x - y) * cos30 * 100, (x + y) * 50 - z * 100];
}

const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const scale = (a: V3, k: number): V3 => [a[0] * k, a[1] * k, a[2] * k];
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const faces = (n: V3) => dot(n, view) > 1e-9;

/** Circle of radius r around c in the plane spanned by the unit vectors u, v. */
function ring(c: V3, u: V3, v: V3, r: number, n = 48): V3[] {
  return Array.from({ length: n }, (_, k) => {
    const t = (2 * Math.PI * k) / n;
    return add(c, add(scale(u, r * Math.cos(t)), scale(v, r * Math.sin(t))));
  });
}

class Sketch {
  items: IsoItem[] = [];

  face(points: V3[], tone: IsoTone = "face") {
    this.items.push({ type: "face", points: points.map(p), tone });
  }

  edge(a: V3, b: V3, hidden = false) {
    this.items.push({ type: "edge", a: p(a), b: p(b), hidden });
  }

  /**
   * Dimension line between two points, with extension lines from the measured points `from` on the part,
   * running a little past the dimension line as in a drawing; the label is shifted by `shift` screen px from the middle.
   */
  dim(from: [V3, V3], a: V3, b: V3, label: string, shift: V2, anchor: "start" | "middle" | "end" = "middle") {
    const [pa, pb] = [p(a), p(b)];
    const ext = ([q, r]: [V2, V2]): [V2, V2][] => {
      const d = Math.hypot(r[0] - q[0], r[1] - q[1]);
      if (d < 1) return [];
      const k = (d + 5) / d;
      return [[q, [q[0] + (r[0] - q[0]) * k, q[1] + (r[1] - q[1]) * k]]];
    };
    this.items.push({
      type: "dim",
      a: pa,
      b: pb,
      label,
      at: [(pa[0] + pb[0]) / 2 + shift[0], (pa[1] + pb[1]) / 2 + shift[1]],
      anchor,
      ext: [...ext([p(from[0]), pa]), ...ext([p(from[1]), pb])],
    });
  }

  radius(center: V3, to: V3, label: string) {
    const [c, t] = [p(center), p(to)];
    // the letter sits beside the centre, which is off the drawing
    this.items.push({ type: "radius", center: c, to: t, label, at: [c[0] + 10, c[1] + 5] });
  }

  /** Centre line of a bent duct, dash-dot. */
  axis(points: V3[]) {
    this.items.push({ type: "axis", points: points.map(p) });
  }

  /**
   * Round tube along a path: each sample has a centre, two unit vectors across the path and a radius.
   * Outline = the extreme points of each section across the projected path; the ends are drawn as discs.
   */
  tube(centres: V3[], across: [V3, V3][], radii: number[], endTone: IsoTone = "opening", bodyTone: IsoTone = "face") {
    const sections = centres.map((c, k) => ring(c, across[k][0], across[k][1], radii[k], 72).map(p));
    const sides = centres.map((_, k) => {
      const [a, b] = [p(centres[Math.max(k - 1, 0)]), p(centres[Math.min(k + 1, centres.length - 1)])];
      const side = sections[k].map((q) => (b[0] - a[0]) * q[1] - (b[1] - a[1]) * q[0]);
      return [side.indexOf(Math.max(...side)), side.indexOf(Math.min(...side))];
    });
    const left = sides.map(([l], k) => sections[k][l]);
    const right = sides.map(([, r], k) => sections[k][r]);
    const last = centres.length - 1;
    const ends = [
      { k: 0, next: 1, out: sub(centres[0], centres[1]) },
      { k: last, next: last - 1, out: sub(centres[last], centres[last - 1]) },
    ];
    // the two halves of an end section between its outline points: towards the rest of the tube first, then away from it
    const halves = (k: number, next: number) => {
      const ring2 = sections[k];
      const n = ring2.length;
      const [l, r] = sides[k];
      const walk = (step: 1 | -1) => {
        const out: V2[] = [];
        for (let i = l; ; i = (i + step + n) % n) {
          out.push(ring2[i]);
          if (i === r) return out;
        }
      };
      const [c, d] = [p(centres[k]), p(centres[next])];
      const towards = (arc: V2[]) => {
        const q = arc[Math.floor(arc.length / 2)];
        return (q[0] - c[0]) * (d[0] - c[0]) + (q[1] - c[1]) * (d[1] - c[1]);
      };
      const [a, b] = [walk(1), walk(-1)];
      return towards(a) >= towards(b) ? [a, b] : [b, a];
    };
    const disc = (k: number, tone: IsoTone) => this.face(ring(centres[k], across[k][0], across[k][1], radii[k]), tone);
    // an end turned away is seen only by its far half, which closes the outline
    for (const e of ends) {
      if (faces(e.out)) continue;
      this.items.push({ type: "face", points: sections[e.k], tone: bodyTone, stroke: false }, { type: "outline", points: halves(e.k, e.next)[1] });
    }
    // the body: both outlines joined round the near half of each end, so no chord is drawn across an end
    const startArc = halves(0, 1)[0].reverse();
    const endArc = halves(last, last - 1)[0];
    this.items.push({ type: "face", points: [...startArc, ...left, ...endArc, ...[...right].reverse()], tone: bodyTone, stroke: false });
    this.items.push({ type: "outline", points: left }, { type: "outline", points: right });
    for (const e of ends) if (faces(e.out)) disc(e.k, endTone);
  }

  /** Straight round tube from a to b. */
  cylinder(a: V3, b: V3, r: number, endTone: IsoTone = "opening", bodyTone: IsoTone = "face", r2 = r) {
    const axis = sub(b, a);
    const len = Math.hypot(...axis);
    const t = scale(axis, 1 / len);
    const u: V3 = Math.abs(t[2]) > 0.9 ? [1, 0, 0] : [0, 0, 1];
    const v = cross(t, u);
    const n = 12;
    const centres = Array.from({ length: n + 1 }, (_, k) => add(a, scale(axis, k / n)));
    const radii = centres.map((_, k) => r + ((r2 - r) * k) / n);
    this.tube(centres, centres.map(() => [u, v]), radii, endTone, bodyTone);
  }

  /**
   * Convex body given by its faces: the faces turned to the viewer are filled, the edges between two hidden faces are dashed.
   * `tones[i]` tones face i; `hiddenEdges: false` leaves out the dashed edges (a branch standing on a duct).
   */
  solid(faceList: V3[][], tones: IsoTone[], hiddenEdges = true) {
    const all = faceList.flat();
    const mid = scale(all.reduce(add, [0, 0, 0] as V3), 1 / all.length);
    const shown = faceList.map((f) => {
      let n = cross(sub(f[1], f[0]), sub(f[2], f[0]));
      const c = scale(f.reduce(add, [0, 0, 0] as V3), 1 / f.length);
      if (dot(n, sub(c, mid)) < 0) n = scale(n, -1);
      return faces(n);
    });
    faceList.forEach((f, i) => shown[i] && this.face(f, tones[i]));
    // hidden edges go over the faces, as seen through the wall
    if (hiddenEdges) {
      const key = (q: V3) => q.map((x) => x.toFixed(4)).join(",");
      const edgeKey = (a: V3, b: V3) => [key(a), key(b)].sort().join("|");
      const drawn = new Set<string>();
      faceList.forEach((f, i) => shown[i] && f.forEach((q, j) => drawn.add(edgeKey(q, f[(j + 1) % f.length]))));
      faceList.forEach((f, i) => {
        if (shown[i]) return;
        f.forEach((q, j) => {
          const r = f[(j + 1) % f.length];
          if (drawn.has(edgeKey(q, r))) return;
          drawn.add(edgeKey(q, r));
          this.edge(q, r, true);
        });
      });
    }
  }

  /** Box or frustum between two rectangles across the axis `along` (x or z), from `from` to `to`. */
  prism(along: "x" | "z", from: number, to: number, a0: number, b0: number, a1 = a0, b1 = b0, endTone: IsoTone = "opening", sideTone: IsoTone = "face", hiddenEdges = true) {
    const rect = (s: number, a: number, b: number): V3[] =>
      along === "x"
        ? [[s, -a / 2, -b / 2], [s, a / 2, -b / 2], [s, a / 2, b / 2], [s, -a / 2, b / 2]]
        : [[-a / 2, -b / 2, s], [a / 2, -b / 2, s], [a / 2, b / 2, s], [-a / 2, b / 2, s]];
    const r0 = rect(from, a0, b0);
    const r1 = rect(to, a1, b1);
    const sides = r0.map((q, i) => [q, r0[(i + 1) % 4], r1[(i + 1) % 4], r1[i]]);
    this.solid([r0, r1, ...sides], [endTone, endTone, sideTone, sideTone, sideTone, sideTone], hiddenEdges);
  }

  /** A round branch standing on the main duct, from its wall `foot(y)` up to `top`. */
  roundBranch(r: number, top: number, foot: (y: number) => number, dir: 1 | -1 = 1) {
    const n = 72;
    const t = Array.from({ length: n }, (_, k) => (2 * Math.PI * k) / n);
    const base: V3[] = t.map((a) => [r * Math.cos(a), r * Math.sin(a), dir * foot(r * Math.sin(a))]);
    const cap: V3[] = t.map((a) => [r * Math.cos(a), r * Math.sin(a), dir * top]);
    const capP = cap.map(p);
    const xs = capP.map((q) => q[0]);
    const iL = xs.indexOf(Math.min(...xs));
    const iR = xs.indexOf(Math.max(...xs));
    const walk = (step: 1 | -1) => {
      const out: V3[] = [];
      for (let k = iR; ; k = (k + step + n) % n) {
        out.push(base[k]);
        if (k === iL) return out;
      }
    };
    // the visible part of the foot is the half nearer the viewer (lower on screen)
    const a = walk(1);
    const b = walk(-1);
    const lowest = (path: V3[]) => Math.max(...path.map((q) => p(q)[1]));
    const front = lowest(a) >= lowest(b) ? a : b;
    this.items.push({ type: "face", points: [capP[iR], ...front.map(p), capP[iL]], tone: "face" });
    this.face(cap, "opening");
  }
}

// Schematic proportions in world units.
const mainR = 0.32;
const rectW = 0.72;
const rectH = 0.44;
const len = 1.5;

/** Ends of a horizontal circle's diameter that runs level on screen, raised to height z, for its dimension line. */
function flatDiameter(r: number, z: number): [V3, V3] {
  const d = r * Math.SQRT1_2;
  return [[-d, d, z], [d, -d, z]];
}

/** A point on the lower near edge of a round duct along x, or `gap` outside it: its outline there runs at 45° between y and -z. */
function lower(x: number, r: number, gap = 0.16): V3 {
  const d = (r + gap) * Math.SQRT1_2;
  return [x, d, -d];
}

/** Both ends of a dimension `off` away from the measured points. */
function offset(from: [V3, V3], off: V3): [[V3, V3], V3, V3] {
  return [from, add(from[0], off), add(from[1], off)];
}

function straight(s: Sketch, round: boolean, cap: boolean) {
  if (round) {
    s.cylinder([0, 0, 0], [len, 0, 0], mainR);
    if (cap) s.cylinder([len, 0, 0], [len + 0.06, 0, 0], mainR * 1.1, "plate", "plate");
    // a cap's plate is the outermost end, so the extension lines start on it
    const [x, rx] = cap ? [len + 0.06, mainR * 1.1] : [len, mainR];
    s.dim([[x, 0, -rx], [x, 0, rx]], [len, -mainR - 0.16, -mainR], [len, -mainR - 0.16, mainR], sym.diameter, [10, 5], "start");
    s.dim([lower(0, mainR, 0), lower(len, mainR, 0)], lower(0, mainR), lower(len, mainR), sym.length, [-8, 20]);
  } else {
    s.prism("x", 0, len, rectW, rectH);
    if (cap) s.prism("x", len, len + 0.06, rectW + 0.08, rectH + 0.08, rectW + 0.08, rectH + 0.08, "plate", "plate");
    s.dim(...offset([[0, -rectW / 2, rectH / 2], [0, rectW / 2, rectH / 2]], [-0.18, 0, 0]), sym.width, [-8, -8]);
    s.dim(...offset([[0, rectW / 2, -rectH / 2], [0, rectW / 2, rectH / 2]], [0, 0.14, 0]), sym.height, [-10, 5], "end");
    s.dim(...offset([[0, rectW / 2, -rectH / 2], [len, rectW / 2, -rectH / 2]], [0, 0, -0.16]), sym.length, [-8, 20]);
  }
}

function tap(s: Sketch, round: boolean) {
  const [mw, md, mh, l] = [1.5, 0.9, 0.4, 0.45];
  s.solid(
    (() => {
      const lo: V3[] = [[-mw / 2, -md / 2, -mh], [mw / 2, -md / 2, -mh], [mw / 2, md / 2, -mh], [-mw / 2, md / 2, -mh]];
      const hi = lo.map(([x, y]) => [x, y, 0] as V3);
      return [lo, hi, ...lo.map((q, i) => [q, lo[(i + 1) % 4], hi[(i + 1) % 4], hi[i]])];
    })(),
    ["ghost", "ghost", "ghost", "ghost", "ghost", "ghost"],
    false,
  );
  if (round) {
    s.roundBranch(0.22, l, () => 0);
    s.dim(...offset(flatDiameter(0.22, l), [0, 0, 0.24]), sym.diameter, [0, -8]);
    // the branch's right outline on screen, measured beside it
    const side = 0.22 * Math.SQRT1_2;
    s.dim([[side, -side, 0], [side, -side, l]], [0.22, -0.22 - 0.14, 0], [0.22, -0.22 - 0.14, l], sym.length, [10, 5], "start");
  } else {
    s.prism("z", 0, l, 0.5, 0.36, 0.5, 0.36, "opening", "face", false);
    s.dim(...offset([[-0.25, -0.18, l], [0.25, -0.18, l]], [0, -0.14, 0]), sym.width, [8, -8], "start");
    s.dim(...offset([[-0.25, -0.18, l], [-0.25, 0.18, l]], [-0.14, 0, 0]), sym.height, [-10, -6], "end");
    s.dim([[0.25, -0.18, 0], [0.25, -0.18, l]], [0.25, -0.18 - 0.14, 0], [0.25, -0.18 - 0.14, l - 0.02], sym.length, [10, 12], "start");
  }
}

function elbow(s: Sketch, round: boolean) {
  const n = 36;
  // a 90° bend in the horizontal plane around the z axis; both open ends face the viewer
  const t = Array.from({ length: n + 1 }, (_, k) => (-Math.PI / 2) - (Math.PI / 2) * (k / n));
  if (round) {
    const rc = 0.85;
    const centres = t.map((a): V3 => [rc * Math.cos(a), rc * Math.sin(a), 0]);
    s.tube(centres, t.map((a): [V3, V3] => [[Math.cos(a), Math.sin(a), 0], [0, 0, 1]]), centres.map(() => mainR));
    s.axis(centres);
    s.radius([0, 0, 0], centres[n / 2], sym.radius);
    // the end at x = 0 faces right on screen: its diameter is measured beside it
    s.dim(...offset([[0, -rc, -mainR], [0, -rc, mainR]], [0, -mainR - 0.14, 0]), sym.diameter, [10, 5], "start");
  } else {
    const [ri, w, h] = [0.55, 0.55, 0.5];
    const ro = ri + w;
    const arc = (r: number, z: number) => t.map((a): V3 => [r * Math.cos(a), r * Math.sin(a), z]);
    const [ti, to, bi] = [arc(ri, h / 2), arc(ro, h / 2), arc(ri, -h / 2)];
    const bo = arc(ro, -h / 2);
    s.face([...ti, ...[...bi].reverse()]);
    s.face([...to, ...[...ti].reverse()]);
    for (const k of [0, n]) s.face([ti[k], to[k], bo[k], bi[k]], "opening");
    // R is drawn in the bottom plane, from the centre to the lower inner edge, so it stays off the walls
    s.radius([0, 0, -h / 2], bi[n / 2], sym.radius);
    s.dim(...offset([[-ro, 0, -h / 2], [-ri, 0, -h / 2]], [0, 0, -0.16]), sym.width, [-8, 18]);
    s.dim(...offset([[-ro, 0, -h / 2], [-ro, 0, h / 2]], [-0.14, 0, 0]), sym.height, [-10, 5], "end");
  }
}

function reducer(s: Sketch, roundMain: boolean, roundSmall: boolean) {
  const len2 = 1.3;
  const r1 = 0.22;
  const [w1, h1] = [0.5, 0.36];
  if (roundMain) {
    s.cylinder([0, 0, 0], [len2, 0, 0], mainR + 0.06, "opening", "face", r1);
    const R = mainR + 0.06;
    // the large end faces away: d is taken across its outline, the extension lines carry the outline back past the end
    const d = R * Math.SQRT1_2;
    s.dim(...offset([[0, d, -d], [0, -d, d]], [-0.42, 0, 0]), sym.diameter, [-10, 5], "end");
    s.dim(...offset([[len2, 0, -r1], [len2, 0, r1]], [0, -r1 - 0.14, 0]), sym.smallDiameter, [10, 5], "start");
    s.dim([lower(0, R, 0), lower(len2, r1, 0)], lower(0, R), lower(len2, r1), sym.length, [-8, 20]);
    return;
  }
  const [W, H] = [0.9, 0.62];
  if (roundSmall) {
    // rect end at x = 0 turning into a round end at x = len2: outline is the hull of both ends
    const rect: V3[] = [[0, -W / 2, -H / 2], [0, W / 2, -H / 2], [0, W / 2, H / 2], [0, -W / 2, H / 2]];
    const circle = ring([len2, 0, 0], [0, 1, 0], [0, 0, 1], r1);
    s.items.push({ type: "face", points: hull([...rect, ...circle].map(p)), tone: "face" });
    // seams from the three visible corners of the rect end to the round end
    const seam = (corner: V3, angle: number) => s.edge(corner, [len2, r1 * Math.cos(angle), r1 * Math.sin(angle)]);
    seam(rect[2], Math.PI / 4);
    seam(rect[1], -Math.PI / 4);
    seam(rect[3], (3 * Math.PI) / 4);
    s.edge(rect[2], rect[1]);
    s.edge(rect[2], rect[3]);
    s.face(circle, "opening");
    rectEnd(s, W, H);
    s.dim(...offset([[len2, 0, -r1], [len2, 0, r1]], [0, -r1 - 0.14, 0]), sym.smallDiameter, [10, 5], "start");
    // vertical extension lines down to one level: from the rect end's near corner and the round end's lowest point on screen
    const foot: V3 = [len2, r1 * 0.447, -r1 * 0.894];
    s.dim([[0, W / 2, -H / 2], foot], [0, W / 2, -H / 2 - 0.16], [len2, foot[1], -H / 2 - 0.16], sym.length, [-8, 20]);
    return;
  }
  s.prism("x", 0, len2, W, H, w1, h1);
  rectEnd(s, W, H);
  s.dim(...offset([[len2, -w1 / 2, -h1 / 2], [len2, w1 / 2, -h1 / 2]], [0.18, 0, 0]), sym.smallWidth, [10, 14], "start");
  s.dim(...offset([[len2, -w1 / 2, -h1 / 2], [len2, -w1 / 2, h1 / 2]], [0, -0.14, 0]), sym.smallHeight, [10, 5], "start");
  // vertical extension lines from both near lower corners down to one level
  s.dim([[0, W / 2, -H / 2], [len2, w1 / 2, -h1 / 2]], [0, W / 2, -H / 2 - 0.16], [len2, w1 / 2, -H / 2 - 0.16], sym.length, [-8, 20]);
}

/** a and b of a reducer's large rect end at x = 0. */
function rectEnd(s: Sketch, W: number, H: number) {
  s.dim(...offset([[0, -W / 2, H / 2], [0, W / 2, H / 2]], [-0.18, 0, 0]), sym.width, [-8, -8]);
  s.dim(...offset([[0, W / 2, -H / 2], [0, W / 2, H / 2]], [0, 0.14, 0]), sym.height, [-10, 5], "end");
}

function branchFitting(s: Sketch, roundMain: boolean, roundSmall: boolean, cross: boolean) {
  const half = 0.8;
  const top = 0.75;
  const [bw, bd] = [0.4, 0.3];
  const rb = 0.21;
  // the main duct's upper wall above the point (x, y); it does not depend on x
  const wall = (y: number) => (roundMain ? Math.sqrt(Math.max(mainR * mainR - y * y, 0)) : rectH / 2);
  if (cross) {
    // the lower branch goes first: the main duct covers where it starts
    if (roundSmall) s.cylinder([0, 0, 0], [0, 0, -top], rb, "opening");
    else s.prism("z", 0, -top, bw, bd, bw, bd, "opening", "face", false);
  }
  if (roundMain) s.cylinder([-half, 0, 0], [half, 0, 0], mainR);
  else s.prism("x", -half, half, rectW, rectH);
  if (roundSmall) s.roundBranch(rb, top, wall);
  else if (!roundMain) s.prism("z", wall(bd / 2), top, bw, bd, bw, bd, "opening", "face", false);
  else {
    // a rect branch on a round duct: its side across the duct follows the duct's curve, the side along it stands on a straight line
    const ys = Array.from({ length: 13 }, (_, k) => bd / 2 - (bd * k) / 12);
    s.face([[-bw / 2, bd / 2, top], [bw / 2, bd / 2, top], [bw / 2, bd / 2, wall(bd / 2)], [-bw / 2, bd / 2, wall(bd / 2)]]);
    s.face([[bw / 2, -bd / 2, top], [bw / 2, bd / 2, top], ...ys.map((y): V3 => [bw / 2, y, wall(y)])]);
    s.face([[-bw / 2, -bd / 2, top], [bw / 2, -bd / 2, top], [bw / 2, bd / 2, top], [-bw / 2, bd / 2, top]], "opening");
  }
  if (roundMain) {
    s.dim(...offset([[half, 0, -mainR], [half, 0, mainR]], [0, -mainR - 0.14, 0]), sym.diameter, [10, 5], "start");
  } else {
    s.dim(...offset([[half, -rectW / 2, -rectH / 2], [half, -rectW / 2, rectH / 2]], [0, -0.14, 0]), sym.height, [10, 5], "start");
    s.dim(...offset([[-half, -rectW / 2, rectH / 2], [-half, rectW / 2, rectH / 2]], [-0.18, 0, 0]), sym.width, [-8, -8]);
  }
  if (roundSmall) {
    s.dim(...offset(flatDiameter(rb, top), [0, 0, 0.24]), sym.smallDiameter, [0, -8]);
  } else {
    s.dim(...offset([[-bw / 2, -bd / 2, top], [bw / 2, -bd / 2, top]], [0, -0.12, 0]), sym.smallWidth, [8, -6], "start");
    s.dim(...offset([[-bw / 2, -bd / 2, top], [-bw / 2, bd / 2, top]], [-0.12, 0, 0]), sym.smallHeight, [-8, -8], "end");
  }
}

/** Convex hull of screen points (monotone chain). */
function hull(points: V2[]): V2[] {
  const pts = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const turn = (o: V2, a: V2, b: V2) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const half = (list: V2[]) => {
    const out: V2[] = [];
    for (const q of list) {
      while (out.length >= 2 && turn(out[out.length - 2], out[out.length - 1], q) <= 0) out.pop();
      out.push(q);
    }
    return out.slice(0, -1);
  };
  return [...half(pts), ...half([...pts].reverse())];
}

/** The isometric drawing of a fitting kind, with the box its viewBox needs. */
export function isoDrawing(kind: FittingKind): IsoDrawing {
  const { shape, roundMain, roundSmall = false } = sketchSpecs[kind];
  const s = new Sketch();
  switch (shape) {
    case "straight":
    case "cap":
      straight(s, roundMain, shape === "cap");
      break;
    case "tap":
      tap(s, roundMain);
      break;
    case "elbow":
      elbow(s, roundMain);
      break;
    case "reducer":
      reducer(s, roundMain, roundSmall);
      break;
    case "tee":
    case "cross":
      branchFitting(s, roundMain, roundSmall, shape === "cross");
      break;
  }
  const pts: V2[] = s.items.flatMap((i) => {
    if (i.type === "face" || i.type === "axis" || i.type === "outline") return i.points;
    if (i.type === "edge") return [i.a, i.b];
    // a label is about 16 px tall and 12 px wide per letter, drawn from its baseline
    const w = i.label.length * 12;
    const x0 = i.type === "dim" && i.anchor === "end" ? i.at[0] - w : i.type === "dim" && i.anchor === "middle" ? i.at[0] - w / 2 : i.at[0];
    const ends: V2[] = i.type === "dim" ? [i.a, i.b, ...i.ext.flat()] : [i.center, i.to];
    return [...ends, [x0, i.at[1] - 14], [x0 + w, i.at[1] + 4]];
  });
  const pad = 8;
  const xs = pts.map((q) => q[0]);
  const ys = pts.map((q) => q[1]);
  const [x0, y0] = [Math.min(...xs) - pad, Math.min(...ys) - pad];
  return { items: s.items, box: [x0, y0, Math.max(...xs) + pad - x0, Math.max(...ys) + pad - y0] };
}
