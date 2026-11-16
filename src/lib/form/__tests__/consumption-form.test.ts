import { describe, expect, it } from 'vitest';
import { defaultConfig } from '../../calc/config';
import { metalConsumption } from '../../calc/consumption';
import { orderArea } from '../../calc/sheet-count';
import { metalArea } from '../../calc/waste-factor';
import { calculate } from '../calculate';
import { newRow, type FormRow } from '../fields';

const air = { temperatureC: '22', pressurePa: '101308' };
const reducer = (length: string): FormRow => ({
  ...newRow(1, 'roundReducer'),
  values: { diameter: '315', smallDiameter: '200', length, allowance: '50' },
  quantity: '2',
  flow: '500',
});

describe('two areas in the form layer', () => {
  it('a short reducer: actual area by the typed length, consumption and order by 300 mm', () => {
    const calc = calculate([reducer('150')], air);
    const out = calc.rows[0];
    expect(out.ok).toBe(true);
    if (!out.ok) return;
    const f = out.result.fitting;
    expect(out.result.metalArea).toBeCloseTo(metalArea(f, defaultConfig), 12);
    expect(out.result.metalConsumption).toBeCloseTo(metalConsumption({ ...f, length: 300 } as typeof f, defaultConfig), 12);
    expect(out.result.consumptionDiffers).toBe(true);
    expect(calc.totalMetalArea).toBeCloseTo(2 * out.result.metalArea, 12);
    expect(calc.totalMetalConsumption).toBeCloseTo(2 * out.result.metalConsumption, 12);
    expect(calc.sheetList[0].area).toBeCloseTo(calc.totalMetalConsumption, 12);
    expect(calc.totalMetalAreaToOrder).toBeCloseTo(orderArea(calc.totalMetalConsumption, defaultConfig.order.marginPercent), 12);
  });

  it('a 300 mm reducer: both areas are the same', () => {
    const out = calculate([reducer('300')], air).rows[0];
    if (!out.ok) throw new Error('row failed');
    expect(out.result.metalConsumption).toBe(out.result.metalArea);
    expect(out.result.consumptionDiffers).toBe(false);
  });
});
