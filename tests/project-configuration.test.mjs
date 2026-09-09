import assert from "node:assert/strict";
import test, { after } from "node:test";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import ts from "typescript";

const runtimeRoot = new URL("../.sites-runtime/", import.meta.url);
mkdirSync(runtimeRoot, { recursive: true });
const fixtureRoot = mkdtempSync(join(runtimeRoot.pathname, "configuration-tests-"));
after(() => rmSync(fixtureRoot, { recursive: true, force: true }));
for (const name of ["calculator-controls", "project-configuration"]) {
  const source = readFileSync(new URL(`../lib/${name}.ts`, import.meta.url), "utf8");
  writeFileSync(join(fixtureRoot, `${name}.js`), ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 },
  }).outputText.replace(/from "(\.\/[^".]+)"/g, 'from "$1.js"'));
}
const { selectedConfiguration, configurationExport, requestContactSchema } = await import(pathToFileURL(join(fixtureRoot, "project-configuration.js")));

function fixture() {
  return {
    areaM2: 150, ventilation: true,
    floors: [
      { id: "first", type: "first", rooms: [{ id: "bedroom-1", type: "Спальня", wetZoneCount: 0, airConditioner: true, controls: { p4: true, p6: false, p8: true, scenarioSwitch: "6" } }] },
      { id: "second", type: "second", rooms: [{ id: "bedroom-2", type: "Спальня", wetZoneCount: 2, airConditioner: false, controls: { p4: false, p6: true, p8: false, scenarioSwitch: "8" } }] },
    ],
    counts: {
      "bedroom-1:lighting:relay": 2, "bedroom-1:lighting:dimming": 1, "bedroom-1:lighting:dali": 3, "bedroom-1:lighting:led": 4,
      "bedroom-1:heating:radiators": 1, "bedroom-1:heating:water-floor": 2, "bedroom-1:heating:electric-floor": 3, "bedroom-1:heating:fan-coil": 4,
      "bedroom-1:sensors:co2": 1, "bedroom-1:sensors:motion": 2, "bedroom-1:curtains:curtains": 1,
      "bedroom-2:lighting:relay": 5, "bedroom-2:curtains:curtains": 2,
      "deleted-room:lighting:relay": 90, "bedroom-2:sensors:wet-zones": 80,
    },
  };
}

test("export preserves all selected systems and independent repeated rooms, ignoring stale counters", () => {
  const state = fixture();
  const original = structuredClone(state);
  const configuration = selectedConfiguration(state);
  const document = configurationExport(configuration, null, new Date("2026-09-07T12:00:00Z"));
  const roundTrip = JSON.parse(JSON.stringify(document));
  assert.equal(roundTrip.schemaVersion, "technobit.configuration.v1");
  assert.equal(roundTrip.generatedAt, "2026-09-07T12:00:00.000Z");
  assert.deepEqual(roundTrip.configuration.floors.map((floor) => floor.rooms[0].id), ["bedroom-1", "bedroom-2"]);
  assert.deepEqual(roundTrip.configuration.floors[0].rooms[0].systems, {
    lighting: { relayAndSocketsGroups: 2, dimmingGroups: 1, daliGroups: 3, ledGroups: 4 },
    heating: { radiatorZones: 1, waterFloorCircuits: 2, electricFloorZones: 3, fanCoils: 4 },
    sensors: { co2: 1, motion: 2, wetZones: 0 }, curtains: { drives: 1 }, airConditioner: { present: true },
    controls: { p4: true, p6: false, p8: true, scenarioSwitch: "6" },
  });
  assert.equal(roundTrip.configuration.totals.relayAndSocketsGroups, 7);
  assert.equal(roundTrip.configuration.totals.curtainDrives, 3);
  assert.equal(roundTrip.configuration.totals.wetZones, 2);
  assert.equal(roundTrip.configuration.totals.airConditioners, 1);
  assert.equal(roundTrip.configuration.totals.panelsP4, 1);
  assert.equal(roundTrip.configuration.totals.panelsP6, 1);
  assert.equal(roundTrip.configuration.totals.panelsP8, 1);
  assert.equal(roundTrip.configuration.totals.scenarioSwitches4, 0);
  assert.equal(roundTrip.configuration.totals.scenarioSwitches6, 1);
  assert.equal(roundTrip.configuration.totals.scenarioSwitches8, 1);
  assert.deepEqual(state, original);
});

