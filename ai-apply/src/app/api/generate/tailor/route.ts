import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { callClaude } from "@/lib/anthropic";
import { tailorResumePrompt } from "@/lib/prompts";
import { fromJson } from "@/lib/serialize";
import { verifyResume } from "@/lib/verify";
import { ok, badRequest, notFound, fail } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/generate/tailor — produce a job-tailored resume.
// Body: { resumeId, jobId }
export async function POST(req: Request) {
  try {
    const userId = await requireUserId();
    const { resumeId, jobId } = await req.json();
    if (!resumeId || !jobId) {
      return badRequest("resumeId and jobId are required.");
    }

    const [resume, job] = await Promise.all([
      prisma.resume.findFirst({ where: { id: resumeId, userId } }),
      prisma.jobPosting.findUnique({ where: { id: jobId } }),
    ]);

    if (!resume) return notFound("Resume not found");
    if (!job) return notFound("Job not found");

    const tailoredResume = await callClaude(
      tailorResumePrompt(
        resume.originalText,
        fromJson(job.analysis) ?? job.description
      ),
      3000
    );

    const verification = verifyResume(resume.originalText, tailoredResume);
    return ok({ tailoredResume, verification });
  } catch (e) {
    return fail(e);
  }
}
