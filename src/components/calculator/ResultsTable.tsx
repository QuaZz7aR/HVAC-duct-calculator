import type { Calculation, RowOutcome } from "@/lib/form/calculate";
import type { FormRow } from "@/lib/form/fields";
import { useI18n } from "@/components/i18n";
import { positionLabel } from "@/lib/form/order";
import { rowTitle } from "./format";
import { Info } from "./Info";
import { cardClass, mutedClass } from "./styles";

interface Props {
  rows: FormRow[];
  outcome: (id: number) => RowOutcome | undefined;
  calc: Calculation;
}

/** mm -> metres without trailing zeros: 3000 -> "3", 1500 -> "1,5". */
const metres = (mm: number, locale: string) => (mm / 1000).toLocaleString(locale, { maximumFractionDigits: 3 });

const numCell = "px-2 text-right tabular-nums";

function ResultRow({ row, index, outcome }: { row: FormRow; index: number; outcome: RowOutcome | undefined }) {
  const { dict, fmt } = useI18n();
  if (!outcome?.ok) {
    return (
      <tr className="border-t border-line text-muted hover:bg-accent-soft">
        <td className="py-1 pr-3">{positionLabel(row, index)}. {rowTitle(row, dict)}</td>
        <td colSpan={7} className="px-2 text-right">—</td>
      </tr>
    );
  }
  const r = outcome.result;
  const p = r.pieces;
  return (
    <tr className="border-t border-line hover:bg-accent-soft">
      <td className="py-1 pr-3">
        {positionLabel(row, index)}. {rowTitle(row, dict)}
        {p && <span className={`block text-xs ${mutedClass}`}>{dict.results.pieces(String(p.full), metres(p.pieceMm, dict.locale), p.restMm > 0 ? metres(p.restMm, dict.locale) : null)}</span>}
      </td>
      <td className={numCell}>{r.quantity}</td>
      <td className={numCell}>{fmt(r.thicknessMm, 2)}</td>
      <td className={numCell}>{fmt(r.metalArea)}</td>
      <td className={numCell}>{fmt(r.metalAreaTotal)}</td>
      <td className={numCell}>{fmt(r.metalConsumption)}</td>
      <td className={numCell}>{fmt(r.metalConsumptionTotal)}</td>
      <td className="pl-2 text-right tabular-nums">{r.insulation ? fmt(r.insulation.areaTotal) : "—"}</td>
    </tr>
  );
}

export function ResultsTable({ rows, outcome, calc }: Props) {
  const { dict } = useI18n();
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
                <th className="px-2 text-right">{dict.results.thickness}<Info text={dict.help.columns.thickness} /></th>
                <th className="px-2 text-right">{dict.results.metalArea}<Info text={dict.help.columns.metalArea} /></th>
                <th className="px-2 text-right">{dict.results.metalAreaTotal}</th>
                <th className="px-2 text-right">{dict.results.metalConsumption}<Info text={dict.help.columns.metalConsumption} /></th>
                <th className="px-2 text-right">{dict.results.metalConsumptionTotal}</th>
                <th className="pl-2 text-right">{dict.results.insulationTotal}<Info text={dict.help.columns.insulation} /></th>
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
      {calc.rows.some((o) => o.ok && o.result.consumptionDiffers) && (
        <p className={`mt-2 text-xs ${mutedClass}`}>{dict.results.consumptionNote}</p>
      )}
      {calc.skipped > 0 && <p className="mt-2 text-sm text-amber-700 dark:text-amber-400">{dict.results.skipped(calc.skipped)}</p>}
    </section>
  );
}
