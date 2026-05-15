import type { NextFunction, Request, Response } from "express";

export type AuthedRequest = Request & {
  userId: string;
  githubAccessToken?: string;
};

export function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const userId = req.headers["x-user-id"];
  if (typeof userId !== "string" || !userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const authed = req as AuthedRequest;
  authed.userId = userId;
  const token = req.headers["x-github-token"];
  if (typeof token === "string" && token) {
    authed.githubAccessToken = token;
  }
  next();
}
