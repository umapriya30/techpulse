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

// HTTP Basic Auth for the admin dashboard (/admin) and its API routes
// (/api/admin/*). Credentials come from ADMIN_USERNAME / ADMIN_PASSWORD env
// vars — never hard-coded in source, same "no secrets in code" policy as
// CRON_SECRET. Fails closed: if the env vars aren't configured, the route
// 503s rather than opening up.
function checkAdminAuth(req: NextRequest): NextResponse | null {
  if (!req.nextUrl.pathname.startsWith("/admin") && !req.nextUrl.pathname.startsWith("/api/admin")) {
    return null;
  }

  const user = process.env.ADMIN_USERNAME;
  const pass = process.env.ADMIN_PASSWORD;
  if (!user || !pass) {
    return new NextResponse("Admin login is not configured.", { status: 503 });
  }

  const auth = req.headers.get("authorization");
  if (auth?.startsWith("Basic ")) {
    const decoded = atob(auth.slice(6));
    const sep = decoded.indexOf(":");
    const reqUser = sep === -1 ? decoded : decoded.slice(0, sep);
    const reqPass = sep === -1 ? "" : decoded.slice(sep + 1);
    if (reqUser === user && reqPass === pass) return null; // authenticated, continue
  }

  return new NextResponse("Authentication required.", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="TechPulse Admin"' },
  });
}

export function proxy(req: NextRequest) {
  const authFailure = checkAdminAuth(req);
  if (authFailure) return authFailure;

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
