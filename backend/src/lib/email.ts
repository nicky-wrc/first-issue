import { Resend } from "resend";
import type { FeedIssue } from "./issue-feed.js";

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}

function buildDigestHtml(
  username: string,
  issues: FeedIssue[],
  digestLogId?: string,
): string {
  const backendUrl = process.env.BACKEND_URL ?? "http://localhost:4000";
  const appLink = digestLogId
    ? `${backendUrl}/api/digest/open/${digestLogId}`
    : `${process.env.FRONTEND_URL ?? "http://localhost:3000"}/feed`;
  const items = issues
    .map(
      (issue) => `
    <li style="margin-bottom:16px;">
      <a href="${issue.url}" style="color:#111;font-weight:600;text-decoration:none;">${escapeHtml(issue.title)}</a>
      <div style="color:#666;font-size:13px;margin-top:4px;">
        ${escapeHtml(issue.repoName)}${issue.language ? ` · ${escapeHtml(issue.language)}` : ""}
      </div>
    </li>`,
    )
    .join("");

  return `<!DOCTYPE html>
<html>
<body style="font-family:system-ui,sans-serif;line-height:1.5;color:#111;max-width:560px;margin:0 auto;padding:24px;">
  <h1 style="font-size:20px;margin:0 0 8px;">Your weekly good-first issues</h1>
  <p style="color:#666;margin:0 0 20px;">Hi @${escapeHtml(username)}, here are issues picked for your stack.</p>
  <ul style="padding-left:20px;margin:0;">${items}</ul>
  <p style="margin-top:24px;font-size:13px;color:#888;">
    <a href="${appLink}">Open First Issue</a>
  </p>
</body>
</html>`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function sendDigestEmail(
  to: string,
  username: string,
  issues: FeedIssue[],
  digestLogId?: string,
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    const err = new Error("RESEND_API_KEY is not configured");
    (err as Error & { code: string }).code = "EMAIL_NOT_CONFIGURED";
    throw err;
  }

  const from =
    process.env.RESEND_FROM_EMAIL?.trim() ?? "First Issue <onboarding@resend.dev>";
  const resend = new Resend(apiKey);

  const { error } = await resend.emails.send({
    from,
    to,
    subject: `${issues.length} good-first issues for you this week`,
    html: buildDigestHtml(username, issues, digestLogId),
  });

  if (error) {
    throw new Error(error.message);
  }
}
