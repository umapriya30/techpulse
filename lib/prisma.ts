import { PrismaClient } from "@prisma/client";

/**
 * Prisma client singleton.
 *
 * Hunt is the first TechPulse section actually backed by Postgres (everything
 * else — news/events/hackathons — runs on the live-fetch-and-cache
 * MockProvider/LiveProvider pattern in lib/provider.ts). Cached on
 * `globalThis` so hot-reload in dev doesn't open a new connection per edit.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
