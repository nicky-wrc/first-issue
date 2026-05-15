import { Router } from "express";
import type { AuthedRequest } from "../middleware/auth.js";
import { requireAuth } from "../middleware/auth.js";
import { githubGraphql } from "../lib/github.js";
import { prisma } from "../lib/prisma.js";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  const { userId } = req as AuthedRequest;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      githubId: true,
      username: true,
      avatarUrl: true,
      email: true,
      languages: true,
      skillLevel: true,
      createdAt: true,
    },
  });

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json(user);
});

type RepoLanguagesResponse = {
  viewer: {
    repositories: {
      nodes: {
        name: string;
        languages: { edges: { size: number; node: { name: string } }[] };
      }[];
    };
  };
};

const SYNC_REPOS_QUERY = `
  query SyncRepos($login: String!) {
    viewer: user(login: $login) {
      repositories(first: 30, ownerAffiliations: OWNER, orderBy: { field: UPDATED_AT, direction: DESC }) {
        nodes {
          name
          languages(first: 10, orderBy: { field: SIZE, direction: DESC }) {
            edges { size node { name } }
          }
        }
      }
    }
  }
`;

router.post("/sync", requireAuth, async (req, res) => {
  const authed = req as AuthedRequest;
  const user = await prisma.user.findUnique({ where: { id: authed.userId } });
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  try {
    const data = await githubGraphql<RepoLanguagesResponse>(
      SYNC_REPOS_QUERY,
      { login: user.username },
      authed.githubAccessToken,
    );

    const languageTotals = new Map<string, number>();
    for (const repo of data.viewer.repositories.nodes) {
      for (const edge of repo.languages.edges) {
        languageTotals.set(
          edge.node.name,
          (languageTotals.get(edge.node.name) ?? 0) + edge.size,
        );
      }
    }

    const languages = Array.from(languageTotals.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name]) => name);

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { languages },
      select: {
        id: true,
        username: true,
        languages: true,
        skillLevel: true,
      },
    });

    res.json(updated);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sync failed";
    res.status(500).json({ error: message });
  }
});

export default router;
