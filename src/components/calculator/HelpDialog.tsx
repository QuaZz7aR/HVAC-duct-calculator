import { useId, useRef } from "react";
import { useI18n } from "@/components/i18n";
import { buttonClass, railItemClass } from "./styles";

/** The «Довідка» button in the header and the short how-to it opens (a native modal dialog: Esc and the cross close it). */
export function HelpButton({ rail = false }: { rail?: boolean }) {
  const { dict } = useI18n();
  const ref = useRef<HTMLDialogElement>(null);
  // the button is rendered twice (phone header, desktop rail), so the title id must be unique
  const titleId = useId();
  const g = dict.help.guide;
  return (
    <>
      {rail ? (
        // desktop rail: an icon over a label, like the other rail items
        <button type="button" className={railItemClass} onClick={() => ref.current?.showModal()} aria-haspopup="dialog">
          <span aria-hidden="true" className="grid h-6 w-6 place-items-center rounded-full border-2 border-accent text-sm font-bold leading-none text-accent">?</span>
          {g.button}
        </button>
      ) : (
        <button type="button" className={`${buttonClass} shrink-0`} onClick={() => ref.current?.showModal()} aria-haspopup="dialog">
          {g.button}
        </button>
      )}
      <dialog
        ref={ref}
        aria-labelledby={titleId}
        // click on the backdrop (the dialog element itself, outside the content box) closes it
        onClick={(e) => e.target === e.currentTarget && e.currentTarget.close()}
        className="m-0 h-full max-h-none w-full max-w-none bg-panel p-0 text-foreground backdrop:bg-black/50 sm:m-auto sm:h-auto sm:max-h-[85vh] sm:max-w-xl sm:rounded-lg sm:border sm:border-line"
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
              </li>
            ))}
          </ol>
          <p className="mt-4 text-sm text-muted">{g.outro}</p>
        </div>
      </dialog>
    </>
  );
}
