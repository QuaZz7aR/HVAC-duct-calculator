import type { Calculation } from "@/lib/form/calculate";
import type { Pricing } from "@/lib/form/price";
import { useI18n } from "@/components/i18n";
import { PriceInput } from "./PriceInput";
import { cardClass, mutedClass } from "./styles";
import { Info } from "./Info";
import { insulationName } from "./format";

interface Props {
  groups: Calculation["insulationList"];
  prices: Record<string, string>;
  costs: Pricing["insulation"];
  onPrice: (code: string, value: string) => void;
}

export function InsulationList({ groups, prices, costs, onPrice }: Props) {
  const { dict, fmt } = useI18n();
  return (
    <section className={`min-w-0 ${cardClass}`} aria-labelledby="insulation-title">
      <h2 id="insulation-title" className="mb-3 font-medium">{dict.insulation.title}</h2>
      {groups.length === 0 ? (
        <p className={`text-sm ${mutedClass}`}>{dict.insulation.empty}</p>
      ) : (
        <>
        {/* phone: one block per material, label beside value (ADR 0058) */}
        <ul className="space-y-2 sm:hidden">
          {groups.map((g, i) => {
            const name = insulationName(g.code, dict);
            const cost = costs[i];
            return (
              <li key={g.code} className="rounded-md border border-line p-2 text-sm">
                <p className="mb-1 font-medium">{name}</p>
                <dl className="space-y-1">
                  <div className="flex justify-between gap-2"><dt className={mutedClass}>{dict.insulation.area}</dt><dd className="tabular-nums">{fmt(g.area)}</dd></div>
                  <div className="flex items-center justify-between gap-2"><dt className={mutedClass}>{dict.price.perM2}<Info text={dict.help.columns.price} /></dt><dd><PriceInput label={dict.price.insulationLabel(name)} value={prices[g.code] ?? ""} onChange={(v) => onPrice(g.code, v)} /></dd></div>
                  <div className="flex justify-between gap-2"><dt className={mutedClass}>{dict.price.cost}</dt><dd className="tabular-nums font-medium">{cost === undefined ? dict.totals.noPrice : fmt(cost, 2)}</dd></div>
                </dl>
              </li>
            );
          })}
        </ul>
        <div className="hidden overflow-x-auto sm:block">
          <table className="w-full text-sm">
            <thead className={`text-left text-xs ${mutedClass}`}>
              <tr>
                <th className="py-1">{dict.insulation.material}</th>
                <th className="text-right">{dict.insulation.area}</th>
                <th className="pl-2 text-right">{dict.price.perM2}<Info text={dict.help.columns.price} /></th>
                <th className="pl-2 text-right">{dict.price.cost}</th>
              </tr>
            </thead>
            <tbody>
              {groups.map((g, i) => {
                const name = insulationName(g.code, dict);
                const cost = costs[i];
                return (
                  <tr key={g.code} className="border-t border-line">
                    <td className="py-1">{name}</td>
                    <td className="text-right tabular-nums">{fmt(g.area)}</td>
                    <td className="py-1 pl-2 text-right">
                      <PriceInput label={dict.price.insulationLabel(name)} value={prices[g.code] ?? ""} onChange={(v) => onPrice(g.code, v)} />
                    </td>
                    <td className="pl-2 text-right tabular-nums">{cost === undefined ? dict.totals.noPrice : fmt(cost, 2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        </>
      )}
      <p className={`mt-2 text-xs ${mutedClass}`}>{dict.insulation.note}</p>
    </section>
  );
}
