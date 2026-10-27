import { describe, expect, it } from "vitest";
import { kindOrder, type FittingKind } from "@/lib/form/fields";
import { isoDrawing, type IsoItem, type V2 } from "../iso-sketch";

const inside = (q: V2, poly: V2[]) => {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > q[1] !== yj > q[1] && q[0] < ((xj - xi) * (q[1] - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
};

type Mark = Extract<IsoItem, { type: "dim" | "radius" | "angle" }>;
/** The main line of a mark: a dimension line, a radius leader, or the chord of an angle arc. */
const ends = (m: Mark): [V2, V2] => (m.type === "dim" ? [m.a, m.b] : m.type === "angle" ? [m.arc[0], m.arc[m.arc.length - 1]] : [m.center, m.to]);
const along = ([a, b]: [V2, V2]): V2[] => Array.from({ length: 49 }, (_, k) => [a[0] + ((b[0] - a[0]) * (k + 1)) / 50, a[1] + ((b[1] - a[1]) * (k + 1)) / 50] as V2);

/** Points along the line a mark draws; for an angle, its arc (its rays run along the legs to the axis, like a radius). */
const drawn = (m: Mark): V2[] => (m.type === "angle" ? m.arc.slice(1).flatMap((q, k) => along([m.arc[k], q])) : along(ends(m)));

/** The label's box, as the viewBox estimate draws it: 12 px per letter, 14 px above the baseline, 4 below. */
function labelBox(m: Mark): [number, number, number, number] {
  const w = m.label.length * 12;
  const x0 = m.type === "dim" && m.anchor === "end" ? m.at[0] - w : m.type === "dim" && m.anchor === "middle" ? m.at[0] - w / 2 : m.at[0];
  return [x0, m.at[1] - 14, x0 + w, m.at[1] + 4];
}
const inBox = (q: V2, [x0, y0, x1, y1]: number[]) => q[0] > x0 && q[0] < x1 && q[1] > y0 && q[1] < y1;

function parts(kind: FittingKind) {
  const { items } = isoDrawing(kind);
  const faces = items.flatMap((i) => (i.type === "face" && i.tone !== "ghost" ? [i.points] : []));
  const marks = items.filter((i): i is Mark => i.type === "dim" || i.type === "radius" || i.type === "angle");
  return { faces, marks };
}

describe("isometric sketch layout", () => {
  it.each(kindOrder)("%s: dimension lines and letters stay off the walls", (kind) => {
    const { faces, marks } = parts(kind);
    for (const m of marks) {
      const box = labelBox(m);
      const corners: V2[] = [[box[0], box[1]], [box[2], box[1]], [box[0], box[3]], [box[2], box[3]]];
      expect(corners.some((q) => faces.some((f) => inside(q, f))), `letter ${m.label}`).toBe(false);
      // a round elbow's radius ends on the centre line inside the duct, by definition
      if (m.type === "radius" && kind === "roundElbow") continue;
      expect(drawn(m).some((q) => faces.some((f) => inside(q, f))), `line ${m.label}`).toBe(false);
    }
  });

  it.each(kindOrder)("%s: no letter sits on another letter or on another dimension line", (kind) => {
    const { marks } = parts(kind);
    marks.forEach((m, i) => {
      const box = labelBox(m);
      marks.forEach((o, j) => {
        if (i === j) return;
        const ob = labelBox(o);
        const overlap = box[0] < ob[2] && ob[0] < box[2] && box[1] < ob[3] && ob[1] < box[3];
        expect(overlap, `${m.label} / ${o.label}`).toBe(false);
        expect([...drawn(o), ...(o.type === "angle" ? o.rays.flatMap(along) : [])].some((q) => inBox(q, box)), `${m.label} on line ${o.label}`).toBe(false);
      });
    });
  });
});

/** The segments a dimension draws: its line and its extension lines. */
const segments = (m: Mark): [V2, V2][] =>
  m.type === "dim" ? [[m.a, m.b], ...m.ext] : m.type === "angle" ? [...m.rays, ...m.arc.slice(1).map((q, k): [V2, V2] => [m.arc[k], q])] : [[m.center, m.to]];

/** True when two segments cross away from their ends (two lines leaving the same point on the part only touch). */
function crosses([a, b]: [V2, V2], [c, d]: [V2, V2]) {
  const cr = (o: V2, p: V2, q: V2) => (p[0] - o[0]) * (q[1] - o[1]) - (p[1] - o[1]) * (q[0] - o[0]);
  const [d1, d2, d3, d4] = [cr(c, d, a), cr(c, d, b), cr(a, b, c), cr(a, b, d)];
  if (!(d1 * d2 < 0 && d3 * d4 < 0)) return false;
  const t = d1 / (d1 - d2);
  const x: V2 = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  const near = (q: V2) => Math.hypot(q[0] - x[0], q[1] - x[1]) < 2;
  return !(near(a) || near(b) || near(c) || near(d));
}

describe("isometric sketch dimensions", () => {
  it.each(kindOrder)("%s: no dimension or extension line crosses another dimension's lines", (kind) => {
    const { marks } = parts(kind);
    marks.forEach((m, i) =>
      marks.forEach((o, j) => {
        if (j <= i) return;
        const hit = segments(m).some((s) => segments(o).some((t) => crosses(s, t)));
        expect(hit, `${m.label} / ${o.label}`).toBe(false);
      }),
    );
  });

  it.each(kindOrder)("%s: no extension line runs through a letter", (kind) => {
    const { marks } = parts(kind);
    marks.forEach((m) => {
      const box = labelBox(m);
      marks.forEach((o) => {
        if (o.type !== "dim") return;
        expect(o.ext.some((e) => along(e).some((q) => inBox(q, box))), `${m.label} on extension of ${o.label}`).toBe(false);
      });
    });
  });
});
