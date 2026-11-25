"use client";

import { useRef, useState } from "react";
import { useDismiss } from "./useDismiss";

import { useI18n } from "@/components/i18n";
import { writeXlsx } from "@/lib/export/xlsx-writer";
import { reportSheets, type ReportInput } from "./export-report";
import { Info } from "./Info";
import { buttonClass, railItemClass } from "./styles";

export type ExportProps = Omit<ReportInput, "date">;

/** «Завантажити Excel» and «Друк / PDF» (ADR 0102): the file is made in the browser, the print shows the results only. */
export function ExportBar({ variant = "bar", ...props }: ExportProps & { variant?: "bar" | "rail" | "toolbar" }) {
  const { dict } = useI18n();
  const d = dict.export;
  const download = () => {
    const now = new Date();
    const bytes = writeXlsx(reportSheets({ ...props, date: now }, dict));
    const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `${d.fileName}-${now.toISOString().slice(0, 10)}.xlsx`;
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const empty = props.rows.length === 0;
  // desktop rail: one «Експорт» item with a list beside it, like «Режим» (ADR 0089), so the rail stays short
  if (variant === "rail") return <ExportRailItem empty={empty} onXlsx={download} />;
  if (variant === "toolbar") {
    return (
      <>
        <button type="button" className={`${buttonClass} shrink-0`} onClick={download} disabled={empty}>{d.menuXlsx}</button>
        <button type="button" className={`${buttonClass} shrink-0`} onClick={() => window.print()} disabled={empty}>{d.menuPdf}</button>
      </>
    );
  }
  return (
    <div className="print-hide flex flex-wrap items-center gap-x-4 gap-y-2">
      <span className="inline-flex items-center gap-1">
        <button type="button" className={buttonClass} onClick={download} disabled={empty}>{d.menuXlsx}</button>
        <Info text={d.xlsxInfo} />
      </span>
      <span className="inline-flex items-center gap-1">
        <button type="button" className={buttonClass} onClick={() => window.print()} disabled={empty}>{d.menuPdf}</button>
        <Info text={d.printInfo} />
      </span>
    </div>
  );
}

function ExportRailItem({ empty, onXlsx }: { empty: boolean; onXlsx: () => void }) {
  const { dict } = useI18n();
  const d = dict.export;
  const [open, setOpen] = useState(false);
  // the rail scrolls (overflow), so the list is fixed to the viewport beside the button
  const [pos, setPos] = useState({ left: 0, bottom: 0 });
  const ref = useRef<HTMLDivElement>(null);
  useDismiss(ref, open, () => setOpen(false));
  const item = "grid w-full rounded-md px-1.5 py-1.5 text-left hover:bg-accent-soft disabled:opacity-40";
  return (
    <div ref={ref} className="relative grid">
      <button type="button" onClick={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          setPos({ left: r.right + 12, bottom: window.innerHeight - r.bottom });
          setOpen(!open);
        }} aria-expanded={open} aria-haspopup="true" className={railItemClass}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="h-6 w-6 text-accent">
          <path d="M6 3h8l4 4v14H6zM14 3v4h4M12 17v-7M9 13l3-3 3 3" />
        </svg>
        {d.short}
      </button>
      {open && (
        <div role="group" aria-label={d.short} style={pos} className="fixed z-30 w-max min-w-56 max-w-80 rounded-lg border border-line bg-panel p-2 shadow-xl shadow-black/30">
          <h3 className="mb-1 px-1.5 text-sm uppercase tracking-wider text-muted">{d.short}</h3>
          <button type="button" className={item} disabled={empty} onClick={() => { onXlsx(); setOpen(false); }}>
            <span>{d.xlsx}</span><span className="text-xs text-muted">{d.xlsxInfo}</span>
          </button>
          <button type="button" className={item} disabled={empty} onClick={() => { setOpen(false); window.print(); }}>
            <span>{d.print}</span><span className="text-xs text-muted">{d.printInfo}</span>
          </button>
        </div>
      )}
    </div>
  );
}
