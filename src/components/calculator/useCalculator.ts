import { useMemo, useRef, useState } from "react";
import { defaultConfig } from "@/lib/calc/config";
import { calculate, type RowOutcome } from "@/lib/form/calculate";
import { buildConfig, defaultSettings, type SettingsText } from "@/lib/form/settings";
import { initialValues, newRow, type FieldKey, type FittingKind, type FormRow } from "@/lib/form/fields";

/**
 * The page shows areas only; pressure losses are hidden for now (docs/decisions.md). The core still needs a flow and
 * air to assemble a section, so these fixed inputs feed it. Metal area, thickness and the sheet list do not depend on them.
 */
const hiddenLossInputs = {
  flow: "1",
  zeta: "",
  air: {
    temperatureC: String(defaultConfig.air.airTemperatureC),
    pressurePa: String(defaultConfig.air.airPressurePa),
  },
};

/** Form state (rows, settings) and the derived calculation; the components only render and call the actions. */
export function useCalculator() {
  const [rows, setRows] = useState<FormRow[]>([
    { ...newRow(1), values: { diameter: "150", length: "1000" } },
  ]);
  const nextId = useRef(2);

  const [settings, setSettings] = useState<SettingsText>(() => defaultSettings());
  const built = useMemo(() => buildConfig(settings), [settings]);

  const calc = useMemo(
    () => calculate(rows.map((r) => ({ ...r, flow: hiddenLossInputs.flow, zeta: hiddenLossInputs.zeta })), hiddenLossInputs.air, built.config),
    [rows, built.config],
  );
  const outcomes = useMemo(
    () => new Map<number, RowOutcome>(calc.rows.map((r) => [r.ok ? r.result.id : r.id, r])),
    [calc],
  );
  const outcome = (id: number) => outcomes.get(id);

  const update = (id: number, patch: Partial<FormRow>) =>
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  const setKind = (id: number, kind: FittingKind) => update(id, { kind, values: initialValues(kind) });
  const setValue = (id: number, key: FieldKey, value: string) =>
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, values: { ...r.values, [key]: value } } : r)));
  const addRow = () => {
    const id = nextId.current++; // outside the updater, which React may run twice
    setRows((rs) => [...rs, newRow(id)]);
  };
  const removeRow = (id: number) => setRows((rs) => rs.filter((r) => r.id !== id));

  return { rows, settings, setSettings, settingsIssues: built.issues, calc, outcome, update, setKind, setValue, addRow, removeRow };
}
