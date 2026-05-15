import { Router } from "express";
import type { AuthedRequest } from "../middleware/auth.js";
import { requireAuth } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";
import { syncLanguagesFromGitHub } from "../lib/profile-sync.js";

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
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sync failed";
    res.status(500).json({ error: message });
  }
});

export default router;
