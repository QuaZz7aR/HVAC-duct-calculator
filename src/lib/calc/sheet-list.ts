import type { CalcConfig } from './config';
import { thickness, thicknessSize } from './thickness';
import type { SheetListItem, ThicknessGroup } from './types';
import { metalArea } from './waste-factor';

/** Metal area in m2 (waste factor included, times quantity) per sheet thickness, ascending thickness. */
export function sheetList(items: SheetListItem[], config: CalcConfig): ThicknessGroup[] {
  const byThickness = new Map<number, number>();
  for (const { fitting, quantity } of items) {
    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new Error(`quantity must be a positive integer: ${quantity}`);
    }
    const t = thickness(thicknessSize(fitting), config);
    byThickness.set(t, (byThickness.get(t) ?? 0) + quantity * metalArea(fitting, config));
  }
  return [...byThickness]
    .map(([thicknessMm, area]) => ({ thicknessMm, area }))
    .sort((a, b) => a.thicknessMm - b.thicknessMm);
}
