import Anthropic from "@anthropic-ai/sdk";

export type IssueMatchResult = {
  score: number;
  summary: string;
  skillsNeeded: string[];
  difficulty: "easy" | "medium" | "hard";
};

const SYSTEM_PROMPT =
  "You are a senior engineer matching developers to open source issues. Respond with valid JSON only.";

export function isAiConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY?.trim());
}

function mapAnthropicError(error: unknown): Error {
  const message =
    error instanceof Error ? error.message : "Anthropic API request failed";
  const lower = message.toLowerCase();

  if (
    lower.includes("credit balance") ||
    lower.includes("insufficient") ||
    lower.includes("billing")
  ) {
    const err = new Error(
      "Anthropic account has no credits. Add billing at console.anthropic.com → Plans & Billing.",
    );
    (err as Error & { code: string }).code = "AI_INSUFFICIENT_CREDITS";
    return err;
  }

  if (lower.includes("invalid x-api-key") || lower.includes("authentication")) {
    const err = new Error("Invalid ANTHROPIC_API_KEY in backend/.env");
    (err as Error & { code: string }).code = "AI_INVALID_KEY";
    return err;
  }

  return error instanceof Error ? error : new Error(message);
}

function parseModelJson(text: string): IssueMatchResult {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const jsonText = fenced ? fenced[1].trim() : trimmed;
  return JSON.parse(jsonText) as IssueMatchResult;
}

export async function analyzeIssueMatch(input: {
  developerSkills: string[];
  issueTitle: string;
  issueBody: string;
  labels: string[];
}): Promise<IssueMatchResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) {
    const err = new Error("AI matching is not configured on the server");
    (err as Error & { code: string }).code = "AI_NOT_CONFIGURED";
    throw err;
  }

  const client = new Anthropic({ apiKey });

  let message;
  try {
    message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 512,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: JSON.stringify({
            developerSkills: input.developerSkills,
            issueTitle: input.issueTitle,
            issueBody: input.issueBody.slice(0, 800),
            labels: input.labels,
            responseFormat: {
              score: "0-100 integer",
              summary: "short paragraph",
              skillsNeeded: ["string"],
              difficulty: "easy | medium | hard",
            },
          }),
        },
      ],
    });
  } catch (error) {
    throw mapAnthropicError(error);
  }

  const text =
    message.content[0]?.type === "text" ? message.content[0].text : "";
  const parsed = parseModelJson(text);

  return {
    score: Math.min(100, Math.max(0, Math.round(parsed.score))),
    summary: parsed.summary,
    skillsNeeded: parsed.skillsNeeded ?? [],
    difficulty: parsed.difficulty ?? "medium",
  };
}
