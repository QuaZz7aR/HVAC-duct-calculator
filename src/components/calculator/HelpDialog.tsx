import { useEffect, useId, useRef, useState } from "react";
import { useI18n } from "@/components/i18n";
import { buttonClass, railItemClass } from "./styles";

/** The «Довідка» button in the header and the short how-to it opens (a native modal dialog: Esc and the cross close it). */
/** Once the page is idle, fetch the first clip of the guide into the browser cache, so it plays at once when the dialog opens (ADR 0105). */
const prefetched = new Set<string>();
function usePrefetchFirstClip(lang: string) {
  useEffect(() => {
    const phone = !!window.matchMedia?.("(max-width: 1023px)").matches;
    const url = `/help/${helpClips[0]}-${lang}${phone ? "-phone" : ""}.mp4`;
    // the button renders twice (phone header, desktop rail): fetch once
    const run = () => { if (prefetched.has(url)) return; prefetched.add(url); fetch(url).catch(() => {}); };
    // Safari has no requestIdleCallback: a plain delay there
    const hasIdle = "requestIdleCallback" in window;
    const id = hasIdle ? window.requestIdleCallback(run) : window.setTimeout(run, 3000);
    return () => (hasIdle ? window.cancelIdleCallback(id) : window.clearTimeout(id));
  }, [lang]);
}

export function HelpButton({ rail = false }: { rail?: boolean }) {
  const { dict, lang } = useI18n();
  usePrefetchFirstClip(lang);
  const ref = useRef<HTMLDialogElement>(null);
  // the button is rendered twice (phone header, desktop rail), so the title id must be unique
  const titleId = useId();
  const g = dict.help.guide;
  // the clips load only while the dialog is open, so the page itself downloads nothing (ADR 0097)
  const [open, setOpen] = useState(false);
  const show = () => { setOpen(true); ref.current?.showModal(); };
  return (
    <>
      {rail ? (
        // desktop rail: an icon over a label, like the other rail items
        <button type="button" className={railItemClass} onClick={show} aria-haspopup="dialog">
          <span aria-hidden="true" className="grid h-5 w-5 place-items-center rounded-full border-2 border-accent text-xs font-bold leading-none text-accent">?</span>
          {g.button}
        </button>
      ) : (
        <button type="button" className={`${buttonClass} shrink-0`} onClick={show} aria-haspopup="dialog">
          {g.button}
        </button>
      )}
      <dialog
        ref={ref}
        onClose={() => setOpen(false)}
        aria-labelledby={titleId}
        // click on the backdrop (the dialog element itself, outside the content box) closes it
        onClick={(e) => e.target === e.currentTarget && e.currentTarget.close()}
        className="m-0 h-full max-h-none w-full max-w-none bg-panel p-0 text-foreground backdrop:bg-black/50 sm:m-auto sm:h-auto sm:max-h-[85vh] sm:max-w-3xl sm:rounded-lg sm:border sm:border-line"
      >
        <div className="p-5">
          <div className="mb-3 flex items-start justify-between gap-3">
            <h2 id={titleId} className="text-lg font-semibold">{g.title}</h2>
            <button type="button" className={`${buttonClass} !px-2 !py-1`} onClick={() => ref.current?.close()} aria-label={g.close} title={g.close}>
              ×
            </button>
          </div>
          <ol className="space-y-4">
            {g.steps.map((s, i) => (
              <li key={s.title}>
                <h3 className="font-medium">{i + 1}. {s.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted">{s.text}</p>
                {open && helpClips[i] && <HelpClip name={`${helpClips[i]}-${lang}`} label={s.title} />}
              </li>
            ))}
          </ol>
          <p className="mt-4 text-sm text-muted">{g.outro}</p>
        </div>
      </dialog>
    </>
  );
}

/** One short screen recording per guide step, in the order of `dict.help.guide.steps` (recorded by `scripts/record-help.cjs`). */
export const helpClips = ["add", "sizes", "settings", "results", "price", "import"] as const;

/** A muted looping clip; with reduced motion it does not play by itself and shows its controls. */
function HelpClip({ name, label }: { name: string; label: string }) {
  const [reduce] = useState(() => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);
  // below lg the page has the phone layout, so the clip shows the phone recording (ADR 0105)
  const [phone] = useState(() => typeof window !== "undefined" && !!window.matchMedia?.("(max-width: 1023px)").matches);
  const base = `/help/${name}${phone ? "-phone" : ""}`;
  const src = `${base}.mp4`;
  // load a clip only when it scrolls near the view: the dialog no longer pulls all six at once (ADR 0105)
  const ref = useRef<HTMLVideoElement>(null);
  const [near, setNear] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || near) return;
    if (typeof IntersectionObserver === "undefined") {
      el.src = src;
      return;
    }
    const io = new IntersectionObserver((e) => { if (e.some((x) => x.isIntersecting)) setNear(true); }, { rootMargin: "200px" });
    io.observe(el);
    return () => io.disconnect();
  }, [near, src]);
  return (
    <video
      ref={ref}
      src={near ? src : undefined}
      // the first frame shows at once while the clip loads (ADR 0105)
      poster={`${base}.webp`}
      aria-label={label}
      className={phone ? "mx-auto mt-2 h-[70svh] w-auto rounded-md border border-line" : "mt-2 w-full rounded-md border border-line"}
      // a fixed box before anything loads, so the clips below stay out of view and do not load early
      style={{ aspectRatio: phone ? "390 / 760" : "960 / 570" }}
      width={phone ? 390 : 960}
      height={phone ? 760 : 570}
      muted
      loop
      playsInline
      autoPlay={!reduce}
      controls={reduce}
      preload={near ? "auto" : "none"}
    />
  );
}
