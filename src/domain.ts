export type CheckStatus = "passed" | "warning" | "failed";
export type CheckCategory =
  | "build"
  | "unit"
  | "api"
  | "browser"
  | "visual"
  | "performance"
  | "security";

export interface ReleaseCheck {
  name: string;
  category: CheckCategory;
  status: CheckStatus;
  durationMs: number;
  summary: string;
  evidence?: string;
}

export interface ReleaseAssessmentInput {
  version: string;
  commit: string;
  environment: string;
  checks: ReleaseCheck[];
}

export interface FailureGroup {
  id: string;
  category: CheckCategory;
  title: string;
  severity: "critical" | "high" | "medium";
  likelyCause: string;
  checks: string[];
  evidence: string[];
}

export interface ReleaseAssessment {
  assessmentId: string;
  version: string;
  commit: string;
  environment: string;
  recommendation: "SHIP" | "REVIEW" | "HOLD";
  confidence: number;
  riskScore: number;
  summary: string;
  checks: ReleaseCheck[];
  totals: {
    passed: number;
    warning: number;
    failed: number;
    durationMs: number;
  };
  failureGroups: FailureGroup[];
  createdAt: string;
  aiNarrative?: string;
  artifacts?: {
    screenshotUrl?: string;
    logs: string[];
  };
}
