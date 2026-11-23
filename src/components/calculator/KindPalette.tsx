import { useEffect, useRef, useState } from "react";
import type { FittingKind } from "@/lib/form/fields";
import { kindGroups, searchKinds, type KindGroupId } from "@/lib/form/kind-groups";
import { useI18n } from "@/components/i18n";
import { HelpButton } from "./HelpDialog";
import { KindGlyph } from "./KindGlyph";
import { LangRailButton } from "./LangSwitch";
import { scrollToTop } from "./scrollToTop";
import { FoldIcon, SketchesIcon, UpIcon } from "./ViewIcons";
import { buttonClass, inputClass } from "./styles";
import type { CardView } from "./useCardView";
import { useDismiss } from "./useDismiss";

interface Props {
  /** how many rows of the kind the list already has */
  count: (kind: FittingKind) => number;
  onAdd: (kind: FittingKind) => void;
}

/** The list of kinds is one grid, so the designation column is as wide as the longest designation of that list. */
export const kindListGrid = "grid grid-cols-[auto_1fr_auto] gap-x-3";

/** One kind in a list: designation, name, "+" (or the count already in the list). */
function KindItem({ kind, count, onPick }: { kind: FittingKind; count: number; onPick: () => void }) {
  const { dict } = useI18n();
  const k = dict.kinds[kind];
  return (
    <button
      type="button"
      onClick={onPick}
      className="group col-span-3 grid w-full grid-cols-subgrid items-center rounded-md border border-transparent px-1.5 py-1.5 text-left hover:border-line hover:bg-accent-soft focus-visible:outline-2 focus-visible:outline-accent"
    >
      <span className="px-1.5 font-mono text-sm text-accent">{k.designation}</span>
      <span className="text-base leading-tight">{k.name}</span>
      <span
        className="grid h-7 min-w-7 place-items-center rounded-md border border-line px-1 font-mono text-sm text-accent group-hover:border-accent group-hover:bg-accent group-hover:text-background"
        title={count ? `${dict.palette.countOnPage}: ${count}` : dict.addItem}
      >
        {count || "+"}
      </span>
    </button>
  );
}

// sections of the one rail panel, split by a line
const railBox = "flex flex-col gap-1 border-t border-line pt-1.5 first:border-t-0 first:pt-0";

const railAction =
  "grid justify-items-center gap-1 rounded-md border border-transparent px-1 py-1.5 text-center text-xs leading-tight text-muted hover:border-line hover:text-foreground hover:bg-accent-soft focus-visible:outline-2 focus-visible:outline-accent";

