"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";
import {
  BookmarkCard,
  type BookmarkItem,
} from "@/components/bookmark-card";
import { Button } from "@/components/ui/button";

type StatusFilter = "" | "interested" | "applying" | "submitted";

type BookmarkStats = {
  interested: number;
  applying: number;
  submitted: number;
  total: number;
};

const FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "", label: "All" },
  { value: "interested", label: "Interested" },
  { value: "applying", label: "Applying" },
  { value: "submitted", label: "Submitted" },
];

export default function BookmarksPage() {
  const { status } = useSession();
  const [filter, setFilter] = useState<StatusFilter>("");
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [stats, setStats] = useState<BookmarkStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadBookmarks = useCallback(async (statusFilter: StatusFilter) => {
    setLoading(true);
    setError(null);
    try {
      const params = statusFilter ? `?status=${statusFilter}` : "";
      const [listRes, statsRes] = await Promise.all([
        fetch(`/api/bookmarks${params}`),
        fetch("/api/bookmarks/stats"),
      ]);
      const list = await listRes.json();
      const counts = await statsRes.json();
      if (!listRes.ok) throw new Error(list.error ?? "Failed to load");
      setBookmarks(Array.isArray(list) ? list : []);
      if (statsRes.ok) setStats(counts);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status !== "authenticated") {
      setLoading(false);
      return;
    }
    void loadBookmarks(filter);
  }, [status, filter, loadBookmarks]);

  async function updateStatus(id: string, nextStatus: string) {
    const res = await fetch(`/api/bookmarks/${id}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });
    if (!res.ok) return;
    void loadBookmarks(filter);
  }

  async function deleteBookmark(id: string) {
    if (!confirm("Remove this bookmark?")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/bookmarks/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to remove");
      void loadBookmarks(filter);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove");
    } finally {
      setDeletingId(null);
    }
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
          Track issues from interested → applying → submitted.
        </p>
        {stats && stats.total > 0 && (
          <p className="mt-1 text-xs text-muted-foreground">
            {stats.interested} interested · {stats.applying} applying ·{" "}
            {stats.submitted} submitted
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((item) => (
          <Button
            key={item.value || "all"}
            size="sm"
            variant={filter === item.value ? "default" : "outline"}
            onClick={() => setFilter(item.value)}
          >
            {item.label}
          </Button>
        ))}
      </div>

      {error && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      {loading && (
        <p className="text-sm text-muted-foreground">Loading bookmarks...</p>
      )}

      <div className="grid gap-4">
        {bookmarks.map((bookmark) => (
          <BookmarkCard
            key={bookmark.id}
            bookmark={bookmark}
            onStatusChange={updateStatus}
            onDelete={deleteBookmark}
            deleting={deletingId === bookmark.id}
          />
        ))}
        {!loading && bookmarks.length === 0 && (
          <p className="text-sm text-muted-foreground">
            {filter
              ? `No bookmarks in "${filter}".`
              : "No bookmarks yet. Save issues from the feed."}{" "}
            {!filter && (
              <Link href="/feed" className="underline">
                Go to feed
              </Link>
            )}
          </p>
        )}
      </div>
    </div>
  );
}
