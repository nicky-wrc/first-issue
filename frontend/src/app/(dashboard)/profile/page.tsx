"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { SkillBadge } from "@/components/skill-badge";
import { Button } from "@/components/ui/button";

type Profile = {
  username: string;
  avatarUrl: string | null;
  languages: string[];
  skillLevel: string;
};

export default function ProfilePage() {
  const { status } = useSession();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/profile")
      .then((res) => res.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else setProfile(data);
      })
      .catch(() => setError("Failed to load profile"));
  }, [status]);

  async function syncProfile() {
    setSyncing(true);
    setError(null);
    try {
      const res = await fetch("/api/profile/sync", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Sync failed");
      setProfile((prev) => (prev ? { ...prev, languages: data.languages } : prev));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sync failed");
    } finally {
      setSyncing(false);
    }
  }

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
            Languages inferred from your GitHub repositories.
          </p>
        </div>
        <Button onClick={syncProfile} disabled={syncing}>
          {syncing ? "Syncing..." : "Sync from GitHub"}
        </Button>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {profile && (
        <section className="rounded-xl border bg-card p-6 space-y-4">
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
              ) : (
                <p className="text-sm text-muted-foreground">
                  No languages yet — click Sync from GitHub.
                </p>
              )}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
