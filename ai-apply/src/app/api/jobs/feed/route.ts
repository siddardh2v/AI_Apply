import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { ok, fail } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/jobs/feed?q=&source=&remote= — live jobs + which ones the user saved.
export async function GET(req: Request) {
  try {
    const userId = await requireUserId();
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim();
    const source = searchParams.get("source")?.trim();
    const remote = searchParams.get("remote") === "true";

    const where: Record<string, unknown> = {};
    if (source) where.source = source;
    if (remote) where.remote = true;
    if (q) {
      where.OR = [
        { title: { contains: q } },
        { company: { contains: q } },
        { description: { contains: q } },
      ];
    }

    const [jobs, saved] = await Promise.all([
      prisma.jobPosting.findMany({
        where,
        orderBy: [{ postedDate: "desc" }, { createdAt: "desc" }],
        take: 100,
      }),
      prisma.application.findMany({
        where: { userId },
        select: { jobId: true },
      }),
    ]);

    const savedSet = new Set(saved.map((s) => s.jobId));
    const sources = await prisma.jobPosting.groupBy({
      by: ["source"],
      _count: { source: true },
    });

    return ok({
      jobs: jobs.map((j) => ({ ...j, saved: savedSet.has(j.id) })),
      sources: sources.map((s) => ({ source: s.source, count: s._count.source })),
    });
  } catch (e) {
    return fail(e);
  }
}
