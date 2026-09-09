"use client";

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export function PresenceChoice({ id, label, value, onChange, disabled = false }: {
  id: string;
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <RadioGroup className="presence-choice" aria-label={label} value={value ? "yes" : "no"}
      onValueChange={(choice) => onChange(choice === "yes")} disabled={disabled}>
      {[{ value: "yes", label: "Есть" }, { value: "no", label: "Нет" }].map((choice) => (
        <label key={choice.value} htmlFor={`${id}-${choice.value}`} data-selected={(value ? "yes" : "no") === choice.value}>
          <RadioGroupItem value={choice.value} id={`${id}-${choice.value}`} />
          {choice.label}
        </label>
      ))}
    </RadioGroup>
  );
}
