import assert from "node:assert/strict";
import test from "node:test";
import { DatabaseSync } from "node:sqlite";
import { readFileSync } from "node:fs";
import { loadTestWorker } from "./site-worker.mjs";

test("built calculator API enforces owner access and saves defaults used by rendered pages", async () => {
  const connection = new DatabaseSync(":memory:");
  connection.exec(readFileSync(new URL("../drizzle/0000_watery_agent_brand.sql", import.meta.url), "utf8"));
  const DB = {
    prepare(sql) {
      const statement = connection.prepare(sql);
      return { bind: (...values) => ({ first: async () => statement.get(...values) ?? null }) };
    },
  };
  const fetchWorker = await loadTestWorker({ DB, CALCULATOR_ADMIN_EMAIL: "owner@example.test" });
  const owner = { "oai-authenticated-user-id": "test-owner", "oai-authenticated-user-email": "owner@example.test" };
  const viewer = { "oai-authenticated-user-id": "test-viewer", "oai-authenticated-user-email": "viewer@example.test" };
  const request = (path, method = "GET", body, identity = {}, origin = "http://localhost") => fetchWorker(new Request(`http://localhost${path}`, {
    method,
    headers: { "content-type": "application/json", origin, ...identity },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  }));
  try {
    const initialResponse = await request("/api/calculator-defaults");
    assert.equal(initialResponse.status, 200);
    const initial = await initialResponse.json();
    assert.equal(initial.rooms.length, 30);
    const payload = { rooms: initial.rooms, ventilation: initial.ventilation, revision: initial.revision };
    assert.equal((await request("/api/calculator-defaults", "PUT", payload)).status, 403);
    assert.equal((await request("/api/calculator-defaults", "PUT", payload, viewer)).status, 403);
    assert.equal((await request("/api/calculator-defaults", "PUT", payload, owner, "http://other.example.test")).status, 403);
    const invalid = structuredClone(payload);
    invalid.rooms[0].relay = -1;
    assert.equal((await request("/api/calculator-defaults", "PUT", invalid, owner)).status, 400);

    const changed = structuredClone(payload);
    changed.rooms.find((room) => room.roomType === "Спальня").relay = 4;
    changed.rooms.find((room) => room.roomType === "Спальня").controls = { p4: false, p6: true, p8: false, scenarioSwitch: "8" };
    const saveResponse = await request("/api/calculator-defaults", "PUT", changed, owner);
    assert.equal(saveResponse.status, 200);
    const saved = await saveResponse.json();
    assert.equal(saved.revision, 1);
    assert.equal((await request("/api/calculator-defaults", "PUT", payload, owner)).status, 409);
    const loaded = await (await request("/api/calculator-defaults")).json();
    assert.equal(loaded.rooms.find((room) => room.roomType === "Спальня").relay, 4);
    assert.deepEqual(loaded.rooms.find((room) => room.roomType === "Спальня").controls, { p4: false, p6: true, p8: false, scenarioSwitch: "8" });

    const pageRequest = (path, identity) => fetchWorker(new Request(`http://localhost${path}`, { headers: { accept: "text/html", ...identity } }));
    const ownerPage = await pageRequest("/calculator/settings", owner);
    assert.equal(ownerPage.status, 200);
    const ownerHtml = await ownerPage.text();
    assert.ok(ownerHtml.includes("Сохранить изменения"));
    assert.ok(ownerHtml.includes("Спальня: Свет: релейные группы + умные розетки + вентиляторы"));
    assert.ok(ownerHtml.includes('value="4"'));
    const viewerHtml = await (await pageRequest("/calculator/settings", viewer)).text();
    assert.ok(viewerHtml.includes("Редактирование доступно владельцу калькулятора"));
    assert.ok(!viewerHtml.includes("Сохранить изменения"));
    const calculatorHtml = await (await pageRequest("/calculator", owner)).text();
    assert.ok(calculatorHtml.includes('href="/calculator/settings"'));
    assert.ok(calculatorHtml.includes("Типовой набор света"));
  } finally {
    connection.close();
  }
});
