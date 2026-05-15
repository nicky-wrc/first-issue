import { Router } from "express";
import type { AuthedRequest } from "../middleware/auth.js";
import { requireAuth } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  const { userId } = req as AuthedRequest;
  const bookmarks = await prisma.bookmark.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
  });
  res.json(bookmarks);
});

router.post("/", requireAuth, async (req, res) => {
  const { userId } = req as AuthedRequest;
  const body = req.body as {
    issueUrl?: string;
    issueTitle?: string;
    repoName?: string;
    language?: string;
    matchScore?: number;
  };

  if (!body.issueUrl || !body.issueTitle || !body.repoName) {
    res
      .status(400)
      .json({ error: "issueUrl, issueTitle, and repoName are required" });
    return;
  }

  const bookmark = await prisma.bookmark.upsert({
    where: {
      userId_issueUrl: { userId, issueUrl: body.issueUrl },
    },
    create: {
      userId,
      issueUrl: body.issueUrl,
      issueTitle: body.issueTitle,
      repoName: body.repoName,
      language: body.language,
      matchScore: body.matchScore,
    },
    update: {
      issueTitle: body.issueTitle,
      repoName: body.repoName,
      language: body.language,
      matchScore: body.matchScore,
    },
  });

  res.status(201).json(bookmark);
});

router.delete("/:id", requireAuth, async (req, res) => {
  const { userId } = req as AuthedRequest;
  const bookmark = await prisma.bookmark.findFirst({
    where: { id: req.params.id, userId },
  });
  if (!bookmark) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  await prisma.bookmark.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

router.post("/:id/status", requireAuth, async (req, res) => {
  const { userId } = req as AuthedRequest;
  const valid = new Set(["interested", "applying", "submitted"]);
  const { status } = req.body as { status?: string };

  if (!status || !valid.has(status)) {
    res.status(400).json({ error: "Invalid status" });
    return;
  }

  const bookmark = await prisma.bookmark.findFirst({
    where: { id: req.params.id, userId },
  });
  if (!bookmark) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  const updated = await prisma.bookmark.update({
    where: { id: req.params.id },
    data: { status: status as "interested" | "applying" | "submitted" },
  });

  res.json(updated);
});

export default router;
