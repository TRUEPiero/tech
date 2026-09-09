"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
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

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ROOM_TYPES, countsFromPreset, roomPreset, type RoomDefaultsConfig, type SettingsContent } from "@/lib/calculator-defaults";
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

const ROOM_SYSTEMS = {
  lighting: {
    label: "Свет",
    hint: "Укажите количество управляемых групп каждого типа в помещении.",
    icon: Lightbulb,
    items: [
      { key: "relay", label: "Свет: релейные группы + умные розетки + вентиляторы", note: "Включение и выключение" },
      { key: "dimming", label: "Диммирование", note: "Регулировка яркости" },
      { key: "dali", label: "DALI", note: "Цифровое управление" },
      { key: "led", label: "Светодиодное освещение", note: "Ленты и профили" },
    ],
  },
  heating: {
    label: "Отопление",
    hint: "Выберите количество контуров или зон отопления в каждой комнате.",
    icon: Thermometer,
    items: [
      { key: "radiators", label: "Радиаторы", note: "Зоны регулирования" },
      { key: "water-floor", label: "Водяной теплый пол", note: "Контуры" },
      { key: "electric-floor", label: "Электрический теплый пол", note: "Зоны" },
      { key: "fan-coil", label: "Фанкойл", note: "Устройства" },
    ],
  },
  sensors: {
    label: "Датчики",
    hint: "Укажите количество датчиков CO₂ и движения. Для защиты от протечек укажите количество мокрых зон в каждой комнате.",
    icon: Radio,
    items: [
      { key: "co2", label: "Датчик CO₂", note: "Для работы вентиляции", quantityLabel: "Количество датчиков" },
      { key: "motion", label: "Датчик движения", note: "Для автоматического включения света", quantityLabel: "Количество датчиков" },
      { key: "wet-zones", label: "Датчик протечки", note: "Для перекрытия воды", quantityLabel: "Количество мокрых зон" },
    ],
  },
  curtains: {
    label: "Шторы",
    hint: "Укажите общее количество штор с электроприводом в каждой комнате.",
    icon: PanelTop,
    items: [
      { key: "curtains", label: "Шторы", note: "Электрокарнизы, рулонные шторы, жалюзи и другие" },
    ],
  },
} as const;

type CountMap = Record<string, number>;

function createRoom(id: string, type: string, defaults: SettingsContent): Room {
  const preset = roomPreset(defaults, type);
  return {
    id,
    type,
    wetZoneCount: preset.wetZones,
    airConditioner: preset.airConditioner,
    controls: { ...preset.controls },
  };
}

