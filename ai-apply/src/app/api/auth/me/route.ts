import { getCurrentUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensureAppEmail } from "@/lib/appmail";
import { ok, fail } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/auth/me — the signed-in user (with their assigned inbox address), or null.
export async function GET() {
  try {
    const id = await getCurrentUserId();
    if (!id) return ok({ user: null });

    // Make sure the user has an inbox address assigned.
    const appEmail = await ensureAppEmail(id);
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, name: true, email: true, image: true },
    });

    return ok({ user: user ? { ...user, appEmail } : null });
  } catch (e) {
    return fail(e);
  }
}
