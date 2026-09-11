import { z } from "zod";
import { roomControlsSchema, type RoomControls } from "./calculator-controls";

export const FLOOR_TYPES = [
  { value: "basement", label: "Цокольный этаж" },
  { value: "first", label: "Первый этаж" },
  { value: "second", label: "Второй этаж" },
  { value: "third", label: "Третий этаж" },
] as const;

export type NewFloor = {
  ID: number;
  UF_CODE: string;
  UF_TITLE: string;
};

// Floor codes are administered in the Bitrix highload block, so they are not
// limited to the original seed values.
export type FloorType = string;
export type CalculatorRoom = { id: string; type: string; wetZoneCount: number; airConditioner: boolean; controls: RoomControls };
export type CalculatorFloor = { id: string; type: FloorType; rooms: CalculatorRoom[] };
export type CalculatorSystemDirectory = { code: string; title: string; items: { id: number | string, code: string; title: string, type_id: number | string }[] };
export type CalculatorState = {
  areaM2: number | null; ventilation: boolean; floors: CalculatorFloor[]; counts: Record<string, number>;
  systemDirectories?: CalculatorSystemDirectory[];
  fieldValues?: Record<string, string | boolean | number>;
};
export type ContactChannel = "email" | "telegram" | "whatsapp";
export type BitrixSystem = {
  id: number | string;
  code: string;
  title: string;
  sysName: string;
  typeId: number | string;
};

const phone = z.string().trim().max(40).transform((value) => value.replace(/[\s()-]/g, ""))
  .refine((value) => /^\+[1-9]\d{7,14}$/.test(value), "Укажите номер с кодом страны, например +7 900 123-45-67.");
export const requestContactSchema = z.discriminatedUnion("channel", [
  z.object({ channel: z.literal("email"), value: z.string().trim().max(254).email("Укажите email, например name@example.com."), consent: z.literal(true) }),
  z.object({ channel: z.literal("telegram"), value: z.string().trim().max(33)
    .refine((value) => /^@?[A-Za-z][A-Za-z0-9_]{4,31}$/.test(value), "Укажите имя пользователя Telegram, например @username.")
    .transform((value) => value.startsWith("@") ? value : `@${value}`), consent: z.literal(true) }),
  z.object({ channel: z.literal("whatsapp"), value: phone, consent: z.literal(true) }),
]);
export type RequestContact = z.infer<typeof requestContactSchema>;

const quantity = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
const roomSystemsSchema = z.object({
  lighting: z.object({ relayAndSocketsGroups: quantity, dimmingGroups: quantity, daliGroups: quantity, ledGroups: quantity }),
  heating: z.object({ radiatorZones: quantity, waterFloorCircuits: quantity, electricFloorZones: quantity, fanCoils: quantity }),
  sensors: z.object({ co2: quantity, motion: quantity, wetZones: quantity }),
  curtains: z.object({ drives: quantity }),
  airConditioner: z.object({ present: z.boolean() }),
  controls: roomControlsSchema,
});

