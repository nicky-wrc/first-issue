import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:4000";

async function proxyRequest(req: NextRequest, path: string[]) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const targetPath = path.join("/");
  const url = `${BACKEND_URL}/api/${targetPath}${req.nextUrl.search}`;

  const headers: Record<string, string> = {
    "X-User-Id": session.user.id,
  };
  const contentType = req.headers.get("content-type");
  if (contentType) headers["Content-Type"] = contentType;
  if (session.accessToken) headers["X-Github-Token"] = session.accessToken;

  const init: RequestInit = { method: req.method, headers };
  if (req.method !== "GET" && req.method !== "HEAD") {
    init.body = await req.text();
  }

  const res = await fetch(url, init);
  const body = await res.text();

  return new NextResponse(body, {
    status: res.status,
    headers: {
      "Content-Type": res.headers.get("content-type") ?? "application/json",
    },
  });
}

type RouteContext = { params: { path?: string[] } };

export async function GET(req: NextRequest, ctx: RouteContext) {
  return proxyRequest(req, ctx.params.path ?? []);
}

export async function POST(req: NextRequest, ctx: RouteContext) {
  return proxyRequest(req, ctx.params.path ?? []);
}

export async function PUT(req: NextRequest, ctx: RouteContext) {
  return proxyRequest(req, ctx.params.path ?? []);
}

export async function PATCH(req: NextRequest, ctx: RouteContext) {
  return proxyRequest(req, ctx.params.path ?? []);
}

export async function DELETE(req: NextRequest, ctx: RouteContext) {
  return proxyRequest(req, ctx.params.path ?? []);
}
