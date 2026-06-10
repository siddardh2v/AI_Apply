import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { callClaudeJSON } from "@/lib/anthropic";
import { matchPrompt } from "@/lib/prompts";
import type { MatchResult } from "@/lib/types";
import { fromJson } from "@/lib/serialize";
import { ok, badRequest, notFound, fail } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/match — score how well a resume matches a job posting.
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

    const result = await callClaudeJSON<MatchResult>(
      matchPrompt(
        fromJson(resume.parsedContent) ?? resume.originalText,
        fromJson(job.analysis) ?? job.description
      )
    );

    // Clamp score into a sane range.
    result.score = Math.max(0, Math.min(100, Math.round(result.score)));

    return ok(result);
  } catch (e) {
    return fail(e);
  }
}
