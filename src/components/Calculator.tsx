"use client";
import { useState } from "react";

import { I18nProvider, useI18n } from "@/components/i18n";
import { ModeProvider, useMode } from "@/components/mode";
import { ThemeProvider } from "@/components/theme";
import { AccentSwitch, ThemeSwitch } from "./calculator/ThemeSwitch";
import { ErrorList } from "./calculator/ErrorList";
import { ModeSwitch } from "./calculator/ModeSwitch";
import { LangSwitch } from "./calculator/LangSwitch";
import { HelpButton } from "./calculator/HelpDialog";
import { PhoneMenu } from "./calculator/PhoneMenu";
import { ExportBar } from "./calculator/ExportBar";
import { ImportButton } from "./calculator/ImportDialog";
import { ClearAll, FittingList } from "./calculator/FittingList";
import { NumberSystems } from "./calculator/NumberSystems";
import { SettingsPanel } from "./calculator/SettingsPanel";
import { ResultsTable } from "./calculator/ResultsTable";
import { SheetList } from "./calculator/SheetList";
import { InsulationList } from "./calculator/InsulationList";
import { KindRail } from "./calculator/KindPalette";
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
  const { loaded, rows, settings, setSettings, settingsIssues, calc, outcome, update, setKind, setValue, resetValue, addRow, countOf, lastAddedId, cloneRow, importRows, clearRows, numberRows, removeRow, moveRow, dropRows, prices, costs, setMetalPrice, setInsulationPrice } = useCalculator();

  const exportProps = { rows, outcome, calc, pricing: costs, settings };
  const { mode } = useMode();
  const view = useCardView(rows);
  const [twoColumns, setTwoColumns] = useState(false);

  return (
    <div className="print-block mx-auto w-full max-w-[120rem] flex-1 gap-6 px-4 py-8 print:p-0 xl:px-8 lg:grid lg:grid-cols-[8.5rem_minmax(0,1fr)]">
      <div className="print-hide contents"><KindRail count={countOf} onAdd={addRow} onImport={importRows} exportItems={<ExportBar variant="rail" {...exportProps} />} /></div>
      <main className="min-w-0 space-y-6">
        {/* title, then one toolbar left under it (ADR 0083): mode on its own row on a phone, the other buttons in a second row */}
        <header className="space-y-3">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <div>
              <h1 className="text-2xl font-semibold">{dict.appTitle}</h1>
            </div>
            {/* desktop: help in plain sight beside the title, so a new user sees it first (ADR 0106); the phone has the round «?» on the right */}
            <div className="print-hide hidden lg:block"><HelpButton variant="prominent" /></div>
          </div>
        </header>
        {/* phone: one sticky bar: mode, numbering, clear all and the «☰» menu (import, export, language, theme, accent; ADRs 0106, 0108, 0117). Desktop: all in the rail (ADRs 0048, 0089) */}
        <div className="print-hide sticky top-0 z-20 -mx-4 flex items-center gap-2 bg-background px-4 py-2 lg:hidden [&>*>button]:h-9 [&_[role=group]>button]:h-9 [&>div>div>button]:h-9">
          <ModeSwitch />
          {rows.length > 0 && <div className="ml-auto flex items-center gap-2"><NumberSystems compact rows={rows} onNumber={numberRows} /><ClearAll compact count={rows.length} onClear={clearRows} /></div>}
          <div className={rows.length > 0 ? "" : "ml-auto"}><PhoneMenu>
            <ImportButton onImport={importRows} />
            <ExportBar variant="toolbar" {...exportProps} />
            <LangSwitch />
            <ThemeSwitch />
            <AccentSwitch />
          </PhoneMenu></div>
        </div>

        <div className="adv-only print-hide">
        <SettingsPanel settings={settings} onChange={setSettings} issues={settingsIssues} />
        </div>
        {/* simple mode: the settings block is hidden, but a bad setting is still reported (ADR 0082) */}
        {mode === "simple" && settingsIssues.length > 0 && <ErrorList issues={settingsIssues} />}
        {/* the project is read from localStorage right after hydration (ADR 0101): until then the list and the results stay
            hidden only when the pre-paint script found saved rows, so neither a saved nor an empty project flashes (ADRs 0111, 0112) */}
        <div className="project-wait space-y-6" aria-busy={!loaded}>
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
        <ExportBar {...exportProps} />
        <ResultsTable rows={rows} outcome={outcome} calc={calc} />

        <div className="print-block grid grid-cols-1 gap-6 md:grid-cols-2">
          <Totals calc={calc} pricing={costs} priceIssues={costs.issues} settings={settings} onSettings={setSettings} />
          <SheetList groups={calc.sheetList} prices={prices.metal} costs={costs.metal} onPrice={setMetalPrice} settings={settings} onSettings={setSettings} />
          <div className="adv-only min-w-0">
          <InsulationList groups={calc.insulationList} prices={prices.insulation} costs={costs.insulation} onPrice={setInsulationPrice} />
          </div>
        </div>
        </div>

        <footer className="text-xs text-muted">{dict.footer}</footer>
      </main>
      <div className="print-hide contents"><PhoneActions view={view} hasRows={rows.length > 0} count={countOf} onAdd={addRow} /></div>
    </div>
  );
}
