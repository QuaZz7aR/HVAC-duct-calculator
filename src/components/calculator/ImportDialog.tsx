import { useId, useMemo, useRef, useState } from "react";
import { useI18n } from "@/components/i18n";
import { kindOrder, newRow, type FittingKind } from "@/lib/form/fields";
import { columnKeys, guessMapping, importRows, withKind, type ColumnKey, type ImportRow, type Mapping } from "@/lib/import/mapping";
import { ImportError, readCsv, readXlsx, type Table } from "@/lib/import/xlsx";
import { readPdf } from "@/lib/import/pdf";
import { sizeLabel } from "./format";
import { Info } from "./Info";
import { buttonClass, railItemClass, labelClass, primaryButtonClass, selectClass } from "./styles";
import { subs } from "./subscripts";

type ErrorCode = ImportError["code"];

// the mapping of a file layout, remembered per header text in this browser only (a convenience: the page works without it)
// keyed by the header the site found, so the same layout finds it again; a file without a header row is never remembered
const storageKey = (table: Table, header: number) =>
  header >= 0 ? `hvac-import:${table[header].map((c) => (c === null ? "" : String(c).trim())).join("|")}` : undefined;
function loadMapping(table: Table, guess: Mapping): Mapping {
  const key = storageKey(table, guess.header);
  if (!key) return guess;
  try {
    const saved = localStorage.getItem(key);
    if (saved) return { ...guess, ...(JSON.parse(saved) as Mapping) };
  } catch {
    // storage blocked or a bad entry: the guess stands
  }
  return guess;
}
function saveMapping(table: Table, guessed: number, m: Mapping) {
  const key = storageKey(table, guessed);
  if (!key) return;
  try {
    localStorage.setItem(key, JSON.stringify(m));
  } catch {
    // not saved: nothing else depends on it
  }
}

function forgetMapping(table: Table, guessed: number) {
  const key = storageKey(table, guessed);
  if (!key) return;
  try {
    localStorage.removeItem(key);
  } catch {
    // nothing stored or storage blocked
  }
}

/** Column letter of an index: 0 -> A, 27 -> AB. */
function letter(i: number): string {
  let s = "";
  for (let n = i + 1; n > 0; n = Math.floor((n - 1) / 26)) s = String.fromCharCode(65 + ((n - 1) % 26)) + s;
  return s;
}

async function readFile(file: File): Promise<Table> {
  const name = file.name.toLowerCase();
  if (name.endsWith(".csv") || name.endsWith(".tsv") || name.endsWith(".txt")) return readCsv(await file.text());
  if (name.endsWith(".xlsx") || name.endsWith(".xlsm")) return readXlsx(new Uint8Array(await file.arrayBuffer()));
  if (name.endsWith(".pdf")) return readPdf(new Uint8Array(await file.arrayBuffer()));
  throw new ImportError("import.unknownType");
}

