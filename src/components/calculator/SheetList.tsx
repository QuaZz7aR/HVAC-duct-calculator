import type { Calculation } from "@/lib/form/calculate";
import { priceKey, type Pricing } from "@/lib/form/price";
import { useI18n } from "@/components/i18n";
import type { SettingsText } from "@/lib/form/settings";
import { PriceInput } from "./PriceInput";
import { SheetField, ThicknessTableField } from "./SettingsPanel";
import { cardClass, mutedClass } from "./styles";
import { Info } from "./Info";

interface Props {
  groups: Calculation["sheetList"];
  prices: Record<string, string>;
  costs: Pricing["metal"];
  onPrice: (key: string, value: string) => void;
  settings: SettingsText;
  onSettings: (settings: SettingsText) => void;
}

export function SheetList({ groups, prices, costs, onPrice, settings, onSettings }: Props) {
  const { dict, fmt } = useI18n();
  return (
    <section className={`min-w-0 ${cardClass}`} aria-labelledby="sheets-title">
      <h2 id="sheets-title" className="mb-3 font-medium">{dict.sheetList.title}</h2>
      <div className="mb-3 grid gap-3 sm:grid-cols-2">
        <ThicknessTableField settings={settings} onChange={onSettings} />
        <SheetField settings={settings} onChange={onSettings} />
      </div>
      {/* phone: one block per thickness, label beside value (ADR 0058) */}
      <ul className="space-y-2 sm:hidden">
        {groups.map((g, i) => {
          const key = priceKey(g.thicknessMm);
          const cost = costs[i];
          return (
            <li key={g.thicknessMm} className="rounded-md border border-line p-2 text-sm">
              <p className="mb-1 font-medium">{dict.sheetList.thickness}: {fmt(g.thicknessMm, 2)}</p>
              <dl className="space-y-1">
                <div className="flex justify-between gap-2"><dt className={mutedClass}>{dict.sheetList.area}</dt><dd className="tabular-nums">{fmt(g.area)}</dd></div>
                <div className="flex justify-between gap-2"><dt className={mutedClass}>{dict.sheetList.orderArea}<Info text={dict.help.columns.orderArea} /></dt><dd className="tabular-nums">{fmt(g.orderArea)}</dd></div>
                <div className="flex justify-between gap-2"><dt className={mutedClass}>{dict.sheetList.sheets}<Info text={dict.help.columns.sheets} /></dt><dd className="tabular-nums">{g.sheets}</dd></div>
                <div className="flex items-center justify-between gap-2"><dt className={mutedClass}>{dict.price.perM2}<Info text={dict.help.columns.price} /></dt><dd><PriceInput label={dict.price.metalLabel(fmt(g.thicknessMm, 2))} value={prices[key] ?? ""} onChange={(v) => onPrice(key, v)} /></dd></div>
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
              <th className="py-1">{dict.sheetList.thickness}</th>
              <th className="text-right">{dict.sheetList.area}</th>
              <th className="text-right">{dict.sheetList.orderArea}<Info text={dict.help.columns.orderArea} /></th>
              <th className="text-right">{dict.sheetList.sheets}<Info text={dict.help.columns.sheets} /></th>
              <th className="pl-2 text-right">{dict.price.perM2}<Info text={dict.help.columns.price} /></th>
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
