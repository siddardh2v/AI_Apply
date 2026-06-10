import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { ok, fail } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DAY = 1000 * 60 * 60 * 24;

// GET /api/analytics — funnel + conversion + source + resume (A/B) stats.
export async function GET() {
  try {
    const userId = await requireUserId();
    const apps = await prisma.application.findMany({
      where: { userId },
      select: {
        status: true,
        appliedDate: true,
        responseDate: true,
        job: { select: { source: true } },
        resume: { select: { id: true, title: true } },
      },
    });

    const byStatus: Record<string, number> = {};
    const bySource: Record<string, number> = {};
    const byResume: Record<string, { title: string; total: number; interviews: number }> = {};
    let responseSum = 0;
    let responseCount = 0;

    for (const a of apps) {
      byStatus[a.status] = (byStatus[a.status] || 0) + 1;

      const src = a.job?.source || "manual";
      bySource[src] = (bySource[src] || 0) + 1;

      if (a.resume) {
        const k = a.resume.id;
        if (!byResume[k]) byResume[k] = { title: a.resume.title, total: 0, interviews: 0 };
        byResume[k].total += 1;
        if (["interviewing", "offer"].includes(a.status)) byResume[k].interviews += 1;
      }

      if (a.appliedDate && a.responseDate) {
        responseSum += (new Date(a.responseDate).getTime() - new Date(a.appliedDate).getTime()) / DAY;
        responseCount += 1;
      }
    }

    const applied =
      (byStatus.applied || 0) +
      (byStatus.interviewing || 0) +
      (byStatus.offer || 0) +
      (byStatus.rejected || 0);
    const interviews = (byStatus.interviewing || 0) + (byStatus.offer || 0);
    const offers = byStatus.offer || 0;

    return ok({
      total: apps.length,
      byStatus,
      bySource,
      resumes: Object.values(byResume).map((r) => ({
        ...r,
        interviewRate: r.total ? Math.round((r.interviews / r.total) * 100) : 0,
      })),
      applied,
      interviews,
      offers,
      interviewRate: applied ? Math.round((interviews / applied) * 100) : 0,
      offerRate: applied ? Math.round((offers / applied) * 100) : 0,
      avgResponseDays: responseCount ? Math.round((responseSum / responseCount) * 10) / 10 : null,
    });
  } catch (e) {
    return fail(e);
  }
}
