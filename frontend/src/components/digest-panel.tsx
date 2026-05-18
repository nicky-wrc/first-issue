"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type DigestIssue = {
  title: string;
  url: string;
  repoName: string;
  language: string | null;
};

type DigestPreview = {
  issues: DigestIssue[];
  email: string | null;
  canSend: boolean;
  lastSentAt: string | null;
};

export function DigestPanel() {
  const [preview, setPreview] = useState<DigestPreview | null>(null);
  const [emailConfigured, setEmailConfigured] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [statusRes, previewRes] = await Promise.all([
        fetch("/api/digest/status"),
        fetch("/api/digest/preview"),
      ]);
      const status = await statusRes.json();
      const data = await previewRes.json();
      if (!previewRes.ok) throw new Error(data.error ?? "Failed to load digest");
      setEmailConfigured(Boolean(status.configured));
      setPreview(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function sendTest() {
    setSending(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch("/api/digest/send-test", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Send failed");
      setMessage("Test digest sent — check your inbox.");
      void load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Send failed");
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="rounded-xl border bg-card p-6 space-y-4">
      <div>
        <h2 className="font-medium">Weekly digest</h2>
        <p className="text-sm text-muted-foreground">
          Good-first issues matched to your languages, emailed once a week.
        </p>
      </div>

      {loading && (
        <p className="text-sm text-muted-foreground">Loading preview...</p>
      )}

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      {message && (
        <p className="text-sm text-green-700">{message}</p>
      )}

      {!loading && preview && (
        <>
          <div className="text-sm text-muted-foreground space-y-1">
            {preview.email ? (
              <p>Send to: {preview.email}</p>
            ) : (
              <p>
                No email on file — sign out and sign in again so GitHub shares
                your email.
              </p>
            )}
            {preview.lastSentAt && (
              <p>
                Last sent: {new Date(preview.lastSentAt).toLocaleString()}
              </p>
            )}
            {!emailConfigured && (
              <p>
                Email is off. Add <code className="text-xs">RESEND_API_KEY</code>{" "}
                to <code className="text-xs">backend/.env</code> when ready.
              </p>
            )}
          </div>

          {preview.issues.length > 0 ? (
            <ul className="space-y-2 text-sm">
              {preview.issues.map((issue) => (
                <li key={issue.url} className="rounded-lg border bg-background p-3">
                  <a
                    href={issue.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium hover:underline"
                  >
                    {issue.title}
                  </a>
                  <p className="text-xs text-muted-foreground mt-1">
                    {issue.repoName}
                    {issue.language ? ` · ${issue.language}` : ""}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              Sync your profile first so we can pick issues for your languages.
            </p>
          )}

          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={!preview.canSend || sending || preview.issues.length === 0}
              onClick={() => void sendTest()}
            >
              {sending ? "Sending..." : "Send test email"}
            </Button>
            <Link href="/feed">
              <Button size="sm" variant="ghost">
                Browse feed
              </Button>
            </Link>
          </div>
        </>
      )}
    </section>
  );
}
