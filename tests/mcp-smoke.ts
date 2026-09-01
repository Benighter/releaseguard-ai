import assert from "node:assert/strict";
import {
  Client,
  StreamableHTTPClientTransport,
} from "@modelcontextprotocol/client";
import { demoAssessmentInput } from "../src/release-engine.js";

const client = new Client(
  { name: "releaseguard-smoke-test", version: "0.1.0" },
  { versionNegotiation: { mode: "legacy" } },
);
const transport = new StreamableHTTPClientTransport(
  new URL(process.env.RELEASEGUARD_MCP_URL ?? "http://127.0.0.1:3210/mcp"),
);

try {
  await client.connect(transport);
  const tools = await client.listTools();
  assert.equal(client.getNegotiatedProtocolVersion(), "2025-11-25");
  assert.ok(tools.tools.some((tool) => tool.name === "assess_release"));
  assert.ok(tools.tools.some((tool) => tool.name === "run_demo_release"));

  const result = await client.callTool({
    name: "assess_release",
    arguments: { ...demoAssessmentInput(), useBedrock: false },
  });
  const report = result.structuredContent as { recommendation?: string; totals?: { failed?: number } };
  assert.equal(report.recommendation, "HOLD");
  assert.equal(report.totals?.failed, 2);

  console.log(
    JSON.stringify({
      protocol: client.getNegotiatedProtocolVersion(),
      era: client.getProtocolEra(),
      tools: tools.tools.map((tool) => tool.name),
      recommendation: report.recommendation,
      failedChecks: report.totals?.failed,
    }),
  );
} finally {
  await client.close();
}
