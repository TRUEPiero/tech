import { z } from "zod";

export const PANEL_OPTIONS = [
  { key: "p4", label: "Панель P4" },
  { key: "p6", label: "Панель P6" },
  { key: "p8", label: "Панель P8" },
] as const;
export const SCENARIO_SWITCH_OPTIONS = [
  { value: "none", label: "Нет" },
  { value: "4", label: "4 клавиши" },
  { value: "6", label: "6 клавиш" },
  { value: "8", label: "8 клавиш" },
] as const;

export const roomControlsSchema = z.object({
  p4: z.boolean(), p6: z.boolean(), p8: z.boolean(),
  scenarioSwitch: z.enum(["none", "4", "6", "8"]),
  types: z.optional(z.object({
    p4: z.string(), p6: z.string(), p8: z.string(),
    scenarioSwitch: z.string(),
  }))
}).strict();
export type RoomControls = z.infer<typeof roomControlsSchema>;

// Used for initial presets and read-only upgrades of pre-controls saved settings.
// LED is counted as a light group, not as its estimated hardware channels.
export function recommendedControls(room: {
  roomType: string; relay: number; dimming: number; dali: number; led: number; curtains: number;
}): RoomControls {
  const entrance = room.roomType === "Прихожая" || room.roomType === "Коридор";
  const needsControls = room.relay + room.dimming + room.dali + room.led > 3 || room.curtains > 2;
  return { p4: entrance, p6: false, p8: false, scenarioSwitch: !entrance && needsControls ? "4" : "none" };
}
