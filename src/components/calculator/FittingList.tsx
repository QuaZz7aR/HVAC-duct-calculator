import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { RowOutcome } from "@/lib/form/calculate";
import type { FieldKey, FittingKind, FormRow } from "@/lib/form/fields";
import { useI18n } from "@/components/i18n";
import { moveBlock, positionLabel, positionSpan } from "@/lib/form/order";
import { FittingCard } from "./FittingCard";
import { kindTitle } from "./format";
import { buttonClass, dangerButtonClass } from "./styles";
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
  onClone: (id: number) => number;
  onRemove: (id: number) => void;
  /** one step up (-1) or down (+1) */
  onMove: (id: number, step: number) => void;
  /** removes every row */
  onClear?: () => void;
  /** drag and drop: a card or a whole section (`ids`) takes the place of `targetId` */
  onDrop: (ids: number[], targetId: number) => void;
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

/** «Видалити всі»: a second tap confirms, so one slip does not empty the list (no browser dialog). */
function ClearAll({ count, onClear }: { count: number; onClear: () => void }) {
  const { dict } = useI18n();
  const t = dict.clearAll;
  const [asking, setAsking] = useState(false);
  if (!asking) return <button type="button" className={dangerButtonClass} onClick={() => setAsking(true)}>{t.button}</button>;
  return (
    <div role="group" aria-label={t.button} className="flex flex-wrap items-center gap-2">
      <span className="text-sm">{t.confirm(count)}</span>
      <button type="button" className={dangerButtonClass} onClick={() => { onClear(); setAsking(false); }}>{t.yes}</button>
      <button type="button" className={buttonClass} onClick={() => setAsking(false)}>{t.no}</button>
    </div>
  );
}

