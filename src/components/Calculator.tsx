"use client";

import { uk as dict } from "@/lib/i18n/uk";
import { FittingList } from "./calculator/FittingList";
import { SettingsPanel } from "./calculator/SettingsPanel";
import { ResultsTable } from "./calculator/ResultsTable";
import { SheetList } from "./calculator/SheetList";
import { mutedClass } from "./calculator/styles";
import { Totals } from "./calculator/Totals";
import { useCalculator } from "./calculator/useCalculator";

export function Calculator() {
  const { rows, settings, setSettings, settingsIssues, calc, outcome, update, setKind, setValue, resetValue, addRow, removeRow } = useCalculator();

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 space-y-6 px-4 py-8">
      <header>
        <h1 className="text-2xl font-semibold">{dict.appTitle}</h1>
        <p className={`mt-1 text-sm ${mutedClass}`}>{dict.appSubtitle}</p>
      </header>

      <SettingsPanel settings={settings} onChange={setSettings} issues={settingsIssues} />
      <FittingList
        rows={rows}
        outcome={outcome}
        onKindChange={setKind}
        onValueChange={setValue}
        onReset={resetValue}
        onPatch={update}
        onRemove={removeRow}
        onAdd={addRow}
      />
      <ResultsTable rows={rows} outcome={outcome} calc={calc} />

      <div className="grid gap-6 md:grid-cols-2">
        <Totals calc={calc} />
        <SheetList groups={calc.sheetList} />
      </div>

      <footer className="text-xs text-muted">{dict.footer}</footer>
    </main>
  );
}
