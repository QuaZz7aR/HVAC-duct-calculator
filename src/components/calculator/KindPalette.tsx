import { useRef, useState } from "react";
import type { FittingKind } from "@/lib/form/fields";
import { kindGroups, quickKinds, searchKinds, type KindGroupId } from "@/lib/form/kind-groups";
import { uk as dict } from "@/lib/i18n/uk";
import { KindGlyph } from "./KindGlyph";
import { buttonClass, inputClass } from "./styles";
import type { CardView } from "./useCardView";
import { useDismiss } from "./useDismiss";

interface Props {
  /** how many rows of the kind the list already has */
  count: (kind: FittingKind) => number;
  onAdd: (kind: FittingKind) => void;
}

/** One kind in a list: designation, name, "+" (or the count already in the list). */
function KindItem({ kind, count, onPick }: { kind: FittingKind; count: number; onPick: () => void }) {
  const k = dict.kinds[kind];
  return (
    <button
      type="button"
      onClick={onPick}
      className="group grid w-full grid-cols-[4.5rem_1fr_auto] items-center gap-2 rounded-md border border-transparent px-1.5 py-1.5 text-left hover:border-line hover:bg-accent-soft focus-visible:outline-2 focus-visible:outline-accent"
    >
      <span className="font-mono text-xs text-accent">{k.designation}</span>
      <span className="text-sm leading-tight">{k.name}</span>
      <span
        className="grid h-6 min-w-6 place-items-center rounded-md border border-line px-1 font-mono text-xs text-accent group-hover:border-accent group-hover:bg-accent group-hover:text-background"
        title={count ? `${dict.palette.countOnPage}: ${count}` : dict.addItem}
      >
        {count || "+"}
      </span>
    </button>
  );
}

const railBox = "flex flex-col gap-1 rounded-lg border border-line bg-panel p-1.5";

const railAction =
  "grid justify-items-center gap-0.5 rounded-md border border-line px-0.5 py-1.5 text-center text-[11px] leading-tight hover:bg-accent-soft focus-visible:outline-2 focus-visible:outline-accent";

/** Desktop: a narrow rail of the kind groups, always in view; a group opens a list of its kinds beside the rail. */
export function KindRail({ count, onAdd, view, hasRows }: Props & { view: CardView; hasRows: boolean }) {
  const [open, setOpen] = useState<KindGroupId | null>(null);
  // top of the open group's button inside the sticky box: the list opens level with it
  const [top, setTop] = useState(0);
  const ref = useRef<HTMLElement>(null);
  const box = useRef<HTMLDivElement>(null);
  useDismiss(ref, open !== null, () => setOpen(null));
  const group = kindGroups.find((g) => g.id === open);
  return (
    <nav ref={ref} aria-label={dict.palette.title} className="hidden lg:block">
      {/* the list opens inside the sticky box, so it stays beside the rail wherever the page is scrolled */}
      <div ref={box} className="sticky top-4">
      <div className="flex max-h-[calc(100vh-2rem)] flex-col gap-2 overflow-y-auto">
      <div className={railBox}>
        <p className="grid justify-items-center gap-0.5 border-b border-line px-0.5 pb-2 pt-1 text-center text-[11px] font-medium leading-tight">
          <span aria-hidden="true" className="grid h-6 w-6 place-items-center rounded-full bg-accent text-base leading-none text-background">+</span>
          {dict.palette.title}
        </p>
        {kindGroups.map((g) => (
          <button
            key={g.id}
            type="button"
            aria-expanded={open === g.id}
            onClick={(e) => {
              setTop(box.current ? e.currentTarget.getBoundingClientRect().top - box.current.getBoundingClientRect().top : 0);
              setOpen(open === g.id ? null : g.id);
            }}
            className={`grid justify-items-center gap-0.5 rounded-md border px-0.5 py-1.5 text-[11px] leading-tight hover:bg-accent-soft focus-visible:outline-2 focus-visible:outline-accent ${open === g.id ? "border-line bg-accent-soft text-foreground" : "border-transparent text-muted"}`}
          >
            <KindGlyph kind={g.kinds[0]} className="h-[22px] w-[34px] text-accent" />
            <span>{dict.kindGroups[g.id]}</span>
          </button>
        ))}
      </div>
        {hasRows && (
          <div className={railBox}>
            <p className="px-0.5 pt-0.5 text-center text-[11px] uppercase tracking-wider text-muted">{dict.palette.viewTitle}</p>
            <button type="button" onClick={() => view.setAllSketches(!view.allSketchesOpen)} className={railAction}>
              <svg viewBox="0 0 24 16" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="h-4 w-6 text-accent">
                <path d="M1.5 8S5 2 12 2s10.5 6 10.5 6S19 14 12 14 1.5 8 1.5 8z" />
                <circle cx="12" cy="8" r="2.5" />
                {view.allSketchesOpen && <path d="M3 15L21 1" />}
              </svg>
              {view.allSketchesOpen ? dict.palette.hideSketches : dict.palette.showSketches}
            </button>
            <button type="button" onClick={() => view.setAllFolded(!view.allFolded)} className={railAction}>
              <svg viewBox="0 0 24 16" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="h-4 w-6 text-accent">
                {view.allFolded ? <path d="M6 6l6-4 6 4M6 10l6 4 6-4" /> : <path d="M6 2l6 4 6-4M6 14l6-4 6 4" />}
              </svg>
              {view.allFolded ? dict.expandAll : dict.collapseAll}
            </button>
          </div>
        )}
      </div>
      {group && (
        <div style={{ top }} className="absolute left-full z-30 ml-2 w-72 rounded-lg border border-line bg-panel p-2 shadow-xl shadow-black/30">
          <h3 className="mb-1 px-1.5 text-xs uppercase tracking-wider text-muted">{dict.kindGroups[group.id]}</h3>
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
      )}
      </div>
    </nav>
  );
}

