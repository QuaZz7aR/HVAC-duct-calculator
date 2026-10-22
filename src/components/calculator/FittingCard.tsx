import { defaultConfig } from "@/lib/calc/config";
import { autoKey, isAuto } from "@/lib/form/auto-defaults";
import { fieldColumns } from "@/lib/form/layout";
import { kindFields, kindOrder, type FieldKey, type FittingKind, type FormRow } from "@/lib/form/fields";
import type { RowOutcome } from "@/lib/form/calculate";
import { uk as dict } from "@/lib/i18n/uk";
import { kindTitle } from "./format";
import { FittingSketch } from "./FittingSketch";
import { profileLegend, sketchLegend } from "./sketch-spec";
import { ErrorList, WarningList } from "./ErrorList";
import { buttonClass, cardClass, dangerButtonClass, selectClass, labelClass } from "./styles";
import { TextField } from "./TextField";

interface Props {
  row: FormRow;
  index: number;
  showSketch: boolean;
  collapsed: boolean;
  onToggleSketch: () => void;
  onToggleCollapsed: () => void;
  outcome: RowOutcome | undefined;
  onKindChange: (kind: FittingKind) => void;
  onValueChange: (key: FieldKey, value: string) => void;
  onReset: (key: FieldKey) => void;
  onPatch: (patch: Partial<FormRow>) => void;
  onClone: () => void;
  onRemove: () => void;
}

/** One fitting: kind selector, the size fields that kind needs, quantity. */
export function FittingCard({ row, index, showSketch, collapsed, onToggleSketch, onToggleCollapsed, outcome, onKindChange, onValueChange, onReset, onPatch, onClone, onRemove }: Props) {
  const fieldLabel = (f: (typeof kindFields)[FittingKind][number]) =>
    `${dict.fields[f.key]}${f.optional ? ` (${dict.optional}: ${defaultConfig.reducerLengthMm})` : ""}`;
  // the (авто) hint or the reset link sits after the label, so reserve room for the longer one on the suggested field
  const labels = [...kindFields[row.kind].map((f) => fieldLabel(f) + (autoKey(row.kind) === f.key ? ` ${dict.autoValue.length > dict.resetAuto.length ? `(${dict.autoValue})` : dict.resetAuto}` : "")), dict.quantity];
  if (collapsed) {
    // one compact tile: number, kind and the typed values; the whole tile expands the card
    const summary = [...kindFields[row.kind].map((f) => row.values[f.key] ?? ""), row.quantity].map((v) => v || "–").join(" · ");
    return (
      <div className={`${cardClass} flex items-center gap-2 !p-2`}>
        <button type="button" className="min-w-0 flex-1 text-left" onClick={onToggleCollapsed} aria-expanded={false} title={`${dict.expandCard}: ${kindTitle(row.kind)}`}>
          <span className="block text-sm font-medium leading-tight">{outcome && !outcome.ok && <span className="mr-1 text-red-600 dark:text-red-400" aria-label={dict.cardHasErrors} title={dict.cardHasErrors}>⚠</span>}{index + 1}. {kindTitle(row.kind)}</span>
          <span className="block truncate font-mono text-xs text-muted">{summary}</span>
        </button>
        <button type="button" className={`${buttonClass} shrink-0 !px-2 !py-1`} onClick={onClone} aria-label={dict.cloneItem} title={dict.cloneItem}>
          ⧉
        </button>
        <button type="button" className={`${dangerButtonClass} shrink-0 !px-2 !py-1`} onClick={onRemove} aria-label={dict.removeItem} title={dict.removeItem}>
          ×
        </button>
      </div>
    );
  }
  return (
    <div className={`${cardClass} col-span-full`}>
      <div className="mb-4 flex items-end justify-between gap-3">
        <label className="min-w-0 flex-1 sm:max-w-xl">
          <span className={labelClass}>{index + 1}. {dict.kind}</span>
          <select className={selectClass} value={row.kind} onChange={(e) => onKindChange(e.target.value as FittingKind)}>
            {kindOrder.map((k) => (
              <option key={k} value={k} className="bg-panel text-foreground">{kindTitle(k)}</option>
            ))}
          </select>
        </label>
        <div className="flex gap-2">
          <button type="button" className={buttonClass} onClick={onToggleCollapsed}>
            {dict.collapseCard}
          </button>
          <button type="button" className={buttonClass} onClick={onClone}>
            {dict.cloneItem}
          </button>
          <button type="button" className={dangerButtonClass} onClick={onRemove}>
            {dict.removeItem}
          </button>
        </div>
      </div>
      <div
        className="grid grid-cols-2 gap-3 sm:[grid-template-columns:repeat(var(--cols),minmax(0,1fr))]"
        style={{ "--cols": fieldColumns(labels) } as React.CSSProperties}
      >
        {kindFields[row.kind].map((f) => (
          <TextField
            key={f.key}
            label={fieldLabel(f)}
            value={row.values[f.key] ?? ""}
            onChange={(v) => onValueChange(f.key, v)}
            hint={autoKey(row.kind) === f.key ? (isAuto(row, f.key) && (row.values[f.key] ?? "") !== "" ? dict.autoValue : undefined) : undefined}
            action={autoKey(row.kind) === f.key && !isAuto(row, f.key) ? { label: dict.resetAuto, onClick: () => onReset(f.key) } : undefined}
          />
        ))}
        <TextField label={dict.quantity} inputMode="numeric" value={row.quantity} onChange={(quantity) => onPatch({ quantity })} />
      </div>
      <button
        type="button"
        className={`mt-4 ${buttonClass}`}
        aria-expanded={showSketch}
        onClick={onToggleSketch}
      >
        {showSketch ? dict.sketch.hide : dict.sketch.show}
      </button>
      {showSketch && (
        <div className="mt-4 grid gap-4 rounded-md bg-background p-4 sm:grid-cols-2">
          {([["side", dict.sketch.sideTitle, sketchLegend(row.kind)], ["profile", dict.sketch.profileTitle, profileLegend(row.kind)]] as const).map(([view, title, legend]) => (
            <figure key={view} className="min-w-0">
              <FittingSketch kind={row.kind} view={view} />
              <figcaption className="mt-1 text-[15px] leading-snug">
                <strong className="block text-[13px] font-semibold uppercase tracking-wide text-muted">{title}</strong>
                <span className="text-sm text-muted">{legend.join("; ")}.</span>
              </figcaption>
            </figure>
          ))}
          <p className="text-sm text-muted sm:col-span-2">{dict.sketch.note}</p>
        </div>
      )}
      {outcome && !outcome.ok && <ErrorList issues={outcome.issues} />}
      {outcome?.ok && <WarningList warnings={outcome.result.warnings} />}
    </div>
  );
}
