import type { CalcConfig } from '../calc/config';
import type { FieldKey, FittingKind, FormRow } from './fields';
import { parseNumber } from './calculate';

/** Suggested fields (rect elbow: `width` is the bend-plane side, confirmed by the engineer 2026-10-16): the value follows the duct size until the user types over it. Everything else is a plain input. */
const autoRule: Partial<Record<FittingKind, { key: FieldKey; sizeKey: FieldKey; factor: (c: CalcConfig) => number }>> = {
  roundElbow: { key: 'centerRadius', sizeKey: 'diameter', factor: (c) => c.elbowRadius.roundCenterFactor },
  rectElbow: { key: 'innerRadius', sizeKey: 'width', factor: (c) => c.elbowRadius.rectInnerFactor },
};

/** Which field of this kind is suggested from the size, if any. */
export function autoKey(kind: FittingKind): FieldKey | undefined {
  return autoRule[kind]?.key;
}

/** True when the field is auto-filled and the user has not typed over it. */
export function isAuto(row: FormRow, key: FieldKey): boolean {
  return autoKey(row.kind) === key && !(row.manual ?? []).includes(key);
}

function suggest(row: FormRow, config: CalcConfig): string {
  const rule = autoRule[row.kind];
  if (!rule) return '';
  const size = parseNumber(row.values[rule.sizeKey]);
  if (size === undefined || !Number.isFinite(size) || !(size > 0)) return ''; // no valid size yet: leave the field empty, never guess
  return String(Math.round(size * rule.factor(config) * 10) / 10);
}

/** Recomputes the auto field from the current size unless the user has typed over it. */
export function applyAutoDefaults(row: FormRow, config: CalcConfig): FormRow {
  const key = autoKey(row.kind);
  if (!key || !isAuto(row, key)) return row;
  return { ...row, values: { ...row.values, [key]: suggest(row, config) } };
}

/**
 * Sets one field. Typing in the auto field (also clearing it, so it can be edited) makes it manual; only "reset" hands it back.
 * Any other field is stored as typed and the auto value follows the new size.
 */
export function setFieldValue(row: FormRow, key: FieldKey, value: string, config: CalcConfig): FormRow {
  let next: FormRow = { ...row, values: { ...row.values, [key]: value }, preset: false };
  if (autoKey(row.kind) === key) {
    next = { ...next, manual: [...(row.manual ?? []).filter((k) => k !== key), key] };
  }
  return applyAutoDefaults(next, config);
}

/** Gives the field back to the auto value. */
export function resetToAuto(row: FormRow, key: FieldKey, config: CalcConfig): FormRow {
  return applyAutoDefaults({ ...row, manual: (row.manual ?? []).filter((k) => k !== key) }, config);
}

/** A row whose kind changed: fresh prefills, no manual marks, auto field computed. */
export function withKind(row: FormRow, kind: FittingKind, values: FormRow['values'], config: CalcConfig): FormRow {
  return applyAutoDefaults({ ...row, kind, values, manual: [] }, config);
}
