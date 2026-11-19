import type { Calculation, RowOutcome } from "@/lib/form/calculate";
import type { FormRow } from "@/lib/form/fields";
import { scrollToCard } from "./highlightCard";
import { useI18n } from "@/components/i18n";
import { positionLabel, positionSpan } from "@/lib/form/order";
import { groupRuns } from "./FittingList";
import { kindTitle, rowTitle, sizeLabel } from "./format";
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

/** Position, kind and the sizes; a click scrolls to the card, so rows of one kind (a clone) can be told apart and found. */
function RowName({ row, index }: { row: FormRow; index: number }) {
  const { dict } = useI18n();
  const sizes = sizeLabel(row, dict);
  return (
    <button
      type="button"
      className="text-left hover:text-accent hover:underline"
      title={dict.results.goToCard}
      onClick={() => scrollToCard(row.id)}
    >
      {positionLabel(row, index)}. {rowTitle(row, dict)}
      {sizes && <span className={`block font-mono text-xs ${mutedClass}`}>{sizes}</span>}
    </button>
  );
}

function ResultRow({ row, index, outcome, inSection = false }: { row: FormRow; index: number; outcome: RowOutcome | undefined; inSection?: boolean }) {
  const tint = inSection ? "bg-accent-soft/40" : "";
  const { dict, fmt } = useI18n();
  if (!outcome?.ok) {
    return (
      <tr className={`border-t border-line text-muted hover:bg-accent-soft ${tint}`}>
        <td className="py-1 pr-3"><RowName row={row} index={index} /></td>
        <td colSpan={7} className="px-2 text-right">—</td>
      </tr>
    );
  }
  const r = outcome.result;
  const p = r.pieces;
  return (
    <tr className={`border-t border-line hover:bg-accent-soft ${tint}`}>
      <td className="py-1 pr-3">
        <RowName row={row} index={index} />
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

/** A run of neighbouring rows of one kind, titled and summed as in the list (ADR 0055); a single row has no title. */
function SectionRows({ kind, items, outcome }: { kind: FormRow["kind"]; items: { row: FormRow; index: number }[]; outcome: Props["outcome"] }) {
  const { dict, fmt } = useI18n();
  const rows = items.map(({ row, index }) => <ResultRow key={row.id} row={row} index={index} outcome={outcome(row.id)} inSection={items.length > 1} />);
  if (items.length === 1) return rows;
  const ok = items.flatMap(({ row }) => { const o = outcome(row.id); return o?.ok ? [o.result] : []; });
  const sum = (f: (r: (typeof ok)[number]) => number) => fmt(ok.reduce((a, r) => a + f(r), 0));
  const cell = "px-2 pt-3 pb-1 text-right tabular-nums font-medium";
  return (
    <>
      <tr className="border-t-2 border-line bg-accent-soft">
        <td colSpan={4} className="pt-3 pb-1 pr-3 font-medium">
          <button type="button" className="text-left hover:text-accent hover:underline" title={dict.results.goToCard} onClick={() => document.getElementById(`section-${items[0].row.id}`)?.scrollIntoView({ block: "start", behavior: "smooth" })}>
            <span className="text-muted">{positionSpan(items.map((i) => positionLabel(i.row, i.index)))}.</span> {kindTitle(kind, dict)} <span className="text-muted">× {items.length}</span>
          </button>
        </td>
        <td className={cell}>{sum((r) => r.metalAreaTotal)}</td>
        <td />
        <td className={cell}>{sum((r) => r.metalConsumptionTotal)}</td>
        <td className={`pl-2 pt-3 pb-1 text-right tabular-nums font-medium`}>{ok.some((r) => r.insulation) ? sum((r) => r.insulation?.areaTotal ?? 0) : "—"}</td>
      </tr>
      {rows}
    </>
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
              {groupRuns(rows).map(({ kind, items }) => (
                <SectionRows key={items[0].row.id} kind={kind} items={items} outcome={outcome} />
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