/** The «Імпорт з Excel / PDF» button and its dialog: file, column mapping, preview of every row, then the rows go to the list (ADR 0061). */
export function ImportButton({ onImport, className = "", rail = false }: { onImport: (rows: ImportRow[], replace: boolean) => number; className?: string; rail?: boolean }) {
  const { dict } = useI18n();
  const t = dict.import;
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const fileId = useId();
  const [table, setTable] = useState<Table | null>(null);
  const [fileName, setFileName] = useState("");
  const [mapping, setMapping] = useState<Mapping | null>(null);
  const [error, setError] = useState<ErrorCode | null>(null);
  const [busy, setBusy] = useState(false);
  // kinds chosen by hand, by file line; null = skip the row
  const [chosen, setChosen] = useState<Map<number, FittingKind | null>>(new Map());
  const [showSkipped, setShowSkipped] = useState(false);
  const [replace, setReplace] = useState(true);

  const base = useMemo(() => (table && mapping ? importRows(table, mapping) : []), [table, mapping]);
  const rows = useMemo(
    () => base.map((r) => (chosen.has(r.line) ? withKind(r, chosen.get(r.line) ?? undefined) : r)),
    [base, chosen],
  );
  const counts = { ok: 0, unknown: 0, skip: 0 };
  for (const r of rows) counts[r.status]++;

  const reset = () => {
    setTable(null); setMapping(null); setError(null); setChosen(new Map()); setFileName("");
  };
  const onFile = async (file: File | undefined) => {
    if (!file) return;
    reset();
    setBusy(true);
    setFileName(file.name);
    try {
      const tb = await readFile(file);
      setTable(tb);
      setMapping(loadMapping(tb, guessMapping(tb)));
    } catch (e) {
      setError(e instanceof ImportError ? e.code : "import.notXlsx");
    } finally {
      setBusy(false);
    }
  };
  const changeMapping = (m: Mapping) => {
    setMapping(m);
    setChosen(new Map());
    if (table) saveMapping(table, guessMapping(table).header, m);
  };
  // back to the site's own guess, and the remembered choice for this layout is dropped
  const resetMapping = () => {
    if (!table) return;
    const g = guessMapping(table);
    forgetMapping(table, g.header);
    setMapping(g);
    setChosen(new Map());
  };
  const setColumn = (key: ColumnKey, value: string) => {
    if (!mapping) return;
    const columns = { ...mapping.columns };
    if (value === "") delete columns[key];
    else columns[key] = Number(value);
    changeMapping({ ...mapping, columns });
  };
  const submit = () => {
    onImport(rows, replace);
    ref.current?.close();
    reset();
  };

  const width = table ? Math.max(0, ...table.map((r) => r.length)) : 0;
  // a column is named by its letter, its header and the first value under it (a header may stand one cell off its data)
  const cut = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);
  const columnText = (i: number) => {
    if (!table || !mapping) return letter(i);
    const h = mapping.header >= 0 ? table[mapping.header]?.[i] : null;
    const head = h === null || h === undefined ? "" : String(h).trim();
    const first = table.slice(mapping.header + 1).find((r) => r[i] !== null && r[i] !== undefined)?.[i];
    const sample = first === null || first === undefined ? "" : String(first).trim();
    return [letter(i), head && cut(head, 24), sample && `«${cut(sample, 14)}»`].filter(Boolean).join(" · ");
  };

  return (
    <>
      {rail ? (
        // desktop rail: an icon over a label, like the other rail items (ADR 0089)
        <button type="button" className={railItemClass} onClick={() => ref.current?.showModal()} aria-haspopup="dialog" title={t.button}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="h-5 w-5 text-accent">
            <path d="M6 3h8l4 4v14H6z" /><path d="M14 3v4h4" /><path d="M12 10v7M9 14l3 3 3-3" />
          </svg>
          {t.short}
        </button>
      ) : (
        <button type="button" className={`${buttonClass} shrink-0 ${className}`} onClick={() => ref.current?.showModal()} aria-haspopup="dialog">
          {t.button}
        </button>
      )}
      <dialog
        ref={ref}
        aria-labelledby={titleId}
        onClick={(e) => e.target === e.currentTarget && e.currentTarget.close()}
        className="m-0 h-full max-h-none w-full max-w-none bg-panel p-0 text-foreground backdrop:bg-black/50 sm:m-auto sm:h-auto sm:max-h-[90vh] sm:max-w-4xl sm:rounded-lg sm:border sm:border-line"
      >
        <div className="space-y-4 p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <h2 id={titleId} className="text-lg font-semibold">{t.title}</h2>
            <button type="button" className={`${buttonClass} !px-2 !py-1`} onClick={() => ref.current?.close()} aria-label={t.close} title={t.close}>×</button>
          </div>
          <p className="text-sm text-muted">{t.intro}<Info text={t.info.file} /></p>
          <div className="flex flex-wrap items-center gap-3">
            <label htmlFor={fileId} className={`${primaryButtonClass} cursor-pointer`}>{table ? t.another : t.choose}</label>
            <input
              id={fileId}
              type="file"
              accept=".xlsx,.xlsm,.csv,.tsv,.txt,.pdf,application/pdf,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
              className="sr-only"
              onChange={(e) => { void onFile(e.target.files?.[0]); e.target.value = ""; }}
            />
            {fileName && <span className="break-all font-mono text-sm">{fileName}</span>}
            {busy && <span className="text-sm text-muted">{t.reading}</span>}
          </div>
          {error && <p role="alert" className="text-sm text-red-700 dark:text-red-300">{t.errors[error]}</p>}

          {table && mapping && (
            <>
              <details open className="space-y-3">
                <summary className="cursor-pointer font-medium">{t.columnsTitle}<Info text={t.info.columns} /></summary>
                <div className="mt-2 flex flex-wrap items-start justify-between gap-2">
                  <p className="text-sm text-muted">{t.columnsHint}</p>
                  <span className="flex items-center">
                    <button type="button" className={buttonClass} onClick={resetMapping}>{t.resetMapping}</button>
                    <Info text={t.info.resetMapping} />
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <label className={labelClass} htmlFor={`${fileId}-header`}>{t.headerRow}<Info text={t.info.headerRow} /></label>
                    <select
                      id={`${fileId}-header`}
                      className={selectClass}
                      value={mapping.header}
                      onChange={(e) => {
                        const header = Number(e.target.value);
                        const g = guessMapping(table);
                        changeMapping(header === g.header ? g : { ...mapping, header });
                      }}
                    >
                      <option value={-1}>{t.none}</option>
                      {table.slice(0, 30).map((_, i) => <option key={i} value={i}>{i + 1}</option>)}
                    </select>
                  </div>
                  {columnKeys.map((k) => (
                    <div key={k}>
                      <label className={labelClass} htmlFor={`${fileId}-${k}`}>
                        {t.columns[k]}
                        {k === "A" && <Info text={t.info.sizes} />}
                        {k === "system" && <Info text={t.info.position} />}
                      </label>
                      <select id={`${fileId}-${k}`} className={selectClass} value={mapping.columns[k] ?? ""} onChange={(e) => setColumn(k, e.target.value)}>
                        <option value="">{t.none}</option>
                        {Array.from({ length: width }, (_, i) => <option key={i} value={i}>{columnText(i)}</option>)}
                      </select>
                    </div>
                  ))}
                  <div>
                    <label className={labelClass} htmlFor={`${fileId}-unit`}>{t.lengthUnit}<Info text={t.info.lengthUnit} /></label>
                    <select
                      id={`${fileId}-unit`}
                      className={selectClass}
                      value={mapping.lengthUnit}
                      onChange={(e) => changeMapping({ ...mapping, lengthUnit: e.target.value as Mapping["lengthUnit"] })}
                    >
                      <option value="m">{t.units.m}</option>
                      <option value="mm">{t.units.mm}</option>
                    </select>
                  </div>
                </div>
              </details>

              <section className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-medium">{t.preview}<Info text={t.info.preview} /></h3>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={showSkipped} onChange={(e) => setShowSkipped(e.target.checked)} />
                    {t.showSkipped}
                  </label>
                </div>
                <p className="text-sm" aria-live="polite">{t.summary(counts.ok, counts.unknown, counts.skip)}</p>
                <ul className="max-h-[50vh] space-y-1.5 overflow-y-auto pr-1">
                  {rows.filter((r) => showSkipped || r.status !== "skip").map((r) => (
                    <PreviewRow key={r.line} row={r} onKind={(kind) => setChosen((m) => new Map(m).set(r.line, kind))} />
                  ))}
                </ul>
              </section>

              <fieldset className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
                <legend className="mb-1 text-sm text-muted">{t.mode}<Info text={t.info.mode} /></legend>
                <label className="flex items-center gap-2"><input type="radio" checked={replace} onChange={() => setReplace(true)} />{t.replace}</label>
                <label className="flex items-center gap-2"><input type="radio" checked={!replace} onChange={() => setReplace(false)} />{t.append}</label>
              </fieldset>
              <div className="flex justify-end">
                <button type="button" className={primaryButtonClass} disabled={!counts.ok} onClick={submit}>{t.submit(counts.ok)}</button>
              </div>
            </>
          )}
        </div>
      </dialog>
    </>
  );
}

