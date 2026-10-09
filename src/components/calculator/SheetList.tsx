import type { Calculation } from "@/lib/form/calculate";
import { uk as dict } from "@/lib/i18n/uk";
import { fmt } from "./format";
import { cardClass, mutedClass } from "./styles";

export function SheetList({ groups }: { groups: Calculation["sheetList"] }) {
  return (
    <section className={cardClass} aria-labelledby="sheets-title">
      <h2 id="sheets-title" className="mb-3 font-medium">{dict.sheetList.title}</h2>
      <table className="w-full text-sm">
        <thead className={`text-left text-xs ${mutedClass}`}>
          <tr><th className="py-1">{dict.sheetList.thickness}</th><th className="text-right">{dict.sheetList.area}</th></tr>
        </thead>
        <tbody>
          {groups.map((g) => (
            <tr key={g.thicknessMm} className="border-t border-zinc-200 dark:border-zinc-800">
              <td className="py-1 tabular-nums">{fmt(g.thicknessMm, 2)}</td>
              <td className="text-right tabular-nums">{fmt(g.area)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className={`mt-2 text-xs ${mutedClass}`}>{dict.sheetList.note}</p>
    </section>
  );
}
