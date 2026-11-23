import { defaultConfig } from "@/lib/calc/config";
import { autoKey, isAuto } from "@/lib/form/auto-defaults";
import { fieldColumns, isLongLabel } from "@/lib/form/layout";
import { hasAllowance, kindFields, type FieldKey, type FittingKind, type FormRow } from "@/lib/form/fields";
import type { RowOutcome } from "@/lib/form/calculate";
import { useI18n } from "@/components/i18n";
import { kindTitle } from "./format";
import { FittingSketch } from "./FittingSketch";
import { isoLegend } from "./sketch-spec";
import { ErrorList, WarningList } from "./ErrorList";
import { KindMenu } from "./KindMenu";
import { buttonClass, cardClass, dangerButtonClass, foldButtonClass, labelClass, selectClass } from "./styles";
import { Info } from "./Info";
import { TextField } from "./TextField";

interface Props {
  row: FormRow;
  index: number;
  /** the label shown before the kind: the user's position or the list number */
  position: string;
  first: boolean;
  last: boolean;
  onMove: (step: number) => void;
  onDragStart: () => void;
  /** the drag ended, dropped or cancelled */
  onDragEnd: () => void;
  onDragOverHere: () => void;
  /** a touch or pen pressed the handle: the list drives the drag with pointer events */
  onTouchDrag: (e: React.PointerEvent) => void;
  /** this card is being dragged: shown as the drop place */
  dragging?: boolean;
  justAdded: boolean;
  /** two-column mode: the open card spans half the grid (2 of 4 columns) on xl screens */
  half?: boolean;
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
/** Inputs the simple mode hides; their values stay and still count (ADR 0082). */
const advancedFields = new Set<string>(["allowance", "maxPiece"]);

export function FittingCard({ row, index, position, first, last, onMove, onDragStart, onDragEnd, onDragOverHere, onTouchDrag, dragging, justAdded, half, showSketch, collapsed, onToggleSketch, onToggleCollapsed, outcome, onKindChange, onValueChange, onReset, onPatch, onClone, onRemove }: Props) {
  const { dict } = useI18n();
  // the card under the pointer becomes the drop place (the list takes the drop itself); only the handle starts a drag, so text in the inputs can still be selected
  const dropTarget = {
    onDragOver: onDragOverHere,
  };
  const handle = (
    <span
      draggable
      role="img"
      aria-label={dict.order.drag}
      title={dict.order.drag}
      className="shrink-0 cursor-grab touch-none select-none px-2 py-2 text-xl leading-none text-muted hover:text-foreground active:cursor-grabbing lg:px-1 lg:py-0 lg:text-lg"
      onPointerDown={(e) => {
        if (e.pointerType !== "mouse") onTouchDrag(e);
      }}
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", String(row.id));
        const card = document.getElementById(`fitting-${row.id}`);
        if (card) e.dataTransfer.setDragImage(card, 20, 20);
        // after the browser has taken the drag image, so the image is the card as it looks now
        setTimeout(onDragStart, 0);
      }}
      onDragEnd={onDragEnd}
    >
      ⠿
    </span>
  );
  const moveButtons = (
    <>
      <button type="button" className={`${buttonClass} shrink-0 !px-2 !py-1 disabled:cursor-default disabled:opacity-40`} disabled={first} onClick={() => onMove(-1)} aria-label={dict.order.up} title={dict.order.up}>↑</button>
      <button type="button" className={`${buttonClass} shrink-0 !px-2 !py-1 disabled:cursor-default disabled:opacity-40`} disabled={last} onClick={() => onMove(1)} aria-label={dict.order.down} title={dict.order.down}>↓</button>
    </>
  );
  const fieldLabel = (f: (typeof kindFields)[FittingKind][number]) =>
    `${dict.fields[f.key]}${f.optional ? ` (${dict.optional}: ${defaultConfig.reducerLengthMm})` : ""}`;
  // the (авто) hint or the reset link sits after the label, so reserve room for the longer one on the suggested field
  const labels = [dict.order.position, ...kindFields[row.kind].map((f) => fieldLabel(f) + (autoKey(row.kind) === f.key ? ` ${dict.autoValue.length > dict.resetAuto.length ? `(${dict.autoValue})` : dict.resetAuto}` : "")), ...(hasAllowance(row.kind) ? [dict.allowanceCount.field] : []), dict.quantity, dict.insulation.field];
  if (collapsed) {
    // one compact tile: number, kind and the typed values; the whole tile expands the card
    const summary = [...kindFields[row.kind].map((f) => row.values[f.key] ?? ""), row.quantity].map((v) => v || "–").join(" · ");
    return (
      <div id={`fitting-${row.id}`} {...dropTarget} className={`${cardClass} flex scroll-mt-16 items-center gap-2 !p-2 ${justAdded ? "flash-card" : ""} ${dragging ? "!border-2 !border-dashed !border-accent bg-accent-soft opacity-60 pointer-events-none" : ""}`}>
        {handle}
        <button type="button" className="min-w-0 flex-1 text-left" onClick={onToggleCollapsed} aria-expanded={false} title={`${dict.expandCard}: ${kindTitle(row.kind, dict)}`}>
          <span className="block text-sm font-medium leading-tight">{outcome && !outcome.ok && <span className="mr-1 text-red-600 dark:text-red-400" aria-label={dict.cardHasErrors} title={dict.cardHasErrors}>⚠</span>}{position}. {kindTitle(row.kind, dict)}</span>
          <span className="block truncate font-mono text-xs text-muted">{summary}</span>
          {row.noSizes && <span className="block truncate text-xs text-amber-700 dark:text-amber-400" title={dict.import.noSizes}>⚠ {dict.import.noSizesShort}</span>}
          {row.sizeConflicts && row.sizeConflicts.length > 0 && (
            <span className="block truncate text-xs text-amber-700 dark:text-amber-400" title={row.sizeConflicts.map((c) => dict.import.conflict(dict.fields[c.field], c.name, c.column)).join("\n")}>
              ⚠ {dict.import.conflictShort(row.sizeConflicts.length)}
            </span>
          )}
        </button>
        {/* the four buttons stand in two rows, so the tile keeps room for the name (ADRs 0076, 0077) */}
        <div className="grid shrink-0 grid-cols-2 gap-1">
          {moveButtons}
          <button type="button" className={`${buttonClass} shrink-0 !px-2 !py-1`} onClick={onClone} aria-label={dict.cloneItem} title={dict.cloneItem}>
            ⧉
          </button>
          <button type="button" className={`${dangerButtonClass} shrink-0 !px-2 !py-1`} onClick={onRemove} aria-label={dict.removeItem} title={dict.removeItem}>
            ×
          </button>
        </div>
      </div>
    );
  }
  const sketch = (
        <figure className="mt-4 flex flex-col rounded-md border border-line bg-background p-4">
          <button type="button" className="flex flex-col text-left" onClick={onToggleSketch} aria-expanded={true} title={dict.sketch.hide}>
            <strong className="text-[13px] font-semibold uppercase tracking-wide text-muted">{dict.sketch.isoTitle}</strong>
            <FittingSketch kind={row.kind} view="iso" />
          </button>
          <figcaption className="pt-2 text-sm leading-snug text-muted">
            {isoLegend(row.kind, dict).join("; ")}. {dict.sketch.note}
          </figcaption>
        </figure>
  );
  return (
    <div id={`fitting-${row.id}`} {...dropTarget} className={`${cardClass} col-span-full ${half ? "xl:col-span-2" : ""} scroll-mt-16 ${justAdded ? "flash-card" : ""} ${dragging ? "!border-2 !border-dashed !border-accent bg-accent-soft opacity-60 pointer-events-none" : ""}`}>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <span className="flex self-center">{handle}</span>
        <button
          type="button"
          className={`h-14 w-20 shrink-0 sm:h-16 sm:w-24 rounded-md border bg-background p-1 hover:border-accent ${showSketch ? "border-accent" : "border-line"}`}
          onClick={onToggleSketch}
          aria-expanded={showSketch}
          aria-label={showSketch ? dict.sketch.hide : dict.sketch.show}
          title={showSketch ? dict.sketch.hide : dict.sketch.show}
        >
          <FittingSketch kind={row.kind} view="iso" thumb />
        </button>
        <h3 className="min-w-0 flex-1 self-center text-base font-medium leading-snug">
          <span className="text-muted">{position}.</span> {kindTitle(row.kind, dict)}
        </h3>
        {/* two-column mode: fold and move in the top row, clone, kind and remove below (ADR 0080); otherwise one wrapping row */}
        <div className={`flex max-w-full flex-wrap gap-2 ${half ? "xl:flex-col xl:items-end" : ""}`}>
          <div className={half ? "contents xl:flex xl:gap-2" : "contents"}>
          <button type="button" className={foldButtonClass} onClick={onToggleCollapsed}>
            <svg aria-hidden="true" viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 10l4-4 4 4" /></svg>
            {dict.collapseCard}
          </button>
          {moveButtons}
          </div>
          <div className={half ? "contents xl:flex xl:gap-2" : "contents"}>
          <button type="button" className={buttonClass} onClick={onClone}>
            {dict.cloneItem}
          </button>
          <KindMenu kind={row.kind} onChange={onKindChange} />
          <button type="button" className={dangerButtonClass} onClick={onRemove}>
            {dict.removeItem}
          </button>
          </div>
        </div>
      </div>
      {/* phone: the open sketch sits right under the thumbnail (ADR 0059); from sm up it stays below the inputs */}
      {showSketch && <div className="mb-4 sm:hidden [&>figure]:mt-0">{sketch}</div>}
      {row.preset && <p className="-mt-2 mb-3 text-xs text-muted">{dict.defaultsNote}</p>}
      <div
        className="grid grid-cols-2 gap-3 sm:[grid-template-columns:repeat(var(--cols),minmax(0,1fr))]"
        style={{ "--cols": fieldColumns(labels) } as React.CSSProperties}
      >
        <TextField
          label={dict.order.position}
          info={dict.order.positionInfo}
          inputMode="text"
          value={row.position ?? ""}
          placeholder={String(index + 1)}
          onChange={(position) => onPatch({ position })}
        />
        {kindFields[row.kind].map((f) => {
          const hint = autoKey(row.kind) === f.key ? (isAuto(row, f.key) && (row.values[f.key] ?? "") !== "" ? dict.autoValue : undefined) : undefined;
          const action = autoKey(row.kind) === f.key && !isAuto(row, f.key) ? { label: dict.resetAuto, onClick: () => onReset(f.key) } : undefined;
          return (
            <div key={f.key} className={advancedFields.has(f.key) ? "contents adv-only" : "contents"}>
            <TextField
              label={fieldLabel(f)}
              value={row.values[f.key] ?? ""}
              onChange={(v) => onValueChange(f.key, v)}
              hint={hint}
              action={action}
              info={(dict.help.fields as Partial<Record<string, string>>)[f.key]}
              wide={isLongLabel(`${fieldLabel(f)} ${hint ? `(${hint})` : ""} ${action?.label ?? ""}`.trim())}
            />
            </div>
          );
        })}
        {hasAllowance(row.kind) && (
          <label className="adv-only flex flex-col justify-end">
            <span className={labelClass}>{dict.allowanceCount.field}<Info text={dict.help.fields.allowanceCount} /></span>
            <select className={selectClass} value={row.allowanceCount || "2"} onChange={(e) => onPatch({ allowanceCount: e.target.value })}>
              {(["2", "1", "0"] as const).map((n) => (
                <option key={n} value={n} className="bg-panel text-foreground">{dict.allowanceCount.options[n]}</option>
              ))}
            </select>
          </label>
        )}
        <TextField label={dict.quantity} info={dict.help.fields.quantity} inputMode="numeric" value={row.quantity} onChange={(quantity) => onPatch({ quantity })} />
        <label className="adv-only col-span-2 flex flex-col justify-end sm:col-span-1">
          <span className={labelClass}>{dict.insulation.field}<Info text={dict.help.fields.insulation} /></span>
          <select className={selectClass} value={row.insulation ?? ""} onChange={(e) => onPatch({ insulation: e.target.value })}>
            <option value="" className="bg-panel text-foreground">{dict.insulation.none}</option>
            {defaultConfig.insulation.materials.map((m) => (
              <option key={m.code} value={m.code} className="bg-panel text-foreground">{dict.insulation.materials[m.code] ?? m.code}</option>
            ))}
          </select>
        </label>
      </div>
      {showSketch && <div className="hidden sm:block">{sketch}</div>}
      {outcome && !outcome.ok && <ErrorList issues={outcome.issues} />}
      {outcome?.ok && <WarningList warnings={outcome.result.warnings} />}
      {row.noSizes && <p className="mt-2 text-sm text-amber-700 dark:text-amber-400">⚠ {dict.import.noSizes}</p>}
      {row.sizeConflicts && (
        <ul aria-label={dict.warnings.title} className="mt-2 space-y-0.5 text-sm text-amber-700 dark:text-amber-400">
          {row.sizeConflicts.map((c) => <li key={c.field}>⚠ {dict.import.conflict(dict.fields[c.field], c.name, c.column)}</li>)}
        </ul>
      )}
    </div>
  );
}