const statusTone: Record<ImportRow["status"], string> = {
  ok: "border-line",
  unknown: "border-amber-400 bg-amber-50 dark:border-amber-700 dark:bg-amber-950/40",
  skip: "border-line opacity-60",
};

/** One row of the file: what it said, the kind (a select) and the sizes read for it. */
function PreviewRow({ row, onKind }: { row: ImportRow; onKind: (kind: FittingKind | null) => void }) {
  const { dict } = useI18n();
  const t = dict.import;
  const sizes = row.kind ? sizeLabel({ ...newRow(0, row.kind), values: row.values }, dict) : "";
  return (
    <li className={`grid gap-2 rounded-md border p-2 text-sm sm:grid-cols-[4.5rem_minmax(0,1fr)_14rem] sm:items-center ${statusTone[row.status]}`}>
      <span className="font-mono text-xs text-muted">{t.line} {row.line}</span>
      <div className="min-w-0">
        <p className="truncate" title={row.source}>{row.source}</p>
        <p className="text-xs text-muted">
          {row.status === "ok" ? subs([row.position, sizes, `n ${row.quantity}`].filter(Boolean).join(" · ")) : t.status[row.status]}
        </p>
        {row.status !== "skip" && row.joined && (
          <p className="text-xs text-amber-700 dark:text-amber-400" title={t.joined(row.joined)}>⚠ {t.joinedShort(row.joined)}</p>
        )}
        {row.status === "ok" && row.conflicts && (
          <p className="text-xs text-amber-700 dark:text-amber-400" title={row.conflicts.map((c) => t.conflict(dict.fields[c.field], c.name, c.column)).join("\n")}>
            ⚠ {t.conflictShort(row.conflicts.length)}
          </p>
        )}
      </div>
      {row.status !== "skip" && (
        <select
          aria-label={`${t.kind}, ${t.line} ${row.line}`}
          className={`${selectClass} !py-1 !text-sm`}
          value={row.kind ?? ""}
          onChange={(e) => onKind(e.target.value === "" ? null : (e.target.value as FittingKind))}
        >
          <option value="">{t.skip}</option>
          {kindOrder.map((k) => <option key={k} value={k}>{dict.kinds[k].designation} · {dict.kinds[k].name}</option>)}
        </select>
      )}
    </li>
  );
}
