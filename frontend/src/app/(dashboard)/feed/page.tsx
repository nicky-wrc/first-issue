"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  FilterPanel,
  type IssueFilters,
} from "@/components/filter-panel";
import { IssueCard, type IssueAnalysis } from "@/components/issue-card";
import { LanguageChips } from "@/components/language-chips";
import { Button } from "@/components/ui/button";
import type { IssueSummary } from "@/types";

type IssueResult = IssueSummary & { stars: number };

const DEFAULT_FILTERS: IssueFilters = {
  language: "",
  label: "good-first-issue",
  minStars: "",
  ageDays: "",
};

function buildParams(filters: IssueFilters, cursor?: string | null) {
  const params = new URLSearchParams({ label: filters.label });
  if (filters.language) params.set("lang", filters.language);
  if (filters.minStars) params.set("minStars", filters.minStars);
  if (filters.ageDays) params.set("ageDays", filters.ageDays);
  if (cursor) params.set("after", cursor);
  return params;
}

export default function FeedPage() {
  const { status } = useSession();
  const [filters, setFilters] = useState<IssueFilters>(DEFAULT_FILTERS);
  const [profileLanguages, setProfileLanguages] = useState<string[]>([]);
  const [issues, setIssues] = useState<IssueResult[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [savedUrls, setSavedUrls] = useState<Set<string>>(new Set());
  const [analysisByUrl, setAnalysisByUrl] = useState<
    Record<string, IssueAnalysis>
  >({});
  const [aiAvailable, setAiAvailable] = useState(true);
  const [hasSearched, setHasSearched] = useState(false);
  const initDone = useRef(false);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/issues/ai-status")
      .then((res) => res.json())
      .then((data) => setAiAvailable(Boolean(data.configured)))
      .catch(() => setAiAvailable(false));
  }, [status]);

  const searchIssues = useCallback(
    async (
      append = false,
      cursor?: string | null,
      overrideFilters?: IssueFilters,
    ) => {
      const active = overrideFilters ?? filters;
      if (append) setLoadingMore(true);
      else setLoading(true);
      setError(null);

      try {
        const res = await fetch(
          `/api/issues?${buildParams(active, cursor)}`,
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Failed to load issues");

        setTotal(data.total ?? null);
        setNextCursor(data.nextCursor ?? null);
        setHasNextPage(Boolean(data.hasNextPage));
        setIssues((prev) =>
          append ? [...prev, ...(data.issues as IssueResult[])] : data.issues,
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [filters],
  );

  useEffect(() => {
    if (status !== "authenticated" || initDone.current) return;
    initDone.current = true;

    async function init() {
      const [profileRes, urlsRes] = await Promise.all([
        fetch("/api/profile"),
        fetch("/api/bookmarks/urls"),
      ]);
      const profile = await profileRes.json();
      const urlsData = await urlsRes.json();

      if (Array.isArray(urlsData.urls)) {
        setSavedUrls(new Set(urlsData.urls as string[]));
      }

      const langs: string[] = profile.languages ?? [];
      setProfileLanguages(langs);

      const initialFilters =
        langs.length > 0
          ? { ...DEFAULT_FILTERS, language: langs[0] }
          : DEFAULT_FILTERS;
      setFilters(initialFilters);
      await searchIssues(false, null, initialFilters);
      setHasSearched(true);
    }

    void init();
  }, [status, searchIssues]);

  async function analyzeIssue(issue: IssueResult) {
    setAnalyzingId(issue.id);
    try {
      const res = await fetch("/api/issues/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          issueUrl: issue.url,
          issueTitle: issue.title,
          labels: issue.labels,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.code === "AI_NOT_CONFIGURED") setAiAvailable(false);
        if (data.code === "AI_INSUFFICIENT_CREDITS") setAiAvailable(false);
        throw new Error(data.error ?? "Analysis failed");
      }
      setAnalysisByUrl((prev) => ({
        ...prev,
        [issue.url]: {
          score: data.score,
          summary: data.summary,
          skillsNeeded: data.skillsNeeded ?? [],
          difficulty: data.difficulty,
        },
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setAnalyzingId(null);
    }
  }

  async function bookmarkIssue(issue: IssueResult) {
    const score = analysisByUrl[issue.url]?.score;
    const res = await fetch("/api/bookmarks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        issueUrl: issue.url,
        issueTitle: issue.title,
        repoName: issue.repoName,
        language: issue.language,
        matchScore: score,
      }),
    });
    if (res.ok) {
      setSavedUrls((prev) => new Set(prev).add(issue.url));
    }
  }

  function applyLanguage(lang: string) {
    const next = { ...filters, language: lang };
    setFilters(next);
    setHasSearched(true);
    void searchIssues(false, null, next);
  }

  if (status === "unauthenticated") {
    return (
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold">Issue feed</h1>
        <p className="text-muted-foreground">
          Please{" "}
          <Link href="/" className="underline">
            sign in with GitHub
          </Link>{" "}
          to browse issues.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Issue feed</h1>
        <p className="text-sm text-muted-foreground">
          Issues matched to your GitHub languages — change filters anytime.
        </p>
      </div>

      {!aiAvailable && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          {error?.includes("credits") || error?.includes("billing") ? (
            <>
              AI matching needs Anthropic credits. Top up at{" "}
              <a
                href="https://console.anthropic.com/settings/billing"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                Plans &amp; Billing
              </a>
              , then try again.
            </>
          ) : (
            <>
              AI matching is off. Add{" "}
              <code className="text-xs">ANTHROPIC_API_KEY</code> to{" "}
              <code className="text-xs">backend/.env</code> when ready.
            </>
          )}
        </p>
      )}

      <LanguageChips
        languages={profileLanguages}
        activeLanguage={filters.language}
        onSelect={applyLanguage}
      />

      <FilterPanel
        filters={filters}
        onChange={(patch) => setFilters((f) => ({ ...f, ...patch }))}
        onSearch={() => {
          setHasSearched(true);
          void searchIssues(false);
        }}
        loading={loading}
        total={total}
      />

      {error && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="grid gap-4">
        {issues.map((issue) => (
          <IssueCard
            key={issue.id}
            issue={issue}
            analysis={analysisByUrl[issue.url]}
            analyzing={analyzingId === issue.id}
            aiAvailable={aiAvailable}
            onAnalyze={() => analyzeIssue(issue)}
            onBookmark={() => bookmarkIssue(issue)}
            bookmarked={savedUrls.has(issue.url)}
          />
        ))}
        {loading && issues.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Loading issues from GitHub...
          </p>
        )}
        {!loading && issues.length === 0 && hasSearched && (
          <p className="text-sm text-muted-foreground">
            No issues found. Try another language or label, or loosen filters.
          </p>
        )}
      </div>

      {hasNextPage && issues.length > 0 && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            disabled={loadingMore}
            onClick={() => searchIssues(true, nextCursor)}
          >
            {loadingMore ? "Loading..." : "Load more issues"}
          </Button>
        </div>
      )}
    </div>
  );
}
