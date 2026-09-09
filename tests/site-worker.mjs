import { register } from "node:module";

// Node tests use explicit bindings for the Workers env module. Production
// continues to receive bindings and verified identity headers from Sites.
const envModule = "data:text/javascript," + encodeURIComponent(
  'export const env = globalThis[Symbol.for("technobit.test.worker-env")];',
);
register("data:text/javascript," + encodeURIComponent(`
  export async function resolve(specifier, context, nextResolve) {
    if (specifier === "cloudflare:workers") return { url: ${JSON.stringify(envModule)}, shortCircuit: true };
    return nextResolve(specifier, context);
  }
`), import.meta.url);

export async function loadTestWorker(bindings = {}) {
  const env = {
    ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) },
    ...bindings,
  };
  globalThis[Symbol.for("technobit.test.worker-env")] = env;
  const { default: worker } = await import(new URL("../dist/server/index.js", import.meta.url).href);
  return (request) => worker.fetch(request, env, {
    waitUntil() {},
    passThroughOnException() {},
  });
}
