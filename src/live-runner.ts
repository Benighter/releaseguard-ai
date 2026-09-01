import { existsSync, mkdirSync } from "node:fs";
import { basename, resolve } from "node:path";
import { chromium } from "playwright-core";
import { addBedrockNarrative } from "./bedrock.js";
import type { ReleaseAssessment, ReleaseCheck } from "./domain.js";
import { assessRelease } from "./release-engine.js";

const localHosts = new Set(["127.0.0.1", "localhost", "::1"]);

export function validateTargetUrl(rawUrl: string): URL {
  const url = new URL(rawUrl);
  if (!new Set(["http:", "https:"]).has(url.protocol)) {
    throw new Error("Only HTTP and HTTPS release targets are supported.");
  }

  const configured = (process.env.RELEASEGUARD_ALLOWED_TARGETS ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  if (!localHosts.has(url.hostname) && !configured.includes(url.origin)) {
    throw new Error("The release target is not in RELEASEGUARD_ALLOWED_TARGETS.");
  }
  return url;
}

export async function runDemoRelease(options: {
  baseUrl: string;
  version: "2.8.0-rc.1" | "2.8.0-rc.2";
  useBedrock?: boolean;
}): Promise<ReleaseAssessment> {
  const baseUrl = validateTargetUrl(options.baseUrl);
  const checks: ReleaseCheck[] = [];
  const logs: string[] = [];
  const started = performance.now();

  const builtServerPath = resolve(process.cwd(), "dist", "src", "http.js");
  checks.push({
    name: "Compiled release artifact",
    category: "build",
    status: existsSync(builtServerPath) ? "passed" : "failed",
    durationMs: 1,
    summary: existsSync(builtServerPath)
      ? "The compiled ReleaseGuard server artifact is present."
      : "The compiled server artifact is missing.",
    evidence: basename(builtServerPath),
  });

  const apiStarted = performance.now();
  const apiResponse = await fetch(
    new URL(`/demo/api/checkout?version=${encodeURIComponent(options.version)}`, baseUrl),
    { method: "POST" },
  );
  const apiBody = (await apiResponse.json()) as { orderId?: string; error?: string; requestId?: string };
  const apiPassed = apiResponse.status === 201;
  checks.push({
    name: "Checkout API contract",
    category: "api",
    status: apiPassed ? "passed" : "failed",
    durationMs: Math.round(performance.now() - apiStarted),
    summary: apiPassed
      ? "POST /checkout returned the expected 201 response."
      : `POST /checkout returned ${apiResponse.status} instead of 201.`,
    evidence: apiPassed
      ? `orderId=${apiBody.orderId}; status=201`
      : `requestId=${apiBody.requestId}; status=${apiResponse.status}; error=${apiBody.error}`,
  });

  const reportsDirectory = resolve(process.cwd(), "releaseguard-reports");
  mkdirSync(reportsDirectory, { recursive: true });
  const screenshotName = `checkout-${options.version}.png`;
  const screenshotPath = resolve(reportsDirectory, screenshotName);
  const browserStarted = performance.now();
  let browser;

  try {
    browser = await chromium.launch({ channel: "chrome", headless: true });
    const page = await browser.newPage({ viewport: { width: 1365, height: 900 } });
    page.on("console", (message) => logs.push(`${message.type()}: ${message.text()}`));
    await page.goto(
      new URL(`/demo/store?version=${encodeURIComponent(options.version)}`, baseUrl).toString(),
      { waitUntil: "networkidle", timeout: 15_000 },
    );
    const button = page.getByRole("button", { name: "Place order" });
    const disabled = await button.isDisabled();
    let browserPassed = !disabled;
    let statusText = "Place order was disabled after valid checkout details.";
    if (!disabled) {
      await button.click();
      await page.getByText("Order accepted", { exact: true }).waitFor({ timeout: 5_000 });
      statusText = "Guest checkout completed and displayed Order accepted.";
      browserPassed = true;
    }
    await page.screenshot({ path: screenshotPath, fullPage: true });
    checks.push({
      name: "Guest checkout journey",
      category: "browser",
      status: browserPassed ? "passed" : "failed",
      durationMs: Math.round(performance.now() - browserStarted),
      summary: statusText,
      evidence: `screenshot=/reports/${screenshotName}; console=${logs.join(" | ") || "clean"}`,
    });
  } catch (error) {
    checks.push({
      name: "Guest checkout journey",
      category: "browser",
      status: "failed",
      durationMs: Math.round(performance.now() - browserStarted),
      summary: "The controlled browser journey could not complete.",
      evidence: error instanceof Error ? error.message : String(error),
    });
  } finally {
    await browser?.close();
  }

  const totalDuration = Math.round(performance.now() - started);
  checks.push({
    name: "Release-check duration",
    category: "performance",
    status: totalDuration <= 8_000 ? "passed" : "warning",
    durationMs: totalDuration,
    summary: `The bounded live assessment completed in ${(totalDuration / 1000).toFixed(2)} seconds.`,
    evidence: `budget=8.00s; actual=${(totalDuration / 1000).toFixed(2)}s`,
  });

  const deterministic = assessRelease({
    version: options.version,
    commit: options.version.endsWith("rc.1") ? "b7e41d9" : "ca82f10",
    environment: "local-demo",
    checks,
  });
  const withArtifacts: ReleaseAssessment = {
    ...deterministic,
    artifacts: {
      screenshotUrl: existsSync(screenshotPath) ? `/reports/${screenshotName}` : undefined,
      logs,
    },
  };
  return options.useBedrock ? addBedrockNarrative(withArtifacts) : withArtifacts;
}
