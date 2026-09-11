"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  House,
  Lightbulb,
  Minus,
  PanelTop,
  Plus,
  Radio,
  Snowflake,
  Thermometer,
  Touchpad,
  Trash2,
  Wind,
} from "lucide-react";

import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { type RoomDefaultsConfig } from "@/lib/calculator-defaults";
import { PresenceChoice } from "./presence-choice";
import { SwitchboardRequest } from "./switchboard-request";
import { RoomControlFields } from "./room-control-fields";
import { FLOOR_TYPES, selectedConfiguration, type CalculatorRoom as Room, type CalculatorFloor as Floor, type FloorType } from "@/lib/project-configuration";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

type CountMap = Record<string, number>;

type DirectoryItem = {
  ID: number | string;
  UF_CODE: string;
  UF_TITLE: string;
  UF_HINT?: string;
  UF_ICON?: string;
  UF_TYPE_ID?: number | string | null;
  UF_SORT?: number | string;
};
type SystemDirectory = DirectoryItem & { UF_HINT?: string; items: DirectoryItem[] };
type InitData = { rooms?: DirectoryItem[]; floors?: DirectoryItem[]; systems?: Record<string, SystemDirectory> | SystemDirectory[]; };
type ValueMap = Record<string, boolean | number | string>;

function iconForSystem(code: string, icon?: string) {
  const icons = { House, Lightbulb, Thermometer, Radio, PanelTop, Snowflake, Touchpad };
  if (icon && icon in icons) return icons[icon as keyof typeof icons];
  switch (code) {
    case "general": return House;
    case "air-conditioning":
    case "air_conditioning": return Snowflake;
    case "controls": return Touchpad;
    case "lighting": return Lightbulb;
    case "heating": return Thermometer;
    case "sensors": return Radio;
    case "curtains": return PanelTop;
    default: return Lightbulb;
  }
}

function createRoom(id: string, type: string): Room {
  return {
    id,
    type,
    wetZoneCount: 0,
    airConditioner: false,
    controls: { p4: false, p6: false, p8: false, scenarioSwitch: "none" },
  };
}

function floorLabel(type: FloorType, floors: DirectoryItem[] = []) {
  return floors.find((floor) => floor.UF_CODE === type)?.UF_TITLE
    ?? FLOOR_TYPES.find((floor) => floor.value === type)?.label
    ?? type;
}

function countKey(roomId: string, systemKey: string, itemKey: string) {
  return `${roomId}:${systemKey}:${itemKey}`;
}

function Counter({
  value,
  label,
  onChange,
}: {
  value: number;
  label: string;
  onChange: (delta: number) => void;
}) {
  return (
    <div className="quantity-control">
      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        aria-label={`Уменьшить: ${label}`}
        onClick={() => onChange(-1)}
        disabled={value === 0}
      >
        <Minus />
      </Button>
      <output aria-label={`${label}: ${value}`}>{value}</output>
      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        aria-label={`Увеличить: ${label}`}
        onClick={() => onChange(1)}
      >
        <Plus />
      </Button>
    </div>
  );
}

