"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { MatchScore } from "@/components/match-score";
import { Button } from "@/components/ui/button";

type Bookmark = {
  id: string;
  issueTitle: string;
  issueUrl: string;
  repoName: string;
  status: string;
  matchScore: number | null;
};

export default function BookmarksPage() {
  const { status } = useSession();
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status !== "authenticated") {
      setLoading(false);
      return;
    }
    fetch("/api/bookmarks")
      .then((res) => res.json())
      .then((data) => setBookmarks(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, [status]);

  async function updateStatus(id: string, nextStatus: string) {
    await fetch(`/api/bookmarks/${id}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });
    setBookmarks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, status: nextStatus } : b)),
    );
  }

  if (status === "unauthenticated") {
    return (
      <p className="text-muted-foreground">
        <Link href="/" className="underline">
          Sign in
        </Link>{" "}
        to manage bookmarks.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Bookmarks</h1>
        <p className="text-sm text-muted-foreground">
          Track issues you want to work on.
        </p>
      </div>

      {loading && <p className="text-sm text-muted-foreground">Loading...</p>}

      <div className="grid gap-4">
        {bookmarks.map((bookmark) => (
          <article key={bookmark.id} className="rounded-xl border bg-card p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="mb-1 flex items-center gap-2">
                  {bookmark.matchScore != null && (
                    <MatchScore score={bookmark.matchScore} />
                  )}
                  <span className="text-xs capitalize text-muted-foreground">
                    {bookmark.status}
                  </span>
                </div>
                <h3 className="font-medium">{bookmark.issueTitle}</h3>
                <p className="text-sm text-muted-foreground">
                  {bookmark.repoName}
                </p>
                <a
                  href={bookmark.issueUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-block text-sm underline"
                >
                  Open on GitHub
                </a>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {(["interested", "applying", "submitted"] as const).map((s) => (
                <Button
                  key={s}
                  size="sm"
                  variant={bookmark.status === s ? "default" : "outline"}
                  onClick={() => updateStatus(bookmark.id, s)}
                >
                  {s}
                </Button>
              ))}
            </div>
          </article>
        ))}
        {!loading && bookmarks.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No bookmarks yet. Save issues from the feed.
          </p>
        )}
      </div>
    </div>
  );
}
