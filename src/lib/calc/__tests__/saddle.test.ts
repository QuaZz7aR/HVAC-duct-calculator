import { describe, expect, it } from 'vitest';
import { defaultConfig } from '../config';
import { consumptionArea } from '../consumption';
import { rectSaddle, roundSaddle } from '../saddle';
import { sheetArea } from '../sheet-area';

// brute-force sum of the sag along a branch outline, independent of the formulas in saddle.ts
function bruteRound(R: number, r: number, n = 200000) {
  let s = 0;
  for (let i = 0; i < n; i++) {
    const x = r * Math.sin((2 * Math.PI * (i + 0.5)) / n);
    s += R - Math.sqrt(R * R - x * x);
  }
  return (s / n) * 2 * Math.PI * r;
}
function bruteRect(R: number, along: number, across: number, n = 200000) {
  let s = 0;
  for (let i = 0; i < n; i++) {
    const x = -across / 2 + (across * (i + 0.5)) / n;
    s += R - Math.sqrt(R * R - x * x);
  }
  const edge = R - Math.sqrt(R * R - (across / 2) ** 2);
  return 2 * (s * across) / n + 2 * along * edge;
}

describe('saddle of a branch on a round main (ADR 0118)', () => {
  it.each([[0.1, 0.075], [0.1575, 0.075], [0.1575, 0.05], [0.125, 0.1], [0.1, 0.1]])('round R %s, r %s', (R, r) => {
    expect(roundSaddle(R, r)).toBeCloseTo(bruteRound(R, r), 7);
  });

  it.each([[0.1575, 0.3, 0.1], [0.2, 0.2, 0.2], [0.1, 0.15, 0.2]])('rect R %s, along %s, across %s', (R, along, across) => {
    expect(rectSaddle(R, along, across)).toBeCloseTo(bruteRect(R, along, Math.min(across, 2 * R)), 7);
  });

  it('adds the saddle to a tap on a round main and leaves a flat-wall tap unchanged', () => {
    const flat = sheetArea({ kind: 'roundTap', diameter: 150, length: 100 });
    expect(flat).toBeCloseTo(Math.PI * 0.15 * 0.1, 12);
    expect(sheetArea({ kind: 'roundTap', diameter: 150, length: 100, mainDiameter: 200 })).toBeCloseTo(flat + roundSaddle(0.1, 0.075), 12);
    const rect = sheetArea({ kind: 'rectTap', width: 300, height: 100, length: 100, mainDiameter: 315 });
    expect(rect).toBeCloseTo(2 * 0.4 * 0.1 + rectSaddle(0.1575, 0.3, 0.1), 12);
  });

  it('adds one saddle per branch to a round-main tee or cross only when chosen', () => {
    const tee = { kind: 'roundTee' as const, diameter: 355, branchDiameter: 200, allowance: 50 };
    const off = sheetArea(tee);
    expect(sheetArea({ ...tee, saddle: 0 })).toBeCloseTo(off, 12);
    expect(sheetArea({ ...tee, saddle: 1 })).toBeCloseTo(off + roundSaddle(0.1775, 0.1), 12);
    const cross = { kind: 'roundCrossRectBranches' as const, diameter: 315, branchWidth: 300, branchHeight: 200, allowance: 50 };
    expect(sheetArea({ ...cross, saddle: 1 })).toBeCloseTo(sheetArea(cross) + 2 * rectSaddle(0.1575, 0.3, 0.2), 12);
    // the consumption keeps the saddle and still adds back the flat cut-out
    expect(consumptionArea({ ...tee, saddle: 1 }, defaultConfig) - consumptionArea(tee, defaultConfig)).toBeCloseTo(roundSaddle(0.1775, 0.1), 12);
  });
});
