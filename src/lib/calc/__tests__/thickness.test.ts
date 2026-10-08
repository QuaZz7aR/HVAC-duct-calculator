import { describe, expect, it } from 'vitest';
import { thickness } from '../thickness';
import { defaultConfig } from '../config';
import { thicknessCases } from '../__fixtures__/thickness.fixtures';

describe('thickness', () => {
  it.each(thicknessCases)('$id', (c) => {
    const size =
      c.shape === 'round'
        ? { shape: c.shape, diameter: c.diameter }
        : { shape: c.shape, width: c.width, height: c.height };
    expect(thickness(size, defaultConfig)).toBe(c.thickness);
  });

  it.each([0, -1, Number.NaN, Number.POSITIVE_INFINITY])('throws on invalid diameter %s', (diameter) => {
    expect(() => thickness({ shape: 'round', diameter }, defaultConfig)).toThrow();
  });

  it('throws when the table has no row for the size', () => {
    const broken = { ...defaultConfig, thickness: { ...defaultConfig.thickness, round: [{ fromMm: 100, thicknessMm: 1 }] } };
    expect(() => thickness({ shape: 'round', diameter: 50 }, broken)).toThrow();
  });
});
