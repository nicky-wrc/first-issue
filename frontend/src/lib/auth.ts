import type { NextAuthOptions } from "next-auth";
import GitHubProvider from "next-auth/providers/github";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:4000";

export const authOptions: NextAuthOptions = {
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID ?? "",
      clientSecret: process.env.GITHUB_CLIENT_SECRET ?? "",
      authorization: {
        params: { scope: "read:user user:email repo" },
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/",
  },
  callbacks: {
    async redirect({ url, baseUrl }) {
      if (url.startsWith(baseUrl)) return url;
      return `${baseUrl}/feed`;
    },
    async jwt({ token, account, profile }) {
      if (account && profile && "id" in profile) {
        const githubId = String(profile.id);
        const username =
          ("login" in profile && typeof profile.login === "string"
            ? profile.login
            : token.name) ?? "unknown";
        const avatarUrl =
          "avatar_url" in profile && typeof profile.avatar_url === "string"
            ? profile.avatar_url
            : null;
        const email =
          "email" in profile && typeof profile.email === "string"
            ? profile.email
            : null;

        const res = await fetch(`${BACKEND_URL}/api/auth/upsert`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Internal-Api-Key": process.env.INTERNAL_API_KEY ?? "",
          },
          body: JSON.stringify({ githubId, username, avatarUrl, email }),
        });

        if (res.ok) {
          const user = (await res.json()) as { id: string };
          token.userId = user.id;
          token.githubId = githubId;
          token.accessToken = account.access_token;
        } else {
          console.error("Auth upsert failed:", await res.text());
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.userId as string;
        session.user.githubId = token.githubId as string;
      }
      session.accessToken = token.accessToken as string | undefined;
      return session;
    },
  },
};
