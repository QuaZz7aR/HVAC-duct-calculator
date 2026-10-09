import type { Calculation } from "@/lib/form/calculate";
import { uk as dict } from "@/lib/i18n/uk";
import type { AirText } from "./useCalculator";
import { ErrorList } from "./ErrorList";
import { cardClass } from "./styles";
import { TextField } from "./TextField";

interface Props {
  air: AirText;
  onChange: (air: AirText) => void;
  status: Calculation["air"];
}

export function AirParams({ air, onChange, status }: Props) {
  return (
    <section className={cardClass} aria-labelledby="air-title">
      <h2 id="air-title" className="mb-3 font-medium">{dict.airTitle}</h2>
      <div className="grid max-w-md grid-cols-2 gap-3">
        <TextField label={dict.airTemperature} value={air.temperatureC} onChange={(temperatureC) => onChange({ ...air, temperatureC })} />
        <TextField label={dict.airPressure} value={air.pressurePa} onChange={(pressurePa) => onChange({ ...air, pressurePa })} />
      </div>
      {!status.ok && <ErrorList issues={status.issues} />}
    </section>
  );
}
