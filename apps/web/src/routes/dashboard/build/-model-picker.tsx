import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@package/ui/components/select";
import type { ModelInfo } from "@/routes/dashboard/build/-types";

const ENABLED_MODEL_IDS = new Set(["nvidia", "nvidia-lightning"]);

export function ModelPicker({
  models,
  value,
  onChange,
  credits,
  disabled,
}: {
  models: ModelInfo[];
  value: string;
  onChange: (id: string) => void;
  credits: number;
  disabled?: boolean;
}) {
  return (
    <Select
      value={value}
      onValueChange={(next) => {
        if (next) onChange(next);
      }}
      disabled={disabled}
    >
      <SelectTrigger size="sm" className="w-auto">
        <SelectValue placeholder="Model">
          {(id: string | null) =>
            models.find((model) => model.id === id)?.label ?? "Model"
          }
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {models.map((model) => (
          <SelectItem
            key={model.id}
            value={model.id}
            disabled={credits <= 0 || !ENABLED_MODEL_IDS.has(model.id)}
          >
            {model.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
