import { defaultConfig, dbnThickness, engineerThickness, type CalcConfig, type SheetSize } from '../calc/config';
import { parseNumber } from './calculate';
import type { FormIssue } from './messages';

export type ThicknessTableKey = 'dbn' | 'engineer';

/** Raw form state of the calculation settings; `buildConfig` turns it into a config. */
export interface SettingsText {
  thicknessTable: ThicknessTableKey;
  seamPercent: string; // seam allowance for every kind except elbows, %
  marginPercent: string; // order margin, %
  sheet: string; // key of a sheet size, see `sheetKey`
}

export const thicknessTables = { dbn: dbnThickness, engineer: engineerThickness } as const;

export const sheetKey = (s: SheetSize) => `${s.widthMm}x${s.heightMm}`;

export function defaultSettings(base: CalcConfig = defaultConfig): SettingsText {
  return {
    thicknessTable: 'dbn',
    seamPercent: String(Math.round((base.wasteFactor.default - 1) * 100)),
    marginPercent: String(base.order.marginPercent),
    sheet: sheetKey(base.order.sheet),
  };
}

const maxPercent = 1000; // far beyond any real margin; stops 1e308 from overflowing the areas

/** A percent from text. An empty, bad or out-of-range value reports an issue and falls back to `fallback`. */
function percent(text: string, field: string, fallback: number, issues: FormIssue[]): number {
  const v = parseNumber(text);
  if (v === undefined) issues.push({ code: 'field.required', path: [field] });
  else if (Number.isNaN(v)) issues.push({ code: 'size.notFinite', path: [field] });
  else if (v < 0) issues.push({ code: 'coefficient.negative', path: [field] });
  else if (v > maxPercent) issues.push({ code: 'input.invalid', path: [field] });
  else return v;
  return fallback;
}

/** Settings text -> config. Invalid fields are reported and keep the base value, so the rest still calculates. */
export function buildConfig(
  text: SettingsText,
  base: CalcConfig = defaultConfig,
): { config: CalcConfig; issues: FormIssue[] } {
  const issues: FormIssue[] = [];
  const seam = percent(text.seamPercent, 'seamPercent', (base.wasteFactor.default - 1) * 100, issues);
  const margin = percent(text.marginPercent, 'marginPercent', base.order.marginPercent, issues);
  const sheet = base.order.sheetSizes.find((s) => sheetKey(s) === text.sheet) ?? base.order.sheet;
  return {
    config: {
      ...base,
      thickness: thicknessTables[text.thicknessTable],
      wasteFactor: { ...base.wasteFactor, default: 1 + seam / 100 },
      order: { ...base.order, marginPercent: margin, sheet },
    },
    issues,
  };
}
