// Rebuild handoff data from the current application functions, without database writes.
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";

const root = fileURLToPath(new URL("../", import.meta.url));
const runtime = join(root, ".sites-runtime");
mkdirSync(runtime, { recursive: true });
const temp = mkdtempSync(join(runtime, "handoff-"));
const write = (name, value) => writeFileSync(join(root, "docs/examples", name), JSON.stringify(value, null, 2) + "\n");

try {
  for (const name of ["calculator-controls", "calculator-room-presets", "calculator-defaults", "project-configuration"]) {
    const source = readFileSync(join(root, "lib", `${name}.ts`), "utf8");
    const { outputText } = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 } });
    writeFileSync(join(temp, `${name}.js`), outputText.replace(/from "(\.\/[^".]+)"/g, 'from "$1.js"'));
  }
  const { initialSettings, roomPreset, countsFromPreset } = await import(pathToFileURL(join(temp, "calculator-defaults.js")));
  const { selectedConfiguration, configurationExport } = await import(pathToFileURL(join(temp, "project-configuration.js")));
  const settings = initialSettings();
  const content = { ventilation: settings.ventilation, rooms: settings.rooms };
  write("room-defaults.json", content);

  const counts = {};
  const room = (id, type, controls) => {
    const preset = roomPreset(settings, type);
    Object.assign(counts, countsFromPreset(id, preset));
    return { id, type, wetZoneCount: preset.wetZones, airConditioner: preset.airConditioner, controls: controls ?? structuredClone(preset.controls) };
  };
  const floors = [
    { id: "floor-first", type: "first", rooms: [
      room("room-entrance", "Прихожая"),
      room("room-kitchen", "Кухня"),
      room("room-living", "Гостиная", { p4: false, p6: true, p8: false, scenarioSwitch: "none" }),
    ] },
    { id: "floor-second", type: "second", rooms: [
      room("room-bedroom-1", "Спальня", { p4: false, p6: false, p8: false, scenarioSwitch: "6" }),
      room("room-bedroom-2", "Спальня", { p4: false, p6: false, p8: true, scenarioSwitch: "8" }),
    ] },
  ];
  const selected = selectedConfiguration({ areaM2: 180, ventilation: true, floors, counts });
  const now = new Date("2026-09-07T00:00:00.000Z");
  write("configuration-example.json", configurationExport(selected, { channel: "email", value: "demo-client@example.com", consent: true }, now));
  write("configuration-draft.json", configurationExport(selected, null, now));

  const table = (headers, read) => [
    `| ${headers.join(" | ")} |`, `| ${headers.map(() => "---").join(" | ")} |`,
    ...settings.rooms.map((r) => `| ${read(r).join(" | ")} |`),
  ].join("\n");
  const yes = (v) => v ? "Есть" : "Нет";
  const text = `# Типовые комнаты Технобит

Дата: 07.09.2026. Снимок 30 стартовых шаблонов из lib/calculator-room-presets.ts. Таблицы сформированы автоматически; ручная правка этого документа не меняет калькулятор.

## Где менять значения

Владелец открывает страницу /calculator/settings («Типовые комнаты»), меняет значения и сохраняет. После сохранения источником становится запись calculator_settings в базе. Для переноса стартового набора приложен examples/room-defaults.json.

При проверке опубликованной базы 07.09.2026 сохраненных строк не было. Действует приведенный ниже набор, revision = 0. Начальное наличие вентустановки: ${yes(settings.ventilation)}. Его также можно изменить в редакторе.

Редактор принимает полный набор из 30 уникальных типов. Все числовые поля шаблона - целые от 0 до 100. Калькулятор копирует шаблон при добавлении комнаты. Сохранение нового шаблона не переписывает уже добавленные комнаты открытой конфигурации. Добавление нового типа помещения требует изменения справочника в коде.

Шаблоны - начальные предположения для удобства ввода. Клиент может менять их значения. Они не являются инженерной спецификацией.

## Свет и шторы

«Реле» - общий счетчик релейного света, умных розеток и вентиляторов с включением/выключением. Разделения этих нагрузок в данных нет. При добавлении слова «вентиляторы» числовые значения шаблонов не увеличивались.

LED хранится в группах. Согласованные два аппаратных канала на группу используются только в будущем подборе оборудования. Шторы - число управляемых приводов, без выбора их типа.

${table(["Помещение", "Реле", "Диммирование", "DALI", "LED", "Шторы"], r => [r.roomType, r.relay, r.dimming, r.dali, r.led, r.curtains])}

## Климат

Радиаторы - зоны регулирования; водяной пол - контуры; электрический пол - зоны; фанкойлы - устройства. Кондиционер - один признак наличия на комнату, а не счетчик нескольких кондиционеров.

${table(["Помещение", "Радиаторы", "Водяной пол", "Электрический пол", "Фанкойлы", "Кондиционер"], r => [r.roomType, r.radiators, r.waterFloor, r.electricFloor, r.fanCoil, yes(r.airConditioner)])}

## Датчики и мокрые зоны

CO₂ и движение - количество датчиков. Мокрые зоны - количество мест, для которых нужна защита от протечки. Число датчиков протечки и кранов пока не рассчитывается.

${table(["Помещение", "CO₂", "Движение", "Мокрые зоны"], r => [r.roomType, r.co2, r.motion, r.wetZones])}

## Управление

P4 выбирается в прихожей и коридоре. В остальных комнатах четырехклавишный выключатель задан при relay + dimming + dali + led > 3 ИЛИ curtains > 2. Условие «или» и выбор четырех клавиш - рабочие допущения начальных шаблонов. P6, P8 и выключатели на 6/8 клавиш доступны для ручного выбора.

Сумма «Свет» в сводке управления включает весь объединенный релейный счетчик, то есть также розетки и вентиляторы. Получить из него число только осветительных групп невозможно. Этот же счетчик участвует в начальном условии выбора выключателя.

${table(["Помещение", "Группы в сводке «Свет»", "P4", "P6", "P8", "Выключатель, клавиш"], r => [r.roomType, r.relay + r.dimming + r.dali + r.led, yes(r.controls.p4), yes(r.controls.p6), yes(r.controls.p8), r.controls.scenarioSwitch === "none" ? "Нет" : r.controls.scenarioSwitch])}

Для повторной генерации документа и примеров выполните node scripts/generate-handoff-examples.mjs, затем python3 scripts/render-handoff-docs.py. Генератор берет стартовые значения из исходников; он не выгружает пользовательские изменения из рабочей базы.
`;
  writeFileSync(join(root, "docs/ROOM_DEFAULTS.md"), text);
  console.log("Generated: 30 room presets, room tables, 2 configuration examples (5 rooms / 2 floors).");
} finally {
  rmSync(temp, { recursive: true, force: true });
}
