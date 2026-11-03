import type { Calculation } from "@/lib/form/calculate";
import { uk as dict } from "@/lib/i18n/uk";
import { fmt } from "./format";
import { cardClass, mutedClass } from "./styles";

export function InsulationList({ groups }: { groups: Calculation["insulationList"] }) {
  return (
    <section className={cardClass} aria-labelledby="insulation-title">
      <h2 id="insulation-title" className="mb-3 font-medium">{dict.insulation.title}</h2>
      {groups.length === 0 ? (
        <p className={`text-sm ${mutedClass}`}>{dict.insulation.empty}</p>
      ) : (
        <table className="w-full text-sm">
          <thead className={`text-left text-xs ${mutedClass}`}>
            <tr><th className="py-1">{dict.insulation.material}</th><th className="text-right">{dict.insulation.area}</th></tr>
          </thead>
          <tbody>
            {groups.map((g) => (
              <tr key={g.code} className="border-t border-line">
                <td className="py-1">{dict.insulation.materials[g.code] ?? g.code}</td>
                <td className="text-right tabular-nums">{fmt(g.area)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <p className={`mt-2 text-xs ${mutedClass}`}>{dict.insulation.note}</p>
    </section>
  );
}
