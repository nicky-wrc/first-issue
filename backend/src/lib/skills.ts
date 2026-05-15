import type { SkillLevel } from "@prisma/client";

export function inferSkillLevel(languageCount: number, repoCount: number): SkillLevel {
  if (languageCount >= 6 || repoCount >= 20) return "advanced";
  if (languageCount >= 3 || repoCount >= 8) return "intermediate";
  return "beginner";
}