export function FittingList({ rows: listRows, view, outcome, onKindChange, onValueChange, onReset, onPatch, onClone, onRemove, onClear, onMove, onDrop, lastAddedId, twoColumns = false }: Props) {
  const { dict } = useI18n();
  const { sketchOpen, isFolded, setFoldedMany } = view;
  // two-column mode (desktop, xl+): four tile columns, an open card spans two of them
  // tile columns per width; every section takes the full width (ADR 0071)
  const gridClass = twoColumns ? "grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 min-[1800px]:grid-cols-6";
  // folded tiles read down the columns (ADR 0065): a grid filled column by column, with as many rows as the column count needs
  // at each width (--r1, --r2...), so the tiles of a row share its height (ADR 0066)
  const rowsAt = "[grid-template-rows:repeat(var(--r1),auto)] sm:[grid-template-rows:repeat(var(--r2),auto)] lg:[grid-template-rows:repeat(var(--r3),auto)]";
  const tileColumns = twoColumns
    ? `grid grid-flow-col gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 ${rowsAt} xl:[grid-template-rows:repeat(var(--r4),auto)]`
    : `grid grid-flow-col gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 min-[1800px]:grid-cols-6 ${rowsAt} xl:[grid-template-rows:repeat(var(--r4),auto)] min-[1800px]:[grid-template-rows:repeat(var(--r6),auto)]`;
  const rowVars = (n: number) => Object.fromEntries([1, 2, 3, 4, 6].map((c) => [`--r${c}`, Math.ceil(n / c)])) as React.CSSProperties;
  const tile = (node: React.ReactNode, key: number) => <div key={key} className="min-w-0 [&>*]:h-full">{node}</div>;

  // live preview while dragging (ADR 0049): the list is shown as if the card were already dropped on the card under the pointer
  const [drag, setDrag] = useState<{ ids: number[]; overId: number; prevId?: number; touch?: boolean } | null>(null);
  const rows = drag ? moveBlock(listRows, drag.ids, drag.overId) : listRows;

  // cards glide to their new place when the order changes (FLIP): measure after the change, start each card at its old place, let it slide to zero
  const orderKey = rows.map((r) => r.id).join(",");
  const places = useRef(new Map<string, DOMRect>());
  const lastOrder = useRef(orderKey);
  useLayoutEffect(() => {
    const cards = [...document.querySelectorAll<HTMLElement>("#items [id^=fitting-]")];
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // only a pure reorder glides (same cards, new order); an added or removed card would shift every tile of a column-filled grid (ADR 0068)
    const sameSet = (a: string, b: string) => a.split(",").sort().join() === b.split(",").sort().join();
    if (lastOrder.current !== orderKey && sameSet(lastOrder.current, orderKey) && !reduce) {
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
    if (lastOrder.current !== orderKey) places.current.clear();
    lastOrder.current = orderKey;
  });
  // the old places are taken just before an order change, so scrolling and folding in between do not count
  const remember = () => {
    places.current = new Map([...document.querySelectorAll<HTMLElement>("#items [id^=fitting-]")].map((el) => [el.id, el.getBoundingClientRect()]));
  };

  // the card under the pointer becomes the drop place; the dragged card and the last two cards it displaced are ignored: after the preview move either may sit under the pointer, so the list does not flicker back and forth
  const overCard = (targetId: number) => {
    remember();
    setDrag((d) => (d && !d.ids.includes(targetId) && d.overId !== targetId && d.prevId !== targetId ? { ...d, overId: targetId, prevId: d.overId } : d));
  };
  // a mouse drag whose source left the page (a card that moved into or out of a section during the preview) gets no dragend;
  // the browser sends no mouse events during a drag, so the first one after it ends the stale preview
  useEffect(() => {
    if (!drag || drag.touch) return;
    const clear = () => setDrag(null);
    window.addEventListener("mousemove", clear);
    window.addEventListener("dragend", clear, true);
    return () => {
      window.removeEventListener("mousemove", clear);
      window.removeEventListener("dragend", clear, true);
    };
  }, [drag]);
  const dragNow = useRef(drag);
  useEffect(() => {
    dragNow.current = drag;
  }, [drag]);

  // touch drag by the handle (phone, ADR 0049): the browser's drag and drop does not work by touch on iOS, so pointer events drive the same preview; near the screen edge the page scrolls
  const startTouch = (ids: number[], start: React.PointerEvent) => {
    start.preventDefault();
    setDrag({ ids, overId: ids[0], touch: true });
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
      if (commit && d && !d.ids.includes(d.overId)) onDrop(d.ids, d.overId);
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

  const runs = groupRuns(rows);

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
      dragging={!!drag?.ids.includes(row.id)}
      onDragStart={() => setDrag({ ids: [row.id], overId: row.id })}
      onDragEnd={() => setDrag(null)}
      onDragOverHere={() => drag && overCard(row.id)}
      onTouchDrag={(e) => startTouch([row.id], e)}
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
      onClone={() => {
        // the copy opens in its original's view (folded tile or full card, sketch open or closed)
        const copyId = onClone(row.id);
        if (isFolded(row.id)) setFoldedMany([copyId], true);
        if (sketchOpen(row.id) !== sketchOpen(copyId)) view.toggleSketch(copyId);
      }}
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
        if (!drag.ids.includes(drag.overId)) onDrop(drag.ids, drag.overId);
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
        {listRows.length > 0 && onClear && <ClearAll count={listRows.length} onClear={onClear} />}
      </div>
      {/* one grid for the page: single cards and folded tiles share the 1-3 columns, a repeated kind is a full-width section with a grid of its own; open cards span the full width */}
      <div className={gridClass}>
        {runs.map(({ kind, items }, r) => {
          const lone = (k: number) => runs[k]?.items.length === 1 && isFolded(runs[k].items[0].row.id);
          // a stretch of single folded tiles is one block whose tiles run down its columns; its first run renders it
          if (lone(r)) {
            if (lone(r - 1)) return null;
            let end = r;
            while (lone(end + 1)) end++;
            return (
              // a dashed frame and a muted title set the single fittings apart from the sections (ADR 0070)
              <div key={`tiles-${items[0].row.id}`} className="col-span-full space-y-3 rounded-lg border border-dashed border-line p-3">
                <h3 className="text-sm font-medium text-muted">{dict.singlesTitle} <span>× {end - r + 1}</span></h3>
                <div className={tileColumns} style={rowVars(end - r + 1)}>
                  {runs.slice(r, end + 1).map((x) => tile(card(x.items[0].row, x.items[0].index), x.items[0].row.id))}
                </div>
              </div>
            );
          }
          if (items.length === 1) return card(items[0].row, items[0].index);
          const groupFolded = items.every((i) => isFolded(i.row.id));
          const ids = items.map((i) => i.row.id);
          const dragging = !!drag && ids.every((id) => drag.ids.includes(id));
          // a section moves as a whole past the neighbouring run (ADR 0052)
          const moveSection = (target: number | undefined) => {
            if (target === undefined) return;
            remember();
            onDrop(ids, target);
          };
          const prev = runs[r - 1]?.items[0]?.row.id;
          const next = runs[r + 1]?.items.at(-1)?.row.id;
          return (
            // the dragged section keeps its key while the preview merges it with a neighbour, so its handle stays mounted
            <div key={`${kind}-${drag && ids.includes(drag.ids[0]) ? drag.ids[0] : items[0].row.id}`} id={`section-${items[0].row.id}`} className={`col-span-full scroll-mt-16 space-y-3 rounded-lg border border-accent/35 p-3 ${dragging ? "border-2 border-dashed !border-accent bg-accent-soft opacity-60" : ""}`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span
                  draggable
                  role="img"
                  aria-label={dict.order.dragSection}
                  title={dict.order.dragSection}
                  className="shrink-0 cursor-grab touch-none select-none px-2 py-2 text-xl leading-none text-muted hover:text-foreground active:cursor-grabbing lg:px-1 lg:py-0 lg:text-lg"
                  onPointerDown={(e) => {
                    if (e.pointerType !== "mouse") startTouch(ids, e);
                  }}
                  onDragStart={(e) => {
                    e.dataTransfer.effectAllowed = "move";
                    e.dataTransfer.setData("text/plain", ids.join(","));
                    const el = document.getElementById(`section-${items[0].row.id}`);
                    if (el) e.dataTransfer.setDragImage(el, 20, 20);
                    setTimeout(() => setDrag({ ids, overId: ids[0] }), 0);
                  }}
                  onDragEnd={() => setDrag(null)}
                >
                  ⠿
                </span>
                <h3 className="min-w-0 flex-1 text-sm font-medium">
                  <span className="text-muted">{positionSpan(items.map((i) => positionLabel(i.row, i.index)))}.</span> {kindTitle(kind, dict)} <span className="text-muted">× {items.length}</span>
                </h3>
                <button type="button" className={`${buttonClass} shrink-0 !px-2 !py-1 disabled:cursor-default disabled:opacity-40`} disabled={prev === undefined} onClick={() => moveSection(prev)} aria-label={dict.order.sectionUp} title={dict.order.sectionUp}>↑</button>
                <button type="button" className={`${buttonClass} shrink-0 !px-2 !py-1 disabled:cursor-default disabled:opacity-40`} disabled={next === undefined} onClick={() => moveSection(next)} aria-label={dict.order.sectionDown} title={dict.order.sectionDown}>↓</button>
                <button
                  type="button"
                  className={buttonClass}
                  onClick={() => setFoldedMany(items.map((i) => i.row.id), !groupFolded)}
                >
                  {groupFolded ? dict.expandGroup : dict.collapseGroup}
                </button>
              </div>
              {groupFolded ? (
                <div className={tileColumns} style={rowVars(items.length)}>{items.map(({ row, index }) => tile(card(row, index), row.id))}</div>
              ) : (
                <div className={gridClass}>{items.map(({ row, index }) => card(row, index))}</div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
