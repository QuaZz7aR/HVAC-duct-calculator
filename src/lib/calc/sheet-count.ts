import type { OrderConfig } from './config';
import type { ThicknessGroup } from './types';

/** Metal of one sheet thickness as it is ordered. */
export interface OrderLine {
  thicknessMm: number;
  area: number; // m2, computed (the sheet list value)
  orderArea: number; // m2, with the order margin
  sheets: number; // whole sheets of the configured size
}

/** Computed area plus the order margin. The computed area itself is never changed. */
export function orderArea(area: number, marginPercent: number): number {
  if (!Number.isFinite(marginPercent) || marginPercent < 0) {
    throw new Error(`order margin must be non-negative: ${marginPercent}`);
  }
  return area * (1 + marginPercent / 100);
}

/** Whole sheets needed for `area` m2: ceil(area / sheet area). The epsilon keeps float noise (4.0000000001) from adding a sheet. */
export function sheetCount(area: number, sheet: OrderConfig['sheet']): number {
  const sheetM2 = (sheet.widthMm / 1000) * (sheet.heightMm / 1000);
  if (!(sheetM2 > 0) || !Number.isFinite(sheetM2)) {
    throw new Error(`invalid sheet size: ${sheet.widthMm} x ${sheet.heightMm}`);
  }
  return Math.max(0, Math.ceil(area / sheetM2 - 1e-9));
}

/** Per thickness: the order area (margin included) and the sheet count = ceil(order area / sheet area). */
export function orderList(groups: ThicknessGroup[], order: OrderConfig): OrderLine[] {
  return groups.map(({ thicknessMm, area }) => {
    const withMargin = orderArea(area, order.marginPercent);
    return { thicknessMm, area, orderArea: withMargin, sheets: sheetCount(withMargin, order.sheet) };
  });
}
