import { z } from "zod";
import { SEED_ROOM_SETTINGS } from "./calculator-room-presets";
import { recommendedControls, roomControlsSchema } from "./calculator-controls";

export const ROOM_TYPES = SEED_ROOM_SETTINGS.rooms.map((room) => room.roomType);

export const COUNT_FIELDS = [
  { key: "relay", system: "lighting", item: "relay", label: "Свет: релейные группы + умные розетки + вентиляторы" },
  { key: "dimming", system: "lighting", item: "dimming", label: "Диммирование" },
  { key: "dali", system: "lighting", item: "dali", label: "DALI" },
  { key: "led", system: "lighting", item: "led", label: "Светодиодное освещение" },
  { key: "radiators", system: "heating", item: "radiators", label: "Радиаторы" },
  { key: "waterFloor", system: "heating", item: "water-floor", label: "Водяной теплый пол" },
  { key: "electricFloor", system: "heating", item: "electric-floor", label: "Электрический теплый пол" },
  { key: "fanCoil", system: "heating", item: "fan-coil", label: "Фанкойл" },
  { key: "co2", system: "sensors", item: "co2", label: "Датчик CO₂" },
  { key: "motion", system: "sensors", item: "motion", label: "Датчик движения" },
  { key: "curtains", system: "curtains", item: "curtains", label: "Шторы, электрокарнизы, рулонные шторы и жалюзи" },
] as const;

export const NUMERIC_FIELDS = [
  ...COUNT_FIELDS,
  { key: "wetZones", system: "sensors", item: "wet-zones", label: "Мокрые зоны" },
] as const;
export type NumericPresetKey = (typeof NUMERIC_FIELDS)[number]["key"];

const quantity = z.number().int().min(0).max(100);
export const roomPresetSchema = z.object({
  roomType: z.string().refine((value) => ROOM_TYPES.some((type) => type === value)),
  relay: quantity,
  dimming: quantity,
  dali: quantity,
  led: quantity,
  radiators: quantity,
  waterFloor: quantity,
  electricFloor: quantity,
  fanCoil: quantity,
  co2: quantity,
  motion: quantity,
  wetZones: quantity,
  curtains: quantity,
  airConditioner: z.boolean(),
  controls: roomControlsSchema,
}).strict();

const settingsShape = {
  ventilation: z.boolean(),
  rooms: z.array(roomPresetSchema).length(ROOM_TYPES.length)
    .refine((rooms) => new Set(rooms.map((room) => room.roomType)).size === ROOM_TYPES.length),
};
export const settingsContentSchema = z.object(settingsShape).strict();
// Upgrade only reads. Writes require the new fields, so an old editor tab cannot
// silently remove controls previously saved by an updated editor.
const storedRoomPresetSchema = roomPresetSchema.extend({ controls: roomControlsSchema.optional() })
  .transform((room) => ({ ...room, controls: room.controls ?? recommendedControls(room) }));
export const storedSettingsContentSchema = settingsContentSchema.extend({
  rooms: z.array(storedRoomPresetSchema).length(ROOM_TYPES.length)
    .refine((rooms) => new Set(rooms.map((room) => room.roomType)).size === ROOM_TYPES.length),
});
export const settingsUpdateSchema = z.object({
  ...settingsShape,
  revision: z.number().int().min(0),
}).strict();
export const roomDefaultsConfigSchema = settingsUpdateSchema.extend({ updatedAt: z.string().datetime().nullable() });

export type RoomPreset = z.infer<typeof roomPresetSchema>;
export type SettingsContent = z.infer<typeof settingsContentSchema>;
export type RoomDefaultsConfig = z.infer<typeof roomDefaultsConfigSchema>;

export function initialSettings(): RoomDefaultsConfig {
  return { ...settingsContentSchema.parse(SEED_ROOM_SETTINGS), revision: 0, updatedAt: null };
}

export function roomPreset(settings: SettingsContent, roomType: string): RoomPreset {
  const preset = settings.rooms.find((row) => row.roomType === roomType);
  if (!preset) throw new Error("Unknown room type");
  return preset;
}

export function countsFromPreset(roomId: string, preset: RoomPreset): Record<string, number> {
  return Object.fromEntries(COUNT_FIELDS.map((field) => [
    `${roomId}:${field.system}:${field.item}`, preset[field.key],
  ]));
}

export function canEditRoomDefaults(identity: { id: string; email: string } | null, ownerEmail: string | undefined): boolean {
  return Boolean(identity?.id && identity.email && ownerEmail?.trim() &&
    identity.email.trim().toLowerCase() === ownerEmail.trim().toLowerCase());
}
