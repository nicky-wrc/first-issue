import cors from "cors";
import express from "express";
import authRouter from "./routes/auth.js";
import bookmarksRouter from "./routes/bookmarks.js";
import issuesRouter from "./routes/issues.js";
import profileRouter from "./routes/profile.js";

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: process.env.FRONTEND_URL ?? "http://localhost:3000",
      credentials: true,
    }),
  );
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({ ok: true });
  });

  app.use("/api/auth", authRouter);
  app.use("/api/profile", profileRouter);
  app.use("/api/issues", issuesRouter);
  app.use("/api/bookmarks", bookmarksRouter);

  return app;
}
