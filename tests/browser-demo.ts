import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { chromium, type BrowserContext } from "playwright-core";
import type { ReleaseAssessment } from "../src/domain.js";

const record = process.argv.includes("--record");
const baseUrl = process.env.RELEASEGUARD_DEMO_URL ?? "http://127.0.0.1:3210";
const outputDir = resolve(process.env.RELEASEGUARD_EVIDENCE_DIR ?? (record ? "demo-recording" : "demo-evidence-browser"));
await mkdir(outputDir, { recursive: false }); // Never replace an uncertain earlier run.
const statePath = resolve(outputDir, "run-state.json");
const startedAt = new Date().toISOString();
const started = performance.now();
await writeFile(statePath, JSON.stringify({ status: record ? "recording" : "verifying", startedAt, baseUrl }, null, 2));
const requests: Record<string, unknown>[] = [];
const reports: ReleaseAssessment[] = [];
const responseJobs: Promise<void>[] = [];
const pageErrors: string[] = [];
const responseErrors: string[] = [];
let restShortcutRequests = 0;
const browser = await chromium.launch({ channel: "chrome", headless: true });
let context: BrowserContext | undefined;
let videoPath: string | undefined;
try {
  context = await browser.newContext({ viewport: { width: 1440, height: 1080 },
    recordHar: { path: resolve(outputDir, "browser-network.har"), content: "embed", mode: "full" },
    ...(record ? { recordVideo: { dir: outputDir, size: { width: 1440, height: 1080 } } } : {}),
  });
  const page = await context.newPage();
  const video = page.video();
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("request", (request) => {
    const path = new URL(request.url()).pathname;
    if (path === "/api/live-demo") restShortcutRequests++;
    if (path === "/mcp" && request.method() === "POST") requests.push({ url: request.url(), headers: request.headers(), ...request.postDataJSON() });
  });
  page.on("response", (response) => {
    if (new URL(response.url()).pathname !== "/mcp" || response.status() === 202) return;
    responseJobs.push((async () => {
      if (!response.ok()) return;
      const contentType = response.headers()["content-type"] ?? "";
      const messages = contentType.includes("text/event-stream")
        ? (await response.text()).split(/\r?\n\r?\n/).map((frame) => frame.split(/\r?\n/).filter((line) => line.startsWith("data:")).map((line) => line.slice(5).trimStart()).join("\n")).filter(Boolean).map((data) => JSON.parse(data))
        : [await response.json()];
      for (const message of messages) if (message.result?.structuredContent) reports.push(message.result.structuredContent as ReleaseAssessment);
    })().catch((error: unknown) => { responseErrors.push(error instanceof Error ? error.message : String(error)); }));
  });
  const pause = async (milliseconds: number) => { if (record) await page.waitForTimeout(milliseconds); };
  console.log(`BROWSER: ${record ? "Recording" : "Verifying"} the real dashboard at ${baseUrl}`);
  if (record) {
    await page.goto(new URL("/demo/store?version=2.8.0-rc.1", baseUrl).toString(), { waitUntil: "networkidle" });
    assert.equal(await page.getByRole("button", { name: "Place order", exact: true }).isDisabled(), true);
    await page.screenshot({ path: resolve(outputDir, "rc1-live-checkout.png") });
    await pause(7_000);
  }
  await page.goto(baseUrl, { waitUntil: "networkidle" });
  assert.equal(await page.locator("#verdict").textContent(), "No review yet");
  assert.equal(await page.locator("#run").isEnabled(), true);
  assert.equal(await page.locator("#mcp-trace").textContent(), "No requests sent yet.");
  await page.screenshot({ path: resolve(outputDir, "dashboard-empty.png"), fullPage: true });
  await pause(5_000);
  if (record) await page.getByRole("button", { name: "Check release", exact: true }).click();
  else {
    await page.locator("#candidate").focus();
    await page.keyboard.press("Tab");
    assert.equal(await page.evaluate(() => document.activeElement?.id), "run");
    assert.equal(await page.locator("#run").evaluate((element) => getComputedStyle(element).outlineWidth), "3px");
    await page.keyboard.press("Enter");
  }
  await page.waitForFunction(() => document.getElementById("verdict")?.textContent === "HOLD", undefined, { timeout: 30_000 });
  assert.match(await page.locator("#mcp-status").textContent() ?? "", /^Connected · MCP/);
  assert.match(await page.locator("#mcp-trace").textContent() ?? "", /initialize.*response.*2025-11-25/);
  assert.match(await page.locator("#mcp-trace").textContent() ?? "", /tools\/list.*run_demo_release/);
  console.log("BROWSER: automatic MCP initialization, tool discovery, and RC.1 HOLD confirmed");
  await page.locator("#verdict").scrollIntoViewIfNeeded();
  await page.evaluate(() => scrollTo(0, 0));
  await page.screenshot({ path: resolve(outputDir, "rc1-dashboard.png"), fullPage: true });
  assert.match(await page.locator("#checks").textContent() ?? "", /500 instead of 201/);
  assert.match(await page.locator("#checks").textContent() ?? "", /Place order was disabled/);
  assert.equal(await page.locator("#checks tr:first-child .result").textContent(), "failed");
  assert.equal(await page.locator("#candidate-value").textContent(), "2.8.0-rc.1");
  assert.equal(await page.locator("#run").evaluate((element) => element === document.activeElement), true);
  console.log("BROWSER: RC.1 HOLD confirmed from real API and browser failures");
  await pause(9_000);
  await page.locator("#capture-details summary").click();
  await page.waitForFunction(() => (document.getElementById("artifact") as HTMLImageElement)?.naturalWidth > 0);
  await page.locator("#artifact").scrollIntoViewIfNeeded();
  await pause(6_000);

  if (record) {
    await page.locator("#candidate").selectOption("2.8.0-rc.2");
    await page.getByRole("button", { name: "Check release", exact: true }).scrollIntoViewIfNeeded();
    await pause(3_000);
    await page.getByRole("button", { name: "Check release", exact: true }).click();
  } else {
    await page.locator("#candidate").focus();
    await page.keyboard.press("ArrowDown");
    assert.equal(await page.locator("#candidate").inputValue(), "2.8.0-rc.2");
    await page.keyboard.press("Tab");
    await page.keyboard.press("Enter");
  }
  await page.waitForFunction(() => document.getElementById("verdict")?.textContent === "SHIP", undefined, { timeout: 30_000 });
  await page.locator("#verdict").scrollIntoViewIfNeeded();
  await page.evaluate(() => scrollTo(0, 0));
  await page.screenshot({ path: resolve(outputDir, "rc2-dashboard.png"), fullPage: true });
  assert.match(await page.locator("#checks").textContent() ?? "", /expected 201 response/);
  assert.match(await page.locator("#checks").textContent() ?? "", /Guest checkout completed and displayed Order accepted/);
  assert.equal(await page.locator("#candidate-value").textContent(), "2.8.0-rc.2");
  console.log("BROWSER: RC.2 SHIP confirmed from actual successful checkout");
  await pause(9_000);
  await page.locator("#capture-details summary").click();
  await page.waitForFunction(() => (document.getElementById("artifact") as HTMLImageElement)?.naturalWidth > 0);
  await page.locator("#artifact").scrollIntoViewIfNeeded();
  await pause(6_000);
  await page.locator("#protocol-details summary").click();
  await page.locator("#mcp-trace").scrollIntoViewIfNeeded();
  await pause(7_000);
  await Promise.all(responseJobs);
  assert.deepEqual(responseErrors, []);
  assert.equal(reports.length, 2);
  assert.deepEqual(reports.map((report) => report.recommendation), ["HOLD", "SHIP"]);
  assert.equal(restShortcutRequests, 0, "The dashboard must use MCP, not the REST shortcut.");
  assert.deepEqual(requests.map((request) => request.method), ["initialize", "notifications/initialized", "tools/list", "tools/call", "tools/call"]);
  assert.deepEqual(pageErrors, []);

  if (record) {
    await page.goto(new URL("/demo/store?version=2.8.0-rc.2", baseUrl).toString(), { waitUntil: "networkidle" });
    const orderButton = page.getByRole("button", { name: "Place order", exact: true });
    assert.equal(await orderButton.isDisabled(), false);
    await pause(3_000);
    await orderButton.click();
    await page.getByText("Order accepted", { exact: true }).waitFor();
    await page.screenshot({ path: resolve(outputDir, "rc2-live-checkout.png") });
    console.log("BROWSER: recording shows the actual fixed checkout accepting an order");
    await pause(10_000);
  }

  if (!record) {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.evaluate(() => scrollTo(0, 0));
    await page.screenshot({ path: resolve(outputDir, "desktop-dark.png"), fullPage: true });
    assert.equal(await page.locator("body").evaluate((element) => getComputedStyle(element).color), "rgb(230, 237, 245)");
    await page.setViewportSize({ width: 375, height: 812 });
    await page.emulateMedia({ colorScheme: "light" });
    await page.evaluate(() => scrollTo(0, 0));
    await page.screenshot({ path: resolve(outputDir, "mobile-light.png"), fullPage: true });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    assert.equal(await page.locator("#verdict").evaluate((element) => element.getBoundingClientRect().top < 812), true);
    const headerTop = await page.locator(".topbar").evaluate((element) => element.getBoundingClientRect().top);
    await page.evaluate(() => scrollTo(0, document.body.scrollHeight));
    assert.equal(await page.locator(".topbar").evaluate((element) => element.getBoundingClientRect().top), headerTop);
    await page.emulateMedia({ colorScheme: "dark" });
    await page.evaluate(() => scrollTo(0, 0));
    await page.screenshot({ path: resolve(outputDir, "mobile-dark.png"), fullPage: true });
    await page.setViewportSize({ width: 320, height: 720 });
    await page.evaluate(() => { document.body.style.zoom = "1.25"; });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    await page.evaluate(() => scrollTo(0, 0));
    await page.screenshot({ path: resolve(outputDir, "narrow-scaled.png"), fullPage: true });
    await page.evaluate(() => { document.body.style.zoom = ""; });
    await page.setViewportSize({ width: 1440, height: 1080 });
    await page.emulateMedia({ colorScheme: "light" });
    // Separate negative verification. This injected failure is never recorded.
    await page.route("**/mcp", async (route) => {
      const message = route.request().postDataJSON();
      if (message.method === "tools/call") await route.fulfill({ status: 503, body: "Verification-only simulated transport failure" });
      else await route.continue();
    });
    await page.getByRole("button", { name: "Check release", exact: true }).click();
    await page.waitForFunction(() => document.getElementById("verdict")?.textContent === "ERROR");
    assert.equal(await page.locator("#risk").textContent(), "—");
    assert.equal(await page.locator("#candidate").inputValue(), "2.8.0-rc.2");
    assert.equal(await page.locator("#artifact").isVisible(), false);
    await page.screenshot({ path: resolve(outputDir, "transport-error-test.png"), fullPage: true });
    console.log("BROWSER: negative test confirmed that a transport failure clears the prior SHIP verdict");
  }
  await writeFile(resolve(outputDir, "browser-verification.json"), JSON.stringify({ verifiedAt: new Date().toISOString(), baseUrl, browser: "installed Google Chrome via playwright-core", browserVersion: browser.version(), recording: record, viewport: { width: 1440, height: 1080 }, mockResponsesDuringRecording: false, restShortcutRequests, pageErrors, responseErrors, requests, reports }, null, 2));
  await context.close();
  context = undefined;
  if (video) videoPath = await video.path();
  const durationMs = Math.round(performance.now() - started);
  assert.ok(durationMs < 180_000, "The demo must remain under three minutes.");
  const videoSha256 = videoPath ? createHash("sha256").update(await readFile(videoPath)).digest("hex") : undefined;
  await writeFile(statePath, JSON.stringify({ status: "complete", startedAt, completedAt: new Date().toISOString(), durationMs, baseUrl, videoPath, videoSha256 }, null, 2));
  console.log(JSON.stringify({ status: "complete", durationMs, videoPath, outputDir }));
} catch (error) {
  await writeFile(statePath, JSON.stringify({ status: "failed", startedAt, failedAt: new Date().toISOString(), error: error instanceof Error ? error.message : String(error) }, null, 2));
  throw error;
} finally {
  await context?.close();
  await browser.close();
}