function floorLabel(type: FloorType) {
  return FLOOR_TYPES.find((floor) => floor.value === type)?.label ?? type;
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
  systemKey,
  floors,
  counts,
  onCountChange,
}: {
  systemKey: keyof typeof ROOM_SYSTEMS;
  floors: Floor[];
  counts: CountMap;
  onCountChange: (
    roomId: string,
    systemKey: keyof typeof ROOM_SYSTEMS,
    itemKey: string,
    delta: number,
  ) => void;
}) {
  const system = ROOM_SYSTEMS[systemKey];

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
            <h3>{floorLabel(floor.type)}</h3>
            <div
              className="system-table-scroll room-equipment-table"
              style={{
                "--equipment-columns": system.items.length,
              } as React.CSSProperties}
            >
              <div className="system-grid system-grid-head">
                <div>Помещение</div>
                {system.items.map((item) => (
                  <div key={item.key}>
                    <strong>{item.label}</strong>
                    <span>{item.note}</span>
                    {"quantityLabel" in item && <small>{item.quantityLabel}</small>}
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
                    const key = countKey(room.id, systemKey, item.key);
                    const isWetZone = systemKey === "sensors" && item.key === "wet-zones";
                    return (
                      <div className="system-quantity-cell" key={item.key}>
                        <span className="system-quantity-label">
                            <strong>{item.label}</strong>
                            <span>{item.note}</span>
                            {"quantityLabel" in item && <small>{item.quantityLabel}</small>}
                        </span>
                        <Counter
                          value={isWetZone ? room.wetZoneCount : counts[key] ?? 0}
                          label={`${isWetZone ? "Мокрые зоны" : item.label}, ${floorLabel(floor.type)}, ${room.type}, помещение ${roomIndex + 1}`}
                          onChange={(delta) =>
                            onCountChange(room.id, systemKey, item.key, delta)
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
  const [floors, setFloors] = useState<Floor[]>([
    {
      id: "floor-first",
      type: "first",
      rooms: [createRoom("room-living", "Гостиная", defaults)],
    },
  ]);
  const [floorToAdd, setFloorToAdd] = useState<FloorType | "">("basement");
  const [roomToAdd, setRoomToAdd] = useState<Record<string, string>>({
    "floor-first": "Кухня",
  });
  const [counts, setCounts] = useState<CountMap>(() => countsFromPreset("room-living", roomPreset(defaults, "Гостиная")));
  const [area, setArea] = useState("");
  const [ventilation, setVentilation] = useState(defaults.ventilation);

  const availableFloors = FLOOR_TYPES.filter(
    (option) => !floors.some((floor) => floor.type === option.value),
  );

  const rooms = floors.flatMap((floor) => floor.rooms);
  const roomsTotal = rooms.length;
  const wetZonesTotal = rooms.reduce((total, room) => total + room.wetZoneCount, 0);
  const co2SensorsTotal = rooms.reduce((total, room) => total + (counts[countKey(room.id, "sensors", "co2")] ?? 0), 0);
  const motionSensorsTotal = rooms.reduce((total, room) => total + (counts[countKey(room.id, "sensors", "motion")] ?? 0), 0);
  const conditionedRoomsTotal = rooms.filter((room) => room.airConditioner).length;
  const roomSystemsUsed = Object.keys(ROOM_SYSTEMS).filter((systemKey) =>
    (systemKey === "sensors" && wetZonesTotal > 0) ||
      Object.entries(counts).some(([key, value]) => key.includes(`:${systemKey}:`) && value > 0),
  ).length;
  const areaNumber = Number(area.replace(",", "."));
  const areaInvalid = area !== "" && (!Number.isFinite(areaNumber) || areaNumber <= 0);
  const configuration = selectedConfiguration({
    areaM2: area && !areaInvalid ? areaNumber : null,
    ventilation, floors, counts,
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
    setRoomToAdd((current) => ({ ...current, [newFloorId]: "Гостиная" }));

    const nextAvailable = FLOOR_TYPES.find(
      (option) => !updated.some((floor) => floor.type === option.value),
    );
    setFloorToAdd(nextAvailable?.value ?? "");
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
    const roomType = roomToAdd[floorId] ?? ROOM_TYPES[0];
    const room = createRoom(nextId("room"), roomType, defaults);
    setCounts((current) => ({ ...current, ...countsFromPreset(room.id, roomPreset(defaults, roomType)) }));
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
    systemKey: keyof typeof ROOM_SYSTEMS,
    itemKey: string,
    delta: number,
  ) {
    if (systemKey === "sensors" && itemKey === "wet-zones") {
      changeWetZoneCount(roomId, delta);
      return;
    }
    const key = countKey(roomId, systemKey, itemKey);
    setCounts((current) => ({
      ...current,
      [key]: Math.max(0, (current[key] ?? 0) + delta),
    }));
  }

  function changeWetZoneCount(roomId: string, delta: number) {
    setFloors((current) => current.map((floor) => ({
      ...floor,
      rooms: floor.rooms.map((room) => room.id === roomId
        ? { ...room, wetZoneCount: Math.max(0, room.wetZoneCount + delta) }
        : room),
    })));
  }

  function updateRoom(roomId: string, patch: Partial<Pick<Room, "airConditioner" | "controls">>) {
    setFloors((current) => current.map((floor) => ({
      ...floor,
      rooms: floor.rooms.map((room) => room.id === roomId ? { ...room, ...patch } : room),
    })));
  }

  return (
    <main className="calculator-page">
      <header className="calculator-header">
        <div className="calculator-shell calculator-header-inner">
          <Link className="brand" href="/" aria-label="Технобит - на главную">
            <span className="brand-name">ТЕХНОБИТ</span>
            <span className="brand-caption">умный дом</span>
          </Link>
          <Button asChild variant="ghost">
            <Link href="/">
              <ArrowLeft />
              Вернуться на сайт
            </Link>
          </Button>
        </div>
      </header>

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
                  <SelectItem value={floor.value} key={floor.value}>
                    {floor.label}
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
                    <h3>{floorLabel(floor.type)}</h3>
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
                    value={roomToAdd[floor.id] ?? ROOM_TYPES[0]}
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
                      {ROOM_TYPES.map((room) => (
                        <SelectItem value={room} key={room}>
                          {room}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button type="button" onClick={() => addRoom(floor.id)}>
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

          <Tabs defaultValue="general" className="systems-tabs">
            <div className="tabs-scroll">
              <TabsList className="systems-tabs-list">
                <TabsTrigger value="general">
                  <House />
                  Общее
                </TabsTrigger>
                {Object.entries(ROOM_SYSTEMS).map(([key, system]) => {
                  const Icon = system.icon;
                  return (
                    <TabsTrigger value={key} key={key}>
                      <Icon />
                      {system.label}
                    </TabsTrigger>
                  );
                })}
                <TabsTrigger value="air-conditioning">
                  <Snowflake />
                  Кондиционеры
                </TabsTrigger>
                <TabsTrigger value="controls"><Touchpad />Управление</TabsTrigger>
              </TabsList>
            </div>

            {Object.entries(ROOM_SYSTEMS).map(([key, system]) => (
              <TabsContent value={key} key={key} className="system-panel">
                <div className="system-panel-heading">
                  <h3>{system.label}</h3>
                  <p>{system.hint}</p>
                </div>
                <RoomSystemTable
                  systemKey={key as keyof typeof ROOM_SYSTEMS}
                  floors={floors}
                  counts={counts}
                  onCountChange={changeCount}
                />
                {key === "sensors" && (
                  <p className="sensor-total" aria-live="polite">Всего мокрых зон: {wetZonesTotal}</p>
                )}
              </TabsContent>
            ))}

            <TabsContent value="controls" className="system-panel">
              <div className="system-panel-heading">
                <h3>Управление</h3>
                <p>Отметьте панели в каждой комнате и выберите сценарный выключатель. Проверьте типовой выбор и измените его при необходимости.</p>
              </div>
              {roomsTotal === 0 ? (
                <div className="calculator-empty">Добавьте комнаты выше, чтобы выбрать устройства управления.</div>
              ) : <div className="system-table-list">
                {configuration.floors.filter((floor) => floor.rooms.length > 0).map((floor) => <section className="system-floor" key={floor.id}>
                  <h3>{floorLabel(floor.type)}</h3>
                  {floor.rooms.map((room, index) => {
                    const { lighting, heating, curtains, airConditioner, controls } = room.systems;
                    const lightGroups = lighting.relayAndSocketsGroups + lighting.dimmingGroups + lighting.daliGroups + lighting.ledGroups;
                    const heatingZones = heating.radiatorZones + heating.waterFloorCircuits + heating.electricFloorZones + heating.fanCoils;
                    return <div className="control-room-row" key={room.id}>
                      <div className="control-room-name">
                        <strong>{room.type}</strong>
                        <div className="control-room-summary" aria-label="Выбранные системы комнаты">
                          <span>Свет: {lightGroups}</span>
                          <span>Отопление: {heatingZones}</span>
                          <span>Шторы: {curtains.drives}</span>
                          <span>Кондиционеры: {airConditioner.present ? "1" : "нет"}</span>
                        </div>
                      </div>
                      <RoomControlFields id={`controls-${room.id}`} label={`${floorLabel(floor.type)}, ${room.type}, помещение ${index + 1}`}
                        value={controls} onChange={(nextControls) => updateRoom(room.id, { controls: nextControls })} />
                    </div>;
                  })}
                </section>)}
              </div>}
              <p className="control-selection-note">Панель может заменить сценарный выключатель: отметьте панель и выберите «Нет» у выключателя. Можно оставить оба устройства, если они нужны.</p>
            </TabsContent>

            <TabsContent value="general" className="system-panel">
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

                <section className="general-card">
                  <h4><Wind aria-hidden="true" />Вентустановка</h4>
                  <PresenceChoice
                    id="ventilation"
                    label="Наличие вентустановки"
                    value={ventilation}
                    onChange={setVentilation}
                  />
                </section>
              </div>

            </TabsContent>

            <TabsContent value="air-conditioning" className="system-panel">
              <div className="system-panel-heading">
                <h3>Кондиционеры</h3>
                <p>
                  Отметьте, есть ли кондиционер в каждой комнате.
                </p>
              </div>
              {roomsTotal === 0 ? (
                <div className="calculator-empty">Добавьте комнаты выше, чтобы выбрать кондиционеры.</div>
              ) : (
                <div className="system-table-list">
                  {floors.filter((floor) => floor.rooms.length > 0).map((floor) => (
                    <section className="system-floor" key={floor.id}>
                      <h3>{floorLabel(floor.type)}</h3>
                      {floor.rooms.map((room, index) => (
                        <div className="air-conditioner-row" key={room.id}>
                          <div className="air-conditioner-room">
                            <strong>{room.type}</strong>
                            <small>Помещение {index + 1}</small>
                          </div>
                          <PresenceChoice
                            id={`air-conditioner-${room.id}`}
                            label={`Кондиционер, ${floorLabel(floor.type)}, ${room.type}, помещение ${index + 1}`}
                            value={room.airConditioner}
                            onChange={(airConditioner) => updateRoom(room.id, { airConditioner })}
                          />
                        </div>
                      ))}
                    </section>
                  ))}
                </div>
              )}
            </TabsContent>
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
            <strong>Не рассчитана</strong>
          </div>
        </section>
        <SwitchboardRequest configuration={configuration} />
      </div>
    </main>
  );
}
