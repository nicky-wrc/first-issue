import { Router } from "express";
import type { AuthedRequest } from "../middleware/auth.js";
import { requireAuth } from "../middleware/auth.js";
import { analyzeIssueMatch, isAiConfigured } from "../lib/claude.js";
import { buildIssueSearchQuery } from "../lib/issue-search.js";
import { fetchIssueBody, githubGraphql } from "../lib/github.js";
import { prisma } from "../lib/prisma.js";
import { cacheGet, cacheSet } from "../lib/redis.js";

const router = Router();

type SearchIssuesResponse = {
  search: {
    issueCount: number;
    pageInfo: { endCursor: string | null; hasNextPage: boolean };
    nodes: {
      id: string;
      title: string;
      url: string;
      createdAt: string;
      comments: { totalCount: number };
      repository: {
        nameWithOwner: string;
        stargazerCount: number;
        primaryLanguage: { name: string } | null;
      };
      labels: { nodes: { name: string }[] };
    }[];
  };
};

const SEARCH_ISSUES_QUERY = `
  query SearchIssues($query: String!, $first: Int!, $after: String) {
    search(type: ISSUE, query: $query, first: $first, after: $after) {
      issueCount
      pageInfo { endCursor hasNextPage }
      nodes {
        ... on Issue {
          id
          title
          url
          createdAt
          comments { totalCount }
          repository {
            nameWithOwner
            stargazerCount
            primaryLanguage { name }
          }
          labels(first: 10) { nodes { name } }
        }
      }
    }
  }
`;

function mapIssue(node: SearchIssuesResponse["search"]["nodes"][0]) {
  return {
    id: node.id,
    title: node.title,
    url: node.url,
    repoName: node.repository.nameWithOwner,
    language: node.repository.primaryLanguage?.name ?? null,
    stars: node.repository.stargazerCount,
    labels: node.labels.nodes.map((l) => l.name),
    createdAt: node.createdAt,
    commentCount: node.comments.totalCount,
  };
}

router.get("/", requireAuth, async (req, res) => {
  const authed = req as AuthedRequest;
  const lang = req.query.lang as string | undefined;
  const label = (req.query.label as string | undefined) ?? "good-first-issue";
  const first = Math.min(Number(req.query.first ?? 20), 30);
  const after = (req.query.after as string | undefined) || null;
  const minStars = Number(req.query.minStars ?? 0) || undefined;
  const ageDays = Number(req.query.ageDays ?? 0) || undefined;

  const searchQuery = buildIssueSearchQuery({ label, lang, minStars, ageDays });
  const cacheKey = `issues:${searchQuery}:${first}:${after ?? "start"}`;

  try {
    if (!after) {
      const cached = await cacheGet<{
        total: number;
        issues: ReturnType<typeof mapIssue>[];
        nextCursor: string | null;
        hasNextPage: boolean;
      }>(cacheKey);
      if (cached) {
        res.json({ ...cached, cached: true });
        return;
      }
    }

    const data = await githubGraphql<SearchIssuesResponse>(
      SEARCH_ISSUES_QUERY,
      { query: searchQuery, first, after },
      authed.githubAccessToken,
    );

    const issues = data.search.nodes.map(mapIssue);
    const payload = {
      total: data.search.issueCount,
      issues,
      nextCursor: data.search.pageInfo.endCursor,
      hasNextPage: data.search.pageInfo.hasNextPage,
    };

    if (!after) await cacheSet(cacheKey, payload, 900);
    res.json(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Search failed";
    res.status(500).json({ error: message });
  }
});

router.get("/ai-status", requireAuth, (_req, res) => {
  res.json({ configured: isAiConfigured() });
});

router.post("/analyze", requireAuth, async (req, res) => {
  const authed = req as AuthedRequest;
  const body = req.body as {
    issueUrl?: string;
    issueTitle?: string;
    issueBody?: string;
    labels?: string[];
  };

  if (!isAiConfigured()) {
    res.status(503).json({
      error:
        "AI matching is not available. Add ANTHROPIC_API_KEY to backend/.env and restart the server.",
      code: "AI_NOT_CONFIGURED",
    });
    return;
  }

  if (!body.issueUrl || !body.issueTitle) {
    res.status(400).json({ error: "issueUrl and issueTitle are required" });
    return;
  }

  const cached = await prisma.aiAnalysis.findUnique({
    where: { issueUrl: body.issueUrl },
  });
  if (cached && Date.now() - cached.cachedAt.getTime() < 24 * 60 * 60 * 1000) {
    res.json({
      score: cached.score,
      summary: cached.summary,
      skillsNeeded: cached.skillsNeeded,
      difficulty: cached.difficulty,
      cached: true,
    });
    return;
  }

  const user = await prisma.user.findUnique({ where: { id: authed.userId } });
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  try {
    let issueBody = body.issueBody?.trim() ?? "";
    if (!issueBody) {
      issueBody = await fetchIssueBody(body.issueUrl, authed.githubAccessToken);
    }

    const result = await analyzeIssueMatch({
      developerSkills: user.languages,
      issueTitle: body.issueTitle,
      issueBody,
      labels: body.labels ?? [],
    });

    await prisma.aiAnalysis.upsert({
      where: { issueUrl: body.issueUrl },
      create: {
        issueUrl: body.issueUrl,
        summary: result.summary,
        skillsNeeded: result.skillsNeeded,
        difficulty: result.difficulty,
        score: result.score,
      },
      update: {
        summary: result.summary,
        skillsNeeded: result.skillsNeeded,
        difficulty: result.difficulty,
        score: result.score,
        cachedAt: new Date(),
      },
    });

    res.json({ ...result, cached: false });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Analysis failed";
    const code =
      error instanceof Error && "code" in error
        ? String((error as Error & { code: string }).code)
        : undefined;
    const status =
      code === "AI_NOT_CONFIGURED" || code === "AI_INSUFFICIENT_CREDITS"
        ? 503
        : code === "AI_INVALID_KEY"
          ? 401
          : 500;
    res.status(status).json({ error: message, ...(code ? { code } : {}) });
  }
});

export default router;