/** Desktop: a narrow single-column rail (icon over label) of the kind groups, view toggles, help and language, always in view; a group opens a list of its kinds beside the rail. */
export function KindRail({ count, onAdd, view, hasRows, twoColumns = false, onColumns }: Props & { view: CardView; hasRows: boolean; twoColumns?: boolean; onColumns?: (two: boolean) => void }) {
  const { dict } = useI18n();
  const [open, setOpen] = useState<KindGroupId | null>(null);
  // top of the open group's button inside the sticky box: the list opens level with it
  const [top, setTop] = useState(0);
  const ref = useRef<HTMLElement>(null);
  const box = useRef<HTMLDivElement>(null);
  useDismiss(ref, open !== null, () => setOpen(null));
  const group = kindGroups.find((g) => g.id === open);
  return (
    <nav ref={ref} aria-label={dict.palette.title} className="hidden lg:block">
      {/* the list opens inside the sticky box, so it stays beside the rail wherever the page is scrolled; the box is a stacking context, so it carries z-30 itself or the positioned sections paint over the list (ADR 0087) */}
      <div ref={box} className="sticky top-4 z-30">
      <div className="flex h-[calc(100vh-2rem)] flex-col gap-1.5 overflow-y-auto rounded-lg border border-line bg-panel p-1.5">
      <div className={railBox}>
        <p className="grid justify-items-center gap-0.5 border-b border-line px-0.5 pb-2 pt-1 text-center text-sm font-semibold leading-tight">
          <span aria-hidden="true" className="grid h-7 w-7 place-items-center rounded-full bg-accent text-xl leading-none text-background">+</span>
          {dict.palette.title}
        </p>
        <div className="grid grid-cols-1 gap-0.5">
        {kindGroups.map((g) => (
          <button
            key={g.id}
            type="button"
            aria-expanded={open === g.id}
            onClick={(e) => {
              setTop(box.current ? e.currentTarget.getBoundingClientRect().top - box.current.getBoundingClientRect().top : 0);
              setOpen(open === g.id ? null : g.id);
            }}
            className={`grid justify-items-center gap-1 rounded-md border px-0.5 py-0.5 text-sm leading-tight hover:bg-accent-soft focus-visible:outline-2 focus-visible:outline-accent ${open === g.id ? "border-line bg-accent-soft text-foreground" : "border-transparent text-muted"}`}
          >
            <KindGlyph kind={g.kinds[0]} className="h-7 w-11 text-accent" />
            <span>{dict.kindGroups[g.id]}</span>
          </button>
        ))}
        </div>
      </div>
        {hasRows && (
          <div className={railBox}>
            <p className="px-0.5 pt-0.5 text-center text-[0.65rem] uppercase tracking-wider text-muted">{dict.palette.viewTitle}</p>
            <button type="button" onClick={() => view.setAllSketches(!view.allSketchesOpen)} className={railAction}>
              <SketchesIcon crossed={view.allSketchesOpen} className="h-5 w-8 text-accent" />
              {view.allSketchesOpen ? dict.hideAllSketches : dict.showAllSketches}
            </button>
            <button type="button" onClick={() => view.setAllFolded(!view.allFolded)} className={railAction}>
              <FoldIcon folded={view.allFolded} className="h-5 w-8 text-accent" />
              {view.allFolded ? dict.palette.expandCards : dict.palette.collapseCards}
            </button>
            <button type="button" onClick={() => onColumns?.(!twoColumns)} aria-pressed={twoColumns} className={`${railAction} ${onColumns ? "hidden xl:grid" : "hidden"}`}>
              <ColumnsIcon two={!twoColumns} className="h-5 w-8 text-accent" />
              {twoColumns ? dict.palette.oneColumn : dict.palette.twoColumns}
            </button>
          </div>
        )}
        <div className={railBox}>
          <button type="button" onClick={scrollToTop} className={railAction}>
            <UpIcon className="h-5 w-8 text-accent" />
            {dict.palette.toTop}
          </button>
        </div>
        {/* help and language sit at the bottom of the rail on desktop, beside the work; the phone keeps them in the page header */}
        <div className={`${railBox} mt-auto pb-1`}>
          <HelpButton rail />
          <LangRailButton />
        </div>
      </div>
      {group && (
        <div style={{ top }} className="absolute left-full z-30 ml-2 w-max min-w-64 max-w-[28rem] rounded-lg border border-line bg-panel p-2 shadow-xl shadow-black/30">
          <h3 className="mb-1 px-1.5 text-sm uppercase tracking-wider text-muted">{dict.kindGroups[group.id]}</h3>
          <div className={kindListGrid}>
            {group.kinds.map((kind) => (
              <KindItem
                key={kind}
                kind={kind}
                count={count(kind)}
                onPick={() => {
                  onAdd(kind);
                  setOpen(null);
                }}
              />
            ))}
          </div>
        </div>
      )}
      </div>
    </nav>
  );
}

