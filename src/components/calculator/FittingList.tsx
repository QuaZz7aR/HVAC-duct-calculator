import { useEffect } from "react";
import type { RowOutcome } from "@/lib/form/calculate";
import type { FieldKey, FittingKind, FormRow } from "@/lib/form/fields";
import { uk as dict } from "@/lib/i18n/uk";
import { FittingCard } from "./FittingCard";
import { kindTitle } from "./format";
import { buttonClass } from "./styles";
import type { CardView } from "./useCardView";

interface Props {
  rows: FormRow[];
  view: CardView;
  /** the row added last: the list scrolls to it and marks it */
  lastAddedId: number | null;
  outcome: (id: number) => RowOutcome | undefined;
  onKindChange: (id: number, kind: FittingKind) => void;
  onValueChange: (id: number, key: FieldKey, value: string) => void;
  onReset: (id: number, key: FieldKey) => void;
  onPatch: (id: number, patch: Partial<FormRow>) => void;
  onClone: (id: number) => void;
  onRemove: (id: number) => void;
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

export function FittingList({ rows, view, outcome, onKindChange, onValueChange, onReset, onPatch, onClone, onRemove, lastAddedId }: Props) {
  const { sketchOpen, isFolded, setFoldedMany } = view;

  useEffect(() => {
    if (lastAddedId === null) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.getElementById(`fitting-${lastAddedId}`)?.scrollIntoView({ block: "nearest", behavior: reduce ? "auto" : "smooth" });
  }, [lastAddedId]);

  const card = (row: FormRow, index: number) => (
    <FittingCard
      key={row.id}
      row={row}
      index={index}
      justAdded={row.id === lastAddedId}
      showSketch={sketchOpen(row.id)}
      collapsed={isFolded(row.id)}
      onToggleSketch={() => view.toggleSketch(row.id)}
      onToggleCollapsed={() => view.toggleFolded(row.id)}
      outcome={outcome(row.id)}
      onKindChange={(k) => onKindChange(row.id, k)}
      onValueChange={(key, value) => onValueChange(row.id, key, value)}
      onReset={(key) => onReset(row.id, key)}
      onPatch={(patch) => onPatch(row.id, patch)}
      onClone={() => onClone(row.id)}
      onRemove={() => onRemove(row.id)}
    />
  );

  return (
    <section id="items" aria-labelledby="items-title" className="scroll-mt-28 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 id="items-title" className="font-medium">{dict.itemsTitle}</h2>
          <p className="text-sm text-muted">
            <span className="hidden lg:inline">{dict.palette.hintRail}</span>
            <span className="lg:hidden">{dict.palette.hintBar}</span>
          </p>
        </div>
      </div>
      {/* one grid for the page: single cards and folded tiles share the 1-3 columns, a repeated kind is a full-width section with a grid of its own; open cards span the full width */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {groupByKind(rows).map(([kind, items]) => {
          if (items.length === 1) return card(items[0].row, items[0].index);
          const groupFolded = items.every((i) => isFolded(i.row.id));
          return (
            <div key={kind} className="col-span-full space-y-3 rounded-lg border border-line p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-medium">
                  {kindTitle(kind)} <span className="text-muted">× {items.length}</span>
                </h3>
                <button
                  type="button"
                  className={buttonClass}
                  onClick={() => setFoldedMany(items.map((i) => i.row.id), !groupFolded)}
                >
                  {groupFolded ? dict.expandGroup : dict.collapseGroup}
                </button>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">{items.map(({ row, index }) => card(row, index))}</div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
