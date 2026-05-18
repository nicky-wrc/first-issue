import Link from "next/link";
import { ExternalLink, Trash2 } from "lucide-react";
import { MatchScore } from "@/components/match-score";
import { SkillBadge } from "@/components/skill-badge";
import { Button } from "@/components/ui/button";
import { formatRelativeDate } from "@/lib/format";

export type BookmarkItem = {
  id: string;
  issueTitle: string;
  issueUrl: string;
  repoName: string;
  language: string | null;
  status: string;
  matchScore: number | null;
  updatedAt: string;
};

const STATUS_LABELS: Record<string, string> = {
  interested: "Interested",
  applying: "Applying",
  submitted: "Submitted",
};

type BookmarkCardProps = {
  bookmark: BookmarkItem;
  onStatusChange: (id: string, status: string) => void;
  onDelete: (id: string) => void;
  deleting?: boolean;
};

export function BookmarkCard({
  bookmark,
  onStatusChange,
  onDelete,
  deleting,
}: BookmarkCardProps) {
  return (
    <article className="rounded-xl border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            {bookmark.matchScore != null && (
              <MatchScore score={bookmark.matchScore} />
            )}
            {bookmark.language && <SkillBadge label={bookmark.language} />}
            <span className="text-xs text-muted-foreground">
              Updated {formatRelativeDate(bookmark.updatedAt)}
            </span>
          </div>
          <h3 className="font-medium leading-snug">{bookmark.issueTitle}</h3>
          <p className="text-sm text-muted-foreground">{bookmark.repoName}</p>
        </div>
        <Link
          href={bookmark.issueUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 text-muted-foreground hover:text-foreground"
          aria-label="Open on GitHub"
        >
          <ExternalLink className="size-4" />
        </Link>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {(["interested", "applying", "submitted"] as const).map((s) => (
          <Button
            key={s}
            size="sm"
            variant={bookmark.status === s ? "default" : "outline"}
            onClick={() => onStatusChange(bookmark.id, s)}
          >
            {STATUS_LABELS[s]}
          </Button>
        ))}
        <Button
          size="sm"
          variant="ghost"
          className="ml-auto text-destructive hover:text-destructive"
          disabled={deleting}
          onClick={() => onDelete(bookmark.id)}
        >
          <Trash2 className="mr-1 size-3.5" />
          {deleting ? "Removing..." : "Remove"}
        </Button>
      </div>
    </article>
  );
}
