import { requireUserId } from "@/lib/auth";
import { callClaudeJSON } from "@/lib/anthropic";
import { ok, badRequest, fail } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/interview/evaluate — score & coach a practice answer.
// Body: { question, answer }
export async function POST(req: Request) {
  try {
    await requireUserId();
    const { question, answer } = await req.json();
    if (!question || !answer || answer.trim().length < 5) {
      return badRequest("A question and a real answer are required.");
    }

    const prompt = `You are a supportive but honest interview coach. Score this answer from 0–100 on substance, structure (ideally STAR), and specificity. Be constructive and concrete.

QUESTION: ${question}
ANSWER: """${answer}"""

Return ONLY JSON: { "score": 0, "feedback": "2-3 sentence assessment", "tip": "one concrete way to improve this answer" }`;

    const d = await callClaudeJSON<{ score: number; feedback: string; tip: string }>(
      prompt,
      600
    );
    d.score = Math.max(0, Math.min(100, Math.round(d.score)));
    return ok(d);
  } catch (e) {
    return fail(e);
  }
}
