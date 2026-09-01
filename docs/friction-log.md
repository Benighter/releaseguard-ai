# Friction log

## 1. MCP protocol-era compatibility

- **Task:** Serve the hackathon-required MCP `2025-11-25` revision over Streamable HTTP using the current TypeScript SDK.
- **Steps:** Installed the official v2 server and client packages, created the HTTP handler, connected a real client, listed tools, and called `assess_release`.
- **Expected:** The server should negotiate the required revision and return a structured tool result.
- **Actual:** The current SDK also supports a newer 2026 protocol era, so the server needed an explicit legacy-compatible serving path and the smoke client needed to verify the negotiated version.
- **Severity:** Medium.
- **Workaround:** Serve legacy stateless connections and assert `client.getNegotiatedProtocolVersion() === "2025-11-25"` in the smoke test.
- **Suggestion:** Add a prominent “Hackathon compatibility” example to the official TypeScript SDK docs.

## 2. Safe browser execution

- **Task:** Run a real browser gate without exposing arbitrary command execution.
- **Steps:** Added Playwright Core, used the installed Chrome channel, limited the tool to two included release candidates, added target allowlisting, and captured screenshot plus console evidence.
- **Expected:** A named journey should run locally and produce bounded evidence.
- **Actual:** The browser flow worked, but ordinary missing browser assets such as a favicon initially appeared as console noise.
- **Severity:** Low.
- **Workaround:** Serve an explicit no-content favicon response and keep the runner's evidence scoped to the named journey.
- **Suggestion:** Provide a developer-agent example that demonstrates target allowlists, timeouts, output caps, and evidence redaction together.

## 3. Bedrock proof without weakening deterministic behavior

- **Task:** Add AWS value while preserving a reproducible release gate.
- **Steps:** Kept the verdict in a deterministic engine and passed the finished report to Bedrock only for narrative generation.
- **Expected:** AI should improve readability without becoming the source of truth.
- **Actual:** The separation is clean, but a judge needs configured AWS credentials to exercise the live Bedrock path.
- **Severity:** Medium.
- **Workaround:** The full deterministic product and MCP flow operate without credentials; the exact Bedrock runtime call remains visible and documented in source.
- **Suggestion:** Offer a short-lived hackathon test credential flow or hosted Bedrock sandbox with strict spend caps.
