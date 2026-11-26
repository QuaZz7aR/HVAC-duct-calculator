import { describe, expect, it } from 'vitest';
import { sheetArea } from '../sheet-area';

// open face of a box (ADR 0116): one width x length wall is left out
describe('rectBox open face (ADR 0116)', () => {
  const base = { kind: 'rectBox' as const, width: 95, height: 220, length: 3010, ends: 2 as const, partitions: 0 };
  it('absent or 0 = the closed box', () => {
    const closed = 2 * (0.095 + 0.22) * 3.01 + 2 * 0.095 * 0.22;
    expect(sheetArea(base)).toBeCloseTo(closed, 6);
    expect(sheetArea({ ...base, openFaces: 0 })).toBeCloseTo(closed, 6);
  });
  it('1 leaves out one 95 x 3010 wall', () => {
    expect(sheetArea({ ...base, openFaces: 1 })).toBeCloseTo((2 * 0.315 - 0.095) * 3.01 + 2 * 0.0209, 6);
  });
});
