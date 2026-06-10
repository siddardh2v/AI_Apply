import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { getCurrentUser } from "@/lib/auth";
import { callClaudeJSON } from "@/lib/anthropic";
import { emailDraftPrompt } from "@/lib/prompts";
import { fromJson } from "@/lib/serialize";
import type { ParsedResume } from "@/lib/types";
import { ok, badRequest, notFound, fail } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/emails/draft — AI-generate an email for an application.
// Body: { applicationId, type: "application" | "follow-up" }
export async function POST(req: Request) {
  try {
    const userId = await requireUserId();
    const me = await getCurrentUser();
    const { applicationId, type } = await req.json();
    if (!applicationId) return badRequest("applicationId is required.");

    const app = await prisma.application.findFirst({
      where: { id: applicationId, userId },
      include: { job: true, resume: true },
    });
    if (!app) return notFound("Application not found");

    const parsed = fromJson<ParsedResume>(app.resume?.parsedContent ?? null);
    const resumeSummary =
      parsed?.summary ||
      app.resume?.originalText?.slice(0, 400) ||
      "Experienced candidate.";

    const draft = await callClaudeJSON<{ subject: string; body: string }>(
      emailDraftPrompt({
        type: type === "follow-up" ? "follow-up" : "application",
        applicantName: me?.name || me?.email || "the candidate",
        jobTitle: app.job.title,
        company: app.job.company,
        resumeSummary,
        status: app.status,
      })
    );

    return ok(draft);
  } catch (e) {
    return fail(e);
  }
}
