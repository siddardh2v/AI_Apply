import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { ok, fail } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/stats — aggregate numbers for the dashboard (scoped to the user).
export async function GET() {
  try {
    const userId = await requireUserId();
    const [resumeCount, jobCount, applications] = await Promise.all([
      prisma.resume.count({ where: { userId } }),
      prisma.jobPosting.count(),
      prisma.application.findMany({
        where: { userId },
        select: { status: true, matchScore: true },
      }),
    ]);

    const byStatus: Record<string, number> = {};
    let scoreSum = 0;
    let scored = 0;
    for (const a of applications) {
      byStatus[a.status] = (byStatus[a.status] || 0) + 1;
      if (typeof a.matchScore === "number") {
        scoreSum += a.matchScore;
        scored += 1;
      }
    }

    const total = applications.length;
    const applied =
      (byStatus.applied || 0) +
      (byStatus.interviewing || 0) +
      (byStatus.offer || 0) +
      (byStatus.rejected || 0);
    const interviews = (byStatus.interviewing || 0) + (byStatus.offer || 0);

    return ok({
      resumeCount,
      jobCount,
      total,
      byStatus,
      avgMatchScore: scored ? Math.round(scoreSum / scored) : null,
      interviewRate: applied ? Math.round((interviews / applied) * 100) : 0,
      offerRate: applied ? Math.round(((byStatus.offer || 0) / applied) * 100) : 0,
    });
  } catch (e) {
    return fail(e);
  }
}
