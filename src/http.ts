import { serve } from "@hono/node-server";
import { readFile } from "node:fs/promises";
import { basename, resolve } from "node:path";
import { addBedrockNarrative } from "./bedrock.js";
import { dashboardHtml } from "./dashboard.js";
import { demoStoreHtml } from "./demo-store.js";
import { runDemoRelease } from "./live-runner.js";
import { mcpHandler } from "./mcp-server.js";
import { assessRelease, demoAssessmentInput } from "./release-engine.js";

const port = Number(process.env.PORT ?? 3210);
const allowedOrigins = new Set([
  `http://127.0.0.1:${port}`,
  `http://localhost:${port}`,
]);

export function appFetch(request: Request): Promise<Response> | Response {
  const url = new URL(request.url);

  if (url.pathname === "/mcp") {
    const origin = request.headers.get("origin");
    if (origin && !allowedOrigins.has(origin)) {
      return Response.json({ error: "Origin is not allowed." }, { status: 403 });
    }
    return mcpHandler.fetch(request);
  }

  if (url.pathname === "/api/demo" && request.method === "POST") {
    const report = assessRelease(demoAssessmentInput());
    return addBedrockNarrative(report).then((result) => Response.json(result));
  }

  if (url.pathname === "/api/live-demo" && request.method === "POST") {
    const version = url.searchParams.get("version") === "2.8.0-rc.2"
      ? "2.8.0-rc.2"
      : "2.8.0-rc.1";
    return runDemoRelease({
      baseUrl: url.origin,
      version,
      useBedrock: process.env.RELEASEGUARD_USE_BEDROCK === "1",
    }).then((result) => Response.json(result));
  }

  if (url.pathname === "/demo/store") {
    return new Response(demoStoreHtml, {
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }

  if (url.pathname === "/demo/api/checkout" && request.method === "POST") {
    const broken = url.searchParams.get("version") !== "2.8.0-rc.2";
    return broken
      ? Response.json(
          {
            requestId: "req_28F",
            error: "currencyCode is undefined",
          },
          { status: 500 },
        )
      : Response.json({ orderId: "ord_RG2802", status: "accepted" }, { status: 201 });
  }

  if (url.pathname.startsWith("/reports/")) {
    const safeName = basename(url.pathname);
    if (!safeName.endsWith(".png")) return new Response("Not found", { status: 404 });
    return readFile(resolve(process.cwd(), "releaseguard-reports", safeName))
      .then((content) => new Response(content, { headers: { "content-type": "image/png" } }))
      .catch(() => new Response("Not found", { status: 404 }));
  }

  if (url.pathname === "/health") {
    return Response.json({
      name: "releaseguard-ai",
      status: "ok",
      mcpEndpoint: "/mcp",
      protocolCompatibility: ["2025-11-25", "2026-07-28"],
      bedrockEnabled: process.env.RELEASEGUARD_USE_BEDROCK === "1",
    });
  }

  if (url.pathname === "/favicon.ico") {
    return new Response(null, { status: 204 });
  }

  if (url.pathname === "/") {
    return new Response(dashboardHtml, {
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }

  return new Response("Not found", { status: 404 });
}

serve({ fetch: appFetch, port }, (info) => {
  console.log(`ReleaseGuard AI is running at http://127.0.0.1:${info.port}`);
  console.log(`MCP endpoint: http://127.0.0.1:${info.port}/mcp`);
});
