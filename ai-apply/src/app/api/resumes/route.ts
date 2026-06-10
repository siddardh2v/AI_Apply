import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { callClaudeJSON } from "@/lib/anthropic";
import { parseResumePrompt } from "@/lib/prompts";
import type { ParsedResume } from "@/lib/types";
import { toJson, fromJson } from "@/lib/serialize";
import { ok, badRequest, fail } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Parse the stored JSON string back into an object for the client.
function withParsed<T extends { parsedContent: string | null }>(r: T) {
  return { ...r, parsedContent: fromJson<ParsedResume>(r.parsedContent) };
}

// GET /api/resumes — list the signed-in user's resumes (newest first).
export async function GET() {
  try {
    const userId = await requireUserId();
    const resumes = await prisma.resume.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
    return ok(resumes.map(withParsed));
  } catch (e) {
    return fail(e);
  }
}

// POST /api/resumes — create a resume from pasted text and parse it with Claude.
export async function POST(req: Request) {
  try {
    const userId = await requireUserId();
    const body = await req.json();
    const title: string = (body.title || "Untitled resume").trim();
    const originalText: string = (body.originalText || "").trim();
    const source: string = body.source === "upload" ? "upload" : "paste";
    const fileName: string | null = body.fileName?.trim() || null;

    if (originalText.length < 30) {
      return badRequest("Resume text is too short. Paste your full resume.");
    }

    let parsedContent: ParsedResume | null = null;
    try {
      parsedContent = await callClaudeJSON<ParsedResume>(
        parseResumePrompt(originalText)
      );
    } catch (e) {
      // Still save the resume even if parsing fails (e.g. no API key yet).
      console.warn("Resume parse failed:", e);
    }

    const count = await prisma.resume.count({ where: { userId } });
    const resume = await prisma.resume.create({
      data: {
        userId,
        title,
        source,
        fileName,
        originalText,
        parsedContent: toJson(parsedContent),
        isDefault: count === 0, // first resume becomes the default
      },
    });

    return ok(withParsed(resume), 201);
  } catch (e) {
    return fail(e);
  }
}
