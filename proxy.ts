import { NextResponse, type NextRequest } from "next/server";

// Lightweight in-memory rate limiter for API routes + baseline security headers.
// For production, back the limiter with Redis (see README).
const WINDOW_MS = 60_000;
const MAX_REQ = 60;
const hits = new Map<string, { count: number; reset: number }>();

function rateLimit(key: string) {
  const now = Date.now();
  const entry = hits.get(key);
  if (!entry || entry.reset < now) {
    hits.set(key, { count: 1, reset: now + WINDOW_MS });
    return { ok: true, remaining: MAX_REQ - 1 };
  }
  entry.count += 1;
  return { ok: entry.count <= MAX_REQ, remaining: Math.max(0, MAX_REQ - entry.count) };
}

export function proxy(req: NextRequest) {
  const res = NextResponse.next();

  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");

  if (req.nextUrl.pathname.startsWith("/api/")) {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
    const { ok, remaining } = rateLimit(`${ip}:${req.nextUrl.pathname}`);
    res.headers.set("X-RateLimit-Remaining", String(remaining));
    if (!ok) {
      return NextResponse.json(
        { error: "Too many requests. Please slow down." },
        { status: 429, headers: { "Retry-After": "60" } },
      );
    }
  }

  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