test("a fresh export reflects edits and removed floors without carrying their equipment into totals", () => {
  const state = fixture();
  const before = selectedConfiguration(state);
  state.counts["bedroom-1:lighting:relay"] = 8;
  state.floors[0].rooms[0].wetZoneCount = 3;
  state.floors[0].rooms[0].airConditioner = false;
  state.floors[0].rooms[0].controls.scenarioSwitch = "none";
  state.floors[0].rooms[0].controls.p4 = false;
  state.floors.pop();
  state.areaM2 = 300;
  state.ventilation = false;
  const after = configurationExport(selectedConfiguration(state));
  assert.equal(before.totals.relayAndSocketsGroups, 7);
  assert.equal(after.configuration.totals.relayAndSocketsGroups, 8);
  assert.equal(after.configuration.totals.wetZones, 3);
  assert.equal(after.configuration.totals.rooms, 1);
  assert.equal(after.configuration.totals.airConditioners, 0);
  assert.equal(before.totals.scenarioSwitches6, 1);
  assert.equal(after.configuration.totals.scenarioSwitches6, 0);
  assert.equal(after.configuration.totals.scenarioSwitches8, 0);
  assert.equal(after.configuration.totals.panelsP4, 0);
  assert.equal(after.configuration.totals.panelsP6, 0);
  assert.equal(after.configuration.totals.panelsP8, 1);
  assert.equal(after.configuration.areaM2, 300);
  assert.equal(after.configuration.objectSystems.ventilation.present, false);
  state.floors = [];
  const empty = selectedConfiguration(state);
  assert.ok(Object.values(empty.totals).every((value) => value === 0));
});

test("pending pricing stays explicitly uncalculated and never reports a free or sent project", () => {
  const document = configurationExport(selectedConfiguration({ areaM2: null, ventilation: false, floors: [], counts: {} }));
  assert.equal(document.estimate.status, "pending_rules_approval");
  assert.equal(document.estimate.totalRub, null);
  assert.equal(document.estimate.equipmentSeries, null);
  assert.deepEqual(document.estimate.items, []);
  assert.equal(document.switchboardRequest.contact, null);
  assert.equal(document.switchboardRequest.status, "not_requested");
  assert.equal(document.switchboardRequest.delivery.status, "not_sent");
});

test("each supported channel produces one normalized contact and requires consent", () => {
  for (const [channel, value, expected] of [
    ["email", " demo@example.com ", "demo@example.com"],
    ["telegram", "demo_contact", "@demo_contact"],
    ["whatsapp", "+7 (900) 123-45-67", "+79001234567"],
  ]) {
    const parsed = requestContactSchema.parse({ channel, value, consent: true, unrelatedEmail: "excluded@example.com" });
    const document = configurationExport(selectedConfiguration(fixture()), parsed);
    assert.deepEqual(document.switchboardRequest.contact, { channel, value: expected, consent: true });
    assert.equal(document.switchboardRequest.scope, "electrical_and_automation_switchboard_only");
    assert.equal(document.switchboardRequest.status, "prepared_locally");
    assert.equal(document.switchboardRequest.delivery.status, "not_sent");
    assert.equal(requestContactSchema.safeParse({ channel, value, consent: false }).success, false);
    assert.equal(requestContactSchema.safeParse({ channel, value: "", consent: true }).success, false);
  }
  for (const [channel, value] of [["email", "not-email"], ["telegram", "https://t.me/demo"], ["whatsapp", "89001234567"]]) {
    assert.equal(requestContactSchema.safeParse({ channel, value, consent: true }).success, false);
  }
});
