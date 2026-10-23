import { useEffect, useRef, useState, type CSSProperties } from "react";
import type { FittingKind } from "@/lib/form/fields";
import { quickKinds, searchKinds } from "@/lib/form/kind-groups";
import { uk as dict } from "@/lib/i18n/uk";
import { Sheet } from "./KindPalette";
import type { CardView } from "./useCardView";
import { scrollToTop } from "./scrollToTop";
import { useDismiss } from "./useDismiss";
import { FoldIcon, SketchesIcon, UpIcon } from "./ViewIcons";

const round =
  "grid h-12 w-12 place-items-center rounded-full border border-line bg-panel text-accent shadow-lg shadow-black/30 hover:bg-accent-soft focus-visible:outline-2 focus-visible:outline-accent";

/** Where the buttons of the "+" menu sit: three arcs around the "+" button, angle 0 = straight left, 90 = straight up. Items are 48 px round buttons, at least ~68 px apart centre to centre, every arc symmetric about the 45 degree line, so a thumb does not hit a neighbour. Items fill the inner arc first. */
const arcs = [
  { radius: 80, angles: [18, 72] },
  { radius: 145, angles: [0, 45, 90] },
  { radius: 210, angles: [7.5, 32.5, 57.5, 82.5] },
];
const fanSlots = arcs.flatMap(({ radius, angles }) =>
  angles.map((deg) => ({ dx: -Math.round(radius * Math.cos((deg * Math.PI) / 180)), dy: -Math.round(radius * Math.sin((deg * Math.PI) / 180)) })),
);

interface Props {
  view: CardView;
  hasRows: boolean;
  /** how many rows of the kind the list already has */
  count: (kind: FittingKind) => number;
  onAdd: (kind: FittingKind) => void;
}

/** Phone: a column of small round buttons at the right edge, within reach of a thumb. Closed: the two view toggles, "to top" after a short scroll down, and "+". Opened by "+": the quick kinds and "..." (the sheet with every kind and a search) fan out along three arcs. The column sits 15 % of the screen height above the bottom edge. */
export function PhoneActions({ view, hasRows, count, onAdd }: Props) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [sheet, setSheet] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  useDismiss(ref, open && !sheet, () => setOpen(false));
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 300);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  const closeSheet = () => {
    setSheet(false);
    setQuery("");
    setOpen(false);
  };
  const items: { kind?: FittingKind; text: string; label: string }[] = [
    ...quickKinds.map((kind) => ({ kind, text: dict.kinds[kind].designation, label: dict.kinds[kind].name })),
    { text: "⋯", label: dict.palette.allKinds },
  ];
  const sketches = view.allSketchesOpen ? dict.hideAllSketches : dict.showAllSketches;
  const folding = view.allFolded ? dict.palette.expandCards : dict.palette.collapseCards;
  return (
    <>
      {open && <div className="fixed inset-0 z-30 bg-black/30 lg:hidden" aria-hidden="true" />}
      <div
        ref={ref}
        className="fixed z-30 flex flex-col gap-2 lg:hidden"
        style={{ right: "max(1rem, env(safe-area-inset-right, 0px))", bottom: "max(1rem, calc(env(safe-area-inset-bottom, 0px) + 15svh))" }}
      >
        {!open && hasRows && (
          <>
            <button type="button" onClick={() => view.setAllSketches(!view.allSketchesOpen)} aria-label={sketches} title={sketches} className={round}>
              <SketchesIcon crossed={view.allSketchesOpen} className="h-5 w-7" />
            </button>
            <button type="button" onClick={() => view.setAllFolded(!view.allFolded)} aria-label={folding} title={folding} className={round}>
              <FoldIcon folded={view.allFolded} className="h-5 w-7" />
            </button>
          </>
        )}
        {!open && scrolled && (
          <button type="button" onClick={scrollToTop} aria-label={dict.palette.toTop} title={dict.palette.toTop} className={round}>
            <UpIcon className="h-5 w-7" />
          </button>
        )}
        <div className="relative h-12 w-12 self-end">
          {open && (
            <div role="toolbar" aria-label={dict.palette.title}>
              {items.map((item, i) => (
                <button
                  key={item.kind ?? "all"}
                  type="button"
                  onClick={() => (item.kind ? (onAdd(item.kind), setOpen(false)) : setSheet(true))}
                  aria-label={item.label}
                  title={item.label}
                  aria-haspopup={item.kind ? undefined : "dialog"}
                  className={`${round} fan-item absolute left-0 top-0 font-mono text-sm font-semibold`}
                  style={{ "--dx": `${fanSlots[i].dx}px`, "--dy": `${fanSlots[i].dy}px` } as CSSProperties}
                >
                  {item.text}
                </button>
              ))}
            </div>
          )}
          <button
            type="button"
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            aria-label={open ? dict.palette.closeMenu : dict.palette.addButton}
            title={open ? dict.palette.closeMenu : dict.palette.addButton}
            className="relative grid h-12 w-12 place-items-center rounded-full bg-accent text-2xl font-light leading-none text-background shadow-lg shadow-black/30 focus-visible:outline-2 focus-visible:outline-accent"
          >
            {open ? "×" : "+"}
          </button>
        </div>
      </div>
      {sheet && <Sheet found={searchKinds(query)} query={query} setQuery={setQuery} count={count} onClose={closeSheet} onAdd={(k) => { onAdd(k); closeSheet(); }} />}
    </>
  );
}
