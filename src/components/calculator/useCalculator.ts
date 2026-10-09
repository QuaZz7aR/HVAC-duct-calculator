import { useMemo, useRef, useState } from "react";
import { defaultConfig } from "@/lib/calc/config";
import { calculate, type RowOutcome } from "@/lib/form/calculate";
import { initialValues, newRow, type FieldKey, type FittingKind, type FormRow } from "@/lib/form/fields";

export interface AirText {
  temperatureC: string;
  pressurePa: string;
}

/** Form state (rows, air) and the derived calculation; the components only render and call the actions. */
export function useCalculator() {
  const [rows, setRows] = useState<FormRow[]>([
    { ...newRow(1), values: { diameter: "150", length: "1000" }, flow: "265", zeta: "0,218" },
  ]);
  const nextId = useRef(2);
  const [air, setAir] = useState<AirText>({
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
  const setValue = (id: number, key: FieldKey, value: string) =>
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, values: { ...r.values, [key]: value } } : r)));
  const addRow = () => {
    const id = nextId.current++; // outside the updater, which React may run twice
    setRows((rs) => [...rs, newRow(id)]);
  };
  const removeRow = (id: number) => setRows((rs) => rs.filter((r) => r.id !== id));

  return { rows, air, setAir, calc, outcome, update, setKind, setValue, addRow, removeRow };
}