/** Phone: a bottom sheet with every kind and, at the bottom within thumb reach, a search (not focused on open, so the keyboard stays down). */
export function Sheet({ found, query, setQuery, count, onClose, onAdd }: { found: ReturnType<typeof searchKinds>; query: string; setQuery: (q: string) => void; count: Props["count"]; onClose: () => void; onAdd: (k: FittingKind) => void }) {
  const { dict } = useI18n();
  const ref = useRef<HTMLDivElement>(null);
  useDismiss(ref, true, onClose);
  // The page behind must not scroll while the sheet is open. iOS ignores overflow:hidden on the body and chains touches from a
  // list that does not scroll (few results) or that is at its end, so touches that would move the page are cancelled here.
  const listRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const dialog = ref.current;
    let startY = 0;
    const onStart = (e: TouchEvent) => {
      startY = e.touches[0].clientY;
    };
    const onMove = (e: TouchEvent) => {
      const list = listRef.current;
      if (!list || !(e.target instanceof Node) || !list.contains(e.target)) return e.preventDefault();
      const dy = e.touches[0].clientY - startY;
      const atTop = list.scrollTop <= 0;
      const atBottom = list.scrollTop + list.clientHeight >= list.scrollHeight - 1;
      if (list.scrollHeight <= list.clientHeight || (dy > 0 && atTop) || (dy < 0 && atBottom)) e.preventDefault();
    };
    dialog?.addEventListener("touchstart", onStart, { passive: true });
    dialog?.addEventListener("touchmove", onMove, { passive: false });
    return () => {
      document.body.style.overflow = prev;
      dialog?.removeEventListener("touchstart", onStart);
      dialog?.removeEventListener("touchmove", onMove);
    };
  }, []);
  // The on-screen keyboard shrinks the visual viewport, not the layout one, and iOS pans the visual viewport over the page:
  // while the keyboard is up the sheet is fitted to exactly what is visible (top and bottom), so its list can always be scrolled.
  const [fit, setFit] = useState<{ top: number; height: number } | null>(null);
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const update = () => {
      const keyboard = window.innerHeight - vv.height > 120;
      if (!keyboard) return setFit(null);
      const top = Math.round(vv.offsetTop) + 8;
      setFit({ top, height: Math.max(160, Math.round(vv.offsetTop + vv.height) - top) });
    };
    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
    };
  }, []);
  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50" aria-hidden="true" />
      <div ref={ref} role="dialog" aria-modal="true" aria-label={dict.palette.title} className="fixed inset-x-0 bottom-0 top-16 z-50 flex flex-col gap-2 overscroll-contain rounded-t-2xl border-t border-line bg-panel px-4 pb-4 pt-3 shadow-2xl" style={fit ? { top: fit.top, height: fit.height, bottom: "auto" } : undefined}>
        <div className="flex items-center justify-between">
          <h3 className="font-medium">{dict.palette.title}</h3>
          <button type="button" className={buttonClass} onClick={onClose}>{dict.palette.close}</button>
        </div>
        <div ref={listRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <div className="flex min-h-full flex-col">
            {/* a spacer, not justify-end: a short list sits low, a long one still scrolls up to its first item */}
            <div className="flex-1" aria-hidden="true" />
            {found.length === 0 && <p className="py-4 text-sm text-muted">{dict.palette.nothingFound}</p>}
            {found.map((g) => (
              <div key={g.id} className="mb-2">
                <h4 className="mb-1 mt-2 text-xs uppercase tracking-wider text-muted">{dict.kindGroups[g.id]}</h4>
                <div className={kindListGrid}>{g.kinds.map((kind) => <KindItem key={kind} kind={kind} count={count(kind)} onPick={() => onAdd(kind)} />)}</div>
              </div>
            ))}
          </div>
        </div>
        <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={dict.palette.search} aria-label={dict.palette.search} className={inputClass} />
      </div>
    </>
  );
}

/** Two (or one) column bars: the layout the button switches to. */
function ColumnsIcon({ two, className }: { two: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 32 20" fill="none" stroke="currentColor" strokeWidth="1.6" className={className} aria-hidden="true">
      {two ? (
        <>
          <rect x="4" y="3" width="11" height="14" rx="1.5" />
          <rect x="17" y="3" width="11" height="14" rx="1.5" />
        </>
      ) : (
        <rect x="4" y="3" width="24" height="14" rx="1.5" />
      )}
    </svg>
  );
}
