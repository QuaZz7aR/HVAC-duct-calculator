import type { Calculation } from "@/lib/form/calculate";
import type { FormIssue } from "@/lib/form/messages";
import type { Pricing } from "@/lib/form/price";
import { useI18n } from "@/components/i18n";
import type { SettingsText } from "@/lib/form/settings";
import { ErrorList } from "./ErrorList";
import { MarginField, SeamField } from "./SettingsPanel";
import { cardClass, mutedClass } from "./styles";

/** A cost, or a dash when there is no line or no line has a price yet. */
function money(c: { total: number; unpriced: number }, lines: number, noPrice: string, fmt: (n: number, digits?: number) => string) {
  return c.unpriced === lines ? noPrice : fmt(c.total, 2);
}

interface Props {
  calc: Calculation;
  pricing: Pricing;
  priceIssues: FormIssue[];
  settings: SettingsText;
  onSettings: (settings: SettingsText) => void;
}

export function Totals({ calc, pricing, priceIssues, settings, onSettings }: Props) {
  const { dict, fmt } = useI18n();
  const metalLines = pricing.metal.length;
  const insulationLines = pricing.insulation.length;
  const claddingLines = pricing.claddingLines;
  const allLines = metalLines + insulationLines + claddingLines;
  return (
    <section className={cardClass} aria-labelledby="totals-title">
      <h2 id="totals-title" className="mb-3 font-medium">{dict.totals.title}</h2>
      <div className="adv-only mb-3 grid gap-3 sm:grid-cols-2">
        <SeamField settings={settings} onChange={onSettings} />
        <MarginField settings={settings} onChange={onSettings} />
      </div>
      <dl className="space-y-1 text-sm">
        <div className="flex justify-between"><dt>{dict.totals.metalArea}</dt><dd className="tabular-nums font-medium">{fmt(calc.totalMetalArea)}</dd></div>
        <div className="flex justify-between"><dt>{dict.totals.metalConsumption}</dt><dd className="tabular-nums font-medium">{fmt(calc.totalMetalConsumption)}</dd></div>
        <div className="flex justify-between"><dt>{dict.totals.metalAreaToOrder}</dt><dd className="tabular-nums font-medium">{fmt(calc.totalMetalAreaToOrder)}</dd></div>
        <div className="adv-only flex justify-between"><dt>{dict.totals.insulationArea}</dt><dd className="tabular-nums font-medium">{fmt(calc.totalInsulationArea)}</dd></div>
        {calc.totalCladdingArea > 0 && <div className="adv-only flex justify-between"><dt>{dict.totals.claddingArea}</dt><dd className="tabular-nums font-medium">{fmt(calc.totalCladdingArea)}</dd></div>}
        <div className="adv-only flex justify-between border-t border-line pt-1"><dt>{dict.totals.metalCost}</dt><dd className="tabular-nums font-medium">{money(pricing.metalTotal, metalLines, dict.totals.noPrice, fmt)}</dd></div>
        <div className="adv-only flex justify-between"><dt>{dict.totals.insulationCost}</dt><dd className="tabular-nums font-medium">{money(pricing.insulationTotal, insulationLines, dict.totals.noPrice, fmt)}</dd></div>
        {claddingLines > 0 && <div className="adv-only flex justify-between"><dt>{dict.totals.claddingCost}</dt><dd className="tabular-nums font-medium">{pricing.cladding === undefined ? dict.totals.noPrice : fmt(pricing.cladding, 2)}</dd></div>}
        <div className="adv-only flex justify-between"><dt className="font-medium">{dict.totals.totalCost}</dt><dd className="tabular-nums font-semibold">{money(pricing.total, allLines, dict.totals.noPrice, fmt)}</dd></div>
      </dl>
      {pricing.total.unpriced > 0 && pricing.total.unpriced < allLines && (
        <p className={`adv-only mt-2 text-xs ${mutedClass}`}>{dict.totals.unpriced(pricing.total.unpriced)}</p>
      )}
      <ErrorList issues={priceIssues} />
    </section>
  );
}
