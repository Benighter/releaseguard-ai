import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { Client, StreamableHTTPClientTransport } from "@modelcontextprotocol/client";
import type { ReleaseAssessment } from "../src/domain.js";

const endpoint = new URL(process.env.RELEASEGUARD_MCP_URL ?? "http://127.0.0.1:3210/mcp");
const evidenceDir = resolve(process.env.RELEASEGUARD_EVIDENCE_DIR ?? "demo-evidence");
const client = new Client({ name: "releaseguard-live-verifier", version: "0.1.0" }, { versionNegotiation: { mode: "legacy" } });
const reports: ReleaseAssessment[] = [];
try {
  const health = await (await fetch(new URL("/health", endpoint))).json() as { bedrockEnabled: boolean };
  assert.equal(health.bedrockEnabled, false, "Bedrock must be disabled for this verification.");
  await client.connect(new StreamableHTTPClientTransport(endpoint));
  assert.equal(client.getNegotiatedProtocolVersion(), "2025-11-25");
  const listed = await client.listTools();
  assert.ok(listed.tools.some((tool) => tool.name === "run_demo_release"));
  for (const version of ["2.8.0-rc.1", "2.8.0-rc.2"] as const) {
    const result = await client.callTool({ name: "run_demo_release", arguments: { version, baseUrl: endpoint.origin, useBedrock: false } });
    assert.notEqual(result.isError, true);
    const report = result.structuredContent as unknown as ReleaseAssessment;
    assert.equal(report.recommendation, version.endsWith("rc.1") ? "HOLD" : "SHIP");
    assert.equal(report.totals.failed, version.endsWith("rc.1") ? 2 : 0);
    assert.equal(report.checks.find((check) => check.category === "browser")?.status, version.endsWith("rc.1") ? "failed" : "passed");
    assert.ok(report.artifacts?.screenshotUrl, "Each live browser run must capture fresh evidence.");
    reports.push(report);
    console.log(`${version}: ${report.recommendation}; ${report.totals.failed} failed; ${report.checks.find((check) => check.category === "browser")?.summary}`);
  }
  await mkdir(evidenceDir, { recursive: true });
  await writeFile(resolve(evidenceDir, "mcp-live-verification.json"), JSON.stringify({ verifiedAt: new Date().toISOString(), endpoint: endpoint.toString(), protocol: client.getNegotiatedProtocolVersion(), client: "@modelcontextprotocol/client", tools: listed.tools.map((tool) => tool.name), bedrockEnabled: false, reports }, null, 2));
} finally {
  await client.close();
}
