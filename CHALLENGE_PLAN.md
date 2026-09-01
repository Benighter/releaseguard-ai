# ReleaseGuard AI — challenge plan

## Positioning

ReleaseGuard AI answers a release-manager question: **“Is this exact candidate safe to ship?”**

It is deliberately distinct from a general website scanner. Every verdict is tied to a release version, commit, environment, run provenance, and collected evidence. The agent will orchestrate named checks, correlate failures across test layers, and produce a release gate rather than a general site-quality score.

## Track fit

- **Alexa+ primary track:** self-hosted MCP server over Streamable HTTP, compatible with MCP 2025-11-25 or later.
- **AWS Builder mini-challenge:** Amazon Bedrock produces the evidence-grounded release-manager narrative; the deterministic engine owns the verdict.
- **Open Source mini-challenge:** optional only if the final project meets every required contribution field. A project can enter multiple mini-challenges but can win at most one mini-challenge prize.

## Build sequence

### 1. Evidence and MCP foundation — complete

- Release evidence schema
- Deterministic SHIP / REVIEW / HOLD engine
- Failure clustering
- Streamable HTTP MCP endpoint and `assess_release` tool
- Optional Bedrock `Converse` integration
- Visible dashboard demo
- Unit tests and MCP protocol smoke test

### 2. Controlled project runner

- Allowlisted project adapters stored in configuration
- Build and test subprocess budgets: timeout, output cap, and no arbitrary MCP-provided command
- API assertions with redacted request/response evidence
- Playwright journeys with screenshot, trace, and log capture
- Immutable run manifest containing version, commit, environment, timestamps, and tool versions

### 3. Regression intelligence

- Baseline-versus-candidate comparison
- Screenshot difference scoring and evidence thumbnails
- Error fingerprinting across unit, API, browser, and application logs
- Bedrock narrative constrained to cited finding IDs
- Human override with an audit note; no automatic deployment

### 4. AWS judging proof

- Run a genuine Bedrock-backed assessment using hackathon credits
- Record service, region, model ID, request ID, latency, and cost estimate without exposing credentials
- Add architecture diagram and product feedback/friction log
- Decide whether Strands adds real orchestration value before including it; do not add unused SDK references

### 5. Submission package

- Public Apache-2.0 GitHub repository with one-command setup
- Public demo deployment or judge-ready run instructions
- Public YouTube/Vimeo demo under three minutes
- Track and mini-challenge responses
- Product feedback for every Amazon tool used
- Final review before accepting submission terms or publishing

## Demo story

1. Ask: “Is version 2.8 safe to release?”
2. Show the exact commit and staging candidate.
3. Run build, unit, API, and Playwright checks.
4. Show two symptoms collapsing into related regression clusters.
5. Return `HOLD`, risk score, likely cause, and evidence links.
6. Fix the seeded regression, rerun, and show `SHIP` with a clean audit trail.

## Non-negotiable safety bounds

- No arbitrary shell command supplied through MCP.
- No secrets in reports, screenshots, logs, source control, or the demo.
- No deployment or release action from a recommendation.
- No claim that a check ran without captured evidence.
- No scanning targets outside explicitly configured projects and environments.
