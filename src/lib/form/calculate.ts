import { airAtConditions } from '../calc/air';
import { defaultConfig, type CalcConfig, type InsulationMaterial } from '../calc/config';
import { assembleSection } from '../calc/section';
import { centerlineLength } from '../calc/sheet-area';
import { metalArea } from '../calc/waste-factor';
import { consumptionDiffers, metalConsumption } from '../calc/consumption';
import { insulationArea, insulationList, type InsulationGroup, type InsulationItem } from '../calc/insulation';
import { orderArea, orderList, type OrderLine } from '../calc/sheet-count';
import { sheetList } from '../calc/sheet-list';
import { thickness, thicknessSize } from '../calc/thickness';
import { fittingWarnings, type FittingWarning } from '../calc/warnings';
import type { Fitting, PressureDrop } from '../calc/types';
import { airInputSchema, createSchemas, validate } from '../validation';
import { hasAllowance, isTap, kindFields, saddleKinds, type FormRow } from './fields';
import type { FormIssue } from './messages';
import { splitLength, type Pieces } from './pieces';

/** Raw text -> number. Accepts a decimal comma; empty -> undefined; anything else non-numeric -> NaN. */
export function parseNumber(text: string | undefined): number | undefined {
  const t = (text ?? '').trim().replace(',', '.');
  if (t === '') return undefined;
  if (!/^[+-]?(\d+\.?\d*|\.\d+)$/.test(t)) return NaN;
  const n = Number(t);
  return Number.isFinite(n) ? n : NaN; // a very long digit string overflows to Infinity
}

export interface RowResult {
  id: number;
  fitting: Fitting;
  quantity: number;
  thicknessMm: number;
  metalArea: number; // m2, one piece, waste factor included
  metalAreaTotal: number; // m2, times quantity
  metalConsumption: number; // m2, one piece, waste factor included: reducers at least the minimum length, tees without cut-outs (ADR 0042)
  metalConsumptionTotal: number; // m2, times quantity; the order, the sheet list and the price use this
  consumptionDiffers: boolean; // true when the consumption rule changes this row (a short reducer, a tee or cross)
  insulation: { code: string; area: number; areaTotal: number } | null; // m2 one piece and times quantity; null = not insulated
  centerlineLength: number; // m
  pressureDrop: PressureDrop; // all NaN when `lossesAvailable` is false
  totalLoss: number; // Pa, friction + local, one piece; NaN when `lossesAvailable` is false
  lossesAvailable: boolean; // false when the loss calculation overflowed or failed; the area above is still valid
  warnings: FittingWarning[]; // advice only, the numbers above are unchanged
  pieces: Pieces | null; // straights longer than the max piece length, one row item; the area is unchanged (ADR 0045)
}

export type RowOutcome = { ok: true; result: RowResult } | { ok: false; id: number; issues: FormIssue[] };

export interface Calculation {
  air: { ok: true } | { ok: false; issues: FormIssue[] };
  rows: RowOutcome[];
  sheetList: OrderLine[]; // per thickness, by metal consumption: consumption, consumption with the order margin, whole sheets
  totalMetalArea: number; // m2, times quantity, the actual area
  totalMetalConsumption: number; // m2, times quantity, the metal consumption (ADR 0042)
  totalMetalAreaToOrder: number; // m2, the metal consumption plus the order margin (config.order.marginPercent)
  insulationList: InsulationGroup[]; // m2 per material, times quantity
  totalInsulationArea: number; // m2, all materials
  totalPressureDrop: number; // Pa, times quantity; rows with unavailable losses are left out
  skipped: number; // rows left out because of errors
}

