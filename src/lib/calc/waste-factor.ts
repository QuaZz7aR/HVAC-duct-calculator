import type { CalcConfig, WasteRow } from './config';
import { sheetArea } from './sheet-area';
import type { Fitting } from './types';

/** Equivalent diameter of a rectangle in mm: the round duct with the same friction per unit length. */
const equivalentDiameter = (width: number, height: number): number => (2 * width * height) / (width + height);

/** Factor from a table of bands; throws on a non-positive or non-finite key. */
function lookup(rows: WasteRow[], key: number, version: string): number {
  if (!Number.isFinite(key) || key <= 0) {
    throw new Error(`invalid duct size for waste factor: ${key}`);
  }
  const row = rows.findLast((r) => r.fromMm <= key);
  if (!row) {
    throw new Error(`waste factor table ${version} has no row for size ${key}`);
  }
  return row.factor;
}

/** Cutting-waste multiplier: elbows by size band, every other kind the config default. */
export function wasteFactor(f: Fitting, config: CalcConfig): number {
  const table = config.wasteFactor;
  switch (f.kind) {
    case 'roundElbow':
      // round elbow is keyed by its diameter
      return lookup(table.round, f.diameter, table.version);
    case 'rectElbow':
      // rect elbow is keyed by the equivalent diameter 2WH/(W+H)
      return lookup(table.rect, equivalentDiameter(f.width, f.height), table.version);
    default:
      return table.default;
  }
}

/** Sheet-metal area in m2 including the cutting-waste factor. */
export function metalArea(f: Fitting, config: CalcConfig): number {
  return sheetArea(f) * wasteFactor(f, config);
}
