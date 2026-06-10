import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { requireUserId, SESSION_COOKIE } from "@/lib/auth";
import { ok, fail } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// DELETE /api/account — permanently delete the signed-in user's account and
// all their data (resumes, applications, emails, searches cascade). The user
// triggers this themselves from Settings.
export async function DELETE() {
  try {
    const userId = await requireUserId();
    await prisma.user.delete({ where: { id: userId } });
    cookies().delete(SESSION_COOKIE);
    return ok({ deleted: true });
  } catch (e) {
    return fail(e);
  }
}
