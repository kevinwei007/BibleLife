import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const projectRoot = new URL("../", import.meta.url);

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("renders the 微光讀經 initial experience", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<html lang="zh-Hant">/i);
  assert.match(html, /微光讀經/);
  assert.match(html, /在話語裡，遇見今日的光/);
  assert.match(html, /讀經進度/);
  assert.match(html, /今日小測驗/);
  assert.match(html, /v0\.1\.0/);
  assert.doesNotMatch(html, /codex-preview|Building your site|react-loading-skeleton/i);
});

test("keeps version, metadata, database, and social preview artifacts", async () => {
  const [version, packageJson, hosting, schema, layout] = await Promise.all([
    readFile(new URL("VERSION", projectRoot), "utf8"),
    readFile(new URL("package.json", projectRoot), "utf8"),
    readFile(new URL(".openai/hosting.json", projectRoot), "utf8"),
    readFile(new URL("db/schema.ts", projectRoot), "utf8"),
    readFile(new URL("app/layout.tsx", projectRoot), "utf8"),
  ]);

  assert.equal(version.trim(), "0.1.0");
  assert.match(packageJson, /"name": "light-in-the-word"/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
  assert.match(hosting, /"d1": "DB"/);
  assert.match(schema, /rewardLedger/);
  assert.match(schema, /idempotencyKey/);
  assert.match(layout, /og\.png/);
  await access(new URL("public/og.png", projectRoot));
  await assert.rejects(access(new URL("app/_sites-preview/", projectRoot)));
});
