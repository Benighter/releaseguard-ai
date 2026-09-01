# ReleaseGuard AI

ReleaseGuard AI is an evidence-first release readiness agent for the **Alexa+ primary track** and **AWS Builder mini-challenge** of the 2026 Amazon Build, Ship, Shape Hackathon.

[Watch the 1:52 demo](https://youtu.be/8FaILFxt_Do) · [View the submitted Devpost project](https://devpost.com/software/releaseguard-ai-8gri2d)

Ask: “Is version 2.8 safe to release?” ReleaseGuard runs or accepts concrete build, API, browser, visual, performance, and security evidence; groups related regressions; and returns a defensible `SHIP`, `REVIEW`, or `HOLD` recommendation.

![ReleaseGuard AI architecture](docs/architecture.svg)

## What works

- Self-hosted MCP server over Streamable HTTP at `/mcp`
- MCP 2025-11-25 compatibility, plus the SDK's 2026 protocol support
- `assess_release` MCP tool with structured evidence and output
- `run_demo_release` MCP tool with a real allowlisted API and Playwright journey
- Deterministic failure clustering and release decision
- Evidence dashboard with a real HOLD-to-SHIP demo
- Optional Amazon Bedrock narrative through the AWS SDK `Converse` API
- Origin validation on the MCP endpoint
- Target allowlisting, browser timeout, console capture, and screenshot evidence

ReleaseGuard deliberately does not expose arbitrary shell execution through MCP. New repositories and CI providers are added as reviewed project adapters.

## Run locally

Requirements: Node.js 20 or newer.

```bash
npm install
npm run dev
```

Open `http://127.0.0.1:3210`.

1. Select **Run failing RC.1**. A real API check receives HTTP 500, Playwright finds the checkout button disabled, and ReleaseGuard returns `HOLD`.
2. Select **Verify fixed RC.2**. The API returns HTTP 201, the browser completes checkout, and ReleaseGuard returns `SHIP`.

MCP endpoint: `http://127.0.0.1:3210/mcp`

The server exposes:

- `assess_release` — assess structured evidence from CI or another agent.
- `run_demo_release` — run the included, bounded release-candidate demo.

## Optional Bedrock integration

ReleaseGuard's verdict is deterministic and never delegated to a model. When enabled, Amazon Bedrock adds a concise narrative grounded in the generated report.

1. Copy `.env.example` values into your environment.
2. Configure AWS credentials through the normal AWS credential chain.
3. Set `RELEASEGUARD_USE_BEDROCK=1` and a model available to your account.

The runtime integration is implemented in `src/bedrock.ts` with `BedrockRuntimeClient` and `ConverseCommand`.

## Verify

```bash
npm run check
npm start
# in another terminal
npm run smoke:mcp
```

## Safety model

- Decisions cite only checks supplied to the assessment.
- No arbitrary commands, repository writes, deployment actions, or release actions are exposed.
- Browser/build execution uses named project adapters and explicit budgets.
- A `SHIP` recommendation is advisory; ReleaseGuard does not publish a release.

## Hackathon requirements tracked

- Primary: Alexa+ — self-hosted MCP server, MCP 2025-11-25+, Streamable HTTP
- Mini-challenge: AWS Builder — documented Amazon Bedrock runtime integration
- Apache-2.0 open-source license
- Architecture diagram and verified screenshots in `docs/`
- Product feedback and friction log in `docs/`

## License

Apache-2.0. See `LICENSE`.