export function selectedConfiguration(state: CalculatorState) {
  console.log({state});
  const get = (roomId: string, system: string, key: string) => state.counts[`${roomId}:${system}:${key}`] ?? 0;
  const floors = state.floors.map((floor, floorIndex) => ({
    id: floor.id, type: floor.type,
    name: FLOOR_TYPES.find((item) => item.value === floor.type)?.label ?? floor.type,
    order: floorIndex + 1,
    rooms: floor.rooms.map((room, index) => ({
      id: room.id, type: room.type, name: `${room.type} № ${index + 1}`, order: index + 1,
      systems: roomSystemsSchema.parse({
        lighting: { relayAndSocketsGroups: get(room.id, "lighting", "relay"), dimmingGroups: get(room.id, "lighting", "dimming"),
          daliGroups: get(room.id, "lighting", "dali"), ledGroups: get(room.id, "lighting", "led") },
        heating: { radiatorZones: get(room.id, "heating", "radiators"), waterFloorCircuits: get(room.id, "heating", "water-floor"),
          electricFloorZones: get(room.id, "heating", "electric-floor"), fanCoils: get(room.id, "heating", "fan-coil") },
        sensors: { co2: get(room.id, "sensors", "co2"), motion: get(room.id, "sensors", "motion"), wetZones: room.wetZoneCount },
        curtains: { drives: get(room.id, "curtains", "curtains") },
        airConditioner: { present: room.airConditioner },
        controls: room.controls,
      }),
    })),
  }));
  const rooms = floors.flatMap((floor) => floor.rooms);
  const bitrixSystems: BitrixSystem[] = (state.systemDirectories ?? []).flatMap((directory) =>
    directory.items.flatMap((item) => {
      const quantity = rooms.reduce(
        (total, room) =>
          total +
          (state.counts[
            `${room.id}:${directory.code}:${item.code}`
          ] ?? 0),
        0
      );

      return Array.from({ length: quantity }, () => ({
        id: item.id,
        code: item.code,
        title: item.title,
        sysName: item.title,
        typeId: item.type_id,
      }));
    })
  );
  const sum = (read: (room: (typeof rooms)[number]) => number) => rooms.reduce((total, room) => total + read(room), 0);
  return {
    areaM2: state.areaM2,
    objectSystems: { ventilation: { present: state.ventilation } },
    bitrixSystems,
    floors,
    totals: {
      floors: floors.length, rooms: rooms.length,
      relayAndSocketsGroups: sum((room) => room.systems.lighting.relayAndSocketsGroups),
      dimmingGroups: sum((room) => room.systems.lighting.dimmingGroups),
      daliGroups: sum((room) => room.systems.lighting.daliGroups),
      ledGroups: sum((room) => room.systems.lighting.ledGroups),
      radiatorZones: sum((room) => room.systems.heating.radiatorZones),
      waterFloorCircuits: sum((room) => room.systems.heating.waterFloorCircuits),
      electricFloorZones: sum((room) => room.systems.heating.electricFloorZones),
      fanCoils: sum((room) => room.systems.heating.fanCoils),
      co2Sensors: sum((room) => room.systems.sensors.co2), motionSensors: sum((room) => room.systems.sensors.motion),
      wetZones: sum((room) => room.systems.sensors.wetZones), curtainDrives: sum((room) => room.systems.curtains.drives),
      airConditioners: sum((room) => Number(room.systems.airConditioner.present)),
      panelsP4: sum((room) => Number(room.systems.controls.p4)),
      panelsP6: sum((room) => Number(room.systems.controls.p6)),
      panelsP8: sum((room) => Number(room.systems.controls.p8)),
      scenarioSwitches4: sum((room) => Number(room.systems.controls.scenarioSwitch === "4")),
      scenarioSwitches6: sum((room) => Number(room.systems.controls.scenarioSwitch === "6")),
      scenarioSwitches8: sum((room) => Number(room.systems.controls.scenarioSwitch === "8")),
    },
  };
}
export type SelectedConfiguration = ReturnType<typeof selectedConfiguration>;

// This is a versioned draft exchange format, not a claimed Project Tool API contract.
export function configurationExport(configuration: SelectedConfiguration, contact: RequestContact | null = null, now = new Date()) {
  return {
    schemaVersion: "technobit.configuration.v1",
    generatedAt: now.toISOString(),
    source: "technobit-web-calculator",
    configuration,
    estimate: {
      scope: "smart_home_equipment",
      status: "pending_rules_approval",
      currency: "RUB", priceBasis: "RRP",
      equipmentSeries: null, items: [], totalRub: null,
    },
    switchboardRequest: {
      scope: "electrical_and_automation_switchboard_only",
      status: contact ? "prepared_locally" : "not_requested",
      contact: contact ? requestContactSchema.parse(contact) : null,
      delivery: { status: "not_sent" },
    },
  };
}
export type ConfigurationExport = ReturnType<typeof configurationExport>;
