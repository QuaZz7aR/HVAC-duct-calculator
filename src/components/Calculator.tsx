"use client";

import { useMemo, useRef, useState } from "react";
import { defaultConfig } from "@/lib/calc/config";
import { calculate, type RowOutcome } from "@/lib/form/calculate";
import {
  initialValues,
  kindFields,
  kindOrder,
  newRow,
  type FieldKey,
  type FittingKind,
  type FormRow,
} from "@/lib/form/fields";
import { issueMessage, type FormIssue } from "@/lib/form/messages";
import { uk as dict } from "@/lib/i18n/uk";

const input =
  "w-full rounded border border-zinc-300 bg-transparent px-2 py-1 text-sm dark:border-zinc-700 focus:outline-2 focus:outline-blue-500";
const label = "block text-xs text-zinc-600 dark:text-zinc-400 mb-0.5";
const card = "rounded-lg border border-zinc-200 dark:border-zinc-800 p-4";

const fmt = (n: number, digits = 3) => n.toLocaleString("uk-UA", { minimumFractionDigits: digits, maximumFractionDigits: digits });

function rowTitle(row: FormRow) {
  const k = dict.kinds[row.kind];
  return `${k.designation} — ${k.name}`;
}

function Errors({ issues }: { issues: FormIssue[] }) {
  if (issues.length === 0) return null;
  const field = (i: FormIssue) => {
    const key = String(i.path[0]);
    if (key === "quantity") return dict.quantity;
    if (key === "flow") return dict.flow;
    if (key === "zeta") return dict.zeta;
    if (key === "temperatureC") return dict.airTemperature;
    if (key === "pressurePa") return dict.airPressure;
    return dict.fields[key as FieldKey] ?? key;
  };
  return (
    <ul role="alert" className="mt-2 space-y-0.5 text-sm text-red-600 dark:text-red-400">
      {issues.map((i, n) => (
        <li key={n}>
          {field(i)}: {issueMessage(i, dict)}
        </li>
      ))}
    </ul>
  );
}

