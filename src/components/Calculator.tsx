"use client";

import { uk as dict } from "@/lib/i18n/uk";
import { AirParams } from "./calculator/AirParams";
import { FittingList } from "./calculator/FittingList";
import { ResultsTable } from "./calculator/ResultsTable";
import { SheetList } from "./calculator/SheetList";
import { mutedClass } from "./calculator/styles";
import { Totals } from "./calculator/Totals";
import { useCalculator } from "./calculator/useCalculator";

export function Calculator() {
  const { rows, air, setAir, calc, outcome, update, setKind, setValue, addRow, removeRow } = useCalculator();

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 space-y-6 px-4 py-8">
      <header>
        <h1 className="text-2xl font-semibold">{dict.appTitle}</h1>
        <p className={`mt-1 text-sm ${mutedClass}`}>{dict.appSubtitle}</p>
      </header>

      <AirParams air={air} onChange={setAir} status={calc.air} />
      <FittingList
        rows={rows}
        outcome={outcome}
        onKindChange={setKind}
        onValueChange={setValue}
        onPatch={update}
        onRemove={removeRow}
        onAdd={addRow}
      />
      <ResultsTable rows={rows} outcome={outcome} calc={calc} />

      <div className="grid gap-6 md:grid-cols-2">
        <Totals calc={calc} />
        <SheetList groups={calc.sheetList} />
      </div>

      <footer className="text-xs text-zinc-500">{dict.footer}</footer>
    </main>
  );
}
