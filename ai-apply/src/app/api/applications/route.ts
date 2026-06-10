import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { ok, badRequest, fail } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/applications — list the user's applications with job + resume.
export async function GET() {
  try {
    const userId = await requireUserId();
    const applications = await prisma.application.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: { job: true, resume: { select: { id: true, title: true } } },
    });
    return ok(applications);
  } catch (e) {
    return fail(e);
  }
}

// POST /api/applications — save (or update) an application for a job.
// Body: { jobId, resumeId?, matchScore?, tailoredResume?, coverLetter?, status?, notes? }
export async function POST(req: Request) {
  try {
    const userId = await requireUserId();
    const body = await req.json();
    if (!body.jobId) return badRequest("jobId is required.");

    const data = {
      resumeId: body.resumeId || null,
      status: body.status || "saved",
      matchScore: Number.isFinite(body.matchScore) ? body.matchScore : null,
      tailoredResume: body.tailoredResume || null,
      coverLetter: body.coverLetter || null,
      notes: body.notes || null,
    };

    // One application per (user, job) — upsert keeps "save" idempotent.
    const application = await prisma.application.upsert({
      where: { userId_jobId: { userId, jobId: body.jobId } },
      create: { userId, jobId: body.jobId, ...data },
      update: {
        // only overwrite fields that were explicitly provided
        resumeId: data.resumeId ?? undefined,
        matchScore: data.matchScore ?? undefined,
        tailoredResume: data.tailoredResume ?? undefined,
        coverLetter: data.coverLetter ?? undefined,
        notes: data.notes ?? undefined,
      },
      include: { job: true, resume: { select: { id: true, title: true } } },
    });

    return ok(application, 201);
  } catch (e) {
    return fail(e);
  }
}
