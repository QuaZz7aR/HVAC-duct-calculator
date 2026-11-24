import type { Calculation, RowOutcome } from "@/lib/form/calculate";
import type { FormRow } from "@/lib/form/fields";
import { positionLabel } from "@/lib/form/order";
import type { Pricing } from "@/lib/form/price";
import type { SettingsText } from "@/lib/form/settings";
import type { Dictionary } from "@/lib/i18n";
import type { CostTotal } from "@/lib/calc/price";
import type { XCell, XSheet } from "@/lib/export/xlsx-writer";
import { rowTitle, sizeLabel } from "./format";

export interface ReportInput {
  rows: FormRow[];
  outcome: (id: number) => RowOutcome | undefined;
  calc: Calculation;
  pricing: Pricing;
  settings: SettingsText;
  date: Date;
}

const b = (value: string | number, digits?: number): XCell => ({ value, bold: true, digits });
const n = (value: number, digits = 3): XCell => ({ value, digits });
/** A cost total, or empty when no line has a price (as «—» in «Разом»). */
const cost = (t: CostTotal, lines: number): XCell => (lines > 0 && t.unpriced < lines ? b(t.total, 2) : null);
const plainSizes = (s: string) => s.replace(/[₀-₉]/g, (c) => String(c.charCodeAt(0) - 0x2080));

/**
 * The export workbook (ADR 0102): the results by item with the totals, the metal list by thickness and the insulation list,
 * the same numbers as on the page. The insulation sheet and the price columns appear only when they have content.
 */
export function reportSheets(input: ReportInput, dict: Dictionary): XSheet[] {
  const { rows, outcome, calc, pricing, settings } = input;
  const d = dict.export;
  const [w, h] = settings.sheet.split("x").map(Number);
  const head = [b(dict.appTitle)], when = [d.date(input.date.toLocaleDateString(dict.locale))];
  const insulated = calc.insulationList.length > 0;

  const spec: XCell[][] = [head, when, [], [
    b(d.position), b(dict.results.item), b(d.sizes), b(d.quantity), b(dict.results.thickness), b(dict.results.metalArea),
    b(dict.results.metalAreaTotal), b(dict.results.metalConsumption), b(dict.results.metalConsumptionTotal),
    ...(insulated ? [b(dict.results.insulationTotal)] : []), b(d.pieces),
  ]];
  rows.forEach((row, i) => {
    const name = [positionLabel(row, i), rowTitle(row, dict), plainSizes(sizeLabel(row, dict))] as XCell[];
    const o = outcome(row.id);
    if (!o?.ok) {
      spec.push([...name, null, d.notCounted]);
      return;
    }
    const r = o.result, p = r.pieces;
    spec.push([
      ...name, r.quantity, n(r.thicknessMm, 2), n(r.metalArea), n(r.metalAreaTotal), n(r.metalConsumption), n(r.metalConsumptionTotal),
      ...(insulated ? [r.insulation ? n(r.insulation.areaTotal) : null] : []),
      p ? dict.results.pieces(String(p.full), (p.pieceMm / 1000).toLocaleString(dict.locale), p.restMm > 0 ? (p.restMm / 1000).toLocaleString(dict.locale) : null).replace(/^[^:]*:\s*/, "") : null,
    ]);
  });
  const metalLines = pricing.metal.length, insLines = pricing.insulation.length;
  spec.push([], [b(dict.totals.title)],
    [dict.totals.metalArea, b(calc.totalMetalArea)],
    [dict.totals.metalConsumption, b(calc.totalMetalConsumption)],
    [dict.totals.metalAreaToOrder, b(calc.totalMetalAreaToOrder)]);
  if (insulated) spec.push([dict.totals.insulationArea, b(calc.totalInsulationArea)]);
  if (pricing.total.unpriced < metalLines + insLines) {
    spec.push([dict.totals.metalCost, cost(pricing.metalTotal, metalLines)]);
    if (insulated) spec.push([dict.totals.insulationCost, cost(pricing.insulationTotal, insLines)]);
    spec.push([b(dict.totals.totalCost), cost(pricing.total, metalLines + insLines)]);
    if (pricing.total.unpriced > 0) spec.push([dict.totals.unpriced(pricing.total.unpriced)]);
  }
  if (calc.skipped > 0) spec.push([], [dict.results.skipped(calc.skipped)]);
  spec.push([], [dict.results.consumptionNote]);

  const metalPriced = pricing.metal.some((c) => c !== undefined);
  const metal: XCell[][] = [[b(dict.sheetList.title)], [d.sheetSize(w, h) + "; " + d.margin(settings.marginPercent)], [], [
    b(dict.sheetList.thickness), b(dict.sheetList.area), b(dict.sheetList.orderArea), b(dict.sheetList.sheets),
    ...(metalPriced ? [b(dict.price.cost)] : []),
  ]];
  calc.sheetList.forEach((l, i) => metal.push([n(l.thicknessMm, 2), n(l.area), n(l.orderArea), n(l.sheets, 0), ...(metalPriced ? [pricing.metal[i] === undefined ? null : n(pricing.metal[i]!, 2)] : [])]));
  metal.push([b(dict.totals.title), b(calc.totalMetalConsumption), b(calc.totalMetalAreaToOrder), b(calc.sheetList.reduce((s, l) => s + l.sheets, 0), 0),
    ...(metalPriced ? [cost(pricing.metalTotal, metalLines)] : [])], [], [dict.sheetList.note]);

  const sheets: XSheet[] = [
    { name: d.sheets.spec, rows: spec, widths: [8, 40, 22, 7, 12, 14, 14, 14, 14, ...(insulated ? [12] : []), 20] },
    { name: d.sheets.metal, rows: metal, widths: [16, 20, 16, 12, 14] },
  ];
  if (insulated) {
    const priced = pricing.insulation.some((c) => c !== undefined);
    const ins: XCell[][] = [[b(dict.insulation.title)], [], [b(dict.insulation.material), b(dict.insulation.area), ...(priced ? [b(dict.price.cost)] : [])]];
    calc.insulationList.forEach((g, i) => ins.push([
      dict.insulation.materials[g.code as keyof typeof dict.insulation.materials] ?? g.code, n(g.area),
      ...(priced ? [pricing.insulation[i] === undefined ? null : n(pricing.insulation[i]!, 2)] : []),
    ]));
    ins.push([b(dict.totals.title), b(calc.totalInsulationArea), ...(priced ? [cost(pricing.insulationTotal, insLines)] : [])], [], [dict.insulation.note]);
    sheets.push({ name: d.sheets.insulation, rows: ins, widths: [36, 14, 14] });
  }
  return sheets;
}
