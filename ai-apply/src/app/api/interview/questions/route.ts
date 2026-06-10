import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { callClaudeJSON } from "@/lib/anthropic";
import { ok, badRequest, notFound, fail } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/interview/questions — generate role-specific interview questions.
// Body: { jobId }
export async function POST(req: Request) {
  try {
    await requireUserId();
    const { jobId } = await req.json();
    if (!jobId) return badRequest("jobId is required.");

    const job = await prisma.jobPosting.findUnique({ where: { id: jobId } });
    if (!job) return notFound("Job not found");

    const prompt = `Generate 6 realistic interview questions for this role — a mix of behavioral and role-specific/technical ones a real interviewer would ask.

ROLE: ${job.title} at ${job.company}
JOB DESCRIPTION:
"""
${job.description.slice(0, 2500)}
"""

Return ONLY a JSON array of 6 question strings, ordered from warm-up to harder.`;

    const questions = await callClaudeJSON<string[]>(prompt, 800);
    return ok({ questions });
  } catch (e) {
    return fail(e);
  }
}