/** Form text -> validated core fitting plus the section inputs. */
function parseRow(row: FormRow, schemas: ReturnType<typeof createSchemas>, config: CalcConfig) {
  const issues: FormIssue[] = [];

  const raw: Record<string, unknown> = { kind: row.kind };
  let maxPiece: number | undefined;
  for (const f of kindFields[row.kind]) {
    const v = parseNumber(row.values[f.key]);
    if (f.formOnly) {
      // the max piece length: empty or 0 = no split
      if (v !== undefined && Number.isNaN(v)) issues.push({ code: 'size.notFinite', path: [f.key] });
      else if (v !== undefined && v < 0) issues.push({ code: 'size.nonPositive', path: [f.key] });
      else maxPiece = v;
      continue;
    }
    if (v !== undefined) raw[f.key] = v;
  }
  // the number of allowances is a choice, not typed text; an empty choice leaves the core default (2)
  const count = row.allowanceCount ?? '';
  if (hasAllowance(row.kind) && count !== '') raw.allowanceCount = Number(count);
  // the saddle on a round main (ADR 0118): a tap takes the main diameter, a round-main tee or cross the on / off choice
  const saddle = (row.saddle ?? '').trim();
  if (saddle !== '' && saddleKinds.has(row.kind)) {
    if (isTap(row.kind)) raw.mainDiameter = parseNumber(saddle);
    else raw.saddle = saddle === '1' ? 1 : 0;
  }
  // fitting and quantity go through the sheet-list item schema; its issues for the fitting carry a leading 'fitting' path segment
  // an empty quantity is NaN here so it reports quantity.invalid, as before, not the schema's generic field.required
  const item = validate(schemas.sheetListItem, { fitting: raw, quantity: parseNumber(row.quantity) ?? NaN });
  if (!item.ok) {
    issues.push(...item.issues.map((i) => (i.path[0] === 'fitting' ? { ...i, path: i.path.slice(1) } : i)));
  }

  const flow = parseNumber(row.flow);
  if (flow === undefined) issues.push({ code: 'field.required', path: ['flow'] });
  else if (!(flow > 0)) issues.push({ code: Number.isNaN(flow) ? 'size.notFinite' : 'flow.nonPositive', path: ['flow'] });

  // an empty zeta means no local resistance
  const zeta = parseNumber(row.zeta) ?? 0;
  if (Number.isNaN(zeta)) issues.push({ code: 'size.notFinite', path: ['zeta'] });
  else if (zeta < 0) issues.push({ code: 'coefficient.negative', path: ['zeta'] });

  const code = (row.insulation ?? '').trim();
  const material = code === '' ? null : insulationMaterial(code, config);
  if (code !== '' && !material) issues.push({ code: 'insulation.unknown', path: ['insulation'] });

  if (issues.length > 0 || !item.ok) return { ok: false as const, issues };
  return { ok: true as const, fitting: item.value.fitting, quantity: item.value.quantity, flow: flow!, zeta, material, maxPiece };
}

