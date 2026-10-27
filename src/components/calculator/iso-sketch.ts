import type { FittingKind } from "@/lib/form/fields";
import { sketchSpecs } from "./sketch-spec";

// Isometric sketch of a fitting as flat drawing items. Schematic proportions, never the user's sizes.
// World axes: x along the main duct (screen right-down), y depth (screen left-down), z up.

type V3 = [number, number, number];
export type V2 = [number, number];

/** face = wall, opening = an open end, plate = a cap's end plate, ghost = the duct a tap is cut into. */
export type IsoTone = "face" | "opening" | "plate" | "ghost";

export type IsoItem =
  | { type: "face"; points: V2[]; tone: IsoTone }
  | { type: "edge"; a: V2; b: V2; hidden: boolean }
  | { type: "dim"; a: V2; b: V2; label: string; at: V2; anchor: "start" | "middle" | "end" }
  | { type: "radius"; center: V2; to: V2; label: string; at: V2 };

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

  /** Dimension line between two points; the label is shifted by `shift` screen px from the middle. */
  dim(a: V3, b: V3, label: string, shift: V2, anchor: "start" | "middle" | "end" = "middle") {
    const [pa, pb] = [p(a), p(b)];
    this.items.push({ type: "dim", a: pa, b: pb, label, at: [(pa[0] + pb[0]) / 2 + shift[0], (pa[1] + pb[1]) / 2 + shift[1]], anchor });
  }

  radius(center: V3, to: V3, label: string) {
    const [c, t] = [p(center), p(to)];
    this.items.push({ type: "radius", center: c, to: t, label, at: [(c[0] + t[0]) / 2 + 10, (c[1] + t[1]) / 2 + 5] });
  }

  /**
   * Round tube along a path: each sample has a centre, two unit vectors across the path and a radius.
   * Outline = the extreme points of each section across the projected path; the ends are drawn as discs.
   */
  tube(centres: V3[], across: [V3, V3][], radii: number[], endTone: IsoTone = "opening", bodyTone: IsoTone = "face") {
    const left: V2[] = [];
    const right: V2[] = [];
    centres.forEach((c, k) => {
      const section = ring(c, across[k][0], across[k][1], radii[k], 72).map(p);
      const [a, b] = [p(centres[Math.max(k - 1, 0)]), p(centres[Math.min(k + 1, centres.length - 1)])];
      const side = section.map((q) => (b[0] - a[0]) * q[1] - (b[1] - a[1]) * q[0]);
      left.push(section[side.indexOf(Math.max(...side))]);
      right.push(section[side.indexOf(Math.min(...side))]);
    });
    const last = centres.length - 1;
    const ends = [
      { k: 0, out: sub(centres[0], centres[1]) },
      { k: last, out: sub(centres[last], centres[last - 1]) },
    ];
    const disc = (k: number, tone: IsoTone) => this.face(ring(centres[k], across[k][0], across[k][1], radii[k]), tone);
    for (const e of ends) if (!faces(e.out)) disc(e.k, bodyTone === "ghost" ? "ghost" : "face");
    this.items.push({ type: "face", points: [...left, ...right.reverse()], tone: bodyTone });
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
    faceList.forEach((f, i) => shown[i] && this.face(f, tones[i]));
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

/** A point just outside the lower near edge of a round duct along x: its outline there runs at 45° between y and -z. */
function lower(x: number, r: number): V3 {
  const d = (r + 0.16) * Math.SQRT1_2;
  return [x, d, -d];
}

function straight(s: Sketch, round: boolean, cap: boolean) {
  if (round) {
    s.cylinder([0, 0, 0], [len, 0, 0], mainR);
    if (cap) s.cylinder([len, 0, 0], [len + 0.06, 0, 0], mainR * 1.1, "plate", "plate");
    s.dim([len, -mainR - 0.16, -mainR], [len, -mainR - 0.16, mainR], "Д", [10, 5], "start");
    s.dim(lower(0, mainR), lower(len, mainR), "L", [-8, 20]);
  } else {
    s.prism("x", 0, len, rectW, rectH);
    if (cap) s.prism("x", len, len + 0.06, rectW + 0.08, rectH + 0.08, rectW + 0.08, rectH + 0.08, "plate", "plate");
    s.dim([-0.18, -rectW / 2, rectH / 2], [-0.18, rectW / 2, rectH / 2], "Ш", [-8, -8]);
    s.dim([0, rectW / 2 + 0.14, -rectH / 2], [0, rectW / 2 + 0.14, rectH / 2], "В", [-10, 5], "end");
    s.dim([0, rectW / 2, -rectH / 2 - 0.16], [len, rectW / 2, -rectH / 2 - 0.16], "L", [-8, 20]);
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
    s.dim([-0.22, 0, l + 0.2], [0.22, 0, l + 0.2], "Д", [-6, -10]);
    s.dim([0.22, -0.22 - 0.14, 0], [0.22, -0.22 - 0.14, l], "l", [10, 5], "start");
  } else {
    s.prism("z", 0, l, 0.5, 0.36, 0.5, 0.36, "opening", "face", false);
    s.dim([-0.25, -0.18 - 0.14, l], [0.25, -0.18 - 0.14, l], "Ш", [8, -8], "start");
    s.dim([-0.25 - 0.14, -0.18, l], [-0.25 - 0.14, 0.18, l], "В", [-10, -6], "end");
    s.dim([0.25, -0.18 - 0.14, 0], [0.25, -0.18 - 0.14, l - 0.02], "l", [10, 12], "start");
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
    s.radius([0, 0, 0], centres[n / 2], "R");
    s.dim([-rc - mainR, 0, mainR + 0.22], [-rc + mainR, 0, mainR + 0.22], "Д", [-4, -10]);
  } else {
    const [ri, w, h] = [0.55, 0.55, 0.5];
    const ro = ri + w;
    const arc = (r: number, z: number) => t.map((a): V3 => [r * Math.cos(a), r * Math.sin(a), z]);
    const [ti, to, bi] = [arc(ri, h / 2), arc(ro, h / 2), arc(ri, -h / 2)];
    const bo = arc(ro, -h / 2);
    s.face([...ti, ...[...bi].reverse()]);
    s.face([...to, ...[...ti].reverse()]);
    for (const k of [0, n]) s.face([ti[k], to[k], bo[k], bi[k]], "opening");
    s.radius([0, 0, h / 2], ti[n / 2], "R");
    s.dim([-ro, 0, -h / 2 - 0.16], [-ri, 0, -h / 2 - 0.16], "Ш", [-8, 18]);
    s.dim([-ro - 0.14, 0, -h / 2], [-ro - 0.14, 0, h / 2], "В", [-10, 5], "end");
  }
}

function reducer(s: Sketch, roundMain: boolean, roundSmall: boolean) {
  const len2 = 1.3;
  const r1 = 0.22;
  const [w1, h1] = [0.5, 0.36];
  if (roundMain) {
    s.cylinder([0, 0, 0], [len2, 0, 0], mainR + 0.06, "opening", "face", r1);
    s.dim([0, mainR + 0.06 + 0.14, -mainR - 0.06], [0, mainR + 0.06 + 0.14, mainR + 0.06], "Д", [-10, 5], "end");
    s.dim([len2, -r1 - 0.14, -r1], [len2, -r1 - 0.14, r1], "д", [10, 5], "start");
    s.dim(lower(0, mainR + 0.06), lower(len2, r1), "L", [-8, 20]);
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
    s.dim([-0.18, -W / 2, H / 2], [-0.18, W / 2, H / 2], "Ш", [-8, -8]);
    s.dim([0, W / 2 + 0.14, -H / 2], [0, W / 2 + 0.14, H / 2], "В", [-10, 5], "end");
    s.dim([len2, -r1 - 0.14, -r1], [len2, -r1 - 0.14, r1], "д", [10, 5], "start");
    s.dim([0, W / 2, -H / 2 - 0.16], [len2, r1, -r1 - 0.16], "L", [-8, 20]);
    return;
  }
  s.prism("x", 0, len2, W, H, w1, h1);
  s.dim([-0.18, -W / 2, H / 2], [-0.18, W / 2, H / 2], "Ш", [-8, -8]);
  s.dim([0, W / 2 + 0.14, -H / 2], [0, W / 2 + 0.14, H / 2], "В", [-10, 5], "end");
  s.dim([len2 + 0.16, -w1 / 2, h1 / 2], [len2 + 0.16, w1 / 2, h1 / 2], "ш", [12, -10]);
  s.dim([len2, -w1 / 2 - 0.14, -h1 / 2], [len2, -w1 / 2 - 0.14, h1 / 2], "в", [10, 5], "start");
  s.dim([0, W / 2, -H / 2 - 0.16], [len2, w1 / 2, -h1 / 2 - 0.16], "L", [-8, 20]);
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
  else s.prism("z", wall(bd / 2), top, bw, bd, bw, bd, "opening", "face", false);
  if (roundMain) {
    s.dim([half, -mainR - 0.14, -mainR], [half, -mainR - 0.14, mainR], "Д", [10, 5], "start");
  } else {
    s.dim([half, -rectW / 2 - 0.14, -rectH / 2], [half, -rectW / 2 - 0.14, rectH / 2], "В", [10, 5], "start");
    s.dim([-half - 0.18, -rectW / 2, rectH / 2], [-half - 0.18, rectW / 2, rectH / 2], "Ш", [-8, -8]);
  }
  if (roundSmall) {
    s.dim([-rb, 0, top + 0.2], [rb, 0, top + 0.2], "д", [-6, -10]);
  } else {
    s.dim([-bw / 2, -bd / 2 - 0.12, top], [bw / 2, -bd / 2 - 0.12, top], "ш", [8, -6], "start");
    s.dim([-bw / 2 - 0.12, -bd / 2, top], [-bw / 2 - 0.12, bd / 2, top], "в", [-10, -4], "end");
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
    if (i.type === "face") return i.points;
    if (i.type === "edge") return [i.a, i.b];
    // a label is about 16 px tall and 12 px wide per letter, drawn from its baseline
    const w = i.label.length * 12;
    const x0 = i.type === "dim" && i.anchor === "end" ? i.at[0] - w : i.type === "dim" && i.anchor === "middle" ? i.at[0] - w / 2 : i.at[0];
    const ends: V2[] = i.type === "dim" ? [i.a, i.b] : [i.center, i.to];
    return [...ends, [x0, i.at[1] - 14], [x0 + w, i.at[1] + 4]];
  });
  const pad = 8;
  const xs = pts.map((q) => q[0]);
  const ys = pts.map((q) => q[1]);
  const [x0, y0] = [Math.min(...xs) - pad, Math.min(...ys) - pad];
  return { items: s.items, box: [x0, y0, Math.max(...xs) + pad - x0, Math.max(...ys) + pad - y0] };
}
