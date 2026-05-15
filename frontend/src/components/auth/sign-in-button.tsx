"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";

export function SignInButton() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <Button disabled>Loading...</Button>;
  }

  if (session) {
    return (
      <Button variant="outline" onClick={() => signOut()}>
        Sign out
      </Button>
    );
  }

  return (
    <Button onClick={() => signIn("github")}>Continue with GitHub</Button>
  );
}
