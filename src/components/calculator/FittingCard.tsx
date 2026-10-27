import { defaultConfig } from "@/lib/calc/config";
import { autoKey, isAuto } from "@/lib/form/auto-defaults";
import { fieldColumns, isLongLabel } from "@/lib/form/layout";
import { kindFields, type FieldKey, type FittingKind, type FormRow } from "@/lib/form/fields";
import type { RowOutcome } from "@/lib/form/calculate";
import { uk as dict } from "@/lib/i18n/uk";
import { kindTitle } from "./format";
import { FittingSketch } from "./FittingSketch";
import { isoLegend } from "./sketch-spec";
import { ErrorList, WarningList } from "./ErrorList";
import { KindMenu } from "./KindMenu";
import { buttonClass, cardClass, dangerButtonClass } from "./styles";
import { TextField } from "./TextField";

interface Props {
  row: FormRow;
  index: number;
  justAdded: boolean;
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
export function FittingCard({ row, index, justAdded, showSketch, collapsed, onToggleSketch, onToggleCollapsed, outcome, onKindChange, onValueChange, onReset, onPatch, onClone, onRemove }: Props) {
  const fieldLabel = (f: (typeof kindFields)[FittingKind][number]) =>
    `${dict.fields[f.key]}${f.optional ? ` (${dict.optional}: ${defaultConfig.reducerLengthMm})` : ""}`;
  // the (авто) hint or the reset link sits after the label, so reserve room for the longer one on the suggested field
  const labels = [...kindFields[row.kind].map((f) => fieldLabel(f) + (autoKey(row.kind) === f.key ? ` ${dict.autoValue.length > dict.resetAuto.length ? `(${dict.autoValue})` : dict.resetAuto}` : "")), dict.quantity];
  if (collapsed) {
    // one compact tile: number, kind and the typed values; the whole tile expands the card
    const summary = [...kindFields[row.kind].map((f) => row.values[f.key] ?? ""), row.quantity].map((v) => v || "–").join(" · ");
    return (
      <div id={`fitting-${row.id}`} className={`${cardClass} flex scroll-mt-16 items-center gap-2 !p-2 ${justAdded ? "flash-card" : ""}`}>
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
    <div id={`fitting-${row.id}`} className={`${cardClass} col-span-full scroll-mt-16 ${justAdded ? "flash-card" : ""}`}>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <h3 className="min-w-0 flex-1 text-base font-medium leading-snug">
          <span className="text-muted">{index + 1}.</span> {kindTitle(row.kind)}
        </h3>
        <div className="flex max-w-full flex-wrap gap-2">
          <button type="button" className={buttonClass} onClick={onToggleCollapsed}>
            {dict.collapseCard}
          </button>
          <button type="button" className={buttonClass} onClick={onClone}>
            {dict.cloneItem}
          </button>
          <KindMenu kind={row.kind} onChange={onKindChange} />
          <button type="button" className={dangerButtonClass} onClick={onRemove}>
            {dict.removeItem}
          </button>
        </div>
      </div>
      {row.preset && <p className="-mt-2 mb-3 text-xs text-muted">{dict.defaultsNote}</p>}
      <div
        className="grid grid-cols-2 gap-3 sm:[grid-template-columns:repeat(var(--cols),minmax(0,1fr))]"
        style={{ "--cols": fieldColumns(labels) } as React.CSSProperties}
      >
        {kindFields[row.kind].map((f) => {
          const hint = autoKey(row.kind) === f.key ? (isAuto(row, f.key) && (row.values[f.key] ?? "") !== "" ? dict.autoValue : undefined) : undefined;
          const action = autoKey(row.kind) === f.key && !isAuto(row, f.key) ? { label: dict.resetAuto, onClick: () => onReset(f.key) } : undefined;
          return (
            <TextField
              key={f.key}
              label={fieldLabel(f)}
              value={row.values[f.key] ?? ""}
              onChange={(v) => onValueChange(f.key, v)}
              hint={hint}
              action={action}
              wide={isLongLabel(`${fieldLabel(f)} ${hint ? `(${hint})` : ""} ${action?.label ?? ""}`.trim())}
            />
          );
        })}
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
        <figure className="mt-4 flex flex-col rounded-md border border-line bg-background p-4">
          <strong className="text-[13px] font-semibold uppercase tracking-wide text-muted">{dict.sketch.isoTitle}</strong>
          <FittingSketch kind={row.kind} view="iso" />
          <figcaption className="pt-2 text-sm leading-snug text-muted">
            {isoLegend(row.kind).join("; ")}. {dict.sketch.note}
          </figcaption>
        </figure>
      )}
      {outcome && !outcome.ok && <ErrorList issues={outcome.issues} />}
      {outcome?.ok && <WarningList warnings={outcome.result.warnings} />}
    </div>
  );
}
