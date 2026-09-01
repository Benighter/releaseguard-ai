## Inspiration

Release decisions are often scattered across build output, API failures, browser traces, screenshots, and chat messages. The difficult part is not producing another test result. It is turning several pieces of evidence into one answer a developer can defend: **ship, review, or hold**.

ReleaseGuard AI was created to answer a direct question: “Is version 2.8 safe to release?”

## What it does

ReleaseGuard is a self-hosted Model Context Protocol server and release dashboard. An MCP client such as Alexa+ can ask it to assess a candidate. ReleaseGuard runs narrowly scoped checks, captures evidence, groups related regressions, and returns one of three recommendations:

- **SHIP** when every supplied release gate passes.
- **REVIEW** when evidence contains warnings that need human judgment.
- **HOLD** when a failed gate blocks the release.

The included demo uses two real release candidates. Version `2.8.0-rc.1` has a seeded checkout regression: its API returns HTTP 500 and the browser's Place order button remains disabled. ReleaseGuard launches Chrome through Playwright, runs the journey, captures the console and screenshot, groups the API and browser failures, and returns HOLD. Version `2.8.0-rc.2` fixes the regression and returns SHIP after all four checks pass.

## How it was built

The project is written in TypeScript on Node.js. The MCP server uses the official Model Context Protocol TypeScript SDK and exposes Streamable HTTP at `/mcp`, with compatibility for MCP `2025-11-25`. Its two MCP tools are:

- `assess_release` for structured evidence supplied by an external CI or agent workflow.
- `run_demo_release` for the included bounded API and Playwright demonstration.

The deterministic decision engine calculates the verdict, risk score, stable finding IDs, and related failure clusters. Amazon Bedrock is integrated through the AWS SDK `Converse` API as an optional evidence-grounded narrative layer. Bedrock never changes the deterministic verdict and is instructed not to invent checks, logs, screenshots, or causes.

Security boundaries are part of the design. The MCP surface does not accept arbitrary shell commands. Release targets must be localhost or explicitly allowlisted. The runner enforces timeouts, captures only named evidence, validates HTTP origins, and never deploys a release.

## Challenges

The first challenge was supporting the hackathon's required MCP revision while the official TypeScript SDK now serves both the 2025 legacy era and the newer 2026 protocol era. A real client smoke test now proves that the server negotiates `2025-11-25`.

The second challenge was keeping AI useful without letting it become the source of truth. ReleaseGuard separates deterministic gating from optional model-written explanation. That makes a recommendation reproducible even when AWS credentials are unavailable.

The third challenge was showing an end-to-end regression rather than a mocked dashboard. The final demo contains a real HTTP failure, a real disabled browser control, Playwright console capture, screenshots, and a corrected candidate that reaches SHIP.

## Accomplishments

- Real MCP `2025-11-25` handshake over Streamable HTTP.
- Real Playwright and API evidence in the release decision.
- A complete HOLD-to-SHIP demonstration.
- Stable failure grouping with cited evidence.
- Bounded targets and no arbitrary command execution.
- Optional Amazon Bedrock narrative that cannot override the gate.

## What was learned

Release automation becomes more trustworthy when the agent explains less from intuition and more from artifacts. Stable finding IDs, screenshots, raw statuses, and explicit decision rules made the result clearer than a free-form model answer.

## What's next

The next adapters will connect ReleaseGuard to named CI providers and repositories, add baseline image comparison, and store signed run manifests in Amazon S3. AgentCore is a natural deployment path for durable, authenticated agent execution once the local and Streamable HTTP flows are complete.
