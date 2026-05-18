import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { DifficultyBadge } from "@/components/difficulty-badge";
import { MatchScore } from "@/components/match-score";
import { SkillBadge } from "@/components/skill-badge";
import { Button } from "@/components/ui/button";
import { formatIssueAge, formatStars } from "@/lib/format";
import type { IssueSummary } from "@/types";

export type IssueAnalysis = {
  score: number;
  summary?: string;
  skillsNeeded: string[];
  difficulty?: "easy" | "medium" | "hard";
};

type IssueCardProps = {
  issue: IssueSummary & { stars?: number };
  analysis?: IssueAnalysis;
  onAnalyze?: () => void;
  onBookmark?: () => void;
  analyzing?: boolean;
  bookmarked?: boolean;
  aiAvailable?: boolean;
};

export function IssueCard({
  issue,
  analysis,
  onAnalyze,
  onBookmark,
  analyzing,
  bookmarked,
  aiAvailable = true,
}: IssueCardProps) {
  const skillsNeeded = analysis?.skillsNeeded ?? [];
  const matchScore = analysis?.score;
  return (
    <article className="rounded-xl border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            {matchScore != null && <MatchScore score={matchScore} />}
            {analysis?.difficulty && (
              <DifficultyBadge difficulty={analysis.difficulty} />
            )}
            {issue.language && <SkillBadge label={issue.language} />}
            {issue.stars != null && issue.stars > 0 && (
              <span className="text-xs text-muted-foreground">
                {formatStars(issue.stars)} stars
              </span>
            )}
            <span className="text-xs text-muted-foreground">
              {formatIssueAge(issue.createdAt)}
            </span>
          </div>
          <h3 className="text-base font-medium leading-snug">{issue.title}</h3>
          <p className="text-sm text-muted-foreground">{issue.repoName}</p>
          <div className="flex flex-wrap gap-1.5">
            {issue.labels.slice(0, 4).map((label) => (
              <SkillBadge key={label} label={label} className="bg-muted" />
            ))}
          </div>
          {analysis?.summary && (
            <p className="text-sm leading-relaxed text-muted-foreground">
              {analysis.summary}
            </p>
          )}
          {skillsNeeded.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Skills needed</p>
              <div className="flex flex-wrap gap-1.5">
                {skillsNeeded.map((skill) => (
                  <SkillBadge key={skill} label={skill} />
                ))}
              </div>
            </div>
          )}
        </div>
        <Link
          href={issue.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground hover:text-foreground"
          aria-label="Open issue on GitHub"
        >
          <ExternalLink className="size-4" />
        </Link>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {onAnalyze && (
          <Button
            size="sm"
            variant="outline"
            onClick={onAnalyze}
            disabled={analyzing || !aiAvailable}
            title={
              !aiAvailable
                ? "Add ANTHROPIC_API_KEY to backend/.env to enable AI matching"
                : undefined
            }
          >
            {analyzing
              ? "Analyzing..."
              : analysis
                ? "Re-analyze"
                : "AI match"}
          </Button>
        )}
        {onBookmark && (
          <Button size="sm" onClick={onBookmark} disabled={bookmarked}>
            {bookmarked ? "Saved" : "Save"}
          </Button>
        )}
      </div>
    </article>
  );
}
