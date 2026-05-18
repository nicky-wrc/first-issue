import { Router } from "express";
import type { AuthedRequest } from "../middleware/auth.js";
import { requireAuth } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";
import { isEmailConfigured } from "../lib/email.js";
import { getDigestPreview, runWeeklyDigest } from "../lib/digest.js";

const router = Router();

router.get("/open/:id", async (req, res) => {
  const { id } = req.params;
  await prisma.digestLog.updateMany({
    where: { id, openedAt: null },
    data: { openedAt: new Date() },
  });
  const frontend = process.env.FRONTEND_URL ?? "http://localhost:3000";
  res.redirect(302, `${frontend}/feed`);
});

router.get("/status", requireAuth, (_req, res) => {
  res.json({ configured: isEmailConfigured() });
});

router.get("/preview", requireAuth, async (req, res) => {
  const authed = req as AuthedRequest;
  try {
    const preview = await getDigestPreview(
      authed.userId,
      authed.githubAccessToken,
    );
    res.json(preview);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Preview failed";
    res.status(500).json({ error: message });
  }
});

router.get("/history", requireAuth, async (req, res) => {
  const { userId } = req as AuthedRequest;
  const logs = await prisma.digestLog.findMany({
    where: { userId },
    orderBy: { sentAt: "desc" },
    take: 10,
    select: { id: true, sentAt: true, issueCount: true, openedAt: true },
  });
  res.json(logs);
});

router.post("/send-test", requireAuth, async (req, res) => {
  const authed = req as AuthedRequest;
  if (!isEmailConfigured()) {
    res.status(503).json({
      error:
        "Email is not configured. Add RESEND_API_KEY to backend/.env.",
      code: "EMAIL_NOT_CONFIGURED",
    });
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: authed.userId },
    select: { email: true },
  });
  if (!user?.email) {
    res.status(400).json({
      error: "No email on your account. Re-login with GitHub (user:email scope).",
    });
    return;
  }

  try {
    const result = await runWeeklyDigest({
      dryRun: false,
      userId: authed.userId,
      githubAccessToken: authed.githubAccessToken,
    });
    res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Send failed";
    const code =
      error instanceof Error && "code" in error
        ? String((error as Error & { code: string }).code)
        : undefined;
    res.status(503).json({ error: message, ...(code ? { code } : {}) });
  }
});

router.post("/cron/weekly", async (req, res) => {
  const secret = req.headers["x-cron-secret"];
  if (!secret || secret !== process.env.CRON_SECRET) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  try {
    const result = await runWeeklyDigest({ dryRun: false });
    res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Digest failed";
    const code =
      error instanceof Error && "code" in error
        ? String((error as Error & { code: string }).code)
        : undefined;
    res.status(503).json({ error: message, ...(code ? { code } : {}) });
  }
});

export default router;
