import { Router } from "express";
import type { AuthedRequest } from "../middleware/auth.js";
import { requireAuth } from "../middleware/auth.js";
import { analyzeIssueMatch } from "../lib/claude.js";
import { githubGraphql } from "../lib/github.js";
import { prisma } from "../lib/prisma.js";

const router = Router();

type SearchIssuesResponse = {
  search: {
    issueCount: number;
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

router.get("/", requireAuth, async (req, res) => {
  const authed = req as AuthedRequest;
  const lang = req.query.lang as string | undefined;
  const label = (req.query.label as string | undefined) ?? "good-first-issue";
  const first = Math.min(Number(req.query.first ?? 20), 30);

  const parts = [
    "is:issue",
    "is:open",
    "no:assignee",
    `label:"${label.replace(/-/g, " ")}"`,
  ];
  if (lang) parts.push(`language:${lang}`);

  try {
    const data = await githubGraphql<SearchIssuesResponse>(
      SEARCH_ISSUES_QUERY,
      { query: parts.join(" "), first, after: null },
      authed.githubAccessToken,
    );

    const issues = data.search.nodes.map((node) => ({
      id: node.id,
      title: node.title,
      url: node.url,
      repoName: node.repository.nameWithOwner,
      language: node.repository.primaryLanguage?.name ?? null,
      stars: node.repository.stargazerCount,
      labels: node.labels.nodes.map((l) => l.name),
      createdAt: node.createdAt,
      commentCount: node.comments.totalCount,
    }));

    res.json({ total: data.search.issueCount, issues });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Search failed";
    res.status(500).json({ error: message });
  }
});

router.post("/analyze", requireAuth, async (req, res) => {
  const authed = req as AuthedRequest;
  const body = req.body as {
    issueUrl?: string;
    issueTitle?: string;
    issueBody?: string;
    labels?: string[];
  };

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
    const result = await analyzeIssueMatch({
      developerSkills: user.languages,
      issueTitle: body.issueTitle,
      issueBody: body.issueBody ?? "",
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
    res.status(500).json({ error: message });
  }
});

export default router;
