import { Router } from "express";
import { prisma } from "../lib/prisma.js";

const router = Router();

function assertInternalKey(req: { headers: Record<string, unknown> }): boolean {
  const key = req.headers["x-internal-api-key"];
  const expected = process.env.INTERNAL_API_KEY;
  return Boolean(expected && key === expected);
}

router.post("/upsert", async (req, res) => {
  if (!assertInternalKey(req)) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const { githubId, username, avatarUrl, email } = req.body as {
    githubId?: string;
    username?: string;
    avatarUrl?: string | null;
    email?: string | null;
  };

  if (!githubId || !username) {
    res.status(400).json({ error: "githubId and username are required" });
    return;
  }

  const user = await prisma.user.upsert({
    where: { githubId },
    create: { githubId, username, avatarUrl, email },
    update: { username, avatarUrl, email },
  });

  res.json(user);
});

export default router;
