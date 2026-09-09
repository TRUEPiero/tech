import assert from "node:assert/strict";
import test, { after } from "node:test";
import { DatabaseSync } from "node:sqlite";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import ts from "typescript";

const projectRoot = new URL("../", import.meta.url);
const runtimeRoot = new URL("../.sites-runtime/", import.meta.url);
mkdirSync(runtimeRoot, { recursive: true });
const fixtureRoot = mkdtempSync(join(runtimeRoot.pathname, "calculator-tests-"));
after(() => rmSync(fixtureRoot, { recursive: true, force: true }));

for (const moduleName of ["calculator-controls", "calculator-room-presets", "calculator-defaults", "calculator-settings-store"]) {
  const source = readFileSync(new URL(`lib/${moduleName}.ts`, projectRoot), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 },
  });
  writeFileSync(join(fixtureRoot, `${moduleName}.js`), outputText.replace(/from "(\.\/[^".]+)"/g, 'from "$1.js"'));
}

const defaults = await import(pathToFileURL(join(fixtureRoot, "calculator-defaults.js")));
const store = await import(pathToFileURL(join(fixtureRoot, "calculator-settings-store.js")));
const { initialSettings, roomPreset, countsFromPreset, settingsUpdateSchema, canEditRoomDefaults } = defaults;
const { readRoomDefaults, saveRoomDefaults } = store;
const { recommendedControls } = await import(pathToFileURL(join(fixtureRoot, "calculator-controls.js")));

test("controls defaults use strict light/curtain thresholds with entrance P4 priority", () => {
  const base = { roomType: "Спальня", relay: 1, dimming: 1, dali: 0, led: 1, curtains: 2 };
  assert.equal(recommendedControls(base).scenarioSwitch, "none");
  assert.equal(recommendedControls({ ...base, dali: 1 }).scenarioSwitch, "4");
  assert.equal(recommendedControls({ ...base, curtains: 3 }).scenarioSwitch, "4");
  assert.equal(recommendedControls({ ...base, relay: 0, dimming: 0, led: 2 }).scenarioSwitch, "none");
  for (const roomType of ["Прихожая", "Коридор"]) {
    assert.deepEqual(recommendedControls({ ...base, roomType, relay: 10 }), { p4: true, p6: false, p8: false, scenarioSwitch: "none" });
  }
  for (const preset of initialSettings().rooms) assert.deepEqual(preset.controls, recommendedControls(preset));
  assert.equal(initialSettings().rooms.filter((room) => room.controls.p4).length, 2);
  assert.equal(initialSettings().rooms.filter((room) => room.controls.scenarioSwitch === "4").length, 11);
});

test("legacy reads add controls from saved room quantities without rewriting the record or replacing explicit choices", async () => {
  const content = contentOf(initialSettings());
  const legacy = JSON.parse(JSON.stringify(content));
  for (const row of legacy.rooms) delete row.controls;
  const bedroom = legacy.rooms.find((row) => row.roomType === "Спальня");
  bedroom.relay = 0; bedroom.dimming = 0; bedroom.led = 0; bedroom.curtains = 3;
  const hallway = legacy.rooms.find((row) => row.roomType === "Коридор");
  hallway.controls = { p4: false, p6: true, p8: false, scenarioSwitch: "8" };
  const record = { payload: JSON.stringify(legacy), revision: 7, updated_at: "2026-09-07T12:00:00.000Z" };
  const original = structuredClone(record);
  const db = { prepare(sql) {
    assert.ok(sql.startsWith("SELECT"));
    return { bind: () => ({ first: async () => record }) };
  } };
  const loaded = await readRoomDefaults(db);
  assert.equal(loaded.revision, 7);
  assert.equal(loaded.updatedAt, record.updated_at);
  assert.equal(roomPreset(loaded, "Спальня").relay, 0);
  assert.equal(roomPreset(loaded, "Спальня").controls.scenarioSwitch, "4");
  assert.deepEqual(roomPreset(loaded, "Коридор").controls, hallway.controls);
  assert.deepEqual(record, original);
  assert.equal(settingsUpdateSchema.safeParse({ ...legacy, revision: 7 }).success, false);
  assert.equal(settingsUpdateSchema.safeParse({ ...contentOf(loaded), revision: 7 }).success, true);
});

function contentOf(config) {
  return { ventilation: config.ventilation, rooms: config.rooms };
}

function sqliteAdapter(connection) {
  return {
    prepare(sql) {
      const statement = connection.prepare(sql);
      return {
        bind(...values) {
          return { first: async () => statement.get(...values) ?? null };
        },
      };
    },
  };
}

