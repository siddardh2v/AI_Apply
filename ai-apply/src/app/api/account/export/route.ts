import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { fail } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/account/export — download everything we hold about this user.
export async function GET() {
  try {
    const userId = await requireUserId();
    const [user, resumes, applications, emails, savedSearches] =
      await Promise.all([
        prisma.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            name: true,
            email: true,
            appEmail: true,
            createdAt: true,
          },
        }),
        prisma.resume.findMany({ where: { userId } }),
        prisma.application.findMany({ where: { userId }, include: { job: true } }),
        prisma.emailMessage.findMany({ where: { userId } }),
        prisma.savedSearch.findMany({ where: { userId } }),
      ]);

    const data = JSON.stringify(
      { exportedAt: new Date().toISOString(), user, resumes, applications, emails, savedSearches },
      null,
      2
    );

    return new Response(data, {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": 'attachment; filename="jobward-export.json"',
      },
    });
  } catch (e) {
    return fail(e);
  }
}