/** Phone: a sticky row of quick buttons and "all kinds", which opens a bottom sheet with search. */
export function KindQuickBar({ count, onAdd }: Props) {
  const [sheet, setSheet] = useState(false);
  const [query, setQuery] = useState("");
  const close = () => {
    setSheet(false);
    setQuery("");
  };
  const found = searchKinds(query);
  return (
    <div className="sticky top-0 z-20 -mx-4 border-b border-line bg-panel lg:hidden">
      <div className="flex gap-1.5 overflow-x-auto px-4 py-2" role="toolbar" aria-label={dict.palette.title}>
        {quickKinds.map((kind) => (
          <button key={kind} type="button" onClick={() => onAdd(kind)} title={dict.kinds[kind].name} className="flex-none whitespace-nowrap rounded-full border border-line bg-background px-3 py-1 text-sm hover:bg-accent-soft focus-visible:outline-2 focus-visible:outline-accent">
            <span className="mr-1 font-mono text-accent">+</span>
            {dict.kinds[kind].designation}
          </button>
        ))}
        <button type="button" onClick={() => setSheet(true)} aria-haspopup="dialog" className="flex-none whitespace-nowrap rounded-full border border-accent bg-accent-soft px-3 py-1 text-sm text-accent focus-visible:outline-2 focus-visible:outline-accent">
          {dict.palette.allKinds}
        </button>
      </div>
      {sheet && <Sheet found={found} query={query} setQuery={setQuery} count={count} onClose={close} onAdd={(k) => { onAdd(k); close(); }} />}
    </div>
  );
}

function Sheet({ found, query, setQuery, count, onClose, onAdd }: { found: ReturnType<typeof searchKinds>; query: string; setQuery: (q: string) => void; count: Props["count"]; onClose: () => void; onAdd: (k: FittingKind) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useDismiss(ref, true, onClose);
  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50" aria-hidden="true" />
      <div ref={ref} role="dialog" aria-modal="true" aria-label={dict.palette.title} className="fixed inset-x-0 bottom-0 top-16 z-50 flex flex-col gap-2 rounded-t-2xl border-t border-line bg-panel px-4 pb-4 pt-3 shadow-2xl">
        <div className="flex items-center justify-between">
          <h3 className="font-medium">{dict.palette.title}</h3>
          <button type="button" className={buttonClass} onClick={onClose}>{dict.palette.close}</button>
        </div>
        <input type="search" autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder={dict.palette.search} aria-label={dict.palette.search} className={inputClass} />
        <div className="min-h-0 flex-1 overflow-y-auto">
          {found.length === 0 && <p className="py-4 text-sm text-muted">{dict.palette.nothingFound}</p>}
          {found.map((g) => (
            <div key={g.id} className="mb-2">
              <h4 className="mb-1 mt-2 text-xs uppercase tracking-wider text-muted">{dict.kindGroups[g.id]}</h4>
              {g.kinds.map((kind) => <KindItem key={kind} kind={kind} count={count(kind)} onPick={() => onAdd(kind)} />)}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
