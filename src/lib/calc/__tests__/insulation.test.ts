import { describe, expect, it } from 'vitest';
import { defaultConfig } from '../config';
import { insulated, insulationArea, insulationList } from '../insulation';
import { centerlineLength, developedLength, sheetArea } from '../sheet-area';
import type { Fitting } from '../types';
import { insulationCases } from '../__fixtures__/insulation.fixtures';

const material = (code: string) => defaultConfig.insulation.materials.find((m) => m.code === code)!;

describe('insulation area', () => {
  it.each(insulationCases)('$id', ({ input, thicknessMm, area }) => {
    expect(insulationArea(input, thicknessMm, defaultConfig)).toBeCloseTo(area, 6);
  });

  it.each(insulationCases)('$id: keeps the centre line, and the developed length except for reducers', ({ input, thicknessMm }) => {
    const outer = insulated(input, thicknessMm);
    expect(centerlineLength(outer)).toBeCloseTo(centerlineLength(input), 9);
    if (!input.kind.includes('Reducer')) expect(developedLength(outer)).toBeCloseTo(developedLength(input), 9);
  });

  it('is larger than the metal for a duct', () => {
    const f: Fitting = { kind: 'rectStraight', width: 300, height: 200, length: 1000 };
    expect(insulationArea(f, 10, defaultConfig)).toBeGreaterThan(sheetArea(f));
  });

  it('ignores the seam allowance of the metal', () => {
    const f: Fitting = { kind: 'roundStraight', diameter: 150, length: 1000 };
    const seam = { ...defaultConfig, wasteFactor: { ...defaultConfig.wasteFactor, default: 1.2 } };
    expect(insulationArea(f, 10, seam)).toBeCloseTo(insulationArea(f, 10, defaultConfig), 9);
  });

  it('rejects a non-positive thickness', () => {
    expect(() => insulationArea({ kind: 'roundStraight', diameter: 150, length: 1000 }, 0, defaultConfig)).toThrow();
  });
});

describe('insulationList', () => {
  it('sums per material times quantity, in the config order', () => {
    const duct: Fitting = { kind: 'roundStraight', diameter: 150, length: 1000 };
    const list = insulationList(
      [
        { fitting: duct, quantity: 2, material: material('mf30') },
        { fitting: duct, quantity: 1, material: material('kf10') },
        { fitting: duct, quantity: 3, material: material('kf10') },
      ],
      defaultConfig,
    );
    expect(list.map((g) => g.code)).toEqual(['kf10', 'mf30']);
    expect(list[0].area).toBeCloseTo(4 * insulationArea(duct, 10, defaultConfig), 9);
    expect(list[1].area).toBeCloseTo(2 * insulationArea(duct, 30, defaultConfig), 9);
  });

  it('is empty without insulated rows', () => {
    expect(insulationList([], defaultConfig)).toEqual([]);
  });
});
