import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { hashPassword, createSessionToken, SESSION_COOKIE } from "@/lib/auth";
import { ensureAppEmail } from "@/lib/appmail";
import { ok, badRequest, fail } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/auth/signup — create an account and start a session.
export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();
    const e = (email || "").trim().toLowerCase();

    if (!e || !/.+@.+\..+/.test(e)) return badRequest("Enter a valid email.");
    if (!password || password.length < 8) {
      return badRequest("Password must be at least 8 characters.");
    }

    const existing = await prisma.user.findUnique({ where: { email: e } });
    if (existing) return badRequest("An account with that email already exists.");

    const user = await prisma.user.create({
      data: {
        name: (name || "").trim() || null,
        email: e,
        passwordHash: await hashPassword(password),
      },
    });

    await ensureAppEmail(user.id);

    const token = await createSessionToken(user.id);
    cookies().set(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });

    return ok({ id: user.id, name: user.name, email: user.email }, 201);
  } catch (e) {
    return fail(e);
  }
}
