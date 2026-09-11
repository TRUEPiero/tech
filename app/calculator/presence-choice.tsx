"use client";

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export function PresenceChoice({ id, label, value, onChange, room, system, disabled = false }: {
  id: string;
  label: string;
  value: boolean;
  room?: any;
  system?: any;
  onChange: (value: boolean, roomId: string | undefined, systemKey: string, itemKey: string) => void;
  disabled?: boolean;
}) {
  return (
    <RadioGroup className="presence-choice" aria-label={label} value={value ? "yes" : "no"}
      onValueChange={(choice) => onChange(choice === "yes", room?.id, system?.UF_CODE, system?.items[0]?.UF_CODE)} disabled={disabled}>
      {[{ value: "yes", label: "Есть" }, { value: "no", label: "Нет" }].map((choice) => (
        <label key={choice.value} htmlFor={`${id}-${choice.value}`} data-selected={(value ? "yes" : "no") === choice.value}>
          <RadioGroupItem value={choice.value} id={`${id}-${choice.value}`} />
          {choice.label}
        </label>
      ))}
    </RadioGroup>
  );
}
