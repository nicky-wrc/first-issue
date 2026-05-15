"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function SignInButton() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <Button disabled>Loading...</Button>;
  }

  if (session?.user) {
    return (
      <div className="flex items-center gap-3">
        <Link
          href="/profile"
          className="hidden items-center gap-2 text-sm text-muted-foreground hover:text-foreground sm:flex"
        >
          {session.user.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={session.user.image}
              alt=""
              className="size-7 rounded-full"
            />
          )}
          <span>{session.user.name ?? "Profile"}</span>
        </Link>
        <Button variant="outline" onClick={() => signOut()}>
          Sign out
        </Button>
      </div>
    );
  }

  return (
    <Button onClick={() => signIn("github", { callbackUrl: "/feed" })}>
      Continue with GitHub
    </Button>
  );
}
