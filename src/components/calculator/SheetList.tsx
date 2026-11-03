import type { Calculation } from "@/lib/form/calculate";
import { priceKey, type Pricing } from "@/lib/form/price";
import { uk as dict } from "@/lib/i18n/uk";
import { fmt } from "./format";
import { PriceInput } from "./PriceInput";
import { cardClass, mutedClass } from "./styles";

interface Props {
  groups: Calculation["sheetList"];
  prices: Record<string, string>;
  costs: Pricing["metal"];
  onPrice: (key: string, value: string) => void;
}

export function SheetList({ groups, prices, costs, onPrice }: Props) {
  return (
    <section className={`min-w-0 ${cardClass}`} aria-labelledby="sheets-title">
      <h2 id="sheets-title" className="mb-3 font-medium">{dict.sheetList.title}</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className={`text-left text-xs ${mutedClass}`}>
            <tr>
              <th className="py-1">{dict.sheetList.thickness}</th>
              <th className="text-right">{dict.sheetList.area}</th>
              <th className="text-right">{dict.sheetList.orderArea}</th>
              <th className="text-right">{dict.sheetList.sheets}</th>
              <th className="pl-2 text-right">{dict.price.perM2}</th>
              <th className="pl-2 text-right">{dict.price.cost}</th>
            </tr>
          </thead>
          <tbody>
            {groups.map((g, i) => {
              const key = priceKey(g.thicknessMm);
              const cost = costs[i];
              return (
                <tr key={g.thicknessMm} className="border-t border-line">
                  <td className="py-1 tabular-nums">{fmt(g.thicknessMm, 2)}</td>
                  <td className="text-right tabular-nums">{fmt(g.area)}</td>
                  <td className="text-right tabular-nums">{fmt(g.orderArea)}</td>
                  <td className="text-right tabular-nums">{g.sheets}</td>
                  <td className="py-1 pl-2 text-right">
                    <PriceInput label={dict.price.metalLabel(fmt(g.thicknessMm, 2))} value={prices[key] ?? ""} onChange={(v) => onPrice(key, v)} />
                  </td>
                  <td className="pl-2 text-right tabular-nums">{cost === undefined ? dict.totals.noPrice : fmt(cost, 2)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className={`mt-2 text-xs ${mutedClass}`}>{dict.sheetList.note} {dict.sheetList.priceNote}</p>
    </section>
  );
}
