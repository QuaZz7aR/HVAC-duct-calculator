import { describe, expect, it } from 'vitest';
import { calculate } from '../calculate';
import { newRow, type FormRow } from '../fields';

const air = { temperatureC: '22', pressurePa: '101308' };
const straight = (diameter: string, id = 1): FormRow => ({
  ...newRow(id),
  values: { diameter, length: '1000' },
  flow: '1',
});

describe('area does not depend on the loss calculation', () => {
  it('keeps the row when the loss calculation overflows for an absurd size', () => {
    const huge = '1' + '0'.repeat(157); // mm: the area is finite, the section area squared is not
    const out = calculate([straight(huge)], air).rows[0];
    expect(out.ok).toBe(true);
    if (!out.ok) return;
    expect(out.result.lossesAvailable).toBe(false);
    expect(Number.isFinite(out.result.metalArea)).toBe(true);
    expect(out.result.metalArea).toBeGreaterThan(0);
  });
  it('leaves rows without losses out of the loss total and keeps the area total', () => {
    const normal = calculate([straight('150')], air);
    const mixed = calculate([straight('150'), straight('1' + '0'.repeat(157), 2)], air);
    expect(mixed.totalPressureDrop).toBeCloseTo(normal.totalPressureDrop, 12);
    expect(Number.isFinite(mixed.totalPressureDrop)).toBe(true);
    expect(mixed.totalMetalArea).toBeGreaterThan(normal.totalMetalArea);
  });
  it('reports losses as available for a normal size', () => {
    const out = calculate([straight('150')], air).rows[0];
    expect(out.ok && out.result.lossesAvailable).toBe(true);
  });
});
