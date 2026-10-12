import type { ReleaseAssessment } from "./domain.js";

type JsonObject = Record<string, unknown>;
export type McpEvent = { method: string; phase: "request" | "response" | "error"; detail: string };

function object(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Same-origin MCP web client; accepts JSON and Streamable HTTP SSE responses. */
export class DashboardMcpClient {
  private requestId = 0;
  private sessionId?: string;
  private connection?: Promise<void>;
  protocolVersion?: string;
  toolNames: string[] = [];

  constructor(
    private readonly endpoint = "/mcp",
    private readonly fetchImpl: typeof fetch = fetch,
    private readonly onEvent: (event: McpEvent) => void = () => {},
  ) {}

  connect(): Promise<void> {
    if (!this.connection) {
      this.connection = this.initialize().catch((error: unknown) => {
        this.connection = undefined;
        this.sessionId = undefined;
        this.protocolVersion = undefined;
        this.toolNames = [];
        throw error;
      });
    }
    return this.connection;
  }

  private async initialize(): Promise<void> {
    const result = await this.request("initialize", {
      protocolVersion: "2025-11-25", capabilities: {},
      clientInfo: { name: "releaseguard-web-client", version: "0.1.0" },
    });
    if (result.protocolVersion !== "2025-11-25") throw new Error("The server did not negotiate MCP 2025-11-25.");
    if (!object(result.capabilities) || !object(result.capabilities.tools)) throw new Error("The MCP server did not advertise its tools capability.");
    this.protocolVersion = result.protocolVersion;
    await this.request("notifications/initialized", undefined, true);
    let cursor: string | undefined;
    const visited = new Set<string>();
    do {
      const listed = await this.request("tools/list", cursor ? { cursor } : {});
      if (!Array.isArray(listed.tools) || listed.tools.some((tool) => !object(tool) || typeof tool.name !== "string")) throw new Error("The MCP server returned an invalid tool list.");
      this.toolNames.push(...listed.tools.map((tool) => (tool as JsonObject).name as string));
      cursor = typeof listed.nextCursor === "string" ? listed.nextCursor : undefined;
      if (cursor) {
        if (visited.has(cursor) || visited.size >= 20) throw new Error("The MCP tool list did not finish.");
        visited.add(cursor);
      }
    } while (cursor);
    if (!this.toolNames.includes("run_demo_release")) throw new Error("The MCP server does not expose run_demo_release.");
  }

  async runDemo(version: "2.8.0-rc.1" | "2.8.0-rc.2", baseUrl: string): Promise<ReleaseAssessment> {
    await this.connect();
    const result = await this.request("tools/call", {
      name: "run_demo_release", arguments: { version, baseUrl, useBedrock: false },
    });
    if (result.isError === true) {
      const content = Array.isArray(result.content) ? result.content : [];
      const text = content.filter(object).find((part) => part.type === "text");
      throw new Error(typeof text?.text === "string" ? text.text : "The MCP release tool failed.");
    }
    const report = result.structuredContent;
    if (!object(report) || report.version !== version ||
        !["HOLD", "REVIEW", "SHIP"].includes(String(report.recommendation)) ||
        typeof report.summary !== "string" || typeof report.riskScore !== "number" ||
        !object(report.totals) || !Array.isArray(report.checks) || !Array.isArray(report.failureGroups)) throw new Error("The MCP tool returned an invalid release report.");
    this.onEvent({ method: "tools/call", phase: "response", detail: `run_demo_release · ${version} · ${report.recommendation}` });
    return report as unknown as ReleaseAssessment;
  }

  private async request(method: string, params?: JsonObject, notification = false): Promise<JsonObject> {
    const id = notification ? undefined : ++this.requestId;
    const headers: Record<string, string> = { "Content-Type": "application/json", Accept: "application/json, text/event-stream" };
    if (this.protocolVersion) headers["MCP-Protocol-Version"] = this.protocolVersion;
    if (this.sessionId) headers["MCP-Session-Id"] = this.sessionId;
    this.onEvent({ method, phase: "request", detail: id === undefined ? "notification" : `request #${id}` });
    try {
      const response = await this.fetchImpl.call(globalThis, this.endpoint, {
        method: "POST", headers,
        body: JSON.stringify({ jsonrpc: "2.0", ...(id === undefined ? {} : { id }), method, ...(params ? { params } : {}) }),
        signal: AbortSignal.timeout(30_000),
      });
      if (!response.ok) {
        if (response.status === 404 && this.sessionId) {
          this.connection = undefined; this.sessionId = undefined; this.protocolVersion = undefined; this.toolNames = [];
        }
        throw new Error(`MCP ${method} failed: HTTP ${response.status}.`);
      }
      if (notification) {
        if (response.status !== 202) throw new Error("The MCP initialization notification was not accepted.");
        this.onEvent({ method, phase: "response", detail: "HTTP 202 Accepted" });
        return {};
      }
      let message: unknown;
      const contentType = response.headers.get("content-type") ?? "";
      if (contentType.includes("text/event-stream")) {
        const stream = await response.text();
        for (const frame of stream.split(/\r?\n\r?\n/)) {
          const data = frame.split(/\r?\n/).filter((line) => line.startsWith("data:")).map((line) => line.slice(5).replace(/^ /, "")).join("\n");
          if (!data) continue;
          const candidate: unknown = JSON.parse(data);
          if (object(candidate) && candidate.id === id) { message = candidate; break; }
        }
      } else if (contentType.includes("application/json")) message = await response.json();
      else throw new Error("The MCP server returned an unsupported response format.");
      if (!object(message) || message.jsonrpc !== "2.0" || message.id !== id) throw new Error("The MCP response did not match its request.");
      if (object(message.error)) throw new Error(`MCP ${method}: ${String(message.error.message ?? "protocol error")}`);
      if (!object(message.result)) throw new Error("The MCP response has no result.");
      if (method === "initialize") this.sessionId = response.headers.get("MCP-Session-Id") ?? undefined;
      const detail = method === "initialize" ? `MCP ${message.result.protocolVersion}` :
        method === "tools/list" && Array.isArray(message.result.tools) ? message.result.tools.filter(object).map((tool) => tool.name).join(", ") : "result received";
      if (method !== "tools/call") this.onEvent({ method, phase: "response", detail });
      return message.result;
    } catch (error) {
      this.onEvent({ method, phase: "error", detail: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }
}