function RoomSystemTable({
  system,
  floors,
  floorOptions,
  counts,
  disabled,
  onCountChange,
}: {
  system: SystemDirectory;
  floors: Floor[];
  floorOptions: DirectoryItem[];
  counts: CountMap;
  disabled: boolean;
  onCountChange: (
    roomId: string,
    systemKey: string,
    itemKey: string,
    delta: number,
  ) => void;
}) {
  if (!floors.some((floor) => floor.rooms.length > 0)) {
    return (
      <div className="calculator-empty">
        Сначала добавьте хотя бы одну комнату на выбранный этаж.
      </div>
    );
  }

  return (
    <div className="system-table-list">
      {floors.map((floor) =>
        floor.rooms.length > 0 ? (
          <section className="system-floor" key={floor.id}>
            <h3>{floorLabel(floor.type, floorOptions)}</h3>
            <div
              className="system-table-scroll room-equipment-table"
              style={{
                "--equipment-columns": Math.max(system.items.length, 1),
              } as React.CSSProperties}
            >
              <div className="system-grid system-grid-head">
                <div>Помещение</div>
                {system.items.map((item) => (
                  <div key={item.UF_CODE}>
                    <strong>{item.UF_TITLE}</strong>
                    <span>{item.UF_HINT}</span>
                  </div>
                ))}
              </div>
              {floor.rooms.map((room, roomIndex) => (
                <div className="system-grid system-grid-row" key={room.id}>
                  <div className="room-cell">
                    <span>{room.type}</span>
                    <small>Помещение {roomIndex + 1}</small>
                  </div>
                  {system.items.map((item) => {
                    const key = countKey(room.id, system.UF_CODE, item.UF_CODE);
                    return (
                      <div className="system-quantity-cell" key={item.UF_CODE}>
                        <span className="system-quantity-label">
                            <strong>{item.UF_TITLE}</strong>
                        </span>
                        <Counter
                          value={counts[key] ?? 0}
                          label={`${item.UF_TITLE}, ${floorLabel(floor.type, floorOptions)}, ${room.type}, помещение ${roomIndex + 1}`}
                          onChange={(delta) =>
                            onCountChange(room.id, system.UF_CODE, item.UF_CODE, delta)
                          }
                        />
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </section>
        ) : null,
      )}
    </div>
  );
}

export function SmartHomeCalculator({ defaults, canEditDefaults }: {
  defaults: RoomDefaultsConfig;
  canEditDefaults: boolean;
}) {
  const idCounter = useRef(3);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [floorToAdd, setFloorToAdd] = useState<FloorType | "">("");
  const [roomToAdd, setRoomToAdd] = useState<Record<string, string>>({});
  const [counts, setCounts] = useState<CountMap>({});
  const [area, setArea] = useState("");
  const [ventilation, setVentilation] = useState(false);

  const [newRooms, setNewRooms] = useState<DirectoryItem[]>([]);
  const [newSystems, setNewSystems] = useState<SystemDirectory[]>([]);
  const [newFloors, setNewFloors] = useState<DirectoryItem[]>([]);
  const [dataError, setDataError] = useState("");
  const [totalCost, setTotalCost] = useState("");

  const [loading, setLoading] = useState(false);

  const availableFloors = newFloors.filter(
    (option) => !floors.some((floor) => floor.type === option.UF_CODE),
  );

  const rooms = floors.flatMap((floor) => floor.rooms);
  const roomsTotal = rooms.length;
  const wetZonesTotal = rooms.reduce((total, room) => total + room.wetZoneCount, 0);
  const co2SensorsTotal = rooms.reduce((total, room) => total + (counts[countKey(room.id, "sensors", "co2")] ?? 0), 0);
  const motionSensorsTotal = rooms.reduce((total, room) => total + (counts[countKey(room.id, "sensors", "motion")] ?? 0), 0);
  const conditionedRoomsTotal = rooms.filter((room) => room.airConditioner).length;
  const roomSystemsUsed = newSystems.filter((system) =>
    Object.entries(counts).some(([key, value]) => key.includes(`:${system.UF_CODE}:`) && value > 0),
  ).length;
  const areaNumber = Number(area.replace(",", "."));
  const areaInvalid = area !== "" && (!Number.isFinite(areaNumber) || areaNumber <= 0);
  const configuration = selectedConfiguration({
    areaM2: area && !areaInvalid ? areaNumber : null,
    ventilation, floors, counts,
    systemDirectories: newSystems.map((system) => ({
      code: system.UF_CODE,
      title: system.UF_TITLE,
      items: system.items.map((item) => ({ id: item.ID, code: item.UF_CODE, title: item.UF_TITLE, type_id: item.UF_TYPE_ID! })),
    })),
  });
  const panelsTotal = configuration.totals.panelsP4 + configuration.totals.panelsP6 + configuration.totals.panelsP8;
  const scenarioSwitchesTotal = configuration.totals.scenarioSwitches4 + configuration.totals.scenarioSwitches6 + configuration.totals.scenarioSwitches8;
  const systemsUsed = roomSystemsUsed + Number(ventilation) + Number(conditionedRoomsTotal > 0) + Number(panelsTotal + scenarioSwitchesTotal > 0);

  function nextId(prefix: string) {
    const next = idCounter.current;
    idCounter.current += 1;
    return `${prefix}-${next}`;
  }

  function addFloor() {
    if (!floorToAdd || floors.some((floor) => floor.type === floorToAdd)) return;

    const newFloorId = nextId("floor");
    const updated = [...floors, { id: newFloorId, type: floorToAdd, rooms: [] }];
    setFloors(updated);
    setRoomToAdd((current) => ({ ...current, [newFloorId]: newRooms[0]?.UF_TITLE ?? "" }));

    const nextAvailable = newFloors.find((option) => !updated.some((floor) => floor.type === option.UF_CODE));
    setFloorToAdd(nextAvailable?.UF_CODE ?? "");
  }

  function removeFloor(floorId: string) {
    const floor = floors.find((item) => item.id === floorId);
    if (!floor) return;

    const roomIds = floor.rooms.map((room) => room.id);
    setFloors((current) => current.filter((item) => item.id !== floorId));
    setCounts((current) =>
      Object.fromEntries(
        Object.entries(current).filter(
          ([key]) => !roomIds.some((roomId) => key.startsWith(`${roomId}:`)),
        ),
      ),
    );
    setRoomToAdd((current) => {
      const next = { ...current };
      delete next[floorId];
      return next;
    });
    if (!floorToAdd) setFloorToAdd(floor.type);
  }

  function addRoom(floorId: string) {
    const roomType = roomToAdd[floorId] ?? newRooms[0]?.UF_TITLE;
    if (!roomType) return;
    const room = createRoom(nextId("room"), roomType);
    setFloors((current) =>
      current.map((floor) =>
        floor.id === floorId
          ? {
              ...floor,
              rooms: [...floor.rooms, room],
            }
          : floor,
      ),
    );
  }

  function removeRoom(floorId: string, roomId: string) {
    setFloors((current) =>
      current.map((floor) =>
        floor.id === floorId
          ? { ...floor, rooms: floor.rooms.filter((room) => room.id !== roomId) }
          : floor,
      ),
    );
    setCounts((current) =>
      Object.fromEntries(
        Object.entries(current).filter(([key]) => !key.startsWith(`${roomId}:`)),
      ),
    );
  }

  function changeCount(
    roomId: string,
    systemKey: string,
    itemKey: string,
    delta: number,
  ) {
    const key = countKey(roomId, systemKey, itemKey);
    setCounts((current) => ({
      ...current,
      [key]: Math.max(0, (current[key] ?? 0) + delta),
    }));
  }

  function changeRoomsSystemRow(
    roomId: string,
    systemKey: string,
    itemKey: string,
    delta: number
  ) {
    changeCount(roomId, systemKey, itemKey, delta);


  }

  function setVentilationSystem(
    value: boolean,
    roomId?: string,
    systemKey?: string,
    itemKey?: string,
  ) {
    const count = value ? 1 : -1;

    changeCount(roomId || floors[0]?.rooms[0]?.id, systemKey!, itemKey!, count);
    setVentilation(value);
  }

  function setAirConditioner(
    value: boolean,
    roomId?: string,
    systemKey?: string,
    itemKey?: string,
  ) {
    
    const count = value ? 1 : -1;
    changeCount(roomId!, systemKey!, itemKey!, count);
    updateRoom(roomId!, {airConditioner: value});
  }

  function updateRoom(roomId: string, patch: Partial<Pick<Room, "airConditioner" | "controls">>) {
    setFloors((current) => current.map((floor) => ({
      ...floor,
      rooms: floor.rooms.map((room) => room.id === roomId ? { ...room, ...patch } : room),
    })));
  }

  async function initData() {
    try {
      const response = await axios.post<{ result?: InitData; code?: number }>("/calculator/react/ajax.php", { act: "init_data" });
      const result = response.data.result;
      if (!result || response.data.code !== 200) throw new Error("Invalid API response");
      const bySort = <T extends DirectoryItem>(left: T, right: T) => Number(left.UF_SORT ?? left.ID) - Number(right.UF_SORT ?? right.ID);
      const remoteFloors = (Array.isArray(result.floors) ? result.floors : []).sort(bySort);
      const remoteRooms = (Array.isArray(result.rooms) ? result.rooms : []).sort(bySort);
      const remoteSystems = (Array.isArray(result.systems) ? result.systems : Object.values(result.systems ?? {}))
        .map((system) => ({ ...system, items: [...(system.items ?? [])].sort(bySort) }))
        .sort(bySort);
      setNewFloors(remoteFloors);
      setNewRooms(remoteRooms);
      setNewSystems(remoteSystems.filter((system) => system.UF_CODE && system.UF_TITLE));
      setFloorToAdd((current) => current || remoteFloors[0]?.UF_CODE || "");
      setDataError("");
    } catch (error) {
      console.error("Unable to load calculator data", error);
      setDataError("Не удалось загрузить данные калькулятора. Обновите страницу.");
    }
  }

  const calculateTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const calculationId = useRef(0);

  async function calculateProject(config: typeof configuration) {
    const id = ++calculationId.current;

    try {
      setLoading(true);
      const response = await axios.post("/calculator/react/ajax.php", {
        act: "calculate",
        configuration: config.bitrixSystems,
      });

      if (id !== calculationId.current) {
        return;
      }

      const result = response.data.result;

      if (!result || response.data.code !== 200) throw new Error("Invalid API response");

      console.log(result);

      setTotalCost(result.totalCost);
      setLoading(false);
    } catch (error) {
      if (id === calculationId.current) {
        console.error("Unable to calculate data", error);
      }
    }
  }

  useEffect(() => {
    if (roomsTotal === 0) {
      setTotalCost("");
      return;
    }

    if (calculateTimeout.current) {
      clearTimeout(calculateTimeout.current);
    }

    calculateTimeout.current = setTimeout(() => {
      void calculateProject(configuration);
    }, 500);

    return () => {
      if (calculateTimeout.current) {
        clearTimeout(calculateTimeout.current);
      }
    };
  }, [counts, ventilation]);

  useEffect(() => {
    void Promise.resolve().then(initData);
  }, []);

  return (
    <main className="calculator-page">
      <div className="calculator-shell calculator-main">
        <section className="calculator-intro">
          <p className="calculator-kicker">Предварительная конфигурация</p>
          <h1>Рассчитайте состав умного дома</h1>
          <p>
            Добавьте этажи и комнаты. Типовой набор света, климата, датчиков,
            штор и устройств управления заполнится автоматически. При необходимости поправьте значения.
          </p>
          {canEditDefaults && (
            <Link href="/calculator/settings" className="calculator-settings-link">Типовые комнаты: изменить значения по умолчанию</Link>
          )}
        </section>

        <section className="calculator-section">
          <div className="calculator-section-heading">
            <div>
              <span className="step-number">01</span>
              <h2>Этажи и комнаты</h2>
            </div>
            <p>Одинаковые типы комнат можно добавлять несколько раз.</p>
          </div>

          {dataError && <p className="calculator-field-error" role="alert">{dataError}</p>}

          <div className="floor-add-control">
            <Select
              value={floorToAdd}
              onValueChange={(value) => setFloorToAdd(value as FloorType)}
              disabled={availableFloors.length === 0}
            >
              <SelectTrigger className="calculator-select">
                <SelectValue placeholder="Выберите этаж" />
              </SelectTrigger>
              <SelectContent>
                {availableFloors.map((floor) => (
                  <SelectItem value={floor.UF_CODE} key={floor.UF_TITLE}>
                    {floor.UF_TITLE}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant="outline"
              onClick={addFloor}
              disabled={!floorToAdd || availableFloors.length === 0}
            >
              <Plus />
              Добавить этаж
            </Button>
          </div>

          <div className="floor-list">
            {floors.map((floor) => (
              <article className="floor-card" key={floor.id}>
                <div className="floor-card-head">
                  <div>
                    <h3>{floorLabel(floor.type, newFloors)}</h3>
                    <span>Помещений: {floor.rooms.length}</span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Удалить ${floorLabel(floor.type).toLowerCase()}`}
                    onClick={() => removeFloor(floor.id)}
                  >
                    <Trash2 />
                  </Button>
                </div>

                <div className="room-add-control">
                  <Select
                    value={roomToAdd[floor.id] ?? newRooms[0]?.UF_TITLE ?? ""}
                    onValueChange={(value) =>
                      setRoomToAdd((current) => ({
                        ...current,
                        [floor.id]: value,
                      }))
                    }
                  >
                    <SelectTrigger className="calculator-select">
                      <SelectValue placeholder="Выберите комнату" />
                    </SelectTrigger>
                    <SelectContent>
                      {newRooms.map((room) => (
                        <SelectItem value={room.UF_TITLE} key={room.ID}>
                          {room.UF_TITLE}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button type="button" onClick={() => addRoom(floor.id)} disabled={newRooms.length === 0}>
                    <Plus />
                    Добавить комнату
                  </Button>
                </div>

                {floor.rooms.length > 0 ? (
                  <div className="room-chip-list">
                    {floor.rooms.map((room, index) => (
                      <div className="room-chip" key={room.id}>
                        <span>
                          {room.type}
                          <small>№ {index + 1}</small>
                        </span>
                        <button
                          type="button"
                          aria-label={`Удалить: ${room.type}`}
                          onClick={() => removeRoom(floor.id, room.id)}
                        >
                          <Trash2 />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="floor-empty">На этом этаже пока нет комнат.</p>
                )}
              </article>
            ))}
          </div>
        </section>

        <section className="calculator-section systems-section">
          <div className="calculator-section-heading">
            <div>
              <span className="step-number">02</span>
              <h2>Объект и системы</h2>
            </div>
            <p>Переключайтесь между системами. Введенные значения сохраняются.</p>
          </div>

          <Tabs defaultValue={`system-general`} className="systems-tabs">
            <div className="tabs-scroll">
              <TabsList className="systems-tabs-list">
                {newSystems.map((system) => {
                  const Icon = iconForSystem(system.UF_CODE);
                  return (
                    <TabsTrigger value={`system-${system.UF_CODE}`} key={system.ID}>
                      <Icon />
                      {system.UF_TITLE}
                    </TabsTrigger>
                  )
                })}
              </TabsList>
            </div>

            {newSystems.map((system) => {
              if(system.UF_CODE === "general") {
                return (
                  <TabsContent value="system-general" className="system-panel">
                    <div className="system-panel-heading">
                      <h3>Общее</h3>
                      <p>Площадь и вентиляция задаются для всего объекта.</p>
                    </div>

                    <div className="general-settings">
                      <section className="general-card">
                        <h4>Площадь объекта</h4>
                        <div className="calculator-field">
                          <label htmlFor="object-area">Общая площадь, м²</label>
                          <Input
                            id="object-area"
                            className="calculator-input"
                            type="text"
                            inputMode="decimal"
                            placeholder="Например, 150"
                            maxLength={10}
                            value={area}
                            aria-invalid={areaInvalid}
                            aria-describedby={areaInvalid ? "object-area-error" : undefined}
                            onChange={(event) => {
                              const value = event.target.value;
                              if (/^\d*(?:[.,]\d{0,2})?$/.test(value)) setArea(value);
                            }}
                          />
                          {areaInvalid && (
                            <p id="object-area-error" className="calculator-field-error" role="alert">
                              Укажите площадь больше нуля.
                            </p>
                          )}
                        </div>
                      </section>

                      {
                        roomsTotal === 0 ? (
                          <div className="calculator-empty">
                            Добавьте комнаты выше, чтобы выбрать вентустановку.
                          </div>
                        ) : (
                          <section className="general-card">
                            <h4><Wind aria-hidden="true" />Вентустановка</h4>
                            <PresenceChoice
                              id="ventilation"
                              system={system}
                              label="Наличие вентустановки"
                              value={ventilation}
                              disabled={loading}
                              onChange={setVentilationSystem}
                            />
                          </section>
                        ) 
                      }
                    </div>

                  </TabsContent>
                )
              }

              if (system.UF_CODE === "air-conditioning") {
                return (
                  <TabsContent
                    value="system-air-conditioning"
                    key={system.ID}
                    className="system-panel"
                  >
                    <div className="system-panel-heading">
                      <h3>{system.UF_TITLE}</h3>
                      {system.UF_HINT && <p>{system.UF_HINT}</p>}
                    </div>

                    {roomsTotal === 0 ? (
                      <div className="calculator-empty">
                        Добавьте комнаты выше, чтобы выбрать кондиционеры.
                      </div>
                    ) : (
                      <div className="system-table-list">
                        {floors
                          .filter((floor) => floor.rooms.length > 0)
                          .map((floor) => (
                            <section className="system-floor" key={floor.id}>
                              <h3>{floorLabel(floor.type)}</h3>

                              {floor.rooms.map((room, index) => (
                                <div
                                  className="air-conditioner-row"
                                  key={room.id}
                                >
                                  <div className="air-conditioner-room">
                                    <strong>{room.type}</strong>
                                    <small>
                                      Помещение {index + 1}
                                    </small>
                                  </div>

                                  <PresenceChoice
                                    id={`air-conditioner-${room.id}`}
                                    room={room}
                                    system={system}
                                    label={`Кондиционер, ${floorLabel(floor.type)}, ${room.type}, помещение ${index + 1}`}
                                    value={room.airConditioner}
                                    disabled={loading}
                                    onChange={setAirConditioner}
                                  />
                                </div>
                              ))}
                            </section>
                          ))}
                      </div>
                    )}
                  </TabsContent>
                );
              }

              if (system.UF_CODE === "controls") {
                return (
                  <TabsContent
                    value="system-controls"
                    key={system.ID}
                    className="system-panel"
                  >
                    <div className="system-panel-heading">
                      <h3>{system.UF_TITLE}</h3>
                      {system.UF_HINT && <p>{system.UF_HINT}</p>}
                    </div>

                    {roomsTotal === 0 ? (
                      <div className="calculator-empty">
                        Добавьте комнаты выше, чтобы выбрать устройства управления.
                      </div>
                    ) : (
                      <div className="system-table-list">
                        {configuration.floors
                          .filter((floor) => floor.rooms.length > 0)
                          .map((floor) => (
                            <section className="system-floor" key={floor.id}>
                              <h3>{floorLabel(floor.type)}</h3>

                              {floor.rooms.map((room, index) => {
                                const {
                                  lighting,
                                  heating,
                                  curtains,
                                  airConditioner,
                                  controls,
                                } = room.systems;

                                const lightGroups =
                                  lighting.relayAndSocketsGroups +
                                  lighting.dimmingGroups +
                                  lighting.daliGroups +
                                  lighting.ledGroups;

                                const heatingZones =
                                  heating.radiatorZones +
                                  heating.waterFloorCircuits +
                                  heating.electricFloorZones +
                                  heating.fanCoils;

                                return (
                                  <div
                                    className="control-room-row"
                                    key={room.id}
                                  >
                                    <div className="control-room-name">
                                      <strong>{room.type}</strong>

                                      <div
                                        className="control-room-summary"
                                        aria-label="Выбранные системы комнаты"
                                      >
                                        <span>Свет: {lightGroups}</span>
                                        <span>Отопление: {heatingZones}</span>
                                        <span>Шторы: {curtains.drives}</span>
                                        <span>
                                          Кондиционеры:{" "}
                                          {airConditioner.present ? "1" : "нет"}
                                        </span>
                                      </div>
                                    </div>

                                    <RoomControlFields
                                      id={`controls-${room.id}`}
                                      label={`${floorLabel(floor.type)}, ${room.type}, помещение ${index + 1}`}
                                      value={controls}
                                      disabled={loading}
                                      onChange={(nextControls) =>
                                        updateRoom(room.id, {
                                          controls: nextControls,
                                        })
                                      }
                                    />
                                  </div>
                                );
                              })}
                            </section>
                          ))}
                      </div>
                    )}

                    <p className="control-selection-note">
                      Панель может заменить сценарный выключатель: отметьте панель и
                      выберите «Нет» у выключателя. Можно оставить оба устройства,
                      если они нужны.
                    </p>
                  </TabsContent>
                );
              }

              return (
                <TabsContent
                  value={`system-${system.UF_CODE}`}
                  key={system.ID}
                  className="system-panel"
                >
                  <div className="system-panel-heading">
                    <h3>{system.UF_TITLE}</h3>

                    {system.UF_HINT && (
                      <p>{system.UF_HINT}</p>
                    )}
                  </div>

                  <RoomSystemTable 
                    system={system} 
                    floors={floors} 
                    floorOptions={newFloors} 
                    counts={counts} 
                    disabled={loading}
                    onCountChange={changeRoomsSystemRow} 
                  />
                </TabsContent>
              );
            })}
          </Tabs>
        </section>

        <section className="configuration-summary" id="configuration-summary">
          <div>
            <span className="step-number">03</span>
            <h2>Предварительная конфигурация</h2>
            <p>
              Здесь собраны параметры вашего объекта и выбранные системы.
              Стоимость пока не рассчитывается.
            </p>
          </div>
          <dl>
            <div><dt>Панелей управления</dt><dd>{panelsTotal}</dd></div>
            <div><dt>Сценарных выключателей</dt><dd>{scenarioSwitchesTotal}</dd></div>
            <div>
              <dt>Площадь объекта</dt>
              <dd>{area && !areaInvalid ? `${areaNumber.toLocaleString("ru-RU")} м²` : "Не указана"}</dd>
            </div>
            <div>
              <dt>Этажей</dt>
              <dd>{floors.length}</dd>
            </div>
            <div>
              <dt>Помещений</dt>
              <dd>{roomsTotal}</dd>
            </div>
            <div>
              <dt>Систем выбрано</dt>
              <dd>{systemsUsed}</dd>
            </div>
            <div>
              <dt>Мокрых зон</dt>
              <dd>{wetZonesTotal}</dd>
            </div>
            <div>
              <dt>Датчиков CO₂</dt>
              <dd>{co2SensorsTotal}</dd>
            </div>
            <div>
              <dt>Датчиков движения</dt>
              <dd>{motionSensorsTotal}</dd>
            </div>
            <div>
              <dt>Комнат с кондиционерами</dt>
              <dd>{conditionedRoomsTotal}</dd>
            </div>
          </dl>
          <div className="configuration-price" aria-live="polite">
            <div><h3>Стоимость оборудования умного дома</h3><p>Щит электрики и автоматики рассчитывается отдельно.</p></div>
            <strong>
              {totalCost !== "" ? totalCost : "Не рассчитана"}
            </strong>
          </div>
        </section>
        <SwitchboardRequest configuration={configuration} />
      </div>
    </main>
  );
}
