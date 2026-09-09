"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PANEL_OPTIONS, SCENARIO_SWITCH_OPTIONS, type RoomControls } from "@/lib/calculator-controls";

export function RoomControlFields({ id, label, value, onChange, disabled = false }: {
  id: string; label: string; value: RoomControls; onChange: (value: RoomControls) => void; disabled?: boolean;
}) {
  return <div className="room-control-fields">
    <div className="control-panels" role="group" aria-label={`${label}: панели управления`}>
      {PANEL_OPTIONS.map((panel) => <label key={panel.key} htmlFor={`${id}-${panel.key}`} className="control-panel-choice" data-selected={value[panel.key]}>
        <Checkbox id={`${id}-${panel.key}`} checked={value[panel.key]} disabled={disabled}
          aria-label={`${label}: ${panel.label}`}
          onCheckedChange={(checked) => onChange({ ...value, [panel.key]: checked === true })} />
        <span>{panel.label}</span>
      </label>)}
    </div>
    <div className="control-switch-choice">
      <label htmlFor={`${id}-switch`}>Сценарный выключатель</label>
      <Select value={value.scenarioSwitch} disabled={disabled}
        onValueChange={(scenarioSwitch) => onChange({ ...value, scenarioSwitch: scenarioSwitch as RoomControls["scenarioSwitch"] })}>
        <SelectTrigger id={`${id}-switch`} className="calculator-select" aria-label={`${label}: сценарный выключатель`}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="control-switch-menu">{SCENARIO_SWITCH_OPTIONS.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
      </Select>
    </div>
  </div>;
}
