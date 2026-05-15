import { withAuth } from "next-auth/middleware";

export default withAuth({
  callbacks: {
    authorized: ({ token }) => Boolean(token?.userId),
  },
});

export const config = {
  matcher: ["/feed/:path*", "/profile/:path*", "/bookmarks/:path*"],
};
