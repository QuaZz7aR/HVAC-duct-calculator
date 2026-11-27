"use client";
import { useId, useRef, useState } from "react";
import { useI18n } from "@/components/i18n";
import { feedbackLimits, type FeedbackError } from "@/lib/feedback/feedback";
import { buttonClass, inputClass, labelClass, primaryButtonClass } from "./styles";

type Status = { kind: "idle" } | { kind: "sending" } | { kind: "sent" } | { kind: "error"; error: FeedbackError };

/** «Запропонувати ідею» in the page footer: a short form, the letter goes to the site owner (ADR 0120). Rendered only when the server has the mail settings. */
export function FeedbackButton() {
  const { dict, lang } = useI18n();
  const t = dict.feedback;
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const msgId = useId();
  const contactId = useId();
  const openedAt = useRef(0);
  const [message, setMessage] = useState("");
  const [contact, setContact] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  const open = () => {
    openedAt.current = Date.now();
    if (status.kind === "sent") { setMessage(""); setContact(""); setStatus({ kind: "idle" }); }
    ref.current?.showModal();
  };
  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const website = (new FormData(e.currentTarget).get("website") as string | null) ?? "";
    setStatus({ kind: "sending" });
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, contact, website, lang, page: window.location.pathname, elapsedMs: Date.now() - openedAt.current }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: FeedbackError };
      setStatus(data.ok ? { kind: "sent" } : { kind: "error", error: data.error ?? "failed" });
    } catch {
      setStatus({ kind: "error", error: "failed" });
    }
  };

  return (
    <>
      <button type="button" className={`${buttonClass} print-hide`} onClick={open} aria-haspopup="dialog">{t.button}</button>
      <dialog
        ref={ref}
        aria-labelledby={titleId}
        onClick={(e) => e.target === e.currentTarget && e.currentTarget.close()}
        className="m-0 overscroll-contain h-full max-h-none w-full max-w-none bg-panel p-0 text-foreground backdrop:bg-black/50 sm:m-auto sm:h-auto sm:max-h-[90vh] sm:max-w-lg sm:rounded-lg sm:border sm:border-line"
      >
        <div className="space-y-4 p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <h2 id={titleId} className="text-lg font-semibold">{t.title}</h2>
            <button type="button" className={`${buttonClass} !px-2 !py-1`} onClick={() => ref.current?.close()} aria-label={t.close} title={t.close}>×</button>
          </div>
          {status.kind === "sent" ? (
            <p role="status" className="text-sm">{t.sent}</p>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <p className="text-sm text-muted">{t.intro}</p>
              <div>
                <label htmlFor={msgId} className={labelClass}>{t.message}</label>
                <textarea id={msgId} required rows={6} minLength={feedbackLimits.messageMin} maxLength={feedbackLimits.messageMax} value={message} onChange={(e) => setMessage(e.target.value)} placeholder={t.messagePlaceholder} className={`${inputClass} font-sans`} />
              </div>
              <div>
                <label htmlFor={contactId} className={labelClass}>{t.contact}</label>
                <input id={contactId} maxLength={feedbackLimits.contactMax} value={contact} onChange={(e) => setContact(e.target.value)} placeholder={t.contactPlaceholder} autoComplete="email" className={`${inputClass} font-sans`} />
              </div>
              {/* honeypot: hidden from people and screen readers, bots fill it */}
              <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" defaultValue="" />
              {status.kind === "error" && <p role="alert" className="text-sm text-red-600 dark:text-red-400">{t.errors[status.error]}</p>}
              <button type="submit" className={primaryButtonClass} disabled={status.kind === "sending"}>{status.kind === "sending" ? t.sending : t.send}</button>
            </form>
          )}
        </div>
      </dialog>
    </>
  );
}
