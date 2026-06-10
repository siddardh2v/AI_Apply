import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { callClaudeJSON } from "@/lib/anthropic";
import { parseResumePrompt } from "@/lib/prompts";
import type { ParsedResume } from "@/lib/types";
import { toJson, fromJson } from "@/lib/serialize";
import { ok, badRequest, fail } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Extract plain text from an uploaded resume file (PDF / DOCX / TXT).
async function extractText(file: File): Promise<string> {
  const buf = Buffer.from(await file.arrayBuffer());
  const name = file.name.toLowerCase();

  if (name.endsWith(".pdf")) {
    // Import the lib file directly to avoid pdf-parse's debug-mode file read.
    const pdf = (await import("pdf-parse/lib/pdf-parse.js")).default;
    const data = await pdf(buf);
    return data.text;
  }
  if (name.endsWith(".docx")) {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ buffer: buf });
    return result.value;
  }
  if (name.endsWith(".txt") || name.endsWith(".md")) {
    return buf.toString("utf8");
  }
  throw new Error("Unsupported file type. Upload a PDF, DOCX, or TXT file.");
}

// Normalize whitespace (e.g. non-breaking spaces) without stripping content.
function normalize(text: string): string {
  return text.replace(/ /g, " ").replace(/\r\n/g, "\n").trim();
}

// POST /api/resumes/upload — multipart form with `file` (+ optional `title`).
export async function POST(req: Request) {
  try {
    const userId = await requireUserId();
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return badRequest("No file uploaded.");
    if (file.size > 8 * 1024 * 1024) {
      return badRequest("File is too large (max 8 MB).");
    }

    const text = normalize(await extractText(file));
    if (text.length < 30) {
      return badRequest(
        "Couldn't read enough text from that file. Is it a scanned image? Try pasting the text instead."
      );
    }

    const title =
      (form.get("title") as string)?.trim() ||
      file.name.replace(/\.[^.]+$/, "");

    let parsedContent: ParsedResume | null = null;
    try {
      parsedContent = await callClaudeJSON<ParsedResume>(
        parseResumePrompt(text)
      );
    } catch (e) {
      console.warn("Resume parse failed:", e);
    }

    const count = await prisma.resume.count({ where: { userId } });
    const resume = await prisma.resume.create({
      data: {
        userId,
        title,
        source: "upload",
        fileName: file.name,
        originalText: text,
        parsedContent: toJson(parsedContent),
        isDefault: count === 0,
      },
    });

    return ok(
      { ...resume, parsedContent: fromJson<ParsedResume>(resume.parsedContent) },
      201
    );
  } catch (e) {
    return fail(e);
  }
}
