import Link from "next/link";
import { SkillBadge } from "@/components/skill-badge";
import { formatStars } from "@/lib/format";

export type RepoItem = {
  name: string;
  url: string;
  stars: number;
  languages: string[];
};

export function RepoList({ repos }: { repos: RepoItem[] }) {
  if (repos.length === 0) return null;

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">Recent repositories</p>
      <ul className="space-y-2">
        {repos.map((repo) => (
          <li
            key={repo.url}
            className="flex flex-col gap-2 rounded-lg border bg-background p-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <Link
                href={repo.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium hover:underline"
              >
                {repo.name}
              </Link>
              <p className="text-xs text-muted-foreground">
                {formatStars(repo.stars)} stars
              </p>
            </div>
            <div className="flex flex-wrap gap-1">
              {repo.languages.slice(0, 3).map((lang) => (
                <SkillBadge key={lang} label={lang} className="text-xs" />
              ))}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
