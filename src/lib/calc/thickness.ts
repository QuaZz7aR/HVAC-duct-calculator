import type { CalcConfig } from './config';
import type { Fitting } from './types';

export type ThicknessSize =
  | { shape: 'round'; diameter: number }
  | { shape: 'rect'; width: number; height: number }; // mm

/** Sheet thickness in mm from the config table. Throws on a non-positive or non-finite size. */
export function thickness(size: ThicknessSize, config: CalcConfig): number {
  // round is keyed by diameter, rect by the larger side
  const key = size.shape === 'round' ? size.diameter : Math.max(size.width, size.height);
  if (!Number.isFinite(key) || key <= 0) {
    throw new Error(`invalid duct size for thickness: ${JSON.stringify(size)}`);
  }
  const rows = size.shape === 'round' ? config.thickness.round : config.thickness.rect;
  const row = rows.findLast((r) => r.fromMm <= key);
  if (!row) {
    throw new Error(`thickness table ${config.thickness.version} has no row for ${size.shape} size ${key}`);
  }
  return row.thicknessMm;
}

/**
 * Which size of a fitting keys the thickness lookup: the larger side over both ends of a reducer, the rect end of rect-to-round (as in the Excel).
 * TODO(confirm): Excel convention (columns C/D); handbooks may key on the larger of the two ends.
 */
export function thicknessSize(f: Fitting): ThicknessSize {
  switch (f.kind) {
    case 'roundStraight':
    case 'roundCap':
    case 'roundElbow':
    case 'roundReducer':
      return { shape: 'round', diameter: f.diameter };
    case 'rectStraight':
    case 'rectCap':
    case 'rectElbow':
    case 'rectReducer':
    case 'rectToRoundReducer':
      return { shape: 'rect', width: f.width, height: f.height };
    default:
      return assertNever(f);
  }
}

function assertNever(x: never): never {
  throw new Error(`unknown fitting: ${JSON.stringify(x)}`);
}
