/** Cost of one line: area (m2) x price per m2 (UAH). A line without a price has no cost (undefined), never zero. */
export function lineCost(area: number, pricePerM2: number | undefined): number | undefined {
  if (pricePerM2 === undefined) return undefined;
  if (!Number.isFinite(pricePerM2) || pricePerM2 < 0) {
    throw new Error(`price must be a non-negative number: ${pricePerM2}`);
  }
  return area * pricePerM2;
}

export interface CostTotal {
  total: number; // sum of the priced lines
  unpriced: number; // lines left without a price, so the total is not complete
}

/** Sum of line costs; lines without a price are counted, not treated as free. */
export function costTotal(costs: (number | undefined)[]): CostTotal {
  let total = 0;
  let unpriced = 0;
  for (const c of costs) {
    if (c === undefined) unpriced++;
    else total += c;
  }
  return { total, unpriced };
}
