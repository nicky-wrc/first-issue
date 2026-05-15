import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { MatchScore } from "@/components/match-score";
import { SkillBadge } from "@/components/skill-badge";
import { Button } from "@/components/ui/button";
import type { IssueSummary } from "@/types";

type IssueCardProps = {
  issue: IssueSummary & { stars?: number };
  matchScore?: number;
  skillsNeeded?: string[];
  onAnalyze?: () => void;
  onBookmark?: () => void;
  analyzing?: boolean;
};

export function IssueCard({
  issue,
  skillsNeeded = [],
  matchScore,
  onAnalyze,
  onBookmark,
  analyzing,
}: IssueCardProps) {
  return (
    <article className="rounded-xl border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            {matchScore != null && <MatchScore score={matchScore} />}
            {issue.language && <SkillBadge label={issue.language} />}
          </div>
          <h3 className="text-base font-medium leading-snug">{issue.title}</h3>
          <p className="text-sm text-muted-foreground">{issue.repoName}</p>
          <div className="flex flex-wrap gap-1.5">
            {issue.labels.slice(0, 4).map((label) => (
              <SkillBadge key={label} label={label} className="bg-muted" />
            ))}
          </div>
          {skillsNeeded.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {skillsNeeded.map((skill) => (
                <SkillBadge key={skill} label={skill} />
              ))}
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
          <Button size="sm" variant="outline" onClick={onAnalyze} disabled={analyzing}>
            {analyzing ? "Analyzing..." : "AI match"}
          </Button>
        )}
        {onBookmark && (
          <Button size="sm" onClick={onBookmark}>
            Save
          </Button>
        )}
      </div>
    </article>
  );
}
