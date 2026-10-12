import assert from "node:assert/strict";
import test from "node:test";
import { DashboardMcpClient, type McpEvent } from "../src/dashboard-mcp-client.js";

type Message = { id?: number; method: string; params?: Record<string, any> };
type Call = { message: Message; headers: Headers; endpoint: string };
type Handler = (call: Call) => Response | undefined;
const json = (message: Message, result: unknown, headers: Record<string, string> = {}) =>
  Response.json({ jsonrpc: "2.0", id: message.id, result }, { headers });
const initialization = { protocolVersion: "2025-11-25", capabilities: { tools: {} }, serverInfo: { name: "releaseguard-ai", version: "0.1.0" } };

function harness(handler: Handler = () => undefined) {
  const calls: Call[] = [];
  const events: McpEvent[] = [];
  const fetchImpl: typeof fetch = async (endpoint, options) => {
    const call = { endpoint: String(endpoint), headers: new Headers(options?.headers), message: JSON.parse(String(options?.body)) as Message };
    calls.push(call);
    const overridden = handler(call);
    if (overridden) return overridden;
    if (call.message.method === "initialize") return json(call.message, initialization);
    if (call.message.method === "notifications/initialized") return new Response(null, { status: 202 });
    if (call.message.method === "tools/list") return json(call.message, { tools: [{ name: "assess_release" }, { name: "run_demo_release" }] });
    const version = call.message.params?.arguments.version;
    return json(call.message, { structuredContent: { version, recommendation: version.endsWith("rc.1") ? "HOLD" : "SHIP", summary: "Unit fixture", riskScore: 0, totals: { passed: 4, failed: 0, warning: 0 }, checks: [], failureGroups: [] } });
  };
  return { calls, events, client: new DashboardMcpClient("/mcp", fetchImpl, (event) => events.push(event)) };
}

test("negotiates MCP, acknowledges initialization, discovers tools, then calls the release tool", async () => {
  const { client, calls } = harness();
  const report = await client.runDemo("2.8.0-rc.1", "http://127.0.0.1:3210");
  assert.equal(report.recommendation, "HOLD");
  assert.deepEqual(calls.map((call) => call.message.method), ["initialize", "notifications/initialized", "tools/list", "tools/call"]);
  assert.ok(calls.every((call) => call.endpoint === "/mcp"));
  assert.equal(calls[0].headers.get("Accept"), "application/json, text/event-stream");
  assert.equal(calls[0].headers.get("MCP-Protocol-Version"), null);
  assert.ok(calls.slice(1).every((call) => call.headers.get("MCP-Protocol-Version") === "2025-11-25"));
  assert.equal(calls[1].message.id, undefined);
  assert.deepEqual(calls[3].message.params, { name: "run_demo_release", arguments: { version: "2.8.0-rc.1", baseUrl: "http://127.0.0.1:3210", useBedrock: false } });
});

test("reuses one initialization even for concurrent connection requests and both candidates", async () => {
  const { client, calls } = harness();
  await Promise.all([client.connect(), client.connect()]);
  await client.runDemo("2.8.0-rc.1", "http://localhost:3210");
  const fixed = await client.runDemo("2.8.0-rc.2", "http://localhost:3210");
  assert.equal(fixed.recommendation, "SHIP");
  assert.equal(calls.filter((call) => call.message.method === "initialize").length, 1);
});

test("propagates a server-assigned session ID after initialization", async () => {
  const { client, calls } = harness(({ message }) => message.method === "initialize" ? json(message, initialization, { "MCP-Session-Id": "session-123" }) : undefined);
  await client.runDemo("2.8.0-rc.1", "http://localhost:3210");
  assert.ok(calls.slice(1).every((call) => call.headers.get("MCP-Session-Id") === "session-123"));
});

test("calls browser fetch with its required global receiver", async () => {
  const fetchImpl: typeof fetch = async function (this: unknown, _endpoint, options) {
    assert.equal(this, globalThis, "Native Window.fetch rejects a custom client object as its receiver.");
    const message = JSON.parse(String(options?.body)) as Message;
    if (message.method === "initialize") return json(message, initialization);
    if (message.method === "notifications/initialized") return new Response(null, { status: 202 });
    return json(message, { tools: [{ name: "run_demo_release" }] });
  };
  await new DashboardMcpClient("/mcp", fetchImpl).connect();
});

test("accepts SSE results while ignoring empty priming events and unrelated notifications", async () => {
  const { client } = harness(({ message }) => message.method === "initialize" ? new Response(
    'id: 1\ndata: \n\nevent: message\ndata: {"jsonrpc":"2.0","method":"notifications/message"}\n\nevent: message\ndata: ' + JSON.stringify({ jsonrpc: "2.0", id: message.id, result: initialization }) + '\n\n',
    { headers: { "Content-Type": "text/event-stream" } },
  ) : undefined);
  await client.connect();
  assert.equal(client.protocolVersion, "2025-11-25");
});

