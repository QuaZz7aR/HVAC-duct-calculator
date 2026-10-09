import type { Calculation, RowOutcome } from "@/lib/form/calculate";
import type { FormRow } from "@/lib/form/fields";
import { uk as dict } from "@/lib/i18n/uk";
import { fmt, rowTitle } from "./format";
import { cardClass, mutedClass } from "./styles";

interface Props {
  rows: FormRow[];
  outcome: (id: number) => RowOutcome | undefined;
  calc: Calculation;
}

const numCell = "px-2 text-right tabular-nums";

function ResultRow({ row, index, outcome }: { row: FormRow; index: number; outcome: RowOutcome | undefined }) {
  if (!outcome?.ok) {
    return (
      <tr className="border-t border-zinc-200 text-zinc-400 dark:border-zinc-800">
        <td className="py-1 pr-3">{index + 1}. {rowTitle(row)}</td>
        <td colSpan={9} className="px-2 text-right">—</td>
      </tr>
    );
  }
  const r = outcome.result;
  return (
    <tr className="border-t border-zinc-200 dark:border-zinc-800">
      <td className="py-1 pr-3">{index + 1}. {rowTitle(row)}</td>
      <td className={numCell}>{r.quantity}</td>
      <td className={numCell}>{fmt(r.thicknessMm, 2)}</td>
      <td className={numCell}>{fmt(r.metalArea)}</td>
      <td className={numCell}>{fmt(r.metalAreaTotal)}</td>
      <td className={numCell}>{fmt(r.centerlineLength)}</td>
      <td className={numCell}>{fmt(r.pressureDrop.velocity, 2)}</td>
      <td className={numCell}>{fmt(r.pressureDrop.frictionLoss, 2)}</td>
      <td className={numCell}>{fmt(r.pressureDrop.localLoss, 2)}</td>
      <td className="pl-2 text-right tabular-nums">{fmt(r.totalLoss, 2)}</td>
    </tr>
  );
}

export function ResultsTable({ rows, outcome, calc }: Props) {
  return (
    <section aria-labelledby="results-title" className={cardClass}>
      <h2 id="results-title" className="mb-3 font-medium">{dict.results.title}</h2>
      {calc.rows.length === 0 ? (
        <p className={`text-sm ${mutedClass}`}>{dict.results.empty}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className={`text-left text-xs ${mutedClass}`}>
              <tr>
                <th className="py-1 pr-3">{dict.results.item}</th>
                <th className="px-2 text-right">{dict.quantity}</th>
                <th className="px-2 text-right">{dict.results.thickness}</th>
                <th className="px-2 text-right">{dict.results.metalArea}</th>
                <th className="px-2 text-right">{dict.results.metalAreaTotal}</th>
                <th className="px-2 text-right">{dict.results.centerline}</th>
                <th className="px-2 text-right">{dict.results.velocity}</th>
                <th className="px-2 text-right">{dict.results.friction}</th>
                <th className="px-2 text-right">{dict.results.local}</th>
                <th className="pl-2 text-right">{dict.results.pressureDrop}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => (
                <ResultRow key={row.id} row={row} index={idx} outcome={outcome(row.id)} />
              ))}
            </tbody>
          </table>
        </div>
      )}
      {calc.skipped > 0 && <p className="mt-2 text-sm text-amber-700 dark:text-amber-400">{dict.results.skipped(calc.skipped)}</p>}
    </section>
  );
}
