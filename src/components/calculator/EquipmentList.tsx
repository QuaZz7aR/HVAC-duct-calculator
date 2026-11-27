import { defaultConfig } from "@/lib/calc/config";
import type { EquipmentOutcome, EquipmentOpeningText, EquipmentRow } from "@/lib/form/equipment";
import { newOpening } from "@/lib/form/equipment";
import type { FormIssue } from "@/lib/form/messages";
import { issueMessage } from "@/lib/form/messages";
import { useI18n } from "@/components/i18n";
import type { Dictionary } from "@/lib/i18n";
import { Info } from "./Info";
import { TextField } from "./TextField";
import { buttonClass, cardClass, labelClass, mutedClass, selectClass } from "./styles";

interface Props {
  rows: EquipmentRow[];
  outcome: (id: number) => EquipmentOutcome | undefined;
  onAdd: () => void;
  onPatch: (id: number, patch: Partial<EquipmentRow>) => void;
  onRemove: (id: number) => void;
}

/** The field an equipment issue belongs to, in words. */
function issueField(i: FormIssue, dict: Dictionary): string {
  const e = dict.equipment;
  const [key, n, side] = i.path;
  if (key === "openings") return typeof n === "number" ? `${e.openings} ${n + 1}${side === "b" ? `, ${e.openingHeight}` : ""}` : e.openings;
  if (key === "quantity") return dict.quantity;
  if (key === "insulation") return dict.insulation.field;
  return { length: e.length, width: e.width, height: e.height }[String(key)] ?? String(key);
}

/**
 * Equipment (ADR 0120): its own framed block under the fittings, insulation only. Advanced mode, as the insulation it feeds
 * (ADR 0082); the rows still count in the simple mode.
 */
export function EquipmentList({ rows, outcome, onAdd, onPatch, onRemove }: Props) {
  const { dict, fmt } = useI18n();
  const e = dict.equipment;
  return (
    <section className="equipment-block rounded-lg border-2 p-3 sm:p-4" aria-labelledby="equipment-title">
      <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-2">
        <h2 id="equipment-title" className="text-lg font-semibold">{e.title} <span className={`text-sm font-normal ${mutedClass}`}>({e.beta})</span><Info text={e.info} /></h2>
        <button type="button" className={`${buttonClass} ml-auto`} onClick={onAdd}>+ {e.add}</button>
      </div>
      <p className={`mb-3 text-sm ${mutedClass}`}>{e.intro}</p>
      <ul className="space-y-3">
        {rows.map((row, idx) => {
          const o = outcome(row.id);
          const setOpening = (n: number, patch: Partial<EquipmentOpeningText>) =>
            onPatch(row.id, { openings: row.openings.map((op, k) => (k === n ? { ...op, ...patch } : op)) });
          return (
            <li key={row.id} id={`equipment-${row.id}`} className={cardClass}>
              <div className="mb-3 flex items-center gap-2">
                <input
                  className="min-w-0 flex-1 rounded-md border border-transparent bg-transparent px-1 py-1 font-medium hover:border-line focus:border-line focus:outline-2 focus:outline-accent"
                  aria-label={e.name}
                  placeholder={e.namePlaceholder(idx + 1)}
                  value={row.name}
                  onChange={(ev) => onPatch(row.id, { name: ev.target.value })}
                />
                <button type="button" className="inline-flex h-9 w-10 items-center justify-center rounded-md border border-line text-red-700 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-950" title={e.remove} aria-label={e.remove} onClick={() => onRemove(row.id)}>
                  <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3m-8 0 1 13h8l1-13" /></svg>
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                <TextField label={e.length} value={row.length} onChange={(v) => onPatch(row.id, { length: v })} />
                <TextField label={e.width} value={row.width} onChange={(v) => onPatch(row.id, { width: v })} />
                <TextField label={e.height} value={row.height} onChange={(v) => onPatch(row.id, { height: v })} />
                <TextField label={dict.quantity} value={row.quantity} inputMode="numeric" onChange={(v) => onPatch(row.id, { quantity: v })} />
                <label className="col-span-2 flex flex-col justify-end sm:col-span-1">
                  <span className={labelClass}>{dict.insulation.field}</span>
                  <select className={selectClass} value={row.insulation} onChange={(ev) => onPatch(row.id, { insulation: ev.target.value })}>
                    <option value="" className="bg-panel text-foreground">{dict.insulation.none}</option>
                    {defaultConfig.insulation.materials.map((m) => (
                      <option key={m.code} value={m.code} className="bg-panel text-foreground">{dict.insulation.materials[m.code] ?? m.code}</option>
                    ))}
                  </select>
                </label>
              </div>
              <fieldset className="mt-3">
                <legend className={labelClass}>{e.openings}<Info text={e.openingsInfo} /></legend>
                <ol className="space-y-2">
                  {row.openings.map((op, n) => (
                    <li key={n} className="flex flex-wrap items-end gap-2">
                      {/* phone: the shape on its own line, the sizes and «×» under it; from sm one row */}
                      <label className="flex basis-full items-center gap-2 sm:basis-auto">
                        <span className={`w-5 text-sm tabular-nums ${mutedClass}`}>{n + 1}.</span>
                        <select className={`${selectClass} sm:w-44`} aria-label={`${e.openings} ${n + 1}`} value={op.shape} onChange={(ev) => setOpening(n, newOpening(ev.target.value as EquipmentOpeningText["shape"]))}>
                          <option value="rect" className="bg-panel text-foreground">{e.rect}</option>
                          <option value="round" className="bg-panel text-foreground">{e.round}</option>
                        </select>
                      </label>
                      <div className="ml-7 w-24 sm:ml-0"><TextField label={op.shape === "round" ? e.diameter : e.openingWidth} value={op.a} onChange={(v) => setOpening(n, { a: v })} /></div>
                      {op.shape === "rect" && <div className="w-24"><TextField label={e.openingHeight} value={op.b} onChange={(v) => setOpening(n, { b: v })} /></div>}
                      <button type="button" className="h-10 w-10 rounded-md border border-line text-muted hover:bg-accent-soft" title={e.removeOpening(n + 1)} aria-label={e.removeOpening(n + 1)} onClick={() => onPatch(row.id, { openings: row.openings.filter((_, k) => k !== n) })}>×</button>
                    </li>
                  ))}
                </ol>
                <button type="button" className={`${buttonClass} mt-2`} onClick={() => onPatch(row.id, { openings: [...row.openings, newOpening(row.openings.at(-1)?.shape)] })}>+ {e.addOpening}</button>
              </fieldset>
              <div className="mt-3 text-sm" aria-live="polite">
                {!o ? null : o.ok ? (
                  o.result.insulation ? (
                    <p><span className={mutedClass}>{e.area}:</span> <span className="font-medium tabular-nums">{fmt(o.result.insulation.area)}</span>{o.result.quantity > 1 && <span className={mutedClass}> · {e.areaTotal(fmt(o.result.insulation.areaTotal))}</span>}</p>
                  ) : (
                    <p className={mutedClass}>{e.noInsulation}</p>
                  )
                ) : (
                  <ul role="alert" className="space-y-0.5 text-red-600 dark:text-red-400">
                    {o.issues.map((i, k) => <li key={k}>{issueField(i, dict)}: {issueMessage(i, dict)}</li>)}
                  </ul>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
