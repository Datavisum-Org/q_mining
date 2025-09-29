"use client";

import type { ChangeEvent, FormEvent } from "react";
import { useMemo, useState } from "react";
import type { MiningParameters } from "@/types/mining";
import { HARDWARE_PRESETS, type HardwarePreset } from "@/constants/hardware-presets";
import { Button, Input } from "@/components/ui";
import { MiningParametersSchema } from "@/lib/validations";

interface ParameterFormProps {
  initialValues?: MiningParameters;
  onChange?: (parameters: MiningParameters) => void;
  onSubmit?: (parameters: MiningParameters) => void;
  submitting?: boolean;
}

const DEFAULT_PARAMETERS: MiningParameters = {
  hashRate: 0.1,
  powerConsumption: 3.25,
  electricityRate: 0.06,
  hardwareCost: 650_000,
  setupCost: 50_000,
  maintenanceCost: 5_000,
};

type FieldErrors = Partial<Record<keyof MiningParameters, string>>;

export function ParameterForm({
  initialValues,
  onChange,
  onSubmit,
  submitting,
}: ParameterFormProps) {
  const [parameters, setParameters] = useState<MiningParameters>(
    initialValues ?? DEFAULT_PARAMETERS,
  );
  const [errors, setErrors] = useState<FieldErrors>({});

  const presets = useMemo<HardwarePreset[]>(() => HARDWARE_PRESETS, []);

  const handlePreset = (preset: HardwarePreset) => {
    setParameters(preset);
    setErrors({});
    onChange?.(preset);
  };

  const handleInputChange =
    (key: keyof MiningParameters) => (event: ChangeEvent<HTMLInputElement>) => {
      const value = Number.parseFloat(event.target.value);
      const next = { ...parameters, [key]: Number.isFinite(value) ? value : 0 };
      setParameters(next);
      onChange?.(next);
    };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parseResult = MiningParametersSchema.safeParse(parameters);

    if (!parseResult.success) {
      const fieldErrors: FieldErrors = {};
      parseResult.error.issues.forEach((issue) => {
        const field = issue.path[0];
        if (typeof field === "string") {
          fieldErrors[field as keyof MiningParameters] = issue.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    onSubmit?.(parseResult.data);
  };

  return (
    <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {presets.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => handlePreset(preset)}
            className="rounded-lg border border-coal-700 bg-coal-800/60 px-4 py-3 text-left text-sm text-slate-200 transition hover:border-btc-orange hover:bg-coal-700/70"
          >
            <span className="block font-semibold text-slate-100">{preset.label}</span>
            <span className="block text-xs text-ore-300">{preset.manufacturer}</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Input
          label="Hash Rate (EH/s)"
          type="number"
          min="0"
          step="0.001"
          value={parameters.hashRate}
          onChange={handleInputChange("hashRate")}
          {...(errors.hashRate ? { error: errors.hashRate } : {})}
        />
        <Input
          label="Power Consumption (MW)"
          type="number"
          min="0"
          step="0.01"
          value={parameters.powerConsumption}
          onChange={handleInputChange("powerConsumption")}
          {...(errors.powerConsumption ? { error: errors.powerConsumption } : {})}
        />
        <Input
          label="Electricity Rate (USD/kWh)"
          type="number"
          min="0"
          step="0.001"
          value={parameters.electricityRate}
          onChange={handleInputChange("electricityRate")}
          {...(errors.electricityRate ? { error: errors.electricityRate } : {})}
        />
        <Input
          label="Hardware Cost (USD)"
          type="number"
          min="0"
          step="1"
          value={parameters.hardwareCost}
          onChange={handleInputChange("hardwareCost")}
          {...(errors.hardwareCost ? { error: errors.hardwareCost } : {})}
        />
        <Input
          label="Setup Cost (USD)"
          type="number"
          min="0"
          step="1"
          value={parameters.setupCost ?? 0}
          onChange={handleInputChange("setupCost")}
          {...(errors.setupCost ? { error: errors.setupCost } : {})}
        />
        <Input
          label="Maintenance Cost (USD/month)"
          type="number"
          min="0"
          step="1"
          value={parameters.maintenanceCost ?? 0}
          onChange={handleInputChange("maintenanceCost")}
          {...(errors.maintenanceCost ? { error: errors.maintenanceCost } : {})}
        />
      </div>

      <Button type="submit" disabled={submitting} fullWidth>
        {submitting ? "Calculating..." : "Run Profitability Analysis"}
      </Button>
    </form>
  );
}
