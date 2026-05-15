import Anthropic from "@anthropic-ai/sdk";

export type IssueMatchResult = {
  score: number;
  summary: string;
  skillsNeeded: string[];
  difficulty: "easy" | "medium" | "hard";
};

const SYSTEM_PROMPT =
  "You are a senior engineer matching developers to open source issues. Respond with valid JSON only.";

export async function analyzeIssueMatch(input: {
  developerSkills: string[];
  issueTitle: string;
  issueBody: string;
  labels: string[];
}): Promise<IssueMatchResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not configured");
  }

  const client = new Anthropic({ apiKey });

  const message = await client.messages.create({
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

  const text =
    message.content[0]?.type === "text" ? message.content[0].text : "";
  const parsed = JSON.parse(text) as IssueMatchResult;

  return {
    score: Math.min(100, Math.max(0, Math.round(parsed.score))),
    summary: parsed.summary,
    skillsNeeded: parsed.skillsNeeded ?? [],
    difficulty: parsed.difficulty ?? "medium",
  };
}
