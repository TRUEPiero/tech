import assert from "node:assert/strict";
import test from "node:test";
import { loadTestWorker } from "./site-worker.mjs";

test("renders the home page with its calculator entry point", async () => {
  const fetchWorker = await loadTestWorker();
  const response = await fetchWorker(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
  );

  assert.equal(response.status, 200);
  assert.match(
    response.headers.get("content-type") ?? "",
    /^text\/html\b/i,
  );
  const html = await response.text();
  assert.ok(html.includes('<html lang="ru">'));
  assert.ok(html.includes('href="/calculator"'));
  assert.ok(html.includes('умные дома на iRidi'));
});
