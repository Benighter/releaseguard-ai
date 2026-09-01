import {
  BedrockRuntimeClient,
  ConverseCommand,
} from "@aws-sdk/client-bedrock-runtime";
import type { ReleaseAssessment } from "./domain.js";

export async function addBedrockNarrative(
  assessment: ReleaseAssessment,
): Promise<ReleaseAssessment> {
  if (process.env.RELEASEGUARD_USE_BEDROCK !== "1") {
    return assessment;
  }

  const client = new BedrockRuntimeClient({
    region: process.env.AWS_REGION ?? "us-east-1",
  });
  const command = new ConverseCommand({
    modelId: process.env.BEDROCK_MODEL_ID ?? "amazon.nova-lite-v1:0",
    system: [
      {
        text: "You are ReleaseGuard AI. Explain only the supplied test evidence. Never invent a check, log, screenshot, cause, or release result. Return a compact release-manager briefing.",
      },
    ],
    messages: [
      {
        role: "user",
        content: [{ text: JSON.stringify(assessment) }],
      },
    ],
    inferenceConfig: { maxTokens: 420, temperature: 0.1 },
  });
  const response = await client.send(command);
  const aiNarrative = response.output?.message?.content
    ?.map((item) => ("text" in item ? item.text : ""))
    .filter(Boolean)
    .join("\n")
    .trim();

  return aiNarrative ? { ...assessment, aiNarrative } : assessment;
}
