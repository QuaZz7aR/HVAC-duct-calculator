import type { Calculation } from "@/lib/form/calculate";
import type { Pricing } from "@/lib/form/price";
import { uk as dict } from "@/lib/i18n/uk";
import { fmt } from "./format";
import { PriceInput } from "./PriceInput";
import { cardClass, mutedClass } from "./styles";

interface Props {
  groups: Calculation["insulationList"];
  prices: Record<string, string>;
  costs: Pricing["insulation"];
  onPrice: (code: string, value: string) => void;
}

export function InsulationList({ groups, prices, costs, onPrice }: Props) {
  return (
    <section className={`min-w-0 ${cardClass}`} aria-labelledby="insulation-title">
      <h2 id="insulation-title" className="mb-3 font-medium">{dict.insulation.title}</h2>
      {groups.length === 0 ? (
        <p className={`text-sm ${mutedClass}`}>{dict.insulation.empty}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className={`text-left text-xs ${mutedClass}`}>
              <tr>
                <th className="py-1">{dict.insulation.material}</th>
                <th className="text-right">{dict.insulation.area}</th>
                <th className="pl-2 text-right">{dict.price.perM2}</th>
                <th className="pl-2 text-right">{dict.price.cost}</th>
              </tr>
            </thead>
            <tbody>
              {groups.map((g, i) => {
                const name = dict.insulation.materials[g.code] ?? g.code;
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
      )}
      <p className={`mt-2 text-xs ${mutedClass}`}>{dict.insulation.note}</p>
    </section>
  );
}
