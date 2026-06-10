import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { atsScore } from "@/lib/ats";
import { ok, badRequest, notFound, fail } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/ats — keyword match score of a resume against a job (no AI key).
// Body: { resumeId, jobId }
export async function POST(req: Request) {
  try {
    const userId = await requireUserId();
    const { resumeId, jobId } = await req.json();
    if (!resumeId || !jobId) return badRequest("resumeId and jobId are required.");

    const [resume, job] = await Promise.all([
      prisma.resume.findFirst({ where: { id: resumeId, userId } }),
      prisma.jobPosting.findUnique({ where: { id: jobId } }),
    ]);
    if (!resume) return notFound("Resume not found");
    if (!job) return notFound("Job not found");

    return ok(atsScore(resume.originalText, job.description));
  } catch (e) {
    return fail(e);
  }
}
