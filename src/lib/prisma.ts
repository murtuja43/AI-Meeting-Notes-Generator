import { PrismaClient } from "@prisma/client";

/**
 * Singleton Prisma client.
 *
 * In development, Next.js hot-reloads modules on every change. Without this
 * guard each reload would create a brand-new PrismaClient and quickly exhaust
 * the database connection pool. We cache the instance on `globalThis` so reloads
 * reuse the same client. In production a single instance is created normally.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
