import Link from "next/link";
import { HomeRedirect } from "@/components/home-redirect";
import { SignInButton } from "@/components/auth/sign-in-button";
import { AppNav } from "@/components/layout/app-nav";
import { Button } from "@/components/ui/button";

const features = [
  "Login with GitHub and build a skill profile from your repos",
  "Personalized feed filtered by your top languages",
  "AI match score with Claude — what fits you and why",
  "Bookmark issues and track interested → applying → submitted",
  "Weekly email digest with good-first issues for your stack",
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <HomeRedirect />
      <AppNav />
      <main className="mx-auto max-w-5xl px-4 py-16">
        <section className="mx-auto max-w-2xl space-y-6 text-center">
          <p className="text-sm font-medium text-muted-foreground">
            Open Source Finder
          </p>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Find your first open source issue
          </h1>
          <p className="text-lg text-muted-foreground">
            Match GitHub issues to your skills, get AI-powered fit scores, and
            track your contribution journey.
          </p>
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <SignInButton />
            <Link href="/feed">
              <Button variant="outline">Browse feed</Button>
            </Link>
          </div>
        </section>

        <section className="mt-20 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((text) => (
            <div
              key={text}
              className="rounded-xl border bg-card p-5 text-left text-sm text-muted-foreground"
            >
              {text}
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
