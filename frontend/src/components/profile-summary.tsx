"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { SkillBadge } from "@/components/skill-badge";

type Summary = {
  username: string;
  languages: string[];
  skillLevel: string;
  email: string | null;
  bookmarks: {
    interested: number;
    applying: number;
    submitted: number;
    total: number;
  };
  lastDigest: {
    sentAt: string;
    issueCount: number;
    openedAt: string | null;
  } | null;
};

export function ProfileSummary() {
  const [summary, setSummary] = useState<Summary | null>(null);

  useEffect(() => {
    fetch("/api/profile/summary")
      .then((res) => res.json())
      .then((data) => {
        if (!data.error) setSummary(data);
      })
      .catch(() => {});
  }, []);

  if (!summary) return null;

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <div className="rounded-xl border bg-card p-4">
        <p className="text-xs text-muted-foreground">Bookmarks</p>
        <p className="mt-1 text-2xl font-semibold">{summary.bookmarks.total}</p>
        <Link href="/bookmarks" className="mt-2 inline-block text-xs underline">
          View all
        </Link>
      </div>
      <div className="rounded-xl border bg-card p-4">
        <p className="text-xs text-muted-foreground">In progress</p>
        <p className="mt-1 text-2xl font-semibold">
          {summary.bookmarks.applying}
        </p>
        <p className="mt-2 text-xs text-muted-foreground">applying now</p>
      </div>
      <div className="rounded-xl border bg-card p-4">
        <p className="text-xs text-muted-foreground">Skill level</p>
        <p className="mt-1 text-lg font-semibold capitalize">
          {summary.skillLevel}
        </p>
        {summary.languages[0] && (
          <div className="mt-2">
            <SkillBadge label={summary.languages[0]} className="text-xs" />
          </div>
        )}
      </div>
    </div>
  );
}
