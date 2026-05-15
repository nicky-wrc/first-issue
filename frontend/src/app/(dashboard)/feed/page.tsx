"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { useState } from "react";
import { FilterPanel } from "@/components/filter-panel";
import { IssueCard } from "@/components/issue-card";
import type { IssueSummary } from "@/types";

type IssueResult = IssueSummary & { stars: number; matchScore?: number };

export default function FeedPage() {
  const { status } = useSession();
  const [language, setLanguage] = useState("");
  const [label, setLabel] = useState("good-first-issue");
  const [issues, setIssues] = useState<IssueResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [analysisByUrl, setAnalysisByUrl] = useState<
    Record<string, { score: number; skillsNeeded: string[] }>
  >({});

  async function searchIssues() {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ label });
      if (language) params.set("lang", language);
      const res = await fetch(`/api/issues?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load issues");
      setIssues(data.issues);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

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
      if (!res.ok) throw new Error(data.error ?? "Analysis failed");
      setAnalysisByUrl((prev) => ({
        ...prev,
        [issue.url]: { score: data.score, skillsNeeded: data.skillsNeeded ?? [] },
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setAnalyzingId(null);
    }
  }

  async function bookmarkIssue(issue: IssueResult) {
    const score = analysisByUrl[issue.url]?.score;
    await fetch("/api/bookmarks", {
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
          Discover open source issues that match your skills.
        </p>
      </div>

      <FilterPanel
        language={language}
        label={label}
        onLanguageChange={setLanguage}
        onLabelChange={setLabel}
        onSearch={searchIssues}
        loading={loading}
      />

      {error && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="grid gap-4">
        {issues.map((issue) => {
          const analysis = analysisByUrl[issue.url];
          return (
            <IssueCard
              key={issue.id}
              issue={issue}
              matchScore={analysis?.score}
              skillsNeeded={analysis?.skillsNeeded}
              analyzing={analyzingId === issue.id}
              onAnalyze={() => analyzeIssue(issue)}
              onBookmark={() => bookmarkIssue(issue)}
            />
          );
        })}
        {!loading && issues.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Run a search to see good first issues from GitHub.
          </p>
        )}
      </div>
    </div>
  );
}