export function Calculator() {
  const [rows, setRows] = useState<FormRow[]>([
    { ...newRow(1), values: { diameter: "150", length: "1000" }, flow: "265", zeta: "0,218" },
  ]);
  const nextId = useRef(2);
  const [air, setAir] = useState({
    temperatureC: String(defaultConfig.air.airTemperatureC),
    pressurePa: String(defaultConfig.air.airPressurePa),
  });

  const calc = useMemo(() => calculate(rows, air), [rows, air]);
  const outcomes = useMemo(
    () => new Map<number, RowOutcome>(calc.rows.map((r) => [r.ok ? r.result.id : r.id, r])),
    [calc],
  );
  const outcome = (id: number) => outcomes.get(id);

  const update = (id: number, patch: Partial<FormRow>) =>
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  const setKind = (id: number, kind: FittingKind) => update(id, { kind, values: initialValues(kind) });
  const setValue = (row: FormRow, key: FieldKey, value: string) => update(row.id, { values: { ...row.values, [key]: value } });
  const addRow = () => {
    setRows((rs) => [...rs, newRow(nextId.current++)]);
  };

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 space-y-6 px-4 py-8">
      <header>
        <h1 className="text-2xl font-semibold">{dict.appTitle}</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{dict.appSubtitle}</p>
      </header>

      <section className={card} aria-labelledby="air-title">
        <h2 id="air-title" className="mb-3 font-medium">{dict.airTitle}</h2>
        <div className="grid max-w-md grid-cols-2 gap-3">
          <label>
            <span className={label}>{dict.airTemperature}</span>
            <input className={input} inputMode="decimal" value={air.temperatureC} onChange={(e) => setAir({ ...air, temperatureC: e.target.value })} />
          </label>
          <label>
            <span className={label}>{dict.airPressure}</span>
            <input className={input} inputMode="decimal" value={air.pressurePa} onChange={(e) => setAir({ ...air, pressurePa: e.target.value })} />
          </label>
        </div>
        {!calc.air.ok && <Errors issues={calc.air.issues} />}
      </section>

      <section aria-labelledby="items-title" className="space-y-3">
        <h2 id="items-title" className="font-medium">{dict.itemsTitle}</h2>
        {rows.map((row, idx) => {
          const out = outcome(row.id);
          return (
            <div key={row.id} className={card}>
              <div className="mb-3 flex items-end justify-between gap-3">
                <label className="min-w-0 flex-1 sm:max-w-sm">
                  <span className={label}>{idx + 1}. {dict.kind}</span>
                  <select className={input} value={row.kind} onChange={(e) => setKind(row.id, e.target.value as FittingKind)}>
                    {kindOrder.map((k) => (
                      <option key={k} value={k} className="text-black">{dict.kinds[k].designation} — {dict.kinds[k].name}</option>
                    ))}
                  </select>
                </label>
                <button type="button" className="text-sm text-red-600 hover:underline dark:text-red-400" onClick={() => setRows((rs) => rs.filter((r) => r.id !== row.id))}>
                  {dict.removeItem}
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
                {kindFields[row.kind].map((f) => (
                  <label key={f.key}>
                    <span className={label}>{dict.fields[f.key]}{f.optional ? ` (${dict.optional}: ${defaultConfig.reducerLengthMm})` : ""}</span>
                    <input className={input} inputMode="decimal" value={row.values[f.key] ?? ""} onChange={(e) => setValue(row, f.key, e.target.value)} />
                  </label>
                ))}
                <label>
                  <span className={label}>{dict.quantity}</span>
                  <input className={input} inputMode="numeric" value={row.quantity} onChange={(e) => update(row.id, { quantity: e.target.value })} />
                </label>
                <label>
                  <span className={label}>{dict.flow}</span>
                  <input className={input} inputMode="decimal" value={row.flow} onChange={(e) => update(row.id, { flow: e.target.value })} />
                </label>
                <label>
                  <span className={label}>{dict.zeta} ({dict.optional})</span>
                  <input className={input} inputMode="decimal" value={row.zeta} onChange={(e) => update(row.id, { zeta: e.target.value })} />
                </label>
              </div>
              {out && !out.ok && <Errors issues={out.issues} />}
            </div>
          );
        })}
        <button type="button" className="rounded bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700" onClick={addRow}>
          + {dict.addItem}
        </button>
      </section>

      <section aria-labelledby="results-title" className={card}>
        <h2 id="results-title" className="mb-3 font-medium">{dict.results.title}</h2>
        {calc.rows.length === 0 ? (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">{dict.results.empty}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-zinc-600 dark:text-zinc-400">
                <tr>
                  <th className="py-1 pr-3">{dict.results.item}</th>
                  <th className="px-2 text-right">{dict.quantity}</th>
                  <th className="px-2 text-right">{dict.results.thickness}</th>
                  <th className="px-2 text-right">{dict.results.metalArea}</th>
                  <th className="px-2 text-right">{dict.results.metalAreaTotal}</th>
                  <th className="px-2 text-right">{dict.results.centerline}</th>
                  <th className="px-2 text-right">{dict.results.velocity}</th>
                  <th className="px-2 text-right">{dict.results.friction}</th>
                  <th className="px-2 text-right">{dict.results.local}</th>
                  <th className="pl-2 text-right">{dict.results.pressureDrop}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => {
                  const out = outcome(row.id);
                  if (!out?.ok) {
                    return (
                      <tr key={row.id} className="border-t border-zinc-200 text-zinc-400 dark:border-zinc-800">
                        <td className="py-1 pr-3">{idx + 1}. {rowTitle(row)}</td>
                        <td colSpan={9} className="px-2 text-right">—</td>
                      </tr>
                    );
                  }
                  const r = out.result;
                  return (
                    <tr key={row.id} className="border-t border-zinc-200 dark:border-zinc-800">
                      <td className="py-1 pr-3">{idx + 1}. {rowTitle(row)}</td>
                      <td className="px-2 text-right tabular-nums">{r.quantity}</td>
                      <td className="px-2 text-right tabular-nums">{fmt(r.thicknessMm, 2)}</td>
                      <td className="px-2 text-right tabular-nums">{fmt(r.metalArea)}</td>
                      <td className="px-2 text-right tabular-nums">{fmt(r.metalAreaTotal)}</td>
                      <td className="px-2 text-right tabular-nums">{fmt(r.centerlineLength)}</td>
                      <td className="px-2 text-right tabular-nums">{fmt(r.pressureDrop.velocity, 2)}</td>
                      <td className="px-2 text-right tabular-nums">{fmt(r.pressureDrop.frictionLoss, 2)}</td>
                      <td className="px-2 text-right tabular-nums">{fmt(r.pressureDrop.localLoss, 2)}</td>
                      <td className="pl-2 text-right tabular-nums">{fmt(r.totalLoss, 2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {calc.skipped > 0 && <p className="mt-2 text-sm text-amber-700 dark:text-amber-400">{dict.results.skipped(calc.skipped)}</p>}
      </section>

      <div className="grid gap-6 md:grid-cols-2">
        <section className={card} aria-labelledby="totals-title">
          <h2 id="totals-title" className="mb-3 font-medium">{dict.totals.title}</h2>
          <dl className="space-y-1 text-sm">
            <div className="flex justify-between"><dt>{dict.totals.metalArea}</dt><dd className="tabular-nums font-medium">{fmt(calc.totalMetalArea)}</dd></div>
            <div className="flex justify-between"><dt>{dict.totals.pressureDrop}</dt><dd className="tabular-nums font-medium">{fmt(calc.totalPressureDrop, 2)}</dd></div>
          </dl>
          <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">{dict.totals.pressureDropNote}</p>
        </section>

        <section className={card} aria-labelledby="sheets-title">
          <h2 id="sheets-title" className="mb-3 font-medium">{dict.sheetList.title}</h2>
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-zinc-600 dark:text-zinc-400">
              <tr><th className="py-1">{dict.sheetList.thickness}</th><th className="text-right">{dict.sheetList.area}</th></tr>
            </thead>
            <tbody>
              {calc.sheetList.map((g) => (
                <tr key={g.thicknessMm} className="border-t border-zinc-200 dark:border-zinc-800">
                  <td className="py-1 tabular-nums">{fmt(g.thicknessMm, 2)}</td>
                  <td className="text-right tabular-nums">{fmt(g.area)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">{dict.sheetList.note}</p>
        </section>
      </div>

      <footer className="text-xs text-zinc-500">{dict.footer}</footer>
    </main>
  );
}
