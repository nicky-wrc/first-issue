"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { SignInButton } from "@/components/auth/sign-in-button";
import { cn } from "@/lib/utils";

const links = [
  { href: "/feed", label: "Feed" },
  { href: "/profile", label: "Profile" },
  { href: "/bookmarks", label: "Bookmarks", showCount: true },
];

export function AppNav() {
  const pathname = usePathname();
  const { status } = useSession();
  const isLoggedIn = status === "authenticated";
  const [bookmarkCount, setBookmarkCount] = useState(0);

  useEffect(() => {
    if (!isLoggedIn) return;
    fetch("/api/bookmarks/stats")
      .then((res) => res.json())
      .then((data) => {
        if (typeof data.total === "number") setBookmarkCount(data.total);
      })
      .catch(() => {});
  }, [isLoggedIn, pathname]);

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
                  {"showCount" in link &&
                    link.showCount &&
                    bookmarkCount > 0 && (
                      <span className="ml-1 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium">
                        {bookmarkCount}
                      </span>
                    )}
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
