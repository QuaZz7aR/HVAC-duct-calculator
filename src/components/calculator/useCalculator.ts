import { useMemo, useRef, useState } from "react";
import { defaultConfig } from "@/lib/calc/config";
import { calculate, type RowOutcome } from "@/lib/form/calculate";
import { buildConfig, defaultSettings, type SettingsText } from "@/lib/form/settings";
import { resetToAuto, setFieldValue, withKind } from "@/lib/form/auto-defaults";
import { sampleRows } from "@/lib/form/sample-rows";
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
  // beta: the page opens with one example row of every fitting kind
  const [rows, setRows] = useState<FormRow[]>(() => sampleRows(defaultConfig));
  const nextId = useRef(Math.max(0, ...rows.map((r) => r.id)) + 1);

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
  const setKind = (id: number, kind: FittingKind) =>
    setRows((rs) => rs.map((r) => (r.id === id ? withKind(r, kind, initialValues(kind), built.config) : r)));
  // size-dependent fields (elbow radius) follow the size until the user types over them
  const setValue = (id: number, key: FieldKey, value: string) =>
    setRows((rs) => rs.map((r) => (r.id === id ? setFieldValue(r, key, value, built.config) : r)));
  const resetValue = (id: number, key: FieldKey) =>
    setRows((rs) => rs.map((r) => (r.id === id ? resetToAuto(r, key, built.config) : r)));
  const addRow = () => {
    const id = nextId.current++; // outside the updater, which React may run twice
    setRows((rs) => [...rs, newRow(id)]);
  };
  const removeRow = (id: number) => setRows((rs) => rs.filter((r) => r.id !== id));

  return { rows, settings, setSettings, settingsIssues: built.issues, calc, outcome, update, setKind, setValue, resetValue, addRow, removeRow };
}
