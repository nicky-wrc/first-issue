import { prisma } from "./prisma.js";
import { sendDigestEmail, isEmailConfigured } from "./email.js";
import { searchFeedIssues, type FeedIssue } from "./issue-feed.js";

const DIGEST_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;

export type DigestPreview = {
  issues: FeedIssue[];
  email: string | null;
  canSend: boolean;
  lastSentAt: string | null;
};

export async function getDigestPreview(
  userId: string,
  githubAccessToken?: string | null,
): Promise<DigestPreview> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, languages: true, username: true },
  });
  if (!user) throw new Error("User not found");

  const lastLog = await prisma.digestLog.findFirst({
    where: { userId },
    orderBy: { sentAt: "desc" },
    select: { sentAt: true },
  });

  const issues = await searchFeedIssues(
    { languages: user.languages, limit: 5 },
    githubAccessToken,
  );

  return {
    issues,
    email: user.email,
    canSend: isEmailConfigured() && Boolean(user.email),
    lastSentAt: lastLog?.sentAt.toISOString() ?? null,
  };
}

export type WeeklyDigestResult = {
  sent: number;
  skipped: number;
  failed: number;
  dryRun: boolean;
};

export async function runWeeklyDigest(options?: {
  dryRun?: boolean;
  userId?: string;
  githubAccessToken?: string | null;
}): Promise<WeeklyDigestResult> {
  const dryRun = options?.dryRun ?? false;

  if (!dryRun && !isEmailConfigured()) {
    const err = new Error("RESEND_API_KEY is not configured");
    (err as Error & { code: string }).code = "EMAIL_NOT_CONFIGURED";
    throw err;
  }

  const since = new Date(Date.now() - DIGEST_COOLDOWN_MS);
  const users = await prisma.user.findMany({
    where: {
      email: { not: null },
      ...(options?.userId ? { id: options.userId } : {}),
    },
    select: { id: true, email: true, username: true, languages: true },
  });

  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for (const user of users) {
    if (!user.email) {
      skipped++;
      continue;
    }

    if (!options?.userId) {
      const recent = await prisma.digestLog.findFirst({
        where: { userId: user.id, sentAt: { gte: since } },
      });
      if (recent) {
        skipped++;
        continue;
      }
    }

    try {
      const token =
        options?.userId === user.id ? options.githubAccessToken : null;
      const issues = await searchFeedIssues(
        { languages: user.languages, limit: 5 },
        token,
      );

      if (issues.length === 0) {
        skipped++;
        continue;
      }

      if (!dryRun) {
        const log = await prisma.digestLog.create({
          data: {
            userId: user.id,
            issueCount: issues.length,
          },
        });
        await sendDigestEmail(
          user.email,
          user.username,
          issues,
          log.id,
        );
      }

      sent++;
    } catch {
      failed++;
    }
  }

  return { sent, skipped, failed, dryRun };
}