test("all room presets validate and separate rooms receive independent editable counts", () => {
  const config = initialSettings();
  assert.equal(config.rooms.length, 30);
  assert.equal(new Set(config.rooms.map((room) => room.roomType)).size, 30);
  const bedroom = roomPreset(config, "Спальня");
  assert.equal(bedroom.relay, 2);
  assert.equal(bedroom.curtains, 1);
  const first = countsFromPreset("bedroom-1", bedroom);
  const second = countsFromPreset("bedroom-2", bedroom);
  first["bedroom-1:lighting:relay"] += 1;
  assert.equal(second["bedroom-2:lighting:relay"], 2);
  assert.equal(bedroom.relay, 2);
  config.rooms[0].relay = 99;
  assert.notEqual(initialSettings().rooms[0].relay, 99);
  assert.equal(roomPreset(config, "Кухня").wetZones, 2);
});

test("invalid quantities, room dictionaries and extra fields cannot be saved", () => {
  const valid = { ...contentOf(initialSettings()), revision: 0 };
  assert.equal(settingsUpdateSchema.safeParse(valid).success, true);
  const invalidVariants = [
    (value) => { value.rooms[0].relay = -1; },
    (value) => { value.rooms[0].dimming = 1.5; },
    (value) => { value.rooms[0].wetZones = 101; },
    (value) => { value.rooms[0].curtains = null; },
    (value) => { value.rooms[0].airConditioner = "yes"; },
    (value) => { value.rooms[0].controls.scenarioSwitch = "5"; },
    (value) => { value.rooms[0].controls.p4 = 1; },
    (value) => { delete value.rooms[0].controls; },
    (value) => { value.rooms[1] = value.rooms[0]; },
    (value) => { value.rooms.pop(); },
    (value) => { value.rooms[0].roomType = "Unknown"; },
    (value) => { value.owner = "someone-else"; },
  ];
  for (const mutate of invalidVariants) {
    const invalid = structuredClone(valid);
    mutate(invalid);
    assert.equal(settingsUpdateSchema.safeParse(invalid).success, false);
  }
});

test("editing requires a verified identity with the configured owner's email", () => {
  const owner = "owner@example.test";
  assert.equal(canEditRoomDefaults(null, owner), false);
  assert.equal(canEditRoomDefaults({ id: "", email: owner }, owner), false);
  assert.equal(canEditRoomDefaults({ id: "viewer", email: "viewer@example.test" }, owner), false);
  assert.equal(canEditRoomDefaults({ id: "owner", email: owner }, undefined), false);
  assert.equal(canEditRoomDefaults({ id: "owner", email: "OWNER@example.test" }, owner), true);
});

test("settings survive a database reconnect, reject stale writes and leave invalid drafts unsaved", async () => {
  const databasePath = join(fixtureRoot, "settings.sqlite");
  let connection = new DatabaseSync(databasePath);
  connection.exec(readFileSync(new URL("drizzle/0000_watery_agent_brand.sql", projectRoot), "utf8"));
  let db = sqliteAdapter(connection);
  const initial = await readRoomDefaults(db);
  assert.equal(initial.revision, 0);
  const content = contentOf(initial);
  roomPreset(content, "Спальня").relay = 4;
  roomPreset(content, "Спальня").airConditioner = false;
  content.ventilation = false;
  const saved = await saveRoomDefaults(db, content, 0, "test-owner");
  assert.equal(saved.revision, 1);
  assert.equal(await saveRoomDefaults(db, contentOf(initialSettings()), 0, "stale-tab"), null);
  connection.close();

  connection = new DatabaseSync(databasePath);
  try {
    db = sqliteAdapter(connection);
    const reloaded = await readRoomDefaults(db);
    assert.equal(roomPreset(reloaded, "Спальня").relay, 4);
    assert.equal(roomPreset(reloaded, "Спальня").airConditioner, false);
    assert.equal(reloaded.ventilation, false);
    const updated = contentOf(reloaded);
    roomPreset(updated, "Кухня").wetZones = 3;
    assert.equal((await saveRoomDefaults(db, updated, 1, "test-owner")).revision, 2);
    assert.equal(await saveRoomDefaults(db, content, 1, "stale-tab"), null);
    const invalid = structuredClone(updated);
    invalid.rooms[0].relay = -1;
    await assert.rejects(() => saveRoomDefaults(db, invalid, 2, "test-owner"));
    const final = await readRoomDefaults(db);
    assert.equal(final.revision, 2);
    assert.equal(roomPreset(final, "Кухня").wetZones, 3);
  } finally {
    connection.close();
  }
});
