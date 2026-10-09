import type { Calculation } from "@/lib/form/calculate";
import { uk as dict } from "@/lib/i18n/uk";
import { fmt } from "./format";
import { cardClass, mutedClass } from "./styles";

export function Totals({ calc }: { calc: Calculation }) {
  return (
    <section className={cardClass} aria-labelledby="totals-title">
      <h2 id="totals-title" className="mb-3 font-medium">{dict.totals.title}</h2>
      <dl className="space-y-1 text-sm">
        <div className="flex justify-between"><dt>{dict.totals.metalArea}</dt><dd className="tabular-nums font-medium">{fmt(calc.totalMetalArea)}</dd></div>
        <div className="flex justify-between"><dt>{dict.totals.pressureDrop}</dt><dd className="tabular-nums font-medium">{fmt(calc.totalPressureDrop, 2)}</dd></div>
      </dl>
      <p className={`mt-2 text-xs ${mutedClass}`}>{dict.totals.pressureDropNote}</p>
    </section>
  );
}
