import { describe, expect, it } from 'vitest';
import { developedLength, sheetArea } from '../sheet-area';
import type { Fitting } from '../types';

const r2r = (width: number, height: number, smallDiameter: number, length = 300, allowance = 50): Fitting => ({
  kind: 'rectToRoundReducer',
  width,
  height,
  smallDiameter,
  length,
  allowance,
});

/** Independent check: the same surface as a fine mesh of flat triangles (one triangle per arc step for each corner cone), m2, no allowance. */
function meshArea(width: number, height: number, d: number, length: number, steps = 20000): number {
  const [a, b, r, L] = [width / 2000, height / 2000, d / 2000, length / 1000];
  const cross = (u: number[], v: number[]) => [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
  const norm = (u: number[]) => Math.hypot(u[0], u[1], u[2]);
  const tri = (p: number[], q: number[], s: number[]) =>
    norm(cross([q[0] - p[0], q[1] - p[1], q[2] - p[2]], [s[0] - p[0], s[1] - p[1], s[2] - p[2]])) / 2;
  let cone = 0;
  for (let i = 0; i < steps; i++) {
    const [t0, t1] = [(i * Math.PI) / 2 / steps, ((i + 1) * Math.PI) / 2 / steps];
    cone += tri([a, b, 0], [r * Math.cos(t0), r * Math.sin(t0), L], [r * Math.cos(t1), r * Math.sin(t1), L]);
  }
  const sides = tri([-a, b, 0], [a, b, 0], [0, r, L]) * 2 + tri([a, -b, 0], [a, b, 0], [r, 0, L]) * 2;
  return sides + 4 * cone;
}

describe('rectToRoundReducer layout (ADR 0035)', () => {
  it.each([
    [200, 150, 150, 250],
    [600, 300, 315, 300],
    [1000, 500, 500, 300],
    [100, 800, 100, 150],
    [300, 200, 400, 300],
  ])('matches a fine triangle mesh: %ix%i to d%i, L %i', (w, h, d, l) => {
    expect(sheetArea(r2r(w, h, d, l, 0))).toBeCloseTo(meshArea(w, h, d, l), 8);
  });

  it('does not depend on which rect side is called the width', () => {
    expect(sheetArea(r2r(600, 300, 315))).toBeCloseTo(sheetArea(r2r(300, 600, 315)), 9);
    expect(sheetArea(r2r(1000, 500, 500))).toBeCloseTo(sheetArea(r2r(500, 1000, 500)), 9);
  });

  it('adds the allowance as strips at both ends: rect perimeter + circumference, times the allowance', () => {
    const strips = (2 * (0.6 + 0.3) + Math.PI * 0.315) * 0.05;
    expect(sheetArea(r2r(600, 300, 315)) - sheetArea(r2r(600, 300, 315, 300, 0))).toBeCloseTo(strips, 9);
  });

  it('lies between the round and the square duct wall for a d x d square to a circle d', () => {
    // the surface runs from the square to the inscribed circle, so it is larger than pi d L and smaller than 4 d L
    const area = sheetArea(r2r(300, 300, 300, 300, 0));
    expect(area).toBeGreaterThan(Math.PI * 0.3 * 0.3);
    expect(area).toBeLessThan(4 * 0.3 * 0.3);
  });

  it('keeps sheetArea = mean perimeter x developedLength, so insulation can reuse the length', () => {
    const f = r2r(800, 400, 400);
    const meanPerimeter = (2 * (0.8 + 0.4) + Math.PI * 0.4) / 2;
    expect(sheetArea(f)).toBeCloseTo(meanPerimeter * developedLength(f), 12);
  });
});
