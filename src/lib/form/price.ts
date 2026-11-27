import { costTotal, lineCost, type CostTotal } from '../calc/price';
import { parseNumber, type Calculation } from './calculate';
import type { FormIssue } from './messages';

/** Raw price inputs, UAH per m2: metal by sheet thickness (key `priceKey`), insulation by material code. Empty = no price. */
export interface PriceText {
  metal: Record<string, string>;
  insulation: Record<string, string>;
  /** Cladding over the insulation (ADR 0120), one price for all rows; absent = no price. */
  cladding?: string;
}

export const emptyPrices = (): PriceText => ({ metal: {}, insulation: {} });

/** Key of a metal price: the thickness as plain text, e.g. "0.5". */
export const priceKey = (thicknessMm: number) => String(thicknessMm);

export interface Pricing {
  metal: (number | undefined)[]; // UAH per sheet-list line, on the area to order (margin included)
  insulation: (number | undefined)[]; // UAH per material line, on the computed area
  metalTotal: CostTotal;
  insulationTotal: CostTotal;
  cladding: number | undefined; // UAH, on the cladding area; undefined = no cladding or no price
  claddingLines: number; // 1 when there is cladding, else 0 (one priced line)
  total: CostTotal; // metal + insulation + cladding
  issues: FormIssue[];
}

const maxPrice = 1e9; // far beyond any real price per m2; stops 1e308 from overflowing the totals

/** A price from text. Empty is "no price"; a bad value is reported and treated as no price. */
function price(text: string | undefined, path: (string | number)[], issues: FormIssue[]): number | undefined {
  const v = parseNumber(text);
  if (v === undefined) return undefined;
  if (Number.isNaN(v)) issues.push({ code: 'size.notFinite', path });
  else if (v < 0) issues.push({ code: 'coefficient.negative', path });
  else if (v > maxPrice) issues.push({ code: 'input.invalid', path });
  else return v;
  return undefined;
}

/**
 * Costs of the calculated lists. Metal is priced on the area to order (what is bought, the order margin included);
 * insulation on its computed area (the order margin is for metal only, ADR 0038).
 */
export function pricing(calc: Pick<Calculation, 'sheetList' | 'insulationList'> & Partial<Pick<Calculation, 'totalCladdingArea'>>, text: PriceText): Pricing {
  const issues: FormIssue[] = [];
  const metal = calc.sheetList.map((l) => {
    const key = priceKey(l.thicknessMm);
    return lineCost(l.orderArea, price(text.metal[key], ['metalPrice', key], issues));
  });
  const insulation = calc.insulationList.map((g) =>
    lineCost(g.area, price(text.insulation[g.code], ['insulationPrice', g.code], issues)),
  );
  const metalTotal = costTotal(metal);
  const insulationTotal = costTotal(insulation);
  const claddingArea = calc.totalCladdingArea ?? 0;
  const claddingLines = claddingArea > 0 ? 1 : 0;
  const cladding = claddingLines ? lineCost(claddingArea, price(text.cladding, ['claddingPrice'], issues)) : undefined;
  const claddingTotal = costTotal(claddingLines ? [cladding] : []);
  return {
    metal,
    insulation,
    metalTotal,
    insulationTotal,
    cladding,
    claddingLines,
    total: {
      total: metalTotal.total + insulationTotal.total + claddingTotal.total,
      unpriced: metalTotal.unpriced + insulationTotal.unpriced + claddingTotal.unpriced,
    },
    issues,
  };
}