export function calculate(
  rows: FormRow[],
  airText: { temperatureC: string; pressurePa: string },
  config: CalcConfig = defaultConfig,
): Calculation {
  const air = validate(airInputSchema, {
    temperatureC: parseNumber(airText.temperatureC),
    pressurePa: parseNumber(airText.pressurePa),
  });
  const airResult = air.ok ? airAtConditions(air.value.temperatureC, air.value.pressurePa, config) : undefined;

  const schemas = createSchemas(config);
  const outcomes: RowOutcome[] = [];
  const valid: { fitting: Fitting; quantity: number }[] = [];
  const insulatedItems: InsulationItem[] = [];
  let totalPressureDrop = 0;
  for (const row of rows) {
    const p = parseRow(row, schemas, config);
    if (!p.ok) {
      outcomes.push({ ok: false, id: row.id, issues: p.issues });
    } else if (!airResult) {
      // air errors are shown once, in the air block; the row itself is fine
      outcomes.push({ ok: false, id: row.id, issues: [] });
    } else {
      let result: RowResult;
      try {
        // the area never depends on the loss calculation: that one may overflow for absurd sizes and then only marks the losses unavailable
        const area = metalArea(p.fitting, config);
        const used = metalConsumption(p.fitting, config);
        let pressureDrop: PressureDrop = { velocity: NaN, reynolds: NaN, dynamicPressure: NaN, frictionFactor: NaN, frictionLoss: NaN, localLoss: NaN };
        let totalLoss = NaN;
        const s = assembleSection({ fitting: p.fitting, flow: p.flow, localCoefficient: p.zeta }, airResult, config);
        const sum = s.pressureDrop.frictionLoss + s.pressureDrop.localLoss;
        if (Number.isFinite(sum)) {
          pressureDrop = s.pressureDrop;
          totalLoss = sum;
        }
        const ins = p.material ? insulationArea(p.fitting, p.material.thicknessMm, config) : NaN;
        result = {
          id: row.id,
          fitting: p.fitting,
          quantity: p.quantity,
          thicknessMm: thickness(thicknessSize(p.fitting), config),
          metalArea: area,
          metalAreaTotal: area * p.quantity,
          metalConsumption: used,
          metalConsumptionTotal: used * p.quantity,
          consumptionDiffers: consumptionDiffers(p.fitting, config),
          insulation: p.material ? { code: p.material.code, area: ins, areaTotal: ins * p.quantity } : null,
          centerlineLength: centerlineLength(p.fitting),
          pressureDrop,
          totalLoss,
          lossesAvailable: Number.isFinite(totalLoss),
          warnings: fittingWarnings(p.fitting, config),
          pieces: 'length' in p.fitting && (p.fitting.kind === 'roundStraight' || p.fitting.kind === 'rectStraight') ? splitLength(p.fitting.length, p.maxPiece) : null,
        };
        // sizes near the float limit pass validation but overflow; a size below the first table row has no thickness;
        // a branch cut-out larger than the wall (tees, crosses) gives a non-positive area, which is not a duct
        if (![result.metalArea, result.metalAreaTotal, result.metalConsumptionTotal, result.centerlineLength].every(Number.isFinite) || result.metalArea <= 0) {
          throw new Error('not a valid section');
        }
        if (result.insulation && !(Number.isFinite(result.insulation.areaTotal) && result.insulation.area > 0)) {
          throw new Error('not a valid insulation area');
        }
      } catch {
        outcomes.push({ ok: false, id: row.id, issues: [{ code: 'input.invalid', path: [] }] });
        continue;
      }
      outcomes.push({ ok: true, result });
      valid.push({ fitting: p.fitting, quantity: p.quantity });
      if (p.material) insulatedItems.push({ fitting: p.fitting, quantity: p.quantity, material: p.material });
      if (result.lossesAvailable) totalPressureDrop += p.quantity * result.totalLoss;
    }
  }

  const groups = sheetList(valid, config, metalConsumption);
  const totalMetalConsumption = groups.reduce((sum, g) => sum + g.area, 0);
  const totalMetalArea = valid.reduce((sum, v) => sum + v.quantity * metalArea(v.fitting, config), 0);
  const insulation = insulationList(insulatedItems, withMaterials(config, insulatedItems.map((i) => i.material)));
  return {
    air: air.ok ? { ok: true } : { ok: false, issues: air.issues },
    rows: outcomes,
    sheetList: orderList(groups, config.order),
    totalMetalArea,
    totalMetalConsumption,
    totalMetalAreaToOrder: orderArea(totalMetalConsumption, config.order.marginPercent),
    insulationList: insulation,
    totalInsulationArea: insulation.reduce((sum, g) => sum + g.area, 0),
    totalPressureDrop,
    // rows blocked only by invalid air carry no issues of their own and are not counted
    skipped: outcomes.filter((o) => !o.ok && o.issues.length > 0).length,
  };
}

/** Largest layer thickness the form accepts, mm (ADR 0120). */
export const maxInsulationMm = 200;

/** Code of a typed external insulation thickness (ADR 0120): one list line per thickness. */
export const externalCode = (thicknessMm: number) => `ext${thicknessMm}`;

/**
 * The row's insulation (ADR 0120): a typed thickness in mm («Зовнішній утеплювач», no material),
 * or a legacy material code of `config.insulation.materials` (older saved rows and tests). Null = not valid.
 */
export function insulationMaterial(text: string, config: CalcConfig): InsulationMaterial | null {
  const legacy = config.insulation.materials.find((m) => m.code === text);
  if (legacy) return legacy;
  const t = parseNumber(text);
  return t !== undefined && t > 0 && t <= maxInsulationMm ? { code: externalCode(t), thicknessMm: t } : null;
}

/** The config's list plus the typed thicknesses, thinnest first, so `insulationList` keeps a line for each. */
function withMaterials(config: CalcConfig, used: InsulationMaterial[]): CalcConfig {
  const known = new Set(config.insulation.materials.map((m) => m.code));
  const extra = new Map<string, InsulationMaterial>();
  for (const m of used) if (!known.has(m.code)) extra.set(m.code, m);
  if (extra.size === 0) return config;
  const materials = [...config.insulation.materials, ...[...extra.values()].sort((a, b) => a.thicknessMm - b.thicknessMm)];
  return { ...config, insulation: { ...config.insulation, materials } };
}
