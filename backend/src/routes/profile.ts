import { Router } from "express";
import type { AuthedRequest } from "../middleware/auth.js";
import { requireAuth } from "../middleware/auth.js";
import { cacheGet } from "../lib/redis.js";
import { prisma } from "../lib/prisma.js";
import { syncLanguagesFromGitHub } from "../lib/profile-sync.js";

const router = Router();

router.get("/summary", requireAuth, async (req, res) => {
  const { userId } = req as AuthedRequest;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      username: true,
      languages: true,
      skillLevel: true,
      email: true,
    },
  });
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const groups = await prisma.bookmark.groupBy({
    by: ["status"],
    where: { userId },
    _count: { _all: true },
  });
  const bookmarks = { interested: 0, applying: 0, submitted: 0, total: 0 };
  for (const row of groups) {
    bookmarks[row.status] = row._count._all;
    bookmarks.total += row._count._all;
  }

  const lastDigest = await prisma.digestLog.findFirst({
    where: { userId },
    orderBy: { sentAt: "desc" },
    select: { sentAt: true, issueCount: true, openedAt: true },
  });

  res.json({ ...user, bookmarks, lastDigest });
});

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

  const cached = await cacheGet<{
    repos: { name: string; url: string; stars: number; languages: string[] }[];
    repoCount: number;
  }>(`profile:sync:${userId}`);

  res.json({
    ...user,
    repos: cached?.repos ?? [],
    repoCount: cached?.repoCount ?? null,
  });
});

router.post("/sync", requireAuth, async (req, res) => {
  const authed = req as AuthedRequest;
  const user = await prisma.user.findUnique({ where: { id: authed.userId } });
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  try {
    const skipCache = req.query.force === "true";
    const synced = await syncLanguagesFromGitHub(
      authed.userId,
      authed.githubAccessToken,
      { skipCache },
    );

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        languages: synced.languages,
        skillLevel: synced.skillLevel,
      },
      select: {
        id: true,
        username: true,
        avatarUrl: true,
        languages: true,
        skillLevel: true,
      },
    });

    res.json({
      ...updated,
      repoCount: synced.repoCount,
      repos: synced.repos,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sync failed";
    res.status(500).json({ error: message });
  }
});

export default router;
