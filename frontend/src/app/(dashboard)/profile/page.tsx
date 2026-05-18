"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { DigestPanel } from "@/components/digest-panel";
import { ProfileSummary } from "@/components/profile-summary";
import { RepoList, type RepoItem } from "@/components/repo-list";
import { SkillBadge } from "@/components/skill-badge";
import { Button } from "@/components/ui/button";

type Profile = {
  username: string;
  avatarUrl: string | null;
  languages: string[];
  skillLevel: string;
  repos?: RepoItem[];
  repoCount?: number | null;
};

export default function ProfilePage() {
  const { status } = useSession();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const syncProfile = useCallback(async (force = false) => {
    setSyncing(true);
    setError(null);
    try {
      const url = force ? "/api/profile/sync?force=true" : "/api/profile/sync";
      const res = await fetch(url, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Sync failed");
      setProfile((prev) => ({
        username: data.username ?? prev?.username ?? "",
        avatarUrl: data.avatarUrl ?? prev?.avatarUrl ?? null,
        languages: data.languages ?? [],
        skillLevel: data.skillLevel ?? "beginner",
        repos: data.repos ?? [],
        repoCount: data.repoCount ?? null,
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sync failed");
    } finally {
      setSyncing(false);
    }
  }, []);

  useEffect(() => {
    if (status !== "authenticated") {
      setLoading(false);
      return;
    }

    fetch("/api/profile")
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
          return;
        }
        setProfile(data);
        if (data.languages.length === 0) {
          syncProfile();
        }
      })
      .catch(() => setError("Failed to load profile"))
      .finally(() => setLoading(false));
  }, [status, syncProfile]);

  if (status === "unauthenticated") {
    return (
      <p className="text-muted-foreground">
        <Link href="/" className="underline">
          Sign in
        </Link>{" "}
        to view your skill profile.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Skill profile</h1>
          <p className="text-sm text-muted-foreground">
            Languages and repos synced from your GitHub account.
          </p>
        </div>
        <Button onClick={() => syncProfile(true)} disabled={syncing}>
          {syncing ? "Syncing..." : "Sync from GitHub"}
        </Button>
      </div>

      {error && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      {loading && (
        <p className="text-sm text-muted-foreground">Loading profile...</p>
      )}

      {status === "authenticated" && !loading && <ProfileSummary />}

      {profile && !loading && (
        <section className="rounded-xl border bg-card p-6 space-y-6">
          <div className="flex items-center gap-3">
            {profile.avatarUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatarUrl}
                alt=""
                className="size-12 rounded-full"
              />
            )}
            <div>
              <p className="font-medium">@{profile.username}</p>
              <p className="text-sm text-muted-foreground capitalize">
                Level: {profile.skillLevel}
                {profile.repoCount != null &&
                  ` · ${profile.repoCount} repos analyzed`}
              </p>
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm text-muted-foreground">Top languages</p>
            <div className="flex flex-wrap gap-2">
              {profile.languages.length > 0 ? (
                profile.languages.map((lang) => (
                  <SkillBadge key={lang} label={lang} />
                ))
              ) : syncing ? (
                <p className="text-sm text-muted-foreground">
                  Syncing from GitHub...
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No languages yet — click Sync from GitHub.
                </p>
              )}
            </div>
          </div>

          {profile.repos && profile.repos.length > 0 && (
            <RepoList repos={profile.repos} />
          )}
        </section>
      )}

      {status === "authenticated" && !loading && (
        <DigestPanel />
      )}
    </div>
  );
}
