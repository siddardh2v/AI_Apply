import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE, signSession, verifySession } from "@/lib/jwt";

export { SESSION_COOKIE };

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSessionToken(userId: string): Promise<string> {
  return signSession(userId);
}

/** Read the current user's id from the session cookie (server-side). */
export async function getCurrentUserId(): Promise<string | null> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySession(token);
}

/** Fetch the current user, or null if not signed in. */
export async function getCurrentUser() {
  const id = await getCurrentUserId();
  if (!id) return null;
  return prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, email: true, image: true },
  });
}

/** Throwable guard for API routes. */
export class UnauthorizedError extends Error {
  constructor() {
    super("Not signed in");
    this.name = "UnauthorizedError";
  }
}

export async function requireUserId(): Promise<string> {
  const id = await getCurrentUserId();
  if (!id) throw new UnauthorizedError();
  return id;
}
