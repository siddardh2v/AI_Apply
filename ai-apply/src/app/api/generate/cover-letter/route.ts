import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { callClaude } from "@/lib/anthropic";
import { coverLetterPrompt } from "@/lib/prompts";
import { ok, badRequest, notFound, fail } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/generate/cover-letter — produce a tailored cover letter.
// Body: { resumeId, jobId }
export async function POST(req: Request) {
  try {
    const userId = await requireUserId();
    const { resumeId, jobId, tone, length } = await req.json();
    if (!resumeId || !jobId) {
      return badRequest("resumeId and jobId are required.");
    }

    const [resume, job] = await Promise.all([
      prisma.resume.findFirst({ where: { id: resumeId, userId } }),
      prisma.jobPosting.findUnique({ where: { id: jobId } }),
    ]);

    if (!resume) return notFound("Resume not found");
    if (!job) return notFound("Job not found");

    const coverLetter = await callClaude(
      coverLetterPrompt(
        resume.originalText,
        {
          title: job.title,
          company: job.company,
          description: job.description,
        },
        { tone, length }
      ),
      1500
    );

    return ok({ coverLetter });
  } catch (e) {
    return fail(e);
  }
}