test("follows paginated tool discovery", async () => {
  const { client, calls } = harness(({ message }) => message.method === "tools/list" ? json(message, message.params?.cursor ? { tools: [{ name: "run_demo_release" }] } : { tools: [{ name: "assess_release" }], nextCursor: "page-2" }) : undefined);
  await client.connect();
  assert.deepEqual(client.toolNames, ["assess_release", "run_demo_release"]);
  assert.equal(calls.filter((call) => call.message.method === "tools/list")[1].message.params?.cursor, "page-2");
});

test("stops discovery if a cursor repeats", async () => {
  const { client } = harness(({ message }) => message.method === "tools/list" ? json(message, { tools: [], nextCursor: "same" }) : undefined);
  await assert.rejects(client.connect(), /did not finish/);
});

test("refuses a protocol version it does not implement", async () => {
  const { client, calls } = harness(({ message }) => message.method === "initialize" ? json(message, { ...initialization, protocolVersion: "2099-01-01" }) : undefined);
  await assert.rejects(client.connect(), /negotiate/);
  assert.equal(calls.length, 1);
});

test("refuses a server without tools capability", async () => {
  const { client } = harness(({ message }) => message.method === "initialize" ? json(message, { ...initialization, capabilities: {} }) : undefined);
  await assert.rejects(client.connect(), /tools capability/);
});

test("does not run an undiscovered tool", async () => {
  const { client, calls } = harness(({ message }) => message.method === "tools/list" ? json(message, { tools: [{ name: "unrelated" }] }) : undefined);
  await assert.rejects(client.runDemo("2.8.0-rc.1", "http://localhost:3210"), /does not expose/);
  assert.equal(calls.filter((call) => call.message.method === "tools/call").length, 0);
});

test("surfaces HTTP failure and permits an explicit connection retry", async () => {
  let fail = true;
  const { client, events } = harness(({ message }) => message.method === "initialize" && fail ? new Response("Unavailable", { status: 503 }) : undefined);
  await assert.rejects(client.connect(), /HTTP 503/);
  fail = false;
  await client.connect();
  assert.ok(events.some((event) => event.phase === "error" && event.detail.includes("503")));
});

test("rejects a mismatched JSON-RPC response ID", async () => {
  const { client } = harness(({ message }) => message.method === "initialize" ? Response.json({ jsonrpc: "2.0", id: 999, result: initialization }) : undefined);
  await assert.rejects(client.connect(), /did not match/);
});

test("surfaces a JSON-RPC error", async () => {
  const { client } = harness(({ message }) => message.method === "tools/list" ? Response.json({ jsonrpc: "2.0", id: message.id, error: { code: -32603, message: "Discovery failed" } }) : undefined);
  await assert.rejects(client.connect(), /Discovery failed/);
});

test("requires acknowledgment of the initialization notification", async () => {
  const { client } = harness(({ message }) => message.method === "notifications/initialized" ? new Response(null, { status: 204 }) : undefined);
  await assert.rejects(client.connect(), /not accepted/);
});

test("surfaces a tool execution error instead of treating it as a verdict", async () => {
  const { client } = harness(({ message }) => message.method === "tools/call" ? json(message, { isError: true, content: [{ type: "text", text: "Browser unavailable" }] }) : undefined);
  await assert.rejects(client.runDemo("2.8.0-rc.2", "http://localhost:3210"), /Browser unavailable/);
});

test("rejects a malformed or wrong-candidate release report", async () => {
  const { client } = harness(({ message }) => message.method === "tools/call" ? json(message, { structuredContent: { version: "2.8.0-rc.1", recommendation: "SHIP" } }) : undefined);
  await assert.rejects(client.runDemo("2.8.0-rc.2", "http://localhost:3210"), /invalid release report/);
});

test("does not silently replay a failed tool call after session expiration", async () => {
  let expire = true;
  const { client, calls } = harness(({ message }) => {
    if (message.method === "initialize") return json(message, initialization, { "MCP-Session-Id": "session-123" });
    if (message.method === "tools/call" && expire) return new Response(null, { status: 404 });
  });
  await assert.rejects(client.runDemo("2.8.0-rc.1", "http://localhost:3210"), /HTTP 404/);
  assert.equal(calls.filter((call) => call.message.method === "tools/call").length, 1);
  expire = false;
  await client.runDemo("2.8.0-rc.1", "http://localhost:3210");
  assert.equal(calls.filter((call) => call.message.method === "initialize").length, 2);
});
