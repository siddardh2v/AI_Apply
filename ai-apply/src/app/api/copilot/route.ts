import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { callClaude } from "@/lib/anthropic";
import { fromJson } from "@/lib/serialize";
import { ok, badRequest, fail } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/copilot — answer a question grounded in the user's own data.
// Body: { message, history? }
export async function POST(req: Request) {
  try {
    const userId = await requireUserId();
    const { message, history } = await req.json();
    if (!message || !message.trim()) return badRequest("Ask a question.");

    const [resume, apps, jobs] = await Promise.all([
      prisma.resume.findFirst({
        where: { userId },
        orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
      }),
      prisma.application.findMany({
        where: { userId },
        include: { job: true },
        orderBy: { createdAt: "desc" },
        take: 30,
      }),
      prisma.jobPosting.findMany({ orderBy: { createdAt: "desc" }, take: 40 }),
    ]);

    const profile = resume
      ? JSON.stringify(fromJson(resume.parsedContent) ?? resume.originalText.slice(0, 800))
      : "No resume uploaded yet.";

    const appLines =
      apps
        .map(
          (a) =>
            `- ${a.job.title} @ ${a.job.company} [${a.status}]${
              a.matchScore != null ? ` ${a.matchScore}% match` : ""
            }`
        )
        .join("\n") || "none yet";

    const jobLines =
      jobs
        .map(
          (j) => `- ${j.title} @ ${j.company} (${j.location || "—"}) [${j.source}]`
        )
        .join("\n") || "none yet";

    const prompt = `You are Jobward's job-search copilot. Be concise, practical, and encouraging. Use ONLY the data below; if something isn't present, say so honestly rather than inventing it.

CANDIDATE PROFILE:
${profile.slice(0, 1600)}

THIS USER'S APPLICATIONS (${apps.length}):
${appLines}

AVAILABLE JOBS (sample of the live feed):
${jobLines}
${history ? `\nCONVERSATION SO FAR:\n${String(history).slice(0, 2000)}` : ""}

USER QUESTION: ${message}

Answer helpfully and specifically. When recommending roles, name the title and company. Keep it under ~180 words unless asked for more.`;

    const reply = await callClaude(prompt, 1000);
    return ok({ reply });
  } catch (e) {
    return fail(e);
  }
}
