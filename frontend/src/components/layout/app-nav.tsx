"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { SignInButton } from "@/components/auth/sign-in-button";
import { cn } from "@/lib/utils";

const links = [
  { href: "/feed", label: "Feed" },
  { href: "/profile", label: "Profile" },
  { href: "/bookmarks", label: "Bookmarks" },
];

export function AppNav() {
  const pathname = usePathname();
  const { status } = useSession();
  const isLoggedIn = status === "authenticated";

  return (
    <header className="border-b">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-sm font-semibold">
            First Issue
          </Link>
          {isLoggedIn && (
            <nav className="hidden gap-4 sm:flex">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "text-sm text-muted-foreground transition-colors hover:text-foreground",
                    pathname === link.href && "font-medium text-foreground",
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          )}
        </div>
        <SignInButton />
      </div>
    </header>
  );
}
