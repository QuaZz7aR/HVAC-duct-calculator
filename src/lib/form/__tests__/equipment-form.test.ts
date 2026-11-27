import { describe, expect, it } from 'vitest';
import { defaultConfig } from '../../calc/config';
import { equipmentInsulationArea } from '../../calc/equipment';
import { calculate } from '../calculate';
import { addEquipment, calculateEquipmentRow, newEquipment, type EquipmentRow } from '../equipment';
import { newRow } from '../fields';
import { parseProject, serializeProject } from '../project-store';
import { defaultSettings } from '../settings';
import { emptyPrices } from '../price';

const air = { temperatureC: '20', pressurePa: '101325' };
const row = (patch: Partial<EquipmentRow> = {}): EquipmentRow => ({ ...newEquipment(1), ...patch });
const mf30 = defaultConfig.insulation.materials.find((m) => m.code === 'mf30')!;

describe('equipment rows (ADR 0120)', () => {
  it('a new row is a casing with two rect openings, insulated', () => {
    const o = calculateEquipmentRow(newEquipment(1));
    expect(o.ok).toBe(true);
    expect(o.ok && o.result.equipment.openings).toHaveLength(2);
    expect(o.ok && o.result.insulation?.area).toBeGreaterThan(0);
  });

  it('text -> equipment, area times quantity', () => {
    const o = calculateEquipmentRow(row({ length: '1500', width: '800', height: '600', quantity: '2', insulation: 'mf30',
      openings: [{ shape: 'round', a: '315', b: '' }, { shape: 'rect', a: '500', b: '300' }] }));
    if (!o.ok) throw new Error('row failed');
    const one = equipmentInsulationArea({ length: 1500, width: 800, height: 600, openings: [{ shape: 'round', diameter: 315 }, { shape: 'rect', width: 500, height: 300 }] }, mf30.thicknessMm);
    expect(o.result.insulation).toEqual({ code: 'mf30', area: one, areaTotal: 2 * one });
  });

  it('reports bad sizes on their fields, openings by index', () => {
    const o = calculateEquipmentRow(row({ width: '', openings: [{ shape: 'rect', a: '400', b: '0' }, { shape: 'round', a: 'x', b: '' }], quantity: '0' }));
    expect(o.ok).toBe(false);
    const paths = !o.ok ? o.issues.map((i) => i.path.join('.')) : [];
    expect(paths).toEqual(expect.arrayContaining(['width', 'openings.0.b', 'openings.1.a', 'quantity']));
  });

  it('openings larger than the casing are an error, not a negative area', () => {
    const o = calculateEquipmentRow(row({ length: '100', width: '100', height: '100', openings: [{ shape: 'rect', a: '2000', b: '2000' }] }));
    expect(o.ok).toBe(false);
    expect(!o.ok && o.issues.map((i) => i.code)).toEqual(['equipment.openings']);
  });

  it('an unknown material is an error; no material = counted without insulation', () => {
    expect(calculateEquipmentRow(row({ insulation: 'zz' })).ok).toBe(false);
    const o = calculateEquipmentRow(row({ insulation: '' }));
    expect(o.ok && o.result.insulation).toBeNull();
  });

  it('adds its insulation to the list and the total, no metal', () => {
    const fittings = [{ ...newRow(1, 'roundStraight'), values: { diameter: '200', length: '1000', maxPiece: '' }, insulation: 'mf30', flow: '1' }];
    const calc = calculate(fittings, air);
    const eq = row({ id: 7, insulation: 'mf30' });
    const all = addEquipment(calc, [eq, row({ id: 8, insulation: 'kf13' }), row({ id: 9, width: '' })]);
    const eqArea = calculateEquipmentRow(eq);
    if (!eqArea.ok) throw new Error('row failed');
    expect(all.insulationList.map((g) => g.code)).toEqual(['kf13', 'mf30']);
    expect(all.insulationList.find((g) => g.code === 'mf30')!.area).toBeCloseTo(calc.insulationList[0].area + eqArea.result.insulation!.areaTotal, 9);
    expect(all.totalInsulationArea).toBeCloseTo(all.insulationList.reduce((s, g) => s + g.area, 0), 9);
    expect(all.totalMetalArea).toBe(calc.totalMetalArea);
    expect(all.sheetList).toEqual(calc.sheetList);
    expect(all.equipmentSkipped).toBe(1);
  });

  it('is saved with the project and read back', () => {
    const eq = row({ id: 3, name: 'ПВУ-1', openings: [{ shape: 'round', a: '250', b: '' }] });
    const back = parseProject(serializeProject({ rows: [], settings: defaultSettings(), prices: emptyPrices(), equipment: [eq] }));
    expect(back?.equipment).toEqual([eq]);
  });

  it('an older project without equipment reads as none; broken rows are skipped', () => {
    const text = serializeProject({ rows: [], settings: defaultSettings(), prices: emptyPrices() });
    expect(parseProject(text)?.equipment).toEqual([]);
    const data = JSON.parse(text);
    data.equipment = [{ id: 'x' }, { id: 2, openings: [{ shape: 'oval' }, { shape: 'rect', a: '1', b: '2' }] }];
    expect(parseProject(JSON.stringify(data))?.equipment).toEqual([
      { ...newEquipment(2), name: '', length: '', width: '', height: '', quantity: '1', insulation: '', openings: [{ shape: 'rect', a: '1', b: '2' }] },
    ]);
  });
});
