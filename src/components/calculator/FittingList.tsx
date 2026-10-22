import { useState } from "react";
import type { RowOutcome } from "@/lib/form/calculate";
import type { FieldKey, FittingKind, FormRow } from "@/lib/form/fields";
import { sketchesOpenByDefault } from "@/lib/form/sample-rows";
import { uk as dict } from "@/lib/i18n/uk";
import { FittingCard } from "./FittingCard";
import { kindTitle } from "./format";
import { buttonClass, primaryButtonClass } from "./styles";

interface Props {
  rows: FormRow[];
  outcome: (id: number) => RowOutcome | undefined;
  onKindChange: (id: number, kind: FittingKind) => void;
  onValueChange: (id: number, key: FieldKey, value: string) => void;
  onReset: (id: number, key: FieldKey) => void;
  onPatch: (id: number, patch: Partial<FormRow>) => void;
  onRemove: (id: number) => void;
  onAdd: () => void;
}

/** Rows of one kind next to each other, kinds in the order they first appear; each row keeps its list number. */
function groupByKind(rows: FormRow[]) {
  const groups = new Map<FittingKind, { row: FormRow; index: number }[]>();
  rows.forEach((row, index) => {
    const g = groups.get(row.kind) ?? [];
    g.push({ row, index });
    groups.set(row.kind, g);
  });
  return [...groups.entries()];
}

export function FittingList({ rows, outcome, onKindChange, onValueChange, onReset, onPatch, onRemove, onAdd }: Props) {
  // view state only: per card, whether its sketches are open and whether it is folded to a tile; new rows follow the defaults
  const [sketches, setSketches] = useState<Record<number, boolean>>({});
  const [folded, setFolded] = useState<Record<number, boolean>>({});
  const [sketchDefault, setSketchDefault] = useState(sketchesOpenByDefault);
  const sketchOpen = (id: number) => sketches[id] ?? sketchDefault;
  const isFolded = (id: number) => folded[id] ?? false;
  const allSketchesOpen = rows.every((r) => sketchOpen(r.id));
  const allFolded = rows.length > 0 && rows.every((r) => isFolded(r.id));

  const setAllSketches = (open: boolean) => {
    setSketchDefault(open);
    setSketches(Object.fromEntries(rows.map((r) => [r.id, open])));
  };
  const setAllFolded = (value: boolean) => setFolded(Object.fromEntries(rows.map((r) => [r.id, value])));

  return (
    <section aria-labelledby="items-title" className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="items-title" className="font-medium">{dict.itemsTitle}</h2>
        {rows.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <button type="button" className={buttonClass} onClick={() => setAllSketches(!allSketchesOpen)}>
              {allSketchesOpen ? dict.hideAllSketches : dict.showAllSketches}
            </button>
            <button type="button" className={buttonClass} onClick={() => setAllFolded(!allFolded)}>
              {allFolded ? dict.expandAll : dict.collapseAll}
            </button>
          </div>
        )}
      </div>
      {groupByKind(rows).map(([kind, items]) => {
        const grouped = items.length > 1;
        const groupFolded = items.every((i) => isFolded(i.row.id));
        return (
          <div key={kind} className={grouped ? "space-y-3 rounded-lg border border-line p-3" : undefined}>
            {grouped && (
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-medium">
                  {kindTitle(kind)} <span className="text-muted">× {items.length}</span>
                </h3>
                <button
                  type="button"
                  className={buttonClass}
                  onClick={() => setFolded((f) => ({ ...f, ...Object.fromEntries(items.map((i) => [i.row.id, !groupFolded])) }))}
                >
                  {groupFolded ? dict.expandGroup : dict.collapseGroup}
                </button>
              </div>
            )}
            {/* folded cards are tiles in a grid so many of them fit one screen; open cards span the full width */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {items.map(({ row, index }) => (
                <FittingCard
                  key={row.id}
                  row={row}
                  index={index}
                  showSketch={sketchOpen(row.id)}
                  collapsed={isFolded(row.id)}
                  onToggleSketch={() => setSketches((s) => ({ ...s, [row.id]: !sketchOpen(row.id) }))}
                  onToggleCollapsed={() => setFolded((f) => ({ ...f, [row.id]: !isFolded(row.id) }))}
                  outcome={outcome(row.id)}
                  onKindChange={(k) => onKindChange(row.id, k)}
                  onValueChange={(key, value) => onValueChange(row.id, key, value)}
                  onReset={(key) => onReset(row.id, key)}
                  onPatch={(patch) => onPatch(row.id, patch)}
                  onRemove={() => onRemove(row.id)}
                />
              ))}
            </div>
          </div>
        );
      })}
      <button type="button" className={primaryButtonClass} onClick={onAdd}>
        + {dict.addItem}
      </button>
    </section>
  );
}
