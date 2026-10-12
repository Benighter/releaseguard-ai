import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { Page } from "playwright-core";

export async function auditReview(page: Page, outputDir: string): Promise<void> {
  const metrics: unknown[] = [];
  for (const scheme of ["light", "dark"] as const) {
    await page.emulateMedia({ colorScheme: scheme });
    await page.setViewportSize({ width: 1440, height: 1080 });
    for (const selector of ["#capture-details", "#protocol-details"]) await page.locator(selector).evaluate((element) => { (element as HTMLDetailsElement).open = false; });
    await page.evaluate(() => scrollTo(0, 0));
    const contrasts = await page.evaluate(() => {
      const root = getComputedStyle(document.documentElement);
      const rgb = (value: string): number[] => {
        if (value.startsWith("#")) {
          let hex = value.slice(1);
          if (hex.length === 3) hex = [...hex].map((character) => character + character).join("");
          return [0, 2, 4].map((index) => parseInt(hex.slice(index, index + 2), 16) / 255);
        }
        return (value.match(/[\d.]+/g) ?? []).slice(0, 3).map((channel) => Number(channel) / 255);
      };
      const luminance = (value: string) => rgb(value).map((channel) => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4).reduce((sum, channel, index) => sum + channel * [0.2126, 0.7152, 0.0722][index], 0);
      const contrast = (a: string, b: string) => (Math.max(luminance(a), luminance(b)) + 0.05) / (Math.min(luminance(a), luminance(b)) + 0.05);
      const color = (name: string) => root.getPropertyValue(name).trim();
      const pairs = [["body text", "--ink", "--surface", 4.5], ["supporting text", "--muted", "--surface", 4.5], ["failed status", "--failed", "--surface", 4.5], ["passed status", "--passed", "--surface", 4.5], ["warning status", "--warning", "--surface", 4.5], ["primary action text", "--on-primary", "--primary", 4.5], ["control border", "--control", "--surface", 3], ["focus ring", "--focus", "--surface", 3]] as const;
      return pairs.map(([role, foreground, background, minimum]) => ({ role, ratio: contrast(color(foreground), color(background)), minimum }));
    });
    for (const item of contrasts) assert.ok(item.ratio >= item.minimum, `${scheme} ${item.role}: ${item.ratio.toFixed(2)} < ${item.minimum}`);
    await page.locator("#candidate").focus();
    await page.keyboard.press("Tab");
    assert.equal(await page.evaluate(() => document.activeElement?.id), "run");
    assert.equal(await page.locator("#run").evaluate((element) => getComputedStyle(element).outlineWidth), "3px");
    for (const selector of ["#candidate", "#run", "#protocol-details summary", ".evidence-raw summary"]) assert.ok((await page.locator(selector).first().boundingBox())!.height >= 44, `${selector} needs a 44px target`);
    assert.equal(await page.locator("#checks th[scope=row]").count(), 4);
    await page.screenshot({ path: resolve(outputDir, `desktop-${scheme}.png`), fullPage: true });
    await page.setViewportSize({ width: 375, height: 812 });
    await page.evaluate(() => scrollTo(0, 0));
    const geometry = await page.evaluate(() => ({ width: innerWidth, scrollWidth: document.documentElement.scrollWidth, verdictTop: document.getElementById("verdict")!.getBoundingClientRect().top, actionTop: document.getElementById("run")!.getBoundingClientRect().top }));
    assert.ok(geometry.scrollWidth <= geometry.width, `${scheme} mobile horizontal overflow`);
    assert.ok(geometry.verdictTop < 812 && geometry.actionTop < 812);
    await page.screenshot({ path: resolve(outputDir, `mobile-${scheme}.png`), fullPage: true });
    const raw = page.locator("#checks tr").filter({ has: page.getByText("Guest checkout journey", { exact: true }) }).locator(".evidence-raw");
    await raw.locator("summary").focus();
    await page.keyboard.press("Enter");
    assert.equal(await raw.evaluate((element) => (element as HTMLDetailsElement).open), true);
    assert.match(await raw.locator("pre").textContent() ?? "", /screenshot=\/reports\/checkout-/);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    await page.screenshot({ path: resolve(outputDir, `mobile-${scheme}-raw-evidence.png`), fullPage: true });
    await raw.locator("summary").press("Enter");
    metrics.push({ scheme, contrasts, geometry, keyboardActionFocus: true, keyboardDisclosure: true, semanticRowHeaders: 4, minimumTargetHeight: 44 });
  }
  await page.setViewportSize({ width: 812, height: 375 });
  await page.emulateMedia({ colorScheme: "light" });
  await page.evaluate(() => scrollTo(0, 0));
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  await page.screenshot({ path: resolve(outputDir, "landscape.png"), fullPage: true });
  await page.setViewportSize({ width: 320, height: 720 });
  await page.evaluate(() => { document.body.style.zoom = "1.25"; scrollTo(0, 0); });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  await page.screenshot({ path: resolve(outputDir, "narrow-scaled.png"), fullPage: true });
  await page.evaluate(() => { document.body.style.zoom = ""; });
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.evaluate(() => { document.body.style.zoom = "2"; scrollTo(0, 0); });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  await page.screenshot({ path: resolve(outputDir, "desktop-200-percent.png"), fullPage: true });
  await page.evaluate(() => { document.body.style.zoom = ""; });
  await page.setViewportSize({ width: 1440, height: 1080 });
  await writeFile(resolve(outputDir, "accessibility-verification.json"), JSON.stringify({ measuredAt: new Date().toISOString(), metrics, additionalViews: ["812x375 landscape", "320x720 with 125% CSS zoom", "1280x900 with 200% CSS zoom"], limits: "Installed Chrome only. Role contrast and keyboard behavior were measured; this is not full WCAG certification or a screen-reader compatibility audit." }, null, 2));
  console.log("BROWSER: light/dark contrast, keyboard operation, touch targets, row semantics, mobile wrapping and scaled views verified");
}
