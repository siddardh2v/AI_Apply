import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { callClaudeJSON } from "@/lib/anthropic";
import { analyzeJobPrompt } from "@/lib/prompts";
import type { JobAnalysis } from "@/lib/types";
import { toJson, fromJson } from "@/lib/serialize";
import { ok, badRequest, fail } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Parse the stored analysis JSON string back into an object for the client.
function withAnalysis<T extends { analysis: string | null }>(j: T) {
  return { ...j, analysis: fromJson<JobAnalysis>(j.analysis) };
}

// GET /api/jobs — list job postings (newest first).
export async function GET() {
  try {
    await requireUserId();
    const jobs = await prisma.jobPosting.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    return ok(jobs.map(withAnalysis));
  } catch (e) {
    return fail(e);
  }
}

// POST /api/jobs — save a pasted job posting and analyze it with Claude.
export async function POST(req: Request) {
  try {
    await requireUserId();
    const body = await req.json();
    const title: string = (body.title || "").trim();
    const company: string = (body.company || "").trim();
    const description: string = (body.description || "").trim();

    if (!title || !company) {
      return badRequest("Job title and company are required.");
    }
    if (description.length < 50) {
      return badRequest("Paste the full job description (it looks too short).");
    }

    let analysis: JobAnalysis | null = null;
    try {
      analysis = await callClaudeJSON<JobAnalysis>(
        analyzeJobPrompt(description)
      );
    } catch (e) {
      console.warn("Job analysis failed:", e);
    }

    const job = await prisma.jobPosting.create({
      data: {
        title,
        company,
        location: body.location?.trim() || null,
        url: body.url?.trim() || null,
        source: body.source?.trim() || "manual",
        description,
        salaryMin: Number.isFinite(body.salaryMin) ? body.salaryMin : null,
        salaryMax: Number.isFinite(body.salaryMax) ? body.salaryMax : null,
        analysis: toJson(analysis),
      },
    });

    return ok(withAnalysis(job), 201);
  } catch (e) {
    return fail(e);
  }
}
