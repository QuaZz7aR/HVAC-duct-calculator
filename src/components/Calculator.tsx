"use client";
import { useState } from "react";

import { I18nProvider, useI18n } from "@/components/i18n";
import { ModeProvider, useMode } from "@/components/mode";
import { ThemeProvider } from "@/components/theme";
import { ThemeSwitch } from "./calculator/ThemeSwitch";
import { ErrorList } from "./calculator/ErrorList";
import { ModeSwitch } from "./calculator/ModeSwitch";
import { LangSwitch } from "./calculator/LangSwitch";
import { HelpButton } from "./calculator/HelpDialog";
import { ExportBar } from "./calculator/ExportBar";
import { ImportButton } from "./calculator/ImportDialog";
import { FittingList } from "./calculator/FittingList";
import { SettingsPanel } from "./calculator/SettingsPanel";
import { ResultsTable } from "./calculator/ResultsTable";
import { SheetList } from "./calculator/SheetList";
import { InsulationList } from "./calculator/InsulationList";
import { KindRail } from "./calculator/KindPalette";
import { mutedClass } from "./calculator/styles";
import { Totals } from "./calculator/Totals";
import { PhoneActions } from "./calculator/PhoneActions";
import { useCalculator } from "./calculator/useCalculator";
import { useCardView } from "./calculator/useCardView";

export function Calculator() {
  return (
    <I18nProvider>
      <ThemeProvider>
      <ModeProvider>
        <CalculatorPage />
      </ModeProvider>
      </ThemeProvider>
    </I18nProvider>
  );
}

function CalculatorPage() {
  const { dict } = useI18n();
  const { rows, settings, setSettings, settingsIssues, calc, outcome, update, setKind, setValue, resetValue, addRow, countOf, lastAddedId, cloneRow, importRows, clearRows, numberRows, removeRow, moveRow, dropRows, prices, costs, setMetalPrice, setInsulationPrice } = useCalculator();

  const { mode } = useMode();
  const view = useCardView(rows);
  const [twoColumns, setTwoColumns] = useState(false);

  return (
    <div className="print-block mx-auto w-full max-w-[120rem] flex-1 gap-6 px-4 py-8 print:p-0 xl:px-8 lg:grid lg:grid-cols-[8.5rem_minmax(0,1fr)]">
      <div className="print-hide contents"><KindRail count={countOf} onAdd={addRow} onImport={importRows} /></div>
      <main className="min-w-0 space-y-6">
        {/* title, then one toolbar left under it (ADR 0083): mode on its own row on a phone, the other buttons in a second row */}
        <header className="space-y-3">
          <div>
            <h1 className="text-2xl font-semibold">{dict.appTitle}</h1>
            <p className={`mt-1 text-sm ${mutedClass}`}>{dict.appSubtitle}</p>
          </div>
          {/* desktop: mode, import, help and language live in the rail (ADRs 0048, 0089); the phone keeps the toolbar */}
          <div className="print-hide flex flex-col items-start gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3 lg:hidden">
            <ModeSwitch />
            <div className="flex flex-wrap items-center gap-2">
              <ImportButton onImport={importRows} />
              <HelpButton />
              <LangSwitch />
              <ThemeSwitch />
            </div>
          </div>
        </header>

        <div className="adv-only print-hide">
        <SettingsPanel settings={settings} onChange={setSettings} issues={settingsIssues} />
        </div>
        {/* simple mode: the settings block is hidden, but a bad setting is still reported (ADR 0082) */}
        {mode === "simple" && settingsIssues.length > 0 && <ErrorList issues={settingsIssues} />}
        <div className="print-hide">
        <FittingList
          rows={rows}
          view={view}
          twoColumns={twoColumns}
          onColumns={setTwoColumns}
          lastAddedId={lastAddedId}
          outcome={outcome}
          onKindChange={setKind}
          onValueChange={setValue}
          onReset={resetValue}
          onPatch={update}
          onClone={cloneRow}
          onRemove={removeRow}
          onClear={clearRows}
          onNumber={numberRows}
          onMove={moveRow}
          onDrop={dropRows}
        />
        </div>
        <ExportBar rows={rows} outcome={outcome} calc={calc} pricing={costs} settings={settings} />
        <ResultsTable rows={rows} outcome={outcome} calc={calc} />

        <div className="print-block grid grid-cols-1 gap-6 md:grid-cols-2">
          <Totals calc={calc} pricing={costs} priceIssues={costs.issues} settings={settings} onSettings={setSettings} />
          <SheetList groups={calc.sheetList} prices={prices.metal} costs={costs.metal} onPrice={setMetalPrice} settings={settings} onSettings={setSettings} />
          <div className="adv-only min-w-0">
          <InsulationList groups={calc.insulationList} prices={prices.insulation} costs={costs.insulation} onPrice={setInsulationPrice} />
          </div>
        </div>

        <footer className="text-xs text-muted">{dict.footer}</footer>
      </main>
      <div className="print-hide contents"><PhoneActions view={view} hasRows={rows.length > 0} count={countOf} onAdd={addRow} /></div>
    </div>
  );
}
