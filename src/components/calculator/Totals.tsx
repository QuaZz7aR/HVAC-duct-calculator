import type { Calculation } from "@/lib/form/calculate";
import type { FormIssue } from "@/lib/form/messages";
import type { Pricing } from "@/lib/form/price";
import { uk as dict } from "@/lib/i18n/uk";
import { ErrorList } from "./ErrorList";
import { fmt } from "./format";
import { cardClass, mutedClass } from "./styles";

/** A cost, or a dash when there is no line or no line has a price yet. */
function money(c: { total: number; unpriced: number }, lines: number) {
  return c.unpriced === lines ? dict.totals.noPrice : fmt(c.total, 2);
}

export function Totals({ calc, pricing, priceIssues }: { calc: Calculation; pricing: Pricing; priceIssues: FormIssue[] }) {
  const metalLines = pricing.metal.length;
  const insulationLines = pricing.insulation.length;
  return (
    <section className={cardClass} aria-labelledby="totals-title">
      <h2 id="totals-title" className="mb-3 font-medium">{dict.totals.title}</h2>
      <dl className="space-y-1 text-sm">
        <div className="flex justify-between"><dt>{dict.totals.metalArea}</dt><dd className="tabular-nums font-medium">{fmt(calc.totalMetalArea)}</dd></div>
        <div className="flex justify-between"><dt>{dict.totals.metalAreaToOrder}</dt><dd className="tabular-nums font-medium">{fmt(calc.totalMetalAreaToOrder)}</dd></div>
        <div className="flex justify-between"><dt>{dict.totals.insulationArea}</dt><dd className="tabular-nums font-medium">{fmt(calc.totalInsulationArea)}</dd></div>
        <div className="flex justify-between border-t border-line pt-1"><dt>{dict.totals.metalCost}</dt><dd className="tabular-nums font-medium">{money(pricing.metalTotal, metalLines)}</dd></div>
        <div className="flex justify-between"><dt>{dict.totals.insulationCost}</dt><dd className="tabular-nums font-medium">{money(pricing.insulationTotal, insulationLines)}</dd></div>
        <div className="flex justify-between"><dt className="font-medium">{dict.totals.totalCost}</dt><dd className="tabular-nums font-semibold">{money(pricing.total, metalLines + insulationLines)}</dd></div>
      </dl>
      {pricing.total.unpriced > 0 && pricing.total.unpriced < metalLines + insulationLines && (
        <p className={`mt-2 text-xs ${mutedClass}`}>{dict.totals.unpriced(pricing.total.unpriced)}</p>
      )}
      <ErrorList issues={priceIssues} />
    </section>
  );
}
