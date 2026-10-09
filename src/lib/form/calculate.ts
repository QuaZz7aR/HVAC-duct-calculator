import { airAtConditions } from '../calc/air';
import { defaultConfig, type CalcConfig } from '../calc/config';
import { assembleSection } from '../calc/section';
import { sheetList } from '../calc/sheet-list';
import { thickness, thicknessSize } from '../calc/thickness';
import type { Fitting, PressureDrop, ThicknessGroup } from '../calc/types';
import { airInputSchema, createSchemas, validate } from '../validation';
import { kindFields, type FormRow } from './fields';
import type { FormIssue } from './messages';

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
  centerlineLength: number; // m
  pressureDrop: PressureDrop;
  totalLoss: number; // Pa, friction + local, one piece
}

export type RowOutcome = { ok: true; result: RowResult } | { ok: false; id: number; issues: FormIssue[] };

export interface Calculation {
  air: { ok: true } | { ok: false; issues: FormIssue[] };
  rows: RowOutcome[];
  sheetList: ThicknessGroup[];
  totalMetalArea: number; // m2, times quantity
  totalPressureDrop: number; // Pa, times quantity
  skipped: number; // rows left out because of errors
}

/** Form text -> validated core fitting plus the section inputs. */
function parseRow(row: FormRow, schemas: ReturnType<typeof createSchemas>) {
  const issues: FormIssue[] = [];

  const raw: Record<string, unknown> = { kind: row.kind };
  for (const f of kindFields[row.kind]) {
    const v = parseNumber(row.values[f.key]);
    if (v !== undefined) raw[f.key] = v;
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

  if (issues.length > 0 || !item.ok) return { ok: false as const, issues };
  return { ok: true as const, fitting: item.value.fitting, quantity: item.value.quantity, flow: flow!, zeta };
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
  let totalPressureDrop = 0;
  for (const row of rows) {
    const p = parseRow(row, schemas);
    if (!p.ok) {
      outcomes.push({ ok: false, id: row.id, issues: p.issues });
    } else if (!airResult) {
      // air errors are shown once, in the air block; the row itself is fine
      outcomes.push({ ok: false, id: row.id, issues: [] });
    } else {
      let result: RowResult;
      try {
        const s = assembleSection({ fitting: p.fitting, flow: p.flow, localCoefficient: p.zeta }, airResult, config);
        const totalLoss = s.pressureDrop.frictionLoss + s.pressureDrop.localLoss;
        result = {
          id: row.id,
          fitting: p.fitting,
          quantity: p.quantity,
          thicknessMm: thickness(thicknessSize(p.fitting), config),
          metalArea: s.metalArea,
          metalAreaTotal: s.metalArea * p.quantity,
          centerlineLength: s.centerlineLength,
          pressureDrop: s.pressureDrop,
          totalLoss,
        };
        // sizes near the float limit pass validation but overflow; a size below the first table row has no thickness
        if (![result.metalArea, result.centerlineLength, totalLoss].every(Number.isFinite)) throw new Error('not finite');
      } catch {
        outcomes.push({ ok: false, id: row.id, issues: [{ code: 'input.invalid', path: [] }] });
        continue;
      }
      outcomes.push({ ok: true, result });
      valid.push({ fitting: p.fitting, quantity: p.quantity });
      totalPressureDrop += p.quantity * result.totalLoss;
    }
  }

  const groups = sheetList(valid, config);
  return {
    air: air.ok ? { ok: true } : { ok: false, issues: air.issues },
    rows: outcomes,
    sheetList: groups,
    totalMetalArea: groups.reduce((sum, g) => sum + g.area, 0),
    totalPressureDrop,
    // rows blocked only by invalid air carry no issues of their own and are not counted
    skipped: outcomes.filter((o) => !o.ok && o.issues.length > 0).length,
  };
}
