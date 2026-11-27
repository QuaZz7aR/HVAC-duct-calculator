import { defaultConfig, type CalcConfig } from '../calc/config';
import { equipmentInsulationArea, type Equipment, type EquipmentOpening } from '../calc/equipment';
import type { InsulationGroup } from '../calc/insulation';
import { equipmentItemSchema, validate } from '../validation';
import { parseNumber, type Calculation } from './calculate';
import type { FormIssue } from './messages';

/**
 * Equipment rows (ADR 0120): an air handling unit, a duct heater, fan or cooler, kept apart from the fittings.
 * No metal, no thickness: the casing and its openings feed the insulation list only. Every value is the raw text the user typed.
 */
export interface EquipmentOpeningText {
  shape: 'round' | 'rect';
  /** round: the diameter; rect: the width */
  a: string;
  /** rect: the height; unused for round */
  b: string;
}

export interface EquipmentRow {
  id: number;
  /** free text, e.g. «ПВУ-1», «канальний вентилятор»; empty = «Обладнання N» */
  name: string;
  length: string;
  width: string;
  height: string;
  openings: EquipmentOpeningText[];
  quantity: string;
  /** insulation material code (config.insulation.materials); empty = not insulated */
  insulation: string;
}

// TODO(confirm): form prefills only - a mid-size air handling unit with two rect openings, insulated with the first material of the list
export const newOpening = (shape: EquipmentOpeningText['shape'] = 'rect'): EquipmentOpeningText =>
  shape === 'rect' ? { shape, a: '400', b: '300' } : { shape, a: '250', b: '' };

export function newEquipment(id: number, config: CalcConfig = defaultConfig): EquipmentRow {
  return {
    id, name: '', length: '1500', width: '800', height: '600',
    openings: [newOpening(), newOpening()],
    quantity: '1', insulation: config.insulation.materials[0]?.code ?? '',
  };
}

export interface EquipmentResult {
  id: number;
  equipment: Equipment;
  quantity: number;
  /** m2, one piece and times quantity; null = not insulated */
  insulation: { code: string; area: number; areaTotal: number } | null;
}

export type EquipmentOutcome = { ok: true; result: EquipmentResult } | { ok: false; id: number; issues: FormIssue[] };

/** The form field of an opening size: the rect height is 'b', the diameter and the rect width 'a'. */
const openingKey = (field: unknown) => (field === 'height' ? 'b' : 'a');

/** One row: text -> validated equipment -> its insulation area. */
export function calculateEquipmentRow(row: EquipmentRow, config: CalcConfig = defaultConfig): EquipmentOutcome {
  const raw = {
    equipment: {
      length: parseNumber(row.length),
      width: parseNumber(row.width),
      height: parseNumber(row.height),
      openings: row.openings.map((o) =>
        o.shape === 'round' ? { shape: 'round', diameter: parseNumber(o.a) } : { shape: 'rect', width: parseNumber(o.a), height: parseNumber(o.b) },
      ),
    },
    // an empty quantity is NaN so it reports quantity.invalid, as on the fittings
    quantity: parseNumber(row.quantity) ?? NaN,
  };
  const issues: FormIssue[] = [];
  const v = validate(equipmentItemSchema, raw);
  if (!v.ok) {
    for (const i of v.issues) {
      const [head, key, n, field] = i.path;
      // equipment.openings.<n>.<field> -> openings.<n>.a / b; equipment.<size> -> <size>
      if (head === 'equipment' && key === 'openings' && typeof n === 'number') issues.push({ ...i, path: ['openings', n, openingKey(field)] });
      else issues.push({ ...i, path: head === 'equipment' ? i.path.slice(1) : i.path });
    }
  }
  const material = row.insulation === '' ? null : (config.insulation.materials.find((m) => m.code === row.insulation) ?? null);
  if (row.insulation !== '' && !material) issues.push({ code: 'insulation.unknown', path: ['insulation'] });
  if (!v.ok || issues.length > 0) return { ok: false, id: row.id, issues };

  const { equipment, quantity } = v.value as { equipment: Equipment; quantity: number };
  let insulation: EquipmentResult['insulation'] = null;
  if (material) {
    const area = equipmentInsulationArea(equipment, material.thicknessMm);
    // openings that add up to the whole casing leave nothing to insulate
    if (!(Number.isFinite(area) && area > 0)) return { ok: false, id: row.id, issues: [{ code: 'equipment.openings', path: ['openings'] }] };
    insulation = { code: material.code, area, areaTotal: area * quantity };
  }
  return { ok: true, result: { id: row.id, equipment, quantity, insulation } };
}

/** The insulation list of the fittings plus the equipment, per material in the order of `config.insulation.materials`. */
export function withEquipment(groups: InsulationGroup[], equipment: EquipmentOutcome[], config: CalcConfig = defaultConfig): InsulationGroup[] {
  const byCode = new Map(groups.map((g) => [g.code, g.area]));
  for (const o of equipment) {
    if (o.ok && o.result.insulation) byCode.set(o.result.insulation.code, (byCode.get(o.result.insulation.code) ?? 0) + o.result.insulation.areaTotal);
  }
  return config.insulation.materials
    .filter((m) => byCode.has(m.code))
    .map((m) => ({ code: m.code, thicknessMm: m.thicknessMm, area: byCode.get(m.code)! }));
}

/** The calculation of the fittings with the equipment added: its outcomes, and its insulation in the list and the total. */
export function addEquipment(calc: Calculation, rows: EquipmentRow[], config: CalcConfig = defaultConfig): Calculation {
  const equipment = rows.map((r) => calculateEquipmentRow(r, config));
  const insulationList = withEquipment(calc.insulationList, equipment, config);
  return {
    ...calc,
    equipment,
    insulationList,
    totalInsulationArea: insulationList.reduce((sum, g) => sum + g.area, 0),
    equipmentSkipped: equipment.filter((o) => !o.ok).length,
  };
}

export type { EquipmentOpening };
