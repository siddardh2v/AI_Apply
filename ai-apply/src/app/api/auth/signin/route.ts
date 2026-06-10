import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyPassword, createSessionToken, SESSION_COOKIE } from "@/lib/auth";
import { ok, badRequest, fail } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/auth/signin — verify credentials and start a session.
export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    const e = (email || "").trim().toLowerCase();

    const user = await prisma.user.findUnique({ where: { email: e } });
    // Same message either way to avoid leaking which emails exist.
    if (!user || !user.passwordHash) {
      return badRequest("Incorrect email or password.");
    }
    const okPw = await verifyPassword(password || "", user.passwordHash);
    if (!okPw) return badRequest("Incorrect email or password.");

    const token = await createSessionToken(user.id);
    cookies().set(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });

    return ok({ id: user.id, name: user.name, email: user.email });
  } catch (e) {
    return fail(e);
  }
}
