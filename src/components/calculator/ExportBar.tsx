"use client";

import { useI18n } from "@/components/i18n";
import { writeXlsx } from "@/lib/export/xlsx-writer";
import { reportSheets, type ReportInput } from "./export-report";
import { Info } from "./Info";
import { buttonClass } from "./styles";

/** «Завантажити Excel» and «Друк / PDF» (ADR 0102): the file is made in the browser, the print shows the results only. */
export function ExportBar(props: Omit<ReportInput, "date">) {
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
  return (
    <div className="print-hide flex flex-wrap items-center gap-x-4 gap-y-2">
      <span className="inline-flex items-center gap-1">
        <button type="button" className={buttonClass} onClick={download} disabled={empty}>{d.xlsx}</button>
        <Info text={d.xlsxInfo} />
      </span>
      <span className="inline-flex items-center gap-1">
        <button type="button" className={buttonClass} onClick={() => window.print()} disabled={empty}>{d.print}</button>
        <Info text={d.printInfo} />
      </span>
    </div>
  );
}
