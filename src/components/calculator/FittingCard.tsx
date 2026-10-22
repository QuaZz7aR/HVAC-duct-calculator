import { useState } from "react";
import { defaultConfig } from "@/lib/calc/config";
import { sketchesOpenByDefault } from "@/lib/form/sample-rows";
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
  outcome: RowOutcome | undefined;
  onKindChange: (kind: FittingKind) => void;
  onValueChange: (key: FieldKey, value: string) => void;
  onReset: (key: FieldKey) => void;
  onPatch: (patch: Partial<FormRow>) => void;
  onRemove: () => void;
}

/** One fitting: kind selector, the size fields that kind needs, quantity. */
export function FittingCard({ row, index, outcome, onKindChange, onValueChange, onReset, onPatch, onRemove }: Props) {
  const [showSketch, setShowSketch] = useState(sketchesOpenByDefault);
  const fieldLabel = (f: (typeof kindFields)[FittingKind][number]) =>
    `${dict.fields[f.key]}${f.optional ? ` (${dict.optional}: ${defaultConfig.reducerLengthMm})` : ""}`;
  // the (авто) hint or the reset link sits after the label, so reserve room for the longer one on the suggested field
  const labels = [...kindFields[row.kind].map((f) => fieldLabel(f) + (autoKey(row.kind) === f.key ? ` ${dict.autoValue.length > dict.resetAuto.length ? `(${dict.autoValue})` : dict.resetAuto}` : "")), dict.quantity];
  return (
    <div className={cardClass}>
      <div className="mb-4 flex items-end justify-between gap-3">
        <label className="min-w-0 flex-1 sm:max-w-sm">
          <span className={labelClass}>{index + 1}. {dict.kind}</span>
          <select className={selectClass} value={row.kind} onChange={(e) => onKindChange(e.target.value as FittingKind)}>
            {kindOrder.map((k) => (
              <option key={k} value={k} className="bg-panel text-foreground">{kindTitle(k)}</option>
            ))}
          </select>
        </label>
        <button type="button" className={dangerButtonClass} onClick={onRemove}>
          {dict.removeItem}
        </button>
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
        onClick={() => setShowSketch((v) => !v)}
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
