import type { CalcConfig } from './config';

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
