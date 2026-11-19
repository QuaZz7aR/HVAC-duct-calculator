import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { RowOutcome } from "@/lib/form/calculate";
import type { FieldKey, FittingKind, FormRow } from "@/lib/form/fields";
import { useI18n } from "@/components/i18n";
import { moveOnto, positionLabel, positionSpan } from "@/lib/form/order";
import { FittingCard } from "./FittingCard";
import { kindTitle } from "./format";
import { buttonClass } from "./styles";
import type { CardView } from "./useCardView";

interface Props {
  rows: FormRow[];
  view: CardView;
  /** two-column mode (desktop, xl+) */
  twoColumns?: boolean;
  /** the row added last: the list scrolls to it and marks it */
  lastAddedId: number | null;
  outcome: (id: number) => RowOutcome | undefined;
  onKindChange: (id: number, kind: FittingKind) => void;
  onValueChange: (id: number, key: FieldKey, value: string) => void;
  onReset: (id: number, key: FieldKey) => void;
  onPatch: (id: number, patch: Partial<FormRow>) => void;
  onClone: (id: number) => void;
  onRemove: (id: number) => void;
  /** one step up (-1) or down (+1) */
  onMove: (id: number, step: number) => void;
  /** drag and drop: `id` takes the place of `targetId` */
  onDrop: (id: number, targetId: number) => void;
}

/** Runs of neighbouring rows of one kind, in list order; each row keeps its list number. The order is the user's (ADR 0049), so a section is only what already stands together. */
export function groupRuns(rows: FormRow[]) {
  const runs: { kind: FittingKind; items: { row: FormRow; index: number }[] }[] = [];
  rows.forEach((row, index) => {
    const last = runs[runs.length - 1];
    if (last && last.kind === row.kind) last.items.push({ row, index });
    else runs.push({ kind: row.kind, items: [{ row, index }] });
  });
  return runs;
}

export function FittingList({ rows: listRows, view, outcome, onKindChange, onValueChange, onReset, onPatch, onClone, onRemove, onMove, onDrop, lastAddedId, twoColumns = false }: Props) {
  const { dict } = useI18n();
  const { sketchOpen, isFolded, setFoldedMany } = view;
  // two-column mode (desktop, xl+): four tile columns, an open card spans two of them
  const gridClass = twoColumns ? "grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 min-[1800px]:grid-cols-5";

  // live preview while dragging (ADR 0049): the list is shown as if the card were already dropped on the card under the pointer
  const [drag, setDrag] = useState<{ id: number; overId: number; prevId?: number } | null>(null);
  const rows = drag ? moveOnto(listRows, drag.id, drag.overId) : listRows;

  // cards glide to their new place when the order changes (FLIP): measure after the change, start each card at its old place, let it slide to zero
  const orderKey = rows.map((r) => r.id).join(",");
  const places = useRef(new Map<string, DOMRect>());
  const lastOrder = useRef(orderKey);
  useLayoutEffect(() => {
    const cards = [...document.querySelectorAll<HTMLElement>("#items [id^=fitting-]")];
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (lastOrder.current !== orderKey && !reduce) {
      for (const el of cards) {
        const old = places.current.get(el.id);
        if (!old) continue;
        const now = el.getBoundingClientRect();
        const dx = old.left - now.left;
        const dy = old.top - now.top;
        if (!dx && !dy) continue;
        el.style.transition = "none";
        el.style.transform = `translate(${dx}px, ${dy}px)`;
        requestAnimationFrame(() => {
          el.style.transition = "transform 200ms ease";
          el.style.transform = "";
        });
      }
    }
    lastOrder.current = orderKey;
  });
  // the old places are taken just before an order change, so scrolling and folding in between do not count
  const remember = () => {
    places.current = new Map([...document.querySelectorAll<HTMLElement>("#items [id^=fitting-]")].map((el) => [el.id, el.getBoundingClientRect()]));
  };

  // the card under the pointer becomes the drop place; the dragged card and the last two cards it displaced are ignored: after the preview move either may sit under the pointer, so the list does not flicker back and forth
  const overCard = (targetId: number) => {
    remember();
    setDrag((d) => (d && d.id !== targetId && d.overId !== targetId && d.prevId !== targetId ? { ...d, overId: targetId, prevId: d.overId } : d));
  };
  const dragNow = useRef(drag);
  useEffect(() => {
    dragNow.current = drag;
  }, [drag]);

  // touch drag by the handle (phone, ADR 0049): the browser's drag and drop does not work by touch on iOS, so pointer events drive the same preview; near the screen edge the page scrolls
  const startTouch = (id: number, start: React.PointerEvent) => {
    start.preventDefault();
    setDrag({ id, overId: id });
    let x = start.clientX;
    let y = start.clientY;
    let frame = 0;
    const hit = () => {
      const el = document.elementFromPoint(x, y)?.closest<HTMLElement>("#items [id^=fitting-]");
      if (el) overCard(Number(el.id.slice("fitting-".length)));
    };
    const tick = () => {
      const edge = 80;
      const step = y < edge ? -(edge - y) / 4 : y > window.innerHeight - edge ? (y - (window.innerHeight - edge)) / 4 : 0;
      if (step) {
        window.scrollBy(0, step);
        hit();
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    const move = (e: PointerEvent) => {
      x = e.clientX;
      y = e.clientY;
      hit();
    };
    const end = (commit: boolean) => () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", cancel);
      const d = dragNow.current;
      if (commit && d && d.overId !== d.id) onDrop(d.id, d.overId);
      setDrag(null);
    };
    const up = end(true);
    const cancel = end(false);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", cancel);
  };

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
      position={positionLabel(row, index)}
      first={index === 0}
      last={index === rows.length - 1}
      onMove={(step) => {
        remember();
        onMove(row.id, step);
      }}
      dragging={drag?.id === row.id}
      onDragStart={() => setDrag({ id: row.id, overId: row.id })}
      onDragEnd={() => setDrag(null)}
      onDragOverHere={() => drag && overCard(row.id)}
      onTouchDrag={(e) => startTouch(row.id, e)}
      justAdded={row.id === lastAddedId}
      showSketch={sketchOpen(row.id)}
      collapsed={isFolded(row.id)}
      half={twoColumns}
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
    <section
      id="items"
      aria-labelledby="items-title"
      className="scroll-mt-28 space-y-3"
      // the whole list takes the drop, so a drop in a gap between cards (or on the moving card) still lands where the preview shows
      onDragOver={(e) => drag && e.preventDefault()}
      onDrop={(e) => {
        if (!drag) return;
        e.preventDefault();
        if (drag.overId !== drag.id) onDrop(drag.id, drag.overId);
        setDrag(null);
      }}
    >
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
      <div className={gridClass}>
        {groupRuns(rows).map(({ kind, items }) => {
          if (items.length === 1) return card(items[0].row, items[0].index);
          const groupFolded = items.every((i) => isFolded(i.row.id));
          return (
            <div key={`${kind}-${items[0].row.id}`} className="col-span-full space-y-3 rounded-lg border border-line p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-medium">
                  <span className="text-muted">{positionSpan(items.map((i) => positionLabel(i.row, i.index)))}.</span> {kindTitle(kind, dict)} <span className="text-muted">× {items.length}</span>
                </h3>
                <button
                  type="button"
                  className={buttonClass}
                  onClick={() => setFoldedMany(items.map((i) => i.row.id), !groupFolded)}
                >
                  {groupFolded ? dict.expandGroup : dict.collapseGroup}
                </button>
              </div>
              <div className={gridClass}>{items.map(({ row, index }) => card(row, index))}</div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
