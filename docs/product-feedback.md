# Amazon developer product feedback

## Tools and services used

### Amazon Bedrock through AWS SDK for JavaScript v3

ReleaseGuard uses `BedrockRuntimeClient` and `ConverseCommand` to turn the deterministic release report into a concise release-manager narrative. The model receives the complete structured report and a strict instruction not to invent checks, logs, screenshots, causes, or results. Bedrock does not calculate or modify the SHIP, REVIEW, or HOLD verdict.

### Amazon Developer and Alexa+ materials

The Alexa+ track documentation established the self-hosted MCP direction. ReleaseGuard implements a Streamable HTTP MCP endpoint and proves the required `2025-11-25` negotiation with the official client SDK.

## What worked well

- The AWS SDK v3 command model made the Bedrock integration isolated and easy to audit.
- The `Converse` request shape supports a clean separation between system grounding rules and the structured release report.
- The hackathon rules clearly state the required MCP revision and transport, which made compatibility testable instead of implied.
- Alexa+'s acceptance of self-hosted MCP servers makes it possible to build a useful developer tool without requiring a consumer device during early development.

## What needs work

- The Alexa+ submission path would benefit from one end-to-end reference showing an MCP `2025-11-25` Streamable HTTP server connected to an Alexa+ test surface.
- Documentation should distinguish more explicitly between a standalone self-hosted MCP submission and the optional simulated Alexa+ experience.
- A short Bedrock example focused on evidence-grounded summaries with structured JSON input would reduce onboarding time for this kind of agent.

## Onboarding experience

Getting from zero to a deterministic local MCP tool was straightforward after the transport and protocol-era behavior were understood. The most time-consuming part was verifying exactly how the current TypeScript SDK negotiates the required 2025 revision while also supporting the newer 2026 era.

## Would I build with these services again?

**Yes.** MCP provides a portable tool interface, and Bedrock adds a useful explanation layer without forcing the model to own the release decision. This combination fits systems where evidence, auditability, and bounded execution matter.

## Feature request

**Important:** Provide an official Alexa+ MCP conformance checker that accepts a public endpoint, confirms protocol revision and transport behavior, lists exposed tools, and produces a shareable report for hackathon judges.
