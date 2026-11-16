import type { CalcConfig } from './config';
import { thickness, thicknessSize } from './thickness';
import type { Fitting, SheetListItem, ThicknessGroup } from './types';
import { metalArea } from './waste-factor';

/**
 * Metal area in m2 (waste factor included, times quantity) per sheet thickness, ascending thickness.
 * `area` is the per-piece area to sum: the actual metal area by default, `metalConsumption` for the order (ADR 0042).
 */
export function sheetList(
  items: SheetListItem[],
  config: CalcConfig,
  area: (f: Fitting, config: CalcConfig) => number = metalArea,
): ThicknessGroup[] {
  const byThickness = new Map<number, number>();
  for (const { fitting, quantity } of items) {
    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new Error(`quantity must be a positive integer: ${quantity}`);
    }
    const t = thickness(thicknessSize(fitting), config);
    byThickness.set(t, (byThickness.get(t) ?? 0) + quantity * area(fitting, config));
  }
  return [...byThickness]
    .map(([thicknessMm, area]) => ({ thicknessMm, area }))
    .sort((a, b) => a.thicknessMm - b.thicknessMm);
}
