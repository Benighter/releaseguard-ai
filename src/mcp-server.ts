import { createMcpHandler, McpServer } from "@modelcontextprotocol/server";
import * as z from "zod/v4";
import { addBedrockNarrative } from "./bedrock.js";
import { runDemoRelease } from "./live-runner.js";
import { assessRelease } from "./release-engine.js";

const checkSchema = z.object({
  name: z.string().min(1),
  category: z.enum(["build", "unit", "api", "browser", "visual", "performance", "security"]),
  status: z.enum(["passed", "warning", "failed"]),
  durationMs: z.number().nonnegative(),
  summary: z.string().min(1),
  evidence: z.string().optional(),
});

const assessmentSchema = z.object({
  version: z.string().min(1),
  commit: z.string().min(1),
  environment: z.string().min(1).default("staging"),
  checks: z.array(checkSchema).min(1).max(200),
  useBedrock: z.boolean().default(false),
});

export function createReleaseGuardServer(): McpServer {
  const server = new McpServer(
    { name: "releaseguard-ai", version: "0.1.0" },
    {
      instructions:
        "Assess release readiness from concrete build, API, browser, visual, performance, and security evidence. Never claim that a check ran unless it appears in the tool input.",
    },
  );

  server.registerTool(
    "assess_release",
    {
      title: "Assess a release candidate",
      description:
        "Groups related failures and returns an evidence-backed SHIP, REVIEW, or HOLD recommendation.",
      inputSchema: assessmentSchema,
    },
    async ({ useBedrock, ...input }) => {
      const deterministic = assessRelease(input);
      const assessment = useBedrock
        ? await addBedrockNarrative(deterministic)
        : deterministic;

      return {
        content: [
          {
            type: "text",
            text: `${assessment.recommendation}: ${assessment.summary}`,
          },
        ],
        structuredContent: assessment,
      };
    },
  );

  server.registerTool(
    "run_demo_release",
    {
      title: "Run the bounded release demo",
      description:
        "Runs real API and Playwright checks against the included allowlisted release candidate, captures a screenshot and console evidence, then returns a release recommendation.",
      inputSchema: z.object({
        version: z.enum(["2.8.0-rc.1", "2.8.0-rc.2"]),
        baseUrl: z.string().url().default("http://127.0.0.1:3210"),
        useBedrock: z.boolean().default(false),
      }),
    },
    async ({ version, baseUrl, useBedrock }) => {
      const assessment = await runDemoRelease({ version, baseUrl, useBedrock });
      return {
        content: [
          {
            type: "text",
            text: `${assessment.recommendation}: ${assessment.summary}`,
          },
        ],
        structuredContent: assessment,
      };
    },
  );

  return server;
}

export const mcpHandler = createMcpHandler(createReleaseGuardServer, {
  responseMode: "json",
  legacy: "stateless",
});
