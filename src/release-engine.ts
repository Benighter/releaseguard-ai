import { createHash, randomUUID } from "node:crypto";
import type {
  CheckCategory,
  FailureGroup,
  ReleaseAssessment,
  ReleaseAssessmentInput,
  ReleaseCheck,
} from "./domain.js";

const causeByCategory: Record<CheckCategory, string> = {
  build: "The release artifact or dependency graph changed incompatibly.",
  unit: "A code-path contract changed without a matching implementation or test update.",
  api: "The candidate and deployed API contract disagree on shape, status, or authorization.",
  browser: "A user-critical browser flow regressed in the release candidate.",
  visual: "The rendered layout moved outside the approved visual baseline.",
  performance: "The candidate exceeded a latency or resource budget.",
  security: "A release security policy or control is missing or failing.",
};

function groupFailures(checks: ReleaseCheck[]): FailureGroup[] {
  const groups = new Map<CheckCategory, ReleaseCheck[]>();

  for (const check of checks.filter((item) => item.status !== "passed")) {
    const current = groups.get(check.category) ?? [];
    current.push(check);
    groups.set(check.category, current);
  }

  return Array.from(groups.entries()).map(([category, related]) => {
    const failed = related.filter((item) => item.status === "failed").length;
    const severity = failed > 1 || ["build", "api", "browser", "security"].includes(category)
      ? "critical"
      : failed === 1
        ? "high"
        : "medium";
    const digest = createHash("sha256")
      .update(`${category}:${related.map((item) => item.name).sort().join("|")}`)
      .digest("hex")
      .slice(0, 8)
      .toUpperCase();

    return {
      id: `RG-${digest}`,
      category,
      title: `${category[0].toUpperCase()}${category.slice(1)} regression cluster`,
      severity,
      likelyCause: causeByCategory[category],
      checks: related.map((item) => item.name),
      evidence: related.map((item) => item.evidence ?? item.summary),
    } satisfies FailureGroup;
  });
}

export function assessRelease(input: ReleaseAssessmentInput): ReleaseAssessment {
  if (input.checks.length === 0) {
    throw new Error("At least one release check is required.");
  }

  const totals = input.checks.reduce(
    (result, check) => {
      result[check.status] += 1;
      result.durationMs += check.durationMs;
      return result;
    },
    { passed: 0, warning: 0, failed: 0, durationMs: 0 },
  );
  const failureGroups = groupFailures(input.checks);
  const criticalGroups = failureGroups.filter((group) => group.severity === "critical").length;
  const riskScore = Math.min(100, totals.failed * 28 + totals.warning * 9 + criticalGroups * 10);
  const recommendation = totals.failed > 0 ? "HOLD" : totals.warning > 0 ? "REVIEW" : "SHIP";
  const confidence = Math.min(99, Math.round(62 + input.checks.length * 4 + totals.failed * 2));
  const summary = recommendation === "SHIP"
    ? `All ${input.checks.length} checks passed. Version ${input.version} is ready for release.`
    : recommendation === "REVIEW"
      ? `${totals.warning} warning${totals.warning === 1 ? "" : "s"} need human review before version ${input.version} ships.`
      : `${totals.failed} failed check${totals.failed === 1 ? "" : "s"} block version ${input.version}; ${failureGroups.length} related regression cluster${failureGroups.length === 1 ? "" : "s"} identified.`;

  return {
    assessmentId: randomUUID(),
    version: input.version,
    commit: input.commit,
    environment: input.environment,
    recommendation,
    confidence,
    riskScore,
    summary,
    checks: input.checks,
    totals,
    failureGroups,
    createdAt: new Date().toISOString(),
  };
}

export function demoAssessmentInput(): ReleaseAssessmentInput {
  return {
    version: "2.8.0-rc.1",
    commit: "b7e41d9",
    environment: "staging",
    checks: [
      {
        name: "Production build",
        category: "build",
        status: "passed",
        durationMs: 4820,
        summary: "TypeScript build completed without errors.",
        evidence: "dist/ generated; 0 compiler errors",
      },
      {
        name: "Unit test suite",
        category: "unit",
        status: "passed",
        durationMs: 2170,
        summary: "184 of 184 unit tests passed.",
        evidence: "184 passed, 0 failed",
      },
      {
        name: "Checkout API contract",
        category: "api",
        status: "failed",
        durationMs: 412,
        summary: "POST /checkout returned 500 instead of 201.",
        evidence: "requestId=req_28F; expected=201; actual=500; TypeError: currencyCode is undefined",
      },
      {
        name: "Guest checkout journey",
        category: "browser",
        status: "failed",
        durationMs: 8110,
        summary: "The Place order button remained disabled after valid payment details.",
        evidence: "playwright/guest-checkout/error-context.md; screenshot=guest-checkout-failed.png",
      },
      {
        name: "Account sign-in journey",
        category: "browser",
        status: "passed",
        durationMs: 3650,
        summary: "Sign-in and account navigation completed.",
        evidence: "playwright/account-sign-in/trace.zip",
      },
      {
        name: "Largest contentful paint",
        category: "performance",
        status: "warning",
        durationMs: 1290,
        summary: "LCP increased to 2.7 seconds against a 2.5 second budget.",
        evidence: "baseline=2.2s; candidate=2.7s; delta=+22.7%",
      },
    ],
  };
}
